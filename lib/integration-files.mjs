import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import * as fs from 'node:fs/promises';
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
const limit = 2 * 1024 * 1024;
const stateLimit = 64 * 1024 * 1024;
const snapshotLimit = 20 * 1024 * 1024;
const fail = code => { throw Object.assign(new Error(code), { code }); };
const hash = value => createHash('sha256').update(value).digest('hex');

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
    const bytes = Buffer.alloc(current.size + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await file.read(bytes, offset, bytes.length - offset, offset);
      if (!bytesRead) break;
      offset += bytesRead;
    }
    if (offset !== current.size) fail('UNSAFE_PATH');
    return bytes.subarray(0, offset).toString('base64');
  } finally { await file.close(); }
}

export async function snapshot(root, names) {
  const entries = [];
  let bytes = 0;
  for (let offset = 0; offset < names.length; offset += 8) {
    const batch = await Promise.all(names.slice(offset, offset + 8).map(async name => [name, await read(join(root, name))]));
    for (const entry of batch) {
      bytes += Buffer.byteLength(entry[0]) + (entry[1]?.length ?? 4) + 8;
      if (bytes > snapshotLimit) fail('INVALID_STATE');
      entries.push(entry);
    }
  }
  return Object.fromEntries(entries);
}

async function write(path, value, expected, maxBytes = limit, mode = 0o600) {
  if (await read(path, maxBytes) !== expected) fail('SKILL_DRIFT');
  await directory(dirname(path), true);
  if (value === null) {
    if (expected !== null) await fs.unlink(path);
    return;
  }
  const stage = join(dirname(path), '.agentvigor-integration-' + randomUUID() + '.tmp');
  const file = await fs.open(stage, 'wx', mode);
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

function validateSnapshot(value, names) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).sort().join() !== [...names].sort().join()) fail('INVALID_STATE');
  if (Buffer.byteLength(JSON.stringify(value)) > snapshotLimit) fail('INVALID_STATE');
  for (const data of Object.values(value)) {
    if (data === null) continue;
    if (typeof data !== 'string' || data.length > Math.ceil(limit / 3) * 4 ||
        Buffer.from(data, 'base64').toString('base64') !== data) fail('INVALID_STATE');
  }
}

async function managedState(file, root, agent, names) {
  const encoded = await read(file, stateLimit);
  if (encoded === null) return null;
  let state;
  try { state = JSON.parse(Buffer.from(encoded, 'base64').toString()); } catch { fail('INVALID_STATE'); }
  if (state.schema !== 1 || state.root !== hash(root) || state.agent !== agent ||
      !['installed', 'pending', 'rolled-back'].includes(state.status)) fail('INVALID_STATE');
  validateSnapshot(state.before, names);
  validateSnapshot(state.after, names);
  if (state.interrupted !== undefined) validateSnapshot(state.interrupted, names);
  return state;
}


export async function prepareIntegration({ home, root, tool, agent, mode, names, reconcile, lockGroup = tool }) {
  if (!/^[a-z-]+$/.test(tool) || !['codex', 'claude'].includes(agent) ||
      !Array.isArray(names) || !names.length || names.length > 4096 || new Set(names).size !== names.length ||
      names.some(name => typeof name !== 'string' || name.length > 512 || !/^[a-zA-Z0-9._/-]+$/.test(name) ||
        name.split('/').some(part => !part || part === '.' || part === '..'))) fail('UNSAFE_PATH');
  if (!isAbsolute(home) || !isAbsolute(root) || !/^[a-z-]+$/.test(lockGroup)) fail('UNSAFE_PATH');
  root = resolve(root);
  if (root === parse(root).root || !await directory(home)) fail('UNSAFE_PATH');
  const stateRoot = join(home, '.agentvigor', 'integrations', tool + '-' + agent);
  if (root === stateRoot || relative(root, stateRoot).startsWith('..') === false ||
      relative(stateRoot, root).startsWith('..') === false) fail('UNSAFE_PATH');
  const stateFile = join(stateRoot, 'state.json');
  const lockRoot = join(home, '.agentvigor', 'integrations', lockGroup + '-' + agent);
  if (!relative(root, lockRoot).startsWith('..') || !relative(lockRoot, root).startsWith('..')) fail('UNSAFE_PATH');
  const state = await managedState(stateFile, root, agent, names);
  const before = await snapshot(root, names);
  let after;
  if (mode === 'rollback') {
    if (!state || state.status === 'rolled-back') fail('NO_ROLLBACK');
    after = { ...state.before };
    for (const name of names) {
      if (before[name] === state.after[name]) continue;
      if (state.status === 'pending') {
        if (before[name] !== state.before[name] && before[name] !== state.interrupted?.[name]) fail('SKILL_DRIFT');
      } else {
        const merged = reconcile?.(name, before[name], state, mode);
        if (merged === undefined) fail('SKILL_DRIFT');
        after[name] = merged;
      }
    }
  } else {
    if (state?.status === 'pending') fail('RECOVERY_REQUIRED');
    if (state?.status === 'installed' && names.some(name => before[name] !== state.after[name] &&
        reconcile?.(name, before[name], state, mode) === undefined)) {
      fail('SKILL_DRIFT');
    }
  }
  return { home, root, tool, agent, mode, names, stateRoot, stateFile, lockRoot, state, before, after };
}

export async function applyIntegration(context, { after = context.after, dryRun = false, expectedPlan, fingerprint = null,
  beforeWrite, fileModes = {} } = {}) {
  const { root, tool, agent, mode, names, stateRoot, stateFile, lockRoot, state, before } = context;
  validateSnapshot(after, names);
  if (!fileModes || typeof fileModes !== 'object' || Array.isArray(fileModes) ||
      Object.entries(fileModes).some(([name, mode]) => !names.includes(name) || before[name] !== null ||
        after[name] === null || ![0o644, 0o755].includes(mode))) fail('UNSAFE_PATH');
  const planToken = hash(JSON.stringify({ root, agent, mode, fingerprint, before, after, state, fileModes }));
  const changes = names.filter(name => before[name] !== after[name]).map(path => ({
    path, action: after[path] === null ? 'remove' : before[path] === null ? 'add' : 'replace',
  }));
  if (dryRun) return { status: 'planned', agent, tool, changes, planToken };
  if (expectedPlan === undefined) fail('CONFIRMATION_REQUIRED');
  if (expectedPlan !== planToken) fail('PLAN_CHANGED');
  await directory(stateRoot, true);
  if (lockRoot !== stateRoot) await directory(lockRoot, true);
  const lock = join(lockRoot, 'write.lock');
  try { await fs.mkdir(lock, { mode: 0o700 }); }
  catch (error) { if (error.code === 'EEXIST') fail('LOCKED'); throw error; }
  try {
    if (JSON.stringify(await snapshot(root, names)) !== JSON.stringify(before) ||
        JSON.stringify(await managedState(stateFile, root, agent, names)) !== JSON.stringify(state)) fail('PLAN_CHANGED');
    if (!changes.length && mode !== 'rollback') return { status: 'unchanged', tool, agent, changes, planToken };
    if (beforeWrite) {
      await beforeWrite();
      if (JSON.stringify(await snapshot(root, names)) !== JSON.stringify(before) ||
          JSON.stringify(await managedState(stateFile, root, agent, names)) !== JSON.stringify(state)) fail('PLAN_CHANGED');
    }
    const recoveryBefore = mode === 'rollback' ? after : before;
    const record = { schema: 1, root: hash(root), agent, before: recoveryBefore, after, interrupted: before, status: 'pending' };
    const serialized = JSON.stringify(record);
    if (Buffer.byteLength(serialized) > stateLimit) fail('INVALID_STATE');
    await write(stateFile, Buffer.from(serialized).toString('base64'), await read(stateFile, stateLimit), stateLimit);
    try {
      for (const { path } of changes) await write(join(root, path), after[path], before[path], limit, fileModes[path] ?? 0o600);
    } catch {
      fail('RECOVERY_REQUIRED');
    }
    record.status = mode === 'rollback' ? 'rolled-back' : 'installed';
    await write(stateFile, Buffer.from(JSON.stringify(record)).toString('base64'), await read(stateFile, stateLimit), stateLimit);
    if (mode === 'rollback') {
      const directories = [...new Set(names.flatMap(name => {
        const parts = name.split('/');
        return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/'));
      }))].sort((a, b) => b.split('/').length - a.split('/').length);
      for (const name of directories) {
        await directory(root);
        if (await directory(join(root, name))) await fs.rmdir(join(root, name)).catch(error => {
          if (!['ENOTEMPTY', 'EEXIST', 'ENOENT'].includes(error.code)) throw error;
        });
      }
    }
    return { status: mode === 'rollback' ? 'rolled-back' : mode === 'install' ? 'installed' : 'configured', tool, agent, changes, planToken };
  } finally { await fs.rmdir(lock); }
}
