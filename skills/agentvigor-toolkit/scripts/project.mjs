import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import * as fs from 'node:fs/promises';
import { dirname, join, parse, resolve, sep } from 'node:path';
import { preset, projectPaths, projectTemplates } from './project-presets.mjs';

const stateDir = '.agentvigor-project';
const stateFile = stateDir + '/state.json';
const objects = stateDir + '/objects';
const proposals = stateDir + '/proposals/';
const limit = 512 * 1024;
const empty = { schemaVersion: 1, init: null, managed: {}, pending: null };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => hash(JSON.stringify(value));
const idPattern = /^[a-f0-9-]{36}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const allowed = file => typeof file === 'string' &&
  (projectPaths.has(file) || (file.startsWith(proposals) && projectPaths.has(file.slice(proposals.length))));

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

async function lstat(file) {
  return fs.lstat(file, { bigint: true }).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
}

async function directories(path, create = false) {
  const { root } = parse(path);
  let cursor = root;
  for (const part of path.slice(root.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    let info = await lstat(cursor);
    if (!info && create) {
      await fs.mkdir(cursor, { mode: 0o700 }).catch(error => {
        if (error.code !== 'EEXIST') throw error;
      });
      info = await lstat(cursor);
    }
    if (!info) return false;
    if (!info.isDirectory() || info.isSymbolicLink()) fail('UNSAFE_PATH');
  }
  return true;
}

async function inspect(file, read = false) {
  if (!await directories(dirname(file))) return null;
  const info = await lstat(file);
  if (!info) return null;
  if (!info.isFile() || info.isSymbolicLink()) fail('UNSAFE_PATH');
  const stamp = [info.dev, info.ino, info.size, info.mtimeNs].map(String).join(':');
  if (info.size > limit) {
    if (read) fail('INVALID_PROJECT_STATE');
    return { stamp, info, hash: null };
  }
  const handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
  try {
    const opened = await handle.stat({ bigint: true });
    if (!opened.isFile() || opened.ino !== info.ino || opened.dev !== info.dev) fail('UNSAFE_PATH');
    const buffer = Buffer.alloc(limit + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > limit) fail('PROJECT_FILE_LIMIT');
    const bytes = buffer.subarray(0, length);
    return { stamp, info, hash: hash(bytes), ...(read ? { text: bytes.toString('utf8') } : {}) };
  } finally {
    await handle.close();
  }
}

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function validateManaged(entries) {
  if (!record(entries) || Object.keys(entries).length > projectPaths.size * 2) fail('INVALID_PROJECT_STATE');
  const ids = new Set();
  for (const [file, item] of Object.entries(entries)) {
    if (!allowed(file) || !record(item) || typeof item.id !== 'string' || !idPattern.test(item.id) ||
        typeof item.hash !== 'string' || !hashPattern.test(item.hash) || ids.has(item.id)) fail('INVALID_PROJECT_STATE');
    ids.add(item.id);
  }
}

async function load(root) {
  const raw = await inspect(join(root, stateFile), true);
  if (!raw) return empty;
  let state;
  try {
    state = JSON.parse(raw.text);
  } catch {
    fail('INVALID_PROJECT_STATE');
  }
  if (!record(state) || state.schemaVersion !== 1 || (state.init !== null && !projectTemplates.includes(state.init))) fail('INVALID_PROJECT_STATE');
  validateManaged(state.managed);
  if (state.pending !== null) {
    const pending = state.pending;
    if (!record(pending) || !['add', 'remove'].includes(pending.action) ||
        (pending.init !== null && !projectTemplates.includes(pending.init))) fail('INVALID_PROJECT_STATE');
    validateManaged(pending.files);
    for (const [file, item] of Object.entries(pending.files)) {
      const existing = state.managed[file];
      if (pending.action === 'add' ? existing !== undefined : existing?.id !== item.id || existing?.hash !== item.hash) {
        fail('INVALID_PROJECT_STATE');
      }
    }
  }
  return state;
}

async function writeNew(path, contents) {
  await directories(dirname(path), true);
  const handle = await fs.open(path, 'wx', 0o600);
  try {
    await handle.writeFile(contents);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function save(root, state) {
  const path = join(root, stateFile);
  const stage = join(root, stateDir, randomUUID() + '.tmp');
  await writeNew(stage, JSON.stringify(state));
  try {
    await inspect(path);
    await fs.rename(stage, path);
  } finally {
    await fs.unlink(stage).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

const objectPath = (root, item) => join(root, objects, item.id);

async function ownership(root, file, item) {
  const target = await inspect(join(root, file));
  if (!target) return { status: 'missing' };
  const object = await inspect(objectPath(root, item));
  const owned = object && target.info.ino === object.info.ino && target.info.dev === object.info.dev;
  return { status: owned && target.hash === item.hash ? 'ok' : 'modified', stamp: target.stamp, hash: target.hash };
}

async function removeOwned(root, file, item) {
  const owned = await ownership(root, file, item);
  if (owned.status === 'ok') await fs.unlink(join(root, file));
}

async function dropObjects(root, entries) {
  if (!await directories(join(root, objects))) return;
  for (const item of Object.values(entries)) {
    const path = objectPath(root, item);
    const info = await lstat(path);
    if (info?.isFile() && !info.isSymbolicLink()) await fs.unlink(path);
  }
}

async function recover(root, state) {
  if (!state.pending) return;
  const { action, files, init } = state.pending;
  for (const [file, item] of Object.entries(files)) await removeOwned(root, file, item);
  const managed = { ...state.managed };
  if (action === 'remove') for (const file of Object.keys(files)) delete managed[file];
  await save(root, { ...state, init, managed, pending: null });
  await dropObjects(root, files);
}

async function plan(root, mode, template, lang) {
  const state = await load(root);
  const managed = [];
  for (const [file, item] of Object.entries(state.managed)) {
    const observed = await ownership(root, file, item);
    managed.push({ path: file, ...observed });
  }
  const operations = [];
  if (state.pending) {
    if (mode !== 'rollback' && mode !== 'status') fail('PROJECT_RECOVERY_REQUIRED');
    for (const [file, item] of Object.entries(state.pending.files)) {
      const observed = await ownership(root, file, item);
      operations.push({ path: file, action: observed.status === 'ok' ? 'remove' : 'keep', observed });
    }
  } else if (mode === 'rollback') {
    for (const entry of managed) {
      operations.push({ path: entry.path, action: entry.status === 'ok' ? 'remove' : 'keep', observed: entry });
    }
  } else if (mode !== 'status') {
    if (!projectTemplates.includes(template)) fail('INVALID_TEMPLATE');
    if (mode === 'adopt' && ['next', 'harness'].includes(template)) fail('INVALID_PROJECT_MODE');
    if (mode === 'init') {
      const entries = (await fs.readdir(root)).filter(entry => entry !== '.git' && entry !== stateDir);
      if ((state.init === null && entries.length) || (state.init !== null && state.init !== template)) {
        fail('PROJECT_NOT_EMPTY');
      }
    }
    for (const [target, content] of Object.entries(await preset(template, lang))) {
      if (!projectPaths.has(target)) fail('INVALID_TEMPLATE');
      const path = join(root, target);
      const current = await inspect(path);
      if (!current) {
        operations.push({ path: target, action: 'add', content });
      } else if (current.hash === hash(content) || mode === 'init' || Object.hasOwn(state.managed, target)) {
        operations.push({ path: target, action: 'keep', observed: current });
      } else {
        const destination = proposals + target;
        const proposal = await inspect(join(root, destination));
        operations.push({ path: destination, target, action: proposal ? 'keep' : 'propose',
          content, observed: current, proposal });
      }
    }
  }
  const planToken = digest({ root, mode, template, state, operations: operations.map(({ path, target, action, content, observed, proposal }) => ({
    path, target, action, proposed: content === undefined ? null : hash(content),
    observed: observed ? [observed.hash, observed.stamp] : null,
    proposal: proposal ? [proposal.hash, proposal.stamp] : null,
  })) });
  const changes = operations.map(({ path, target, action }) => ({ path, ...(target ? { target } : {}), action }));
  return { state, operations, changes, planToken,
    managed: managed.map(({ path, status }) => ({ path, status })) };
}

async function apply(root, state, operations, mode, template) {
  if (state.pending) {
    await recover(root, state);
    return 'recovered';
  }
  if (mode === 'rollback') {
    if (!Object.keys(state.managed).length) return 'unchanged';
    const pending = { action: 'remove', files: state.managed, init: null };
    await save(root, { ...state, pending });
    await recover(root, { ...state, pending });
    return 'rolled-back';
  }
  const additions = operations.filter(operation => operation.action !== 'keep');
  if (!additions.length) return 'unchanged';
  const files = {};
  for (const { path, content } of additions) {
    const item = { id: randomUUID(), hash: hash(content) };
    await writeNew(objectPath(root, item), content);
    files[path] = item;
  }
  const pending = { action: 'add', files, init: state.init };
  await save(root, { ...state, pending });
  try {
    for (const [path, item] of Object.entries(files)) {
      const destination = join(root, path);
      await directories(dirname(destination), true);
      await fs.link(objectPath(root, item), destination);
    }
    await save(root, { ...state, init: mode === 'init' ? template : state.init,
      managed: { ...state.managed, ...files }, pending: null });
  } catch (error) {
    await recover(root, { ...state, pending });
    throw error;
  }
  return 'applied';
}

export async function project({ path = '.', mode = 'status', template, lang = 'en', dryRun, expectedPlan } = {}) {
  if (!['status', 'init', 'adopt', 'rollback'].includes(mode)) fail('INVALID_PROJECT_MODE');
  if (typeof path !== 'string' || !path.trim()) fail('INVALID_PROJECT_PATH');
  const root = resolve(path);
  if (root === parse(root).root || !await directories(root)) fail('INVALID_PROJECT_PATH');
  const preview = await plan(root, mode, template ?? 'docs', lang);
  const { managed, changes, planToken } = preview;
  if (mode === 'status' || dryRun) return {
    status: mode === 'status' ? preview.state.pending ? 'recovery-required' : 'inspected' : 'planned',
    managed, changes, planToken,
  };
  if (expectedPlan === undefined) fail('CONFIRMATION_REQUIRED');
  if (planToken !== expectedPlan) fail('PLAN_CHANGED');
  await directories(join(root, stateDir), true);
  const lock = join(root, stateDir, 'write.lock');
  try {
    await fs.mkdir(lock, { mode: 0o700 });
  } catch (error) {
    if (error.code === 'EEXIST') fail('LOCKED');
    throw error;
  }
  try {
    const current = await plan(root, mode, template ?? 'docs', lang);
    if (current.planToken !== expectedPlan) fail('PLAN_CHANGED');
    const ignore = join(root, stateDir, '.gitignore');
    if (!await inspect(ignore)) await writeNew(ignore, '*\n');
    const status = await apply(root, current.state, current.operations, mode, template ?? 'docs');
    return { status, changes, planToken };
  } finally {
    await fs.rmdir(lock);
  }
}
