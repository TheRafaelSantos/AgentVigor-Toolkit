import * as fs from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { detectTools } from './platform.mjs';
import { applyIntegration, prepareIntegration, snapshot } from './integration-files.mjs';
import { minimalEnv, readRegular, runFile } from '../skills/agentvigor-toolkit/scripts/process.mjs';

export const nativePluginSources = Object.freeze({
  superpowers: Object.freeze({ version: '7.0.2', marketplace: 'superpowers-dev', repository: 'obra/superpowers',
    revision: '22f0b463e7a5e579904dd6211a520321035526f7', license: 'MIT',
    source: 'https://github.com/obra/superpowers/blob/v7.0.2/README.md' }),
  ponytail: Object.freeze({ version: '5.3.3', marketplace: 'ponytail', repository: 'DietrichGebert/ponytail',
    revision: '7801d061243d7b753bad0e0b3c057cd250b11755', license: 'MIT',
    source: 'https://github.com/DietrichGebert/ponytail/blob/v5.3.3/INSTALL.md' }),
});
const fail = code => { throw Object.assign(new Error(code), { code }); };
const unknown = reason => ({ state: 'UNVERIFIED', reason });
const base = (home, env) => resolve(env.CODEX_HOME || join(home, '.codex'));
const cache = (tool, source) => `plugins/cache/${source.marketplace}/${tool}/${source.version}`;
const marketplaceManifest = source => `.tmp/marketplaces/${source.marketplace}/.agents/plugins/marketplace.json`;
const id = (tool, source) => `${tool}@${source.marketplace}`;
const tables = (tool, source) => `[marketplaces.${source.marketplace}]\nsource_type = "git"\nsource = "https://github.com/${source.repository}.git"\nref = "${source.revision}"\n\n[plugins."${id(tool, source)}"]\nenabled = true\n`;
const block = (tool, source, created) => `\n\n# AgentVigor ${tool}${created ? ' (created config)' : ''}\n${tables(tool, source)}# End AgentVigor ${tool}\n`;
const decode = value => Buffer.from(value ?? '', 'base64').toString();

function managedConfig(config) {
  const blocks = {};
  let base = config;
  for (const [tool, source] of Object.entries(nativePluginSources)) {
    const matches = [false, true].map(created => block(tool, source, created)).filter(fragment => base.includes(fragment));
    if (matches.length > 1 || matches.some(fragment => base.indexOf(fragment) !== base.lastIndexOf(fragment))) return null;
    if (matches.length) {
      blocks[tool] = matches[0];
      base = base.replace(matches[0], '');
    }
  }
  return { base, blocks };
}

function reconcileConfig(tool, name, current, state, mode) {
  if (name !== 'config.toml' || current === null) return;
  const config = decode(current);
  const live = managedConfig(config);
  const installed = managedConfig(decode(state.after[name]));
  if (!live?.blocks[tool] || live.blocks[tool] !== installed?.blocks[tool] || live.base !== installed.base) return;
  if (mode !== 'rollback') return current;
  const remaining = config.replace(live.blocks[tool], '');
  return remaining === '' && live.blocks[tool].includes('(created config)') ? null : Buffer.from(remaining).toString('base64');
}

function validate(tool, agent) {
  if (!Object.hasOwn(nativePluginSources, tool)) fail('INTEGRATION_TOOL');
  if (!['codex', 'claude'].includes(agent)) fail('INVALID_AGENTS');
  return nativePluginSources[tool];
}

export async function nativePluginEvidence({ tool, agent = 'codex', home = homedir(), env = process.env } = {}) {
  const source = validate(tool, agent);
  const result = { installed: unknown('Native registry has not been inspected.'),
    configured: unknown('Native registration has not been confirmed.'),
    discovered: unknown('Requires enumeration in a fresh native-client session.'),
    verified: unknown('Requires an observed scoped invocation; no model call was made.') };
  if (agent === 'claude') return result;
  try {
    const root = base(home, env);
    const manifestName = `${cache(tool, source)}/.codex-plugin/plugin.json`;
    const marketplaceName = marketplaceManifest(source);
    const data = await snapshot(root, ['config.toml', manifestName, marketplaceName]);
    if (data[manifestName] === null) {
      result.installed = unknown('Pinned cache absent; other native installations have not been ruled out.');
      return result;
    }
    const manifest = JSON.parse(Buffer.from(data[manifestName], 'base64').toString());
    if (manifest.name !== tool || manifest.version !== source.version) return result;
    result.installed = { state: 'INSTALLED', evidence: 'Native Codex plugin manifest', version: manifest.version };
    const config = Buffer.from(data['config.toml'] || '', 'base64').toString().replaceAll('\r\n', '\n');
    const marketplace = data[marketplaceName] === null ? null : JSON.parse(Buffer.from(data[marketplaceName], 'base64'));
    if (marketplace?.name === source.marketplace && config.includes(tables(tool, source))) result.configured = {
      state: 'CONFIGURED', evidence: 'Pinned native marketplace and enabled plugin registration.', revision: source.revision,
    };
    return result;
  } catch {
    return { ...result, installed: { state: 'BLOCKED', reason: 'Unsafe or unreadable native registration.' } };
  }
}

async function payload(root, prefix) {
  const files = {};
  const fileModes = {};
  let bytes = 0;
  async function visit(name) {
    const entries = await fs.readdir(join(root, name), { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      // Git administrative files are not plugin runtime and contain staging-specific paths.
      if (entry.name === '.git') continue;
      const path = `${name}/${entry.name}`;
      if (!/^[a-zA-Z0-9._/-]+$/.test(path) || entry.isSymbolicLink()) fail('UNSAFE_PATH');
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        if (Object.keys(files).length >= 4094) fail('INTEGRATION_PAYLOAD_LIMIT');
        const value = await snapshot(root, [path]);
        if (value[path] === null) fail('INTEGRATION_FAILED');
        bytes += Buffer.from(value[path], 'base64').length;
        if (bytes > 16 * 1024 * 1024) fail('INTEGRATION_PAYLOAD_LIMIT');
        files[path] = value[path];
        fileModes[path] = (await fs.stat(join(root, path))).mode & 0o111 ? 0o755 : 0o644;
      } else fail('UNSAFE_PATH');
    }
  }
  await visit(prefix);
  return { files, bytes, fileModes };
}

async function stage(tool, source, env, executable, run) {
  const scratch = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'agentvigor-native-plugin-')));
  try {
    const root = join(scratch, 'codex');
    await fs.mkdir(root);
    const childEnv = { ...minimalEnv(env), HOME: scratch, USERPROFILE: scratch,
      APPDATA: scratch, LOCALAPPDATA: scratch, CODEX_HOME: root,
      XDG_CONFIG_HOME: scratch, XDG_DATA_HOME: scratch, XDG_CACHE_HOME: scratch, XDG_STATE_HOME: scratch,
      CLAUDE_CONFIG_DIR: join(scratch, 'claude'), GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: join(scratch, 'gitconfig'), GIT_TEMPLATE_DIR: join(scratch, 'git-template'),
      GIT_TERMINAL_PROMPT: '0', DO_NOT_TRACK: '1', CI: '1' };
    await fs.writeFile(childEnv.GIT_CONFIG_GLOBAL, '', { mode: 0o600 });
    await fs.mkdir(childEnv.GIT_TEMPLATE_DIR);
    const invoke = async args => {
      const result = await run(executable, args, { cwd: scratch, env: childEnv, timeoutMs: 120000, maxOutputBytes: 128 * 1024 });
      if (result.code !== 0) fail('INTEGRATION_FAILED');
      try { return JSON.parse(result.stdout); } catch { fail('INTEGRATION_FAILED'); }
    };
    const marketplace = await invoke(['plugin', 'marketplace', 'add', source.repository, '--ref', source.revision, '--json']);
    if (marketplace.marketplaceName !== source.marketplace || marketplace.alreadyAdded !== false) fail('INTEGRATION_FAILED');
    const registration = marketplaceManifest(source);
    const registrationPath = join(root, registration);
    const originalManifest = (await snapshot(root, [registration]))[registration];
    if (originalManifest === null) fail('INTEGRATION_FAILED');
    const marketplaceDefinition = JSON.parse(Buffer.from(originalManifest, 'base64'));
    const listing = marketplaceDefinition.plugins?.find(entry => entry.name === tool);
    if (marketplaceDefinition.name !== source.marketplace || !listing?.source) fail('INTEGRATION_FAILED');
    if (listing.source.url === `https://github.com/${source.repository}.git`) {
      listing.source.ref = source.revision;
      await fs.writeFile(registrationPath, JSON.stringify(marketplaceDefinition, null, 2) + '\n');
    } else if (listing.source.url !== './') fail('INTEGRATION_FAILED');
    const installed = await invoke(['plugin', 'add', id(tool, source), '--json']);
    if (installed.pluginId !== id(tool, source) || installed.version !== source.version ||
        resolve(installed.installedPath || '') !== resolve(root, cache(tool, source))) fail('INTEGRATION_FAILED');
    const config = await readRegular(join(root, 'config.toml'), 1024 * 1024, 'INTEGRATION_FAILED');
    if (!config || config.toString().replaceAll('\r\n', '\n') !== tables(tool, source)) fail('INTEGRATION_FAILED');
    const git = (await detectTools({ env })).git?.path;
    if (!git) fail('GIT_MISSING');
    const revision = await run(git, ['-C', join(root, cache(tool, source)), 'rev-parse', 'HEAD'],
      { cwd: scratch, env: childEnv, timeoutMs: 10000, maxOutputBytes: 4096 });
    if (revision.code !== 0 || revision.stdout.trim() !== source.revision) fail('INTEGRATION_FAILED');
    const output = await payload(root, cache(tool, source));
    const nativeManifest = (await snapshot(root, [registration]))[registration];
    if (nativeManifest === null || JSON.parse(Buffer.from(nativeManifest, 'base64')).name !== source.marketplace) {
      fail('INTEGRATION_FAILED');
    }
    output.files[registration] = nativeManifest;
    const listed = await invoke(['plugin', 'list', '--marketplace', source.marketplace, '--json']);
    if (!listed.installed?.some(entry => entry.pluginId === id(tool, source) &&
        entry.version === source.version && entry.installed === true && entry.enabled === true)) fail('INTEGRATION_FAILED');
    const manifest = JSON.parse(Buffer.from(output.files[`${cache(tool, source)}/.codex-plugin/plugin.json`] || '', 'base64').toString());
    if (manifest.name !== tool || manifest.version !== source.version || manifest.license !== 'MIT' ||
        !Object.keys(output.files).some(name => /\/LICENSE(?:\.md|\.txt)?$/i.test(name))) fail('INTEGRATION_FAILED');
    return output;
  } finally { await fs.rm(scratch, { recursive: true, force: true }); }
}

async function ownedNames(home, tool, source) {
  const state = await pluginState(home, tool);
  if (state === null) fail('NO_ROLLBACK');
  const names = Object.keys(state.after || {});
  if (!names.includes('config.toml') || names.length < 2 || names.some(name => name !== 'config.toml' &&
      name !== marketplaceManifest(source) && !name.startsWith(cache(tool, source) + '/'))) fail('INVALID_STATE');
  return names;
}

async function pluginState(home, tool) {
  const stateRoot = join(home, '.agentvigor/integrations', `${tool}-codex`);
  await snapshot(stateRoot, ['.path-check']);
  const data = await readRegular(join(stateRoot, 'state.json'), 64 * 1024 * 1024, 'INVALID_STATE');
  if (data === null) return null;
  try { return JSON.parse(data); } catch { fail('INVALID_STATE'); }
}

export async function manageNativePlugin({ tool, agent = 'codex', mode = 'install', home = homedir(), env = process.env,
  dryRun = false, expectedPlan, executable, run = runFile } = {}) {
  const source = validate(tool, agent);
  if (!['install', 'rollback'].includes(mode)) fail('INTEGRATION_MODE');
  const common = { tool, agent, source, discovered: unknown('Restart the native client and enumerate its plugin skills.'),
    verified: unknown('No native model invocation or lifecycle hook trust was performed.') };
  if (agent === 'claude') return {
    ...common, status: 'BLOCKED', mutates: false,
    reason: 'CLAUDE_NATIVE_LIFECYCLE_UNVERIFIED',
    handoff: 'docs/NATIVE-PLUGIN-MANAGEMENT.md',
  };
  if (!dryRun && expectedPlan === undefined) fail('CONFIRMATION_REQUIRED');
  const root = base(home, env);
  if (!isAbsolute(home) || env.CODEX_HOME && !isAbsolute(env.CODEX_HOME)) fail('UNSAFE_PATH');
  let names, after, bytes = 0;
  const beforeWrite = async () => {
    const other = tool === 'superpowers' ? 'ponytail' : 'superpowers';
    if ((await pluginState(home, other))?.status === 'pending') fail('RECOVERY_REQUIRED');
  };
  const prepare = () => prepareIntegration({ home, root, tool, agent, mode, names, lockGroup: 'native-plugins',
    reconcile: (...args) => reconcileConfig(tool, ...args) });
  if (mode === 'rollback') names = await ownedNames(home, tool, source);
  else {
    const current = await snapshot(root, ['config.toml']);
    const config = Buffer.from(current['config.toml'] || '', 'base64').toString();
    // Refuse every existing identity instead of adopting or overwriting another install.
    if (config.includes(tool)) {
      try { names = await ownedNames(home, tool, source); }
      catch (error) { if (error.code === 'NO_ROLLBACK') fail('UNMANAGED_PLUGIN'); throw error; }
      const context = await prepare();
      if (context.state?.status !== 'installed') fail('RECOVERY_REQUIRED');
      const result = await applyIntegration(context, { after: context.before, dryRun, expectedPlan, fingerprint: source });
      return { ...common, ...result, networkRequired: false };
    }
    const marketplaces = await fs.readdir(join(root, 'plugins/cache'), { withFileTypes: true }).catch(error => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    for (const marketplace of marketplaces) {
      if (marketplace.isSymbolicLink()) fail('UNSAFE_PATH');
      try { await fs.lstat(join(root, 'plugins/cache', marketplace.name, tool)); fail('UNMANAGED_PLUGIN'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    executable ||= env.AGENTVIGOR_CODEX_EXECUTABLE || (await detectTools({ env })).codex?.path;
    if (!executable || !isAbsolute(executable) || process.platform === 'win32' && !/\.exe$/i.test(executable)) return {
      ...common, status: 'BLOCKED', mutates: false, reason: 'NATIVE_CODEX_EXECUTABLE_UNAVAILABLE', handoff: 'docs/NATIVE-PLUGIN-MANAGEMENT.md',
    };
    const output = await stage(tool, source, env, executable, run);
    bytes = output.bytes;
    const currentBlocks = managedConfig(config);
    if (!currentBlocks) fail('SKILL_DRIFT');
    const created = current['config.toml'] === null || currentBlocks.base === '' &&
      Object.values(currentBlocks.blocks).some(fragment => fragment.includes('(created config)'));
    after = { ...output.files, 'config.toml': Buffer.from(config + block(tool, source, created)).toString('base64') };
    names = Object.keys(after);
    // Stage is untrusted: retain only the one generated registration and its pinned cache.
    if (names.some(name => name !== 'config.toml' && name !== marketplaceManifest(source) &&
        !name.startsWith(cache(tool, source) + '/'))) fail('UNSAFE_PATH');
    const context = await prepare();
    if (context.before['config.toml'] !== current['config.toml']) fail('PLAN_CHANGED');
    if (names.some(name => name !== 'config.toml' && context.before[name] !== null)) fail('UNMANAGED_PLUGIN');
    const result = await applyIntegration(context, { after, dryRun, expectedPlan, fingerprint: source, beforeWrite,
      fileModes: process.platform === 'win32' ? {} : output.fileModes });
    return { ...common, ...result, payloadBytes: bytes, networkRequired: true, networkHosts: ['github.com'],
      installed: { state: dryRun ? 'UNVERIFIED' : 'INSTALLED' }, configured: { state: dryRun ? 'UNVERIFIED' : 'CONFIGURED' } };
  }
  const context = await prepare();
  const result = await applyIntegration(context, { dryRun, expectedPlan, fingerprint: source, beforeWrite });
  return { ...common, ...result, networkRequired: false };
}
