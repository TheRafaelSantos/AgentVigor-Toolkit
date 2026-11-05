import * as fs from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { applyIntegration, prepareIntegration, snapshot } from './integration-files.mjs';
import { hash, minimalEnv, readRegular, runFile } from '../skills/agentvigor-toolkit/scripts/process.mjs';

export const graphifySource = Object.freeze({ version: '0.9.102', package: 'graphifyy',
  commit: '59b5ab1151e031fb42e39cfc9a50bf96f2d57ae0',
  source: 'https://github.com/Graphify-Labs/graphify/tree/59b5ab1151e031fb42e39cfc9a50bf96f2d57ae0',
  licenses: ['Apache-2.0', 'MIT', 'NOTICE'] });
const refs = ['add-watch.md', 'exports.md', 'extraction-spec.md', 'github-and-merge.md',
  'hooks.md', 'query.md', 'transcribe.md', 'update.md'];
const skillFiles = ['SKILL.md', ...refs.map(name => 'references/' + name), '.graphify_version',
  'licenses/LICENSE', 'licenses/LICENSE-MIT', 'licenses/NOTICE'];
const fail = code => { throw Object.assign(new Error(code), { code }); };
const encode = bytes => Buffer.from(bytes).toString('base64');
const decode = bytes => Buffer.from(bytes, 'base64').toString('utf8');

async function exists(path) {
  try { await fs.lstat(path); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

async function executableHash(executable) {
  if (!executable || !isAbsolute(executable)) fail('GRAPHIFY_MISSING');
  const bytes = await readRegular(executable, 32 * 1024 * 1024, 'GRAPHIFY_UNRECOGNIZED');
  if (!bytes) fail('GRAPHIFY_MISSING');
  return hash(bytes);
}

function registration(path) {
  return '# graphify\n- **graphify** (`' + path + '`) - any input to knowledge graph. Trigger: `/graphify`\n' +
    'When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.\n';
}

async function bundle(agent) {
  const files = [agent + '/SKILL.md', ...refs.map(name => agent + '/references/' + name), 'LICENSE', 'LICENSE-MIT', 'NOTICE'];
  const bytes = await Promise.all(files.map(name => fs.readFile(new URL('./assets/graphify/' + name, import.meta.url))));
  if (hash(Buffer.concat(bytes)) !== bundleHashes[agent]) fail('BUNDLE_ERROR');
  return Object.fromEntries(skillFiles.map((name, index) => ['skills/graphify/' + name,
    encode(name === '.graphify_version' ? graphifySource.version : bytes[index > 9 ? index - 1 : index])]));
}

async function isolated(env, callback) {
  const scratch = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'agentvigor-graphify-')));
  const childEnv = { ...minimalEnv(env), HOME: scratch, USERPROFILE: scratch,
    HOMEDRIVE: '', HOMEPATH: scratch, APPDATA: scratch, LOCALAPPDATA: scratch,
    XDG_CONFIG_HOME: scratch, XDG_CACHE_HOME: scratch, XDG_DATA_HOME: scratch, XDG_STATE_HOME: scratch,
    CODEX_HOME: join(scratch, '.codex'), CLAUDE_CONFIG_DIR: join(scratch, '.claude'),
    PYTHONNOUSERSITE: '1', PYTHONUTF8: '1', DO_NOT_TRACK: '1', GRAPHIFY_NO_UPDATE_CHECK: '1' };
  try { return await callback(scratch, childEnv); }
  finally { await fs.rm(scratch, { recursive: true, force: true }); }
}

async function generated(context, after, executable, env, run) {
  return isolated(env, async (scratch, childEnv) => {
    const config = context.agent === 'codex' ? childEnv.CODEX_HOME : childEnv.CLAUDE_CONFIG_DIR;
    await fs.mkdir(config);
    if (context.agent === 'claude' && context.before['CLAUDE.md'] !== null) {
      await fs.writeFile(join(config, 'CLAUDE.md'), Buffer.from(context.before['CLAUDE.md'], 'base64'));
    }
    const result = await run(executable, ['install', '--platform', context.agent],
      { cwd: scratch, env: childEnv, timeoutMs: 30000, maxOutputBytes: 128 * 1024 });
    if (result.code !== 0) fail('GRAPHIFY_FAILED');
    const generatedNames = context.names.filter(name => !name.includes('/licenses/'));
    const actual = await snapshot(config, generatedNames);
    if (context.agent === 'claude' && actual['CLAUDE.md']) {
      const stagePath = join(config, 'skills', 'graphify', 'SKILL.md');
      actual['CLAUDE.md'] = encode(decode(actual['CLAUDE.md']).replaceAll(stagePath, join(context.root, 'skills', 'graphify', 'SKILL.md')));
    }
    if (generatedNames.some(name => actual[name] !== after[name])) fail('GRAPHIFY_UNRECOGNIZED');
  });
}

/** Preview is offline: only --version executes, in an isolated home. Initializer runs on apply. */
export async function configureGraphify({ home = homedir(), env = process.env, agent = 'codex',
  mode = 'configure', executable, dryRun = false, expectedPlan, run = runFile } = {}) {
  if (!['codex', 'claude'].includes(agent)) fail('INVALID_AGENTS');
  if (!['configure', 'rollback'].includes(mode)) fail('INTEGRATION_MODE');
  const root = (agent === 'codex' ? env.CODEX_HOME : env.CLAUDE_CONFIG_DIR) || join(home, '.' + agent);
  const names = skillFiles.map(name => 'skills/graphify/' + name);
  if (agent === 'claude') names.push('CLAUDE.md');
  const context = await prepareIntegration({ home, root, tool: 'graphify', agent, mode, names });
  let after = context.after, fingerprint = null;
  if (mode === 'configure') {
    const duplicates = agent === 'codex'
      ? [join(home, '.agents', 'skills', 'graphify'), join(home, '.codex', 'skills', 'graphify')]
      : [join(home, '.claude', 'skills', 'graphify')];
    for (const path of duplicates) {
      if (resolve(path) !== resolve(join(root, 'skills', 'graphify')) && await exists(path)) fail('DUPLICATE_SKILL');
    }
    if (context.state?.status !== 'installed' && await exists(join(root, 'skills', 'graphify'))) fail('UNMANAGED_SKILL');
    fingerprint = await executableHash(executable);
    await isolated(env, async (scratch, childEnv) => {
      const probe = await run(executable, ['--version'], { cwd: scratch, env: childEnv, timeoutMs: 5000, maxOutputBytes: 4096 });
      if (probe.code !== 0 || !/^(?:graphify\s+)?0\.9\.102$/i.test(probe.stdout.trim())) fail('GRAPHIFY_UNRECOGNIZED');
    });
    after = await bundle(agent);
    if (agent === 'claude') {
      if (context.state?.status === 'installed') after['CLAUDE.md'] = context.before['CLAUDE.md'];
      else {
        const text = context.before['CLAUDE.md'] === null ? '' : decode(context.before['CLAUDE.md']);
        if (text.split(/\r?\n/).some(line => line.trim() === '# graphify')) fail('UNMANAGED_REGISTRATION');
        const newline = text.includes('\r\n') ? '\r\n' : '\n';
        const merged = (text.trim() ? text.trimEnd() + newline + newline : '') +
          registration(join(context.root, 'skills', 'graphify', 'SKILL.md')).replaceAll('\n', newline);
        after['CLAUDE.md'] = encode(merged);
      }
    }
    if (await executableHash(executable) !== fingerprint) fail('PLAN_CHANGED');
  }
  const result = await applyIntegration(context, { after, dryRun, expectedPlan, fingerprint,
    beforeWrite: mode === 'configure' ? async () => {
      if (await executableHash(executable) !== fingerprint) fail('PLAN_CHANGED');
      await generated(context, after, executable, env, run);
      if (await executableHash(executable) !== fingerprint) fail('PLAN_CHANGED');
    } : undefined });
  return { ...result, source: graphifySource, destination: context.root, networkRequired: false,
    initializerExecuted: !dryRun && result.status === 'configured',
    previewBehavior: 'Bundled pinned bytes; isolated --version only; initializer executes during confirmed apply.',
    discovered: { state: 'UNVERIFIED', reason: 'Requires a fresh native-client session.' },
    verified: { state: 'UNVERIFIED', reason: 'Requires an observed scoped invocation.' } };
}

const bundleHashes = {
  codex: 'a86c4af84bc99b77a18206f175ae63c0f2eb40c284f9924b099a8fb4ee837d6b',
  claude: '5d8b5c656b63cd09d7c88e8b405fe88a072d6bbbbaace68b05f9ed5a7cf61501',
};
