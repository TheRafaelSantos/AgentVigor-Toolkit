#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline/promises';
import { isAbsolute, join } from 'node:path';
import { spawn } from 'node:child_process';
import pkg from '../package.json' with { type: 'json' };
import { language, translator, errorMessage } from '../lib/i18n.mjs';
import { install, rollback, installationStatus } from '../lib/install.mjs';
import { detectTools, detectPlatform } from '../lib/platform.mjs';
import { runFile } from '../lib/process.mjs';
import { monitor } from '../lib/monitor.mjs';
import { doctor } from '../lib/doctor.mjs';
import { benchmark } from '../lib/benchmark.mjs';
import { reportInstallation } from '../lib/telemetry.mjs';

const commands = {
  install: '--agent --profile --dry-run --yes --json --telemetry',
  doctor: '--json',
  status: '--json',
  monitor: '--interval --once --no-clear',
  update: '--dry-run --yes --json',
  benchmark: '--input --json',
  rollback: '--all --dry-run --yes --json',
  catalog: '--id --mode --json',
  project: '--mode --template --path --dry-run --yes --json',
  quality: '--path --dry-run --yes --json',
  harness: '--path --dry-run --yes --json',
  integrations: '--tool --agent --mode --scope --variant --json --dry-run --yes',
};
const profiles = ['minimal', 'balanced', 'rigorous'];
const agentIds = ['codex', 'claude'];
const linkedin = 'https://www.linkedin.com/in/gerente-de-ecommerce/';
const bool = { type: 'boolean' };
const string = { type: 'string' };

class UsageError extends Error {
  constructor(code = 'USAGE') {
    super(code);
    this.code = code;
  }
}

function parse(args) {
  let parsed;
  try {
    parsed = parseArgs({
      args, allowPositionals: true, tokens: true,
      options: {
        help: { ...bool, short: 'h' }, version: { ...bool, short: 'v' }, lang: string,
        agent: string, profile: string, interval: string, input: string,
        id: string, mode: string, template: string, path: string, tool: string, scope: string, variant: string,
        'dry-run': bool, yes: bool, json: bool, once: bool, 'no-clear': bool, all: bool, telemetry: bool,
      },
    });
  } catch {
    throw new UsageError();
  }
  const { values, positionals, tokens } = parsed;
  const [command] = positionals;
  const flags = tokens.filter(token => token.kind === 'option').map(token => token.name);
  if (positionals.length > 1 || (command && !Object.hasOwn(commands, command)) ||
      new Set(flags).size !== flags.length || tokens.some(token => token.kind === 'option-terminator')) {
    throw new UsageError();
  }
  if (values.version && (command || flags.some(flag => !['version', 'lang'].includes(flag)))) {
    throw new UsageError();
  }
  const allowed = new Set(['--help', '--version', '--lang', ...(command ? commands[command].split(' ') : [])]);
  if (flags.some(flag => !allowed.has('--' + flag))) throw new UsageError();
  return { command, values };
}

function help(t, command) {
  const rows = Object.keys(commands).map(name => `  ${name.padEnd(10)} ${t(name)}`);
  const flags = command ? commands[command] : '--help --version --lang en|pt-BR|es';
  const details = {
    install: '--agent auto|codex|claude|both  --profile minimal|balanced|rigorous\n  --dry-run  --yes  --json  --telemetry',
    monitor: '--interval <1..3600>  --once  --no-clear',
    benchmark: '--input <file.json>  --json',
    catalog: '--id <workflow>  --mode quick|full  --lang en|pt-BR|es  --json',
    integrations: '--tool rtk|superpowers|ponytail|find-skills|graphify  --agent codex|claude\n  --mode status|plan|install|configure|verify|rollback  --scope binary  --variant oss|full (RTK)\n  --dry-run  --yes  --json',
    project: '--mode init|adopt|status|rollback  --template docs|eslint|harness|next\n  --path <directory>  --dry-run  --yes  --json',
  };
  console.log(`AgentVigor Toolkit ${pkg.version}\n\n${t('usage')}\n  agentvigor ${command ?? '<command>'} [options]`);
  if (!command) console.log(`\n${t('commands')}\n${rows.join('\n')}`);
  console.log(`\n${t('options')}\n  ${details[command] ?? flags}`);
}

function show(result, json, t) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`AgentVigor | ${t(result.status)}`);
  if (result.destination) console.log(`  ${t('integrationDestination')}: ${result.destination}`);
  if (result.source?.version) console.log(`  ${result.tool} ${result.source.version} · ${result.source.license} · ${result.source.source}`);
  if (result.networkRequired) console.log(`  ${t('integrationNetwork')}: ${result.networkHosts.join(', ')}`);
  if (result.licenseNotice) console.log(`  ${result.license}: ${result.licenseNotice}`);
  if (result.executable) console.log(`  ${result.executable}`);
  for (const { agent, profile, version } of result.installations ?? []) {
    console.log(`  ${agent} · ${profile} · ${version}`);
  }
  for (const { agent, skill, path, action, status, id, error } of result.skills ?? result.checks ?? result.changes ?? []) {
    const name = skill ? skill + (path && path !== 'SKILL.md' ? '/' + path : '') : path ?? id ?? '';
    console.log(`  ${agent ? agent.padEnd(7) + ' ' : ''}${name}  ${t(action ?? status ?? 'planned')}${error ? ' [' + error + ']' : ''}`);
  }
  if (!result.changes?.length) {
    for (const { path, status } of result.managed ?? []) console.log(`  ${path}  ${t(status)}`);
  }
  if (result.error) console.error(`[${result.error}] ${errorMessage(t, result.error)}`);
}

async function confirm(t, key) {
  const input = createInterface({ input: process.stdin, output: process.stderr });
  const abort = new AbortController();
  const cancel = () => abort.abort();
  input.once('SIGINT', cancel);
  input.once('close', cancel);
  try {
    const answer = await input.question(t(key), { signal: abort.signal });
    return /^(y|yes|s|sim|s[ií])$/i.test(answer.trim());
  } catch {
    return false;
  } finally {
    input.close();
  }
}

async function maybeOpenLinkedIn(context, t) {
  console.log(t('thanks'));
  const { gui, system } = detectPlatform(context);
  if (!gui || !await confirm(t, 'linkedin')) return;
  const { env } = context;
  const tools = system === 'linux' || system === 'wsl' ? await detectTools({ env }) : {};
  const program = system === 'windows'
    ? isAbsolute(env.SystemRoot ?? '') && join(env.SystemRoot, 'System32', 'rundll32.exe')
    : system === 'macos' ? '/usr/bin/open' : tools['xdg-open']?.path;
  const args = system === 'windows' ? ['url.dll,FileProtocolHandler', linkedin] : [linkedin];
  const desktop = new Set(['PATH', 'HOME', 'USERPROFILE', 'SYSTEMROOT', 'WINDIR', 'APPDATA', 'LOCALAPPDATA',
    'DISPLAY', 'WAYLAND_DISPLAY', 'XAUTHORITY', 'XDG_RUNTIME_DIR', 'XDG_CURRENT_DESKTOP',
    'XDG_SESSION_TYPE', 'DBUS_SESSION_BUS_ADDRESS', 'LANG', 'LC_ALL', 'TMPDIR', 'TEMP', 'TMP']);
  const childEnv = Object.fromEntries(Object.entries(env).filter(([name]) => desktop.has(name.toUpperCase())));
  try {
    if (!program) throw new Error('BROWSER');
    if (system === 'linux' || system === 'wsl') {
      await new Promise((resolve, reject) => {
        const child = spawn(program, args, { shell: false, env: childEnv, detached: true, stdio: 'ignore' });
        child.once('error', reject);
        child.once('spawn', () => {
          child.unref();
          resolve();
        });
      });
    } else if ((await runFile(program, args, { timeoutMs: 8000, env: childEnv })).code !== 0) {
      throw new Error('BROWSER');
    }
  } catch {
    console.error(t('browser'));
    console.error(linkedin);
  }
}

async function mutate(command, values, context, t) {
  const options = { ...context, all: values.all, update: command === 'update' };
  if (command === 'install') {
    const agent = values.agent ?? 'auto';
    if (!['auto', ...agentIds, 'both'].includes(agent)) throw new UsageError('INVALID_AGENTS');
    options.profile = values.profile ?? 'balanced';
    if (!profiles.includes(options.profile)) throw new UsageError('INVALID_PROFILE');
    const tools = await detectTools(context);
    options.agents = agent === 'auto' ? agentIds.filter(id => tools[id]?.available) : agent === 'both' ? agentIds : [agent];
    if (options.agents.length === 0) throw new UsageError('NO_AGENTS');
    for (const id of options.agents.filter(id => !tools[id]?.available)) {
      console.error(`${t('missingAgent')}: ${id}`);
    }
  }
  const apply = command === 'rollback' ? rollback : install;
  if (values['dry-run']) return show(await apply({ ...options, dryRun: true }), values.json, t);
  const interactive = process.stdin.isTTY && process.stdout.isTTY && process.stderr.isTTY &&
    !values.json && !context.env.CI;
  if (!values.yes) {
    if (!interactive) throw new UsageError('CONFIRMATION_REQUIRED');
    const preview = await apply({ ...options, dryRun: true });
    show(preview, false, t);
    if (!await confirm(t, 'confirm')) {
      console.error(t('cancelled'));
      process.exitCode = 2;
      return;
    }
    options.expectedPlan = preview.planToken;
  }
  const result = await apply(options);
  show(result, values.json, t);
  if (command === 'install' && result.status === 'installed' && values.telemetry) {
    const telemetry = await reportInstallation({
      consent: true, endpoint: context.env.AGENTVIGOR_TELEMETRY_URL, version: context.version,
      system: detectPlatform(context).system, agents: options.agents,
    });
    if (telemetry !== 'sent') console.error(t('telemetrySkipped'));
  }
  if (command === 'install' && result.status === 'installed' && interactive && !values.yes) {
    await maybeOpenLinkedIn(context, t);
  }
}

async function executeWorkflow(command, values, env, lang, t) {
  const options = { path: values.path ?? '.', env, lang };
  let execute;
  if (command === 'project') {
    options.mode = values.mode ?? 'status';
    options.template = values.template;
    ({ project: execute } = await import('../skills/agentvigor-toolkit/scripts/project.mjs'));
  } else if (command === 'quality') {
    ({ quality: execute } = await import('../skills/agentvigor-toolkit/scripts/quality.mjs'));
  } else {
    ({ harness: execute } = await import('../skills/agentvigor-toolkit/scripts/harness.mjs'));
  }
  const preview = await execute({ ...options, dryRun: true });
  if (values['dry-run'] || options.mode === 'status' || !preview.planToken || preview.status === 'unavailable') {
    show(preview, values.json, t);
    if (preview.status === 'unavailable') process.exitCode = 1;
    return;
  }
  if (!values.yes) {
    if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stderr.isTTY || values.json || env.CI) {
      throw new UsageError('CONFIRMATION_REQUIRED');
    }
    show(preview, false, t);
    if (!await confirm(t, command === 'project' ? 'confirmProject' : 'confirmRun')) {
      console.error(t('cancelled'));
      process.exitCode = 2;
      return;
    }
  }
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    const result = await execute({ ...options, expectedPlan: preview.planToken, signal: controller.signal });
    show(result, values.json, t);
    if (['failed', 'unavailable'].includes(result.status)) process.exitCode = 1;
    if (result.status === 'cancelled') process.exitCode = 130;
  } finally {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
  }
}

async function main(args) {
  const env = process.env;
  const detectedLanguage = language(env);
  let t = translator(detectedLanguage);
  try {
    const { command, values } = parse(args);
    if (values.lang !== undefined) t = translator(values.lang);
    if (values.version) return console.log(pkg.version);
    if (!command || values.help) return help(t, command);
    if (!['22', '24', '26'].includes(process.versions.node.split('.')[0])) throw new UsageError('UNSUPPORTED_NODE');
    const context = { home: homedir(), env, version: pkg.version };
    if (command === 'integrations') {
      const binary = values.scope === 'binary';
      if (values.scope !== undefined && !binary || binary && !['rtk', 'graphify'].includes(values.tool) ||
          binary && (values.agent !== undefined || !['install', 'verify', 'rollback'].includes(values.mode)) ||
          values.variant !== undefined && (values.tool !== 'rtk' || !['oss', 'full'].includes(values.variant) ||
            !binary && values.mode !== 'configure')) throw new UsageError('INTEGRATION_MODE');
      if (binary || ['install', 'configure', 'rollback'].includes(values.mode)) {
        let execute;
        const options = { ...context, agent: values.agent, mode: values.mode };
        if (binary && values.tool === 'rtk') {
          ({ manageRtkBinary: execute } = await import('../lib/rtk-binary.mjs'));
          options.variant = values.variant;
        } else if (binary && values.tool === 'graphify') {
          const graphify = await import('../lib/graphify-binary.mjs');
          if (values.mode === 'verify') {
            if (values['dry-run'] || values.yes) throw new UsageError('INTEGRATION_MODE');
            return show(await graphify.verifyGraphifyBinary(options), values.json, t);
          }
          execute = graphify.manageGraphifyBinary;
          if (values.mode === 'install') options.uvExecutable = (await detectTools(context)).uv?.path;
        } else if (values.tool === 'rtk' && values.mode !== 'install') {
          ({ configureRtk: execute } = await import('../lib/rtk-integration.mjs'));
          if (values.mode === 'configure') {
            const { manageRtkBinary } = await import('../lib/rtk-binary.mjs');
            options.executable = await manageRtkBinary({ ...context, mode: 'verify', variant: values.variant })
              .then(result => result.executable).catch(error => {
                if (!values.variant && ['RTK_MISSING', 'INCOMPATIBLE'].includes(error.code)) return undefined;
                throw error;
              });
            options.executable ??= (await detectTools(context)).rtk?.path;
          }
        } else if (values.tool === 'graphify' && values.mode !== 'install') {
          ({ configureGraphify: execute } = await import('../lib/graphify-integration.mjs'));
          if (values.mode === 'configure') {
            const { verifyGraphifyBinary } = await import('../lib/graphify-binary.mjs');
            options.executable = await verifyGraphifyBinary(context).then(result => result.executable).catch(error => {
              if (error.code === 'GRAPHIFY_MISSING') return undefined;
              throw error;
            });
            options.executable ??= (await detectTools(context)).graphify?.path;
          }
        } else if (values.tool === 'find-skills' && values.mode !== 'configure') {
          ({ manageFindSkills: execute } = await import('../lib/find-skills-integration.mjs'));
        } else throw new UsageError('INTEGRATION_TOOL');
        if (values.mode === 'verify') {
          if (values['dry-run'] || values.yes) throw new UsageError('INTEGRATION_MODE');
          return show(await execute(options), values.json, t);
        }
        const preview = await execute({ ...options, dryRun: true });
        if (values['dry-run']) return show(preview, values.json, t);
        if (!values.yes) {
          if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stderr.isTTY || values.json || env.CI) {
            throw new UsageError('CONFIRMATION_REQUIRED');
          }
          show(preview, false, t);
          if (!await confirm(t, 'confirm')) { process.exitCode = 2; return; }
        }
        return show(await execute({ ...options, expectedPlan: preview.planToken }), values.json, t);
      }
      const { integrations } = await import('../lib/integrations.mjs');
      const result = await integrations({ ...context, tool: values.tool, agent: values.agent,
        mode: values.mode });
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    if (command === 'catalog') {
      const { catalog } = await import('../skills/agentvigor-toolkit/scripts/catalog.mjs');
      const result = await catalog({ id: values.id, mode: values.mode, lang: values.lang ?? detectedLanguage });
      if (values.json) console.log(JSON.stringify(result, null, 2));
      else if (result.content) console.log(result.content.trimEnd());
      else for (const entry of result.entries) console.log(`  ${entry.id}  ${entry.title ?? entry.description}`);
      return;
    }
    if (['project', 'quality', 'harness'].includes(command)) {
      return await executeWorkflow(command, values, env, values.lang ?? detectedLanguage, t);
    }
    if (['install', 'update', 'rollback'].includes(command)) return await mutate(command, values, context, t);
    if (command === 'status') return show(await installationStatus(context), values.json, t);
    if (command === 'doctor') {
      const result = await doctor(context);
      if (values.json) return console.log(JSON.stringify(result, null, 2));
      const { system, arch, release, shell } = result.platform;
      console.log(`${t('platform')}: ${system} · ${arch} · ${release} · ${shell ?? '—'} · Node.js ${result.node}`);
      console.log(`${t('tools')}: ${Object.entries(result.tools).filter(([, found]) => found).map(([id]) => id).join(', ') || '—'}`);
      for (const id of ['codex', 'claude', 'rtk', 'git', 'npm'].filter(id => !result.tools[id])) {
        console.log(`  ${id}: ${t('missing')}`);
      }
      if (result.tools.rtk) console.log(`${t('rtkVersion')}: ${result.rtkVersion ?? t('invalid')}`);
      for (const check of result.checks) console.log(`  ${check.id}: ${t(check.state)}${check.duplicates ? ` (${check.duplicates})` : ''}`);
      show(result.installation, false, t);
      if (result.installation.error) console.error(`[${result.installation.error}] ${errorMessage(t, result.installation.error)}`);
      console.log(t('pathHint'));
      console.log(t('hooksHint'));
      console.log(t('verifyDiscovery'));
      return;
    }
    if (command === 'benchmark') {
      if (!values.input) throw new UsageError();
      const result = await benchmark(values.input);
      return console.log(JSON.stringify(result, null, 2));
    }
    if (command === 'monitor') {
      const interval = values.interval ?? '60';
      if (!/^\d{1,4}$/.test(interval) || Number(interval) < 1 || Number(interval) > 3600) {
        throw new UsageError('MONITOR_INTERVAL');
      }
      const controller = new AbortController();
      const stop = () => controller.abort();
      process.once('SIGINT', stop);
      process.once('SIGTERM', stop);
      try {
        const tools = await detectTools(context);
        await monitor({ executable: tools.rtk?.path, interval: Number(interval), once: values.once,
          noClear: values['no-clear'], signal: controller.signal, env, t });
      } finally {
        process.off('SIGINT', stop);
        process.off('SIGTERM', stop);
      }
    }
  } catch (error) {
    const code = /^[A-Z][A-Z0-9_]{0,49}$/.test(error.code ?? '') ? error.code : 'ERROR';
    console.error(`[${code}] ${errorMessage(t, code)}`);
    process.exitCode = error instanceof UsageError || code === 'INVALID_LANGUAGE' ? 2 : 1;
  }
}

await main(process.argv.slice(2));
