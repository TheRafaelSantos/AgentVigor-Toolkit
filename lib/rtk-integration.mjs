import { createHash, randomUUID } from 'node:crypto';
import { constants, createReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import { runFile, minimalEnv } from '../skills/agentvigor-toolkit/scripts/process.mjs';

const names = {
  codex: ['AGENTS.md', 'RTK.md', 'hooks.json'],
  claude: ['CLAUDE.md', 'RTK.md', 'settings.json'],
};
const limit = 1024 * 1024;
const fail = code => { throw Object.assign(new Error(code), { code }); };
const hash = value => createHash('sha256').update(value).digest('hex');

async function binaryHash(executable) {
  const info = await fs.stat(executable);
  if (!info.isFile() || info.size > 256 * 1024 * 1024) fail('RTK_UNRECOGNIZED');
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(executable)) digest.update(chunk);
  return digest.digest('hex');
}

async function directory(path, create = false) {
  let cursor = parse(path).root;
  for (const part of relative(cursor, path).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    let info;
    try { info = await fs.lstat(cursor); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!create) return false;
      await fs.mkdir(cursor, { mode: 0o700 }).catch(error => {
        if (error.code !== 'EEXIST') throw error;
      });
      info = await fs.lstat(cursor);
    }
    if (!info.isDirectory() || info.isSymbolicLink()) fail('UNSAFE_PATH');
  }
  return true;
}

async function read(path, maxBytes = limit) {
  if (!await directory(dirname(path))) return null;
  let info;
  try { info = await fs.lstat(path); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  if (!info.isFile() || info.isSymbolicLink() || info.size > maxBytes) fail('UNSAFE_PATH');
  const file = await fs.open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const current = await file.stat();
    if (!current.isFile() || current.ino !== info.ino || current.dev !== info.dev) fail('UNSAFE_PATH');
    const bytes = Buffer.alloc(maxBytes + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await file.read(bytes, offset, bytes.length - offset, offset);
      if (!bytesRead) break;
      offset += bytesRead;
    }
    if (offset > maxBytes) fail('UNSAFE_PATH');
    return bytes.subarray(0, offset).toString('base64');
  } finally { await file.close(); }
}

async function snapshot(root, agent) {
  return Object.fromEntries(await Promise.all(names[agent].map(async name => [name, await read(join(root, name))])));
}

async function write(path, value, expected, maxBytes = limit) {
  if (await read(path, maxBytes) !== expected) fail('SKILL_DRIFT');
  await directory(dirname(path), true);
  if (value === null) {
    if (expected !== null) await fs.unlink(path);
    return;
  }
  const stage = join(dirname(path), '.agentvigor-rtk-' + randomUUID() + '.tmp');
  const file = await fs.open(stage, 'wx', 0o600);
  try {
    await file.writeFile(Buffer.from(value, 'base64'));
    await file.sync();
  } finally { await file.close(); }
  try {
    if (await read(path, maxBytes) !== expected) fail('SKILL_DRIFT');
    if (expected === null) await fs.link(stage, path);
    else await fs.rename(stage, path);
  } finally {
    await fs.unlink(stage).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}

function validateSnapshot(value, agent) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).sort().join() !== [...names[agent]].sort().join()) fail('INVALID_STATE');
  for (const data of Object.values(value)) {
    if (data === null) continue;
    if (typeof data !== 'string' || data.length > Math.ceil(limit / 3) * 4 ||
        Buffer.from(data, 'base64').toString('base64') !== data) fail('INVALID_STATE');
  }
}

async function managedState(file, root, agent) {
  const encoded = await read(file, 8 * limit);
  if (encoded === null) return null;
  let state;
  try { state = JSON.parse(Buffer.from(encoded, 'base64').toString()); } catch { fail('INVALID_STATE'); }
  if (state.schema !== 1 || state.root !== hash(root) || state.agent !== agent ||
      !['installed', 'pending', 'rolled-back'].includes(state.status)) fail('INVALID_STATE');
  validateSnapshot(state.before, agent);
  validateSnapshot(state.after, agent);
  if (state.interrupted !== undefined) validateSnapshot(state.interrupted, agent);
  return state;
}

async function generated(root, before, agent, executable, env, run) {
  const scratch = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'agentvigor-rtk-')));
  const config = join(scratch, 'config');
  try {
    await fs.mkdir(config);
    const awareness = join(root, 'RTK.md');
    for (const [name, bytes] of Object.entries(before)) {
      if (bytes === null) continue;
      let content = Buffer.from(bytes, 'base64');
      if (name === 'AGENTS.md') content = Buffer.from(content.toString().replaceAll('@' + awareness, '@' + join(config, 'RTK.md')));
      await fs.writeFile(join(config, name), content, { mode: 0o600 });
    }
    const childEnv = { ...minimalEnv(env), HOME: scratch, USERPROFILE: scratch,
      APPDATA: scratch, LOCALAPPDATA: scratch, XDG_CONFIG_HOME: scratch,
      XDG_DATA_HOME: scratch, XDG_STATE_HOME: scratch, XDG_CACHE_HOME: scratch,
      CODEX_HOME: config, CLAUDE_CONFIG_DIR: config, RTK_DB_PATH: join(scratch, 'metrics.db') };
    const args = ['init', '-g', ...(agent === 'codex' ? ['--codex'] : ['--auto-patch', '--no-trust-filters'])];
    const result = await run(executable, args, { env: childEnv, cwd: scratch, timeoutMs: 15000, maxOutputBytes: 128 * 1024 });
    if (result.code !== 0) fail('RTK_FAILED');
    const after = await snapshot(config, agent);
    if (!after['RTK.md']) fail('RTK_UNRECOGNIZED');
    if (agent === 'codex' && after['AGENTS.md']) {
      const text = Buffer.from(after['AGENTS.md'], 'base64').toString()
        .replaceAll('@' + join(config, 'RTK.md'), '@' + awareness);
      after['AGENTS.md'] = Buffer.from(text).toString('base64');
    }
    const hooksFile = agent === 'codex' ? 'hooks.json' : 'settings.json';
    let hooks;
    try { hooks = JSON.parse(Buffer.from(after[hooksFile], 'base64').toString()).hooks; }
    catch { fail('RTK_UNRECOGNIZED'); }
    const commands = Object.values(hooks ?? {}).flatMap(groups => Array.isArray(groups)
      ? groups.flatMap(group => (group.hooks ?? []).map(hook => hook.command).filter(command => typeof command === 'string' && /rtk(?:\.exe)?["']?\s+hook\b/i.test(command))) : []);
    if (!commands.length) fail('RTK_UNRECOGNIZED');
    if (new Set(commands).size !== commands.length) fail('DUPLICATE_HOOKS');
    return after;
  } finally { await fs.rm(scratch, { recursive: true, force: true }); }
}

export async function configureRtk({
  home = homedir(), env = process.env, agent = 'codex', mode = 'configure',
  executable, run = runFile, dryRun = false, expectedPlan,
} = {}) {
  if (!Object.hasOwn(names, agent)) fail('INVALID_AGENTS');
  if (!['configure', 'rollback'].includes(mode)) fail('INTEGRATION_MODE');
  if (!isAbsolute(home) || (mode === 'configure' && (!executable || !isAbsolute(executable)))) fail('RTK_MISSING');
  const configuredRoot = (agent === 'codex' ? env.CODEX_HOME : env.CLAUDE_CONFIG_DIR) || join(home, '.' + agent);
  if (!isAbsolute(configuredRoot)) fail('UNSAFE_PATH');
  const root = resolve(configuredRoot);
  if (root === parse(root).root || !await directory(home)) fail('UNSAFE_PATH');
  const stateRoot = join(home, '.agentvigor', 'integrations', 'rtk-' + agent);
  if (root === stateRoot || relative(root, stateRoot).startsWith('..') === false ||
      relative(stateRoot, root).startsWith('..') === false) fail('UNSAFE_PATH');
  const stateFile = join(stateRoot, 'state.json');
  const state = await managedState(stateFile, root, agent);
  const before = await snapshot(root, agent);
  const executableHash = mode === 'configure' ? await binaryHash(executable) : null;
  let after;
  if (mode === 'rollback') {
    if (!state || state.status === 'rolled-back') fail('NO_ROLLBACK');
    for (const name of names[agent]) {
      if (state.status === 'pending' ? before[name] !== state.before[name] && before[name] !== state.after[name] &&
          before[name] !== state.interrupted?.[name]
        : before[name] !== state.after[name]) fail('SKILL_DRIFT');
    }
    after = state.before;
  } else {
    if (state?.status === 'pending') fail('RECOVERY_REQUIRED');
    if (state?.status === 'installed' && names[agent].some(name => before[name] !== state.after[name])) {
      fail('SKILL_DRIFT');
    }
    const probe = await run(executable, ['--version'], { env: minimalEnv(env), timeoutMs: 3000, maxOutputBytes: 4096 });
    if (probe.code !== 0 || probe.stdout.trim() !== 'rtk 1.1.0') fail('RTK_UNRECOGNIZED');
    after = await generated(root, before, agent, executable, env, run);
    if (await binaryHash(executable) !== executableHash) fail('PLAN_CHANGED');
  }
  const planToken = hash(JSON.stringify({ root, agent, mode, executableHash, before, after, state }));
  const changes = names[agent].filter(name => before[name] !== after[name]).map(path => ({
    path, action: after[path] === null ? 'remove' : before[path] === null ? 'add' : 'replace',
  }));
  if (dryRun) return { status: 'planned', agent, tool: 'rtk', changes, planToken };
  if (expectedPlan === undefined) fail('CONFIRMATION_REQUIRED');
  if (expectedPlan !== planToken) fail('PLAN_CHANGED');
  await directory(stateRoot, true);
  const lock = join(stateRoot, 'write.lock');
  try { await fs.mkdir(lock, { mode: 0o700 }); }
  catch (error) { if (error.code === 'EEXIST') fail('LOCKED'); throw error; }
  try {
    if (JSON.stringify(await snapshot(root, agent)) !== JSON.stringify(before) ||
        JSON.stringify(await managedState(stateFile, root, agent)) !== JSON.stringify(state)) fail('PLAN_CHANGED');
    if (!changes.length && mode === 'configure') return { status: 'unchanged', tool: 'rtk', agent, changes, planToken };
    const recoveryBefore = mode === 'rollback' ? state.before : before;
    const record = { schema: 1, root: hash(root), agent, before: recoveryBefore, after, interrupted: before, status: 'pending' };
    await write(stateFile, Buffer.from(JSON.stringify(record)).toString('base64'), await read(stateFile, 8 * limit), 8 * limit);
    try {
      for (const { path } of changes) await write(join(root, path), after[path], before[path]);
    } catch {
      fail('RECOVERY_REQUIRED');
    }
    record.status = mode === 'rollback' ? 'rolled-back' : 'installed';
    await write(stateFile, Buffer.from(JSON.stringify(record)).toString('base64'), await read(stateFile, 8 * limit), 8 * limit);
    return { status: mode === 'rollback' ? 'rolled-back' : 'configured', tool: 'rtk', agent, changes, planToken };
  } finally { await fs.rmdir(lock); }
}
