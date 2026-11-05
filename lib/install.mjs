import { isUtf8 } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import { constants, realpath } from 'node:fs';
import * as fs from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const agents = ['codex', 'claude'];
const basic = ['agentvigor-grounded-code', 'agentvigor-agent-doctor'];
const balanced = [...basic, 'agentvigor-diff-guardian', 'agentvigor-token-budget'];
const legacyProfiles = { minimal: basic, balanced, rigorous: [...balanced, 'agentvigor-safe-resume'] };
const router = 'agentvigor-toolkit';
const profiles = Object.fromEntries(Object.entries(legacyProfiles).map(([name, skills]) => [name, [...skills, router]]));
const namespaces = new Set(['references', 'templates', 'scripts', 'licenses']);
const schema = 2;
const skillLimit = 32 * 1024;
const assetLimit = 256 * 1024;
const bundleLimit = 2 * 1024 * 1024;
const assetCountLimit = 180;
const stateLimit = 32 * 1024 * 1024;
const pathDepthLimit = 10;
const reservedName = /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i;
const versionPattern = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?(?:\+[a-z0-9.-]+)?$/i;
const nativeRealpath = promisify(realpath.native);

const messages = {
  INVALID_HOME: 'An absolute user home directory is required.',
  INVALID_CLAUDE_CONFIG: 'CLAUDE_CONFIG_DIR must be an absolute directory.',
  INVALID_PROFILE: 'Select minimal, balanced, or rigorous.',
  INVALID_AGENTS: 'Select Codex, Claude Code, or both.',
  INVALID_VERSION: 'The bundled toolkit version is invalid.',
  NOT_INSTALLED: 'Install AgentVigor before updating it.',
  NO_ROLLBACK: 'There is no managed installation to roll back.',
  UNMANAGED_SKILL: 'An existing skill directory is outside AgentVigor management.',
  SKILL_DRIFT: 'A managed skill changed or disappeared. Restore its original contents before continuing.',
  UNSAFE_PATH: 'A path is linked, overlaps another managed directory, or has the wrong type.',
  INVALID_STATE: 'The managed state or recovery journal is invalid.',
  PLAN_CHANGED: 'The reviewed plan changed. Generate and review a new preview.',
  ROOT_CHANGED: 'The skills directory changed. Restore the previous client configuration before continuing.',
  LOCKED: 'Another installation operation owns the lock.',
  RECOVERY_REQUIRED: 'An interrupted operation must be recovered with rollback.',
  BUNDLE_ERROR: 'A bundled skill is missing or invalid.',
  FILESYSTEM_ERROR: 'The filesystem operation failed. Check permissions and available disk space.'
};

function fail(code) {
  throw Object.assign(new Error(messages[code]), { code });
}

function absoluteDirectory(value, code) {
  if (typeof value !== 'string' || !path.isAbsolute(value) || value.includes('\0')) fail(code);
  if (process.platform === 'win32') {
    if (!/^(?:[a-z]:[\\/]|\\\\[^?.\\/])/i.test(value)) fail(code);
    for (const component of value.slice(path.parse(value).root.length).split(/[\\/]/)) {
      if (component === '.' || component === '..') continue;
      if (/[<>:"|?*\x00-\x1f]|[ .]$/.test(component)
        || reservedName.test(component)) fail(code);
    }
  }
  const directory = path.resolve(value);
  if (directory === path.parse(directory).root) fail(code);
  return directory;
}

export function skillRoot(agent, { home = homedir(), env = process.env } = {}) {
  const base = absoluteDirectory(home, 'INVALID_HOME');
  if (agent === 'codex') return path.join(base, '.agents', 'skills');
  if (agent !== 'claude') fail('INVALID_AGENTS');
  const config = env.CLAUDE_CONFIG_DIR
    ? absoluteDirectory(env.CLAUDE_CONFIG_DIR, 'INVALID_CLAUDE_CONFIG')
    : path.join(base, '.claude');
  return path.join(config, 'skills');
}

async function lstat(file) {
  try {
    return await fs.lstat(file, { bigint: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

async function directoryTree(directory, create = false) {
  const { root } = path.parse(directory);
  let cursor = root;
  let exists = true;
  for (const component of path.relative(root, directory).split(path.sep).filter(Boolean)) {
    const next = path.join(cursor, component);
    let stat = await lstat(next);
    if (!stat && create) {
      await fs.mkdir(next, { mode: 0o700 }).catch((error) => {
        if (error.code !== 'EEXIST') throw error;
      });
      stat = await lstat(next);
    }
    if (!stat) {
      exists = false;
      break;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail('UNSAFE_PATH');
    cursor = next;
  }
  if (process.platform === 'win32' && (await nativeRealpath(cursor)).toLowerCase() !== cursor.toLowerCase()) fail('UNSAFE_PATH');
  return exists;
}

async function readRegular(file, limit, limitError) {
  if (!await directoryTree(path.dirname(file))) return null;
  const stat = await lstat(file);
  if (!stat) return null;
  if (!stat.isFile() || stat.isSymbolicLink()) fail('UNSAFE_PATH');
  if (stat.size > limit) fail(limitError);
  const handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = await handle.stat({ bigint: true });
    if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino) fail('UNSAFE_PATH');
    const contents = Buffer.alloc(Number(stat.size) + 1);
    let offset = 0;
    while (offset < contents.length) {
      const { bytesRead } = await handle.read(contents, offset, contents.length - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset === contents.length) fail(limitError);
    return contents.subarray(0, offset);
  } finally {
    await handle.close();
  }
}

async function atomicWrite(file, contents, { replace, staging = path.dirname(file), beforeWrite, createDirectory = true }) {
  const directory = path.dirname(file);
  if (!await directoryTree(directory, createDirectory)) fail('SKILL_DRIFT');
  const staged = path.join(staging, `.agentvigor-${randomUUID()}.tmp`);
  const handle = await fs.open(staged, 'wx', 0o600);
  try {
    try {
      await handle.writeFile(contents);
      await handle.sync();
    } finally {
      await handle.close();
    }
    if (beforeWrite) await beforeWrite();
    else await directoryTree(directory);
    if (replace) {
      const current = await lstat(file);
      if (!current?.isFile() || current.isSymbolicLink()) fail('UNSAFE_PATH');
      await fs.rename(staged, file);
    } else {
      await fs.link(staged, file);
    }
  } finally {
    if (await directoryTree(staging)) {
      await fs.unlink(staged).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function containsOnly(value, fields) {
  return Object.keys(value).every((key) => fields.includes(key));
}

async function inBatches(items, operation) {
  const results = [];
  for (let offset = 0; offset < items.length; offset += 8) {
    const batch = items.slice(offset, offset + 8);
    // Finish every sibling operation before returning a failure to journal recovery.
    const outcomes = await Promise.allSettled(batch.map(operation));
    for (const outcome of outcomes) {
      if (outcome.status === 'rejected') throw outcome.reason;
      results.push(outcome.value);
    }
  }
  return results;
}

function validVersion(version) {
  return typeof version === 'string' && version.length <= 128
    && !/[^a-z0-9.+-]/i.test(version) && versionPattern.test(version);
}

function validSkill(bytes, skill) {
  return bytes.length <= skillLimit && bytes.toString('utf8').startsWith(`---\nname: ${skill}\n`);
}

function validRelativeAsset(relative) {
  if (relative.length > 384) return false;
  if (relative === 'SKILL.md') return true;
  const segments = relative.split('/');
  return segments.length > 1 && segments.length <= pathDepthLimit && namespaces.has(segments[0])
    && segments.every((segment) => /^[A-Za-z0-9._-]{1,100}$/.test(segment) && !segment.endsWith('.')
      && !reservedName.test(segment) && !['.env', '.git', 'node_modules'].includes(segment.toLowerCase()));
}

function decodeAsset(data, limit, code) {
  if (typeof data !== 'string' || data.length > Math.ceil(limit / 3) * 4) fail(code);
  const bytes = Buffer.from(data, 'base64');
  if (bytes.length > limit || bytes.toString('base64') !== data) fail(code);
  return bytes;
}

function validAsset(bytes, skill, relative) {
  return isUtf8(bytes) && !bytes.includes(0) && (relative !== 'SKILL.md' || validSkill(bytes, skill));
}

function parents(relative) {
  const segments = relative.split('/');
  segments.pop();
  const directories = [];
  while (segments.length > 0) {
    directories.push(segments.join('/'));
    segments.pop();
  }
  return directories;
}

function validateBundle(files, expected, code) {
  const keys = Object.keys(files);
  if (keys.length > assetCountLimit + legacyProfiles.rigorous.length) fail(code);
  for (const skill of expected) if (!Object.hasOwn(files, `${skill}/SKILL.md`)) fail(code);
  const paths = new Map();
  let routerBytes = 0;
  let routerCount = 0;
  for (const key of keys) {
    const slash = key.indexOf('/');
    const skill = key.slice(0, slash);
    const relative = key.slice(slash + 1);
    if (slash === -1 || !expected.includes(skill)
      || (skill === router ? !validRelativeAsset(relative) : relative !== 'SKILL.md')) fail(code);
    for (const name of [key, ...parents(key)]) {
      const folded = name.toLowerCase();
      const prior = paths.get(folded);
      const directory = name !== key;
      if (prior && (prior.name !== name || !prior.directory || !directory)) fail(code);
      paths.set(folded, { name, directory });
    }
    const bytes = decodeAsset(files[key], relative === 'SKILL.md' ? skillLimit : assetLimit, code);
    if (!validAsset(bytes, skill, relative)) fail(code);
    if (skill === router) {
      routerBytes += bytes.length;
      routerCount += 1;
      if (routerBytes > bundleLimit || routerCount > assetCountLimit) fail(code);
    }
  }
}

function validateSnapshot(snapshot, format) {
  if (!isRecord(snapshot)) fail('INVALID_STATE');
  for (const [agent, entry] of Object.entries(snapshot)) {
    if (!agents.includes(agent) || !isRecord(entry) || typeof entry.profile !== 'string' || !Object.hasOwn(profiles, entry.profile)
      || !containsOnly(entry, format === schema ? ['profile', 'version', 'root', 'files', 'legacy'] : ['profile', 'version', 'root', 'files'])
      || !validVersion(entry.version)
      || typeof entry.root !== 'string' || !/^[a-f0-9]{64}$/.test(entry.root) || !isRecord(entry.files)) fail('INVALID_STATE');
    if (format === schema) {
      if (entry.legacy !== undefined && entry.legacy !== true) fail('INVALID_STATE');
      validateBundle(entry.files, (entry.legacy ? legacyProfiles : profiles)[entry.profile], 'INVALID_STATE');
      continue;
    }
    const expected = legacyProfiles[entry.profile];
    if (Object.keys(entry.files).length !== expected.length) fail('INVALID_STATE');
    for (const skill of expected) {
      const bytes = decodeAsset(entry.files[skill], skillLimit, 'INVALID_STATE');
      if (!validSkill(bytes, skill)) fail('INVALID_STATE');
    }
  }
}

function validateState(value) {
  if (!isRecord(value) || ![1, schema].includes(value.schema)
      || !containsOnly(value, value.schema === schema ? ['schema', 'current', 'previous', 'legacyState'] : ['schema', 'current', 'previous'])) {
    fail('INVALID_STATE');
  }
  validateSnapshot(value.current, value.schema);
  if (value.previous !== null) validateSnapshot(value.previous, value.schema);
  if (value.schema === schema && value.legacyState !== undefined) {
    if (value.legacyState?.schema !== 1) fail('INVALID_STATE');
    validateState(value.legacyState);
    if (!same(value.previous, currentSnapshot(value.legacyState))) fail('INVALID_STATE');
  }
}

function currentSnapshot(state) {
  if (state.schema === schema) return state.current;
  return Object.fromEntries(Object.entries(state.current).map(([agent, entry]) => {
    const { profile, version, root, files } = entry;
    const assets = Object.fromEntries(Object.entries(files).map(([skill, contents]) => [`${skill}/SKILL.md`, contents]));
    return [agent, { profile, version, root, legacy: true, files: assets }];
  }));
}

async function readJson(file) {
  const raw = await readRegular(file, stateLimit, 'INVALID_STATE');
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!isRecord(value)) fail('INVALID_STATE');
    return value;
  } catch {
    fail('INVALID_STATE');
  }
}

async function readState(file) {
  const state = await readJson(file);
  if (state === null) return { schema, current: {}, previous: null };
  validateState(state);
  return state;
}

async function readPending(file) {
  const pending = await readJson(file);
  if (pending === null) return null;
  if (![1, schema].includes(pending.schema) || !containsOnly(pending, ['schema', 'before', 'after', 'newDirectories'])) fail('INVALID_STATE');
  validateState(pending.before);
  validateState(pending.after);
  if (pending.schema === 1 && (pending.before.schema !== 1 || pending.after.schema !== 1)) fail('INVALID_STATE');
  if (pending.newDirectories !== undefined) {
    const before = currentSnapshot(pending.before);
    const after = currentSnapshot(pending.after);
    const possible = (snapshot) => new Set(Object.entries(snapshot).flatMap(([agent, entry]) =>
      Object.keys(entry.files).flatMap((file) => parents(file).map((directory) => `${agent}:${directory}`))));
    const beforeDirectories = possible(before);
    const afterDirectories = possible(after);
    if (!Array.isArray(pending.newDirectories) || pending.newDirectories.length > afterDirectories.size ||
        new Set(pending.newDirectories).size !== pending.newDirectories.length) fail('INVALID_STATE');
    for (const entry of pending.newDirectories) {
      if (!afterDirectories.has(entry) || beforeDirectories.has(entry)) fail('INVALID_STATE');
    }
  }
  return pending;
}

function local(options) {
  const home = absoluteDirectory(options.home ?? homedir(), 'INVALID_HOME');
  const directory = path.join(home, '.agentvigor');
  return {
    home,
    directory,
    env: options.env ?? process.env,
    state: path.join(directory, 'state.json'),
    pending: path.join(directory, 'pending.json'),
    lock: path.join(directory, 'write.lock')
  };
}

function fingerprint(directory) {
  const normalized = process.platform === 'win32' ? directory.toLowerCase() : directory;
  return createHash('sha256').update(normalized).digest('hex');
}

function nested(base, value) {
  const relative = path.relative(base, value);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function relevantRoots(context, ...snapshots) {
  const roots = {};
  for (const agent of agents) {
    const entries = snapshots.map((snapshot) => snapshot[agent]).filter(Boolean);
    if (entries.length === 0) continue;
    const root = skillRoot(agent, context);
    if (nested(context.directory, root) || nested(root, context.directory)) fail('UNSAFE_PATH');
    if (entries.some((entry) => entry.root !== fingerprint(root))) fail('ROOT_CHANGED');
    roots[agent] = root;
  }
  if (roots.codex && roots.claude && (nested(roots.codex, roots.claude) || nested(roots.claude, roots.codex))) fail('UNSAFE_PATH');
  return roots;
}

function noPlan(options, code) {
  fail(options.expectedPlan === undefined ? code : 'PLAN_CHANGED');
}

function selectedAgents(options, current) {
  if (options.update && Object.keys(current).length === 0) noPlan(options, 'NOT_INSTALLED');
  const selected = options.agents ?? (options.update ? Object.keys(current) : []);
  if (!Array.isArray(selected) || selected.length === 0 || selected.some((agent) => !agents.includes(agent))) fail('INVALID_AGENTS');
  if (options.update && selected.some((agent) => !Object.hasOwn(current, agent))) noPlan(options, 'NOT_INSTALLED');
  return agents.filter((agent) => selected.includes(agent));
}

async function bundledSkill(skill) {
  const directory = fileURLToPath(new URL(`../skills/${skill}/`, import.meta.url));
  const assetPaths = [];
  let size = 0;
  let entries = 0;
  const visitFile = async (relative) => {
    const limit = relative === 'SKILL.md' ? skillLimit : assetLimit;
    const bytes = await readRegular(path.join(directory, relative), limit, 'BUNDLE_ERROR');
    if (!bytes || !isUtf8(bytes) || bytes.includes(0)) fail('BUNDLE_ERROR');
    size += bytes.length;
    if (size > bundleLimit) fail('BUNDLE_ERROR');
    const contents = relative === 'SKILL.md' ? Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n')) : bytes;
    return [`${skill}/${relative}`, contents.toString('base64')];
  };
  const visitDirectory = async (relative = '') => {
    const absolute = path.join(directory, relative);
    if (!await directoryTree(absolute)) fail('BUNDLE_ERROR');
    for await (const entry of await fs.opendir(absolute)) {
      entries += 1;
      if (entries > assetCountLimit * 2) fail('BUNDLE_ERROR');
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory() && validRelativeAsset(`${child}/file`)) {
        await visitDirectory(child);
      } else if (entry.isFile() && validRelativeAsset(child)) {
        assetPaths.push(child);
        if (assetPaths.length > assetCountLimit) fail('BUNDLE_ERROR');
      } else {
        fail('BUNDLE_ERROR');
      }
    }
  };
  try {
    if (skill === router) await visitDirectory();
    else assetPaths.push('SKILL.md');
    const files = Object.fromEntries(await inBatches(assetPaths.sort(), visitFile));
    validateBundle(files, [skill], 'BUNDLE_ERROR');
    return files;
  } catch {
    fail('BUNDLE_ERROR');
  }
}

async function desiredState(options, context, state, selected) {
  const current = currentSnapshot(state);
  if (options.profile !== undefined && !Object.hasOwn(profiles, options.profile)) fail('INVALID_PROFILE');
  if (!validVersion(options.version)) fail('INVALID_VERSION');
  const next = { ...current };
  const bundles = new Map();
  for (const agent of selected) {
    const profile = options.update ? current[agent].profile : options.profile ?? 'balanced';
    const files = {};
    for (const skill of profiles[profile]) {
      if (!bundles.has(skill)) bundles.set(skill, await bundledSkill(skill));
      Object.assign(files, bundles.get(skill));
    }
    next[agent] = { profile, version: options.version, root: fingerprint(skillRoot(agent, context)), files };
  }
  if (same(next, current)) return state;
  const updated = { schema, current: next, previous: current };
  if (state.schema === 1) updated.legacyState = state;
  return updated;
}

function canonicalJson(value) {
  // Snapshot objects use a fixed key order, except for the sequence of agent installations.
  const sort = (key, value) => isRecord(value)
    ? Object.fromEntries(Object.keys(value).sort().map((name) => [name, value[name]]))
    : value;
  return JSON.stringify(value, sort);
}

function same(first, second) {
  return canonicalJson(first) === canonicalJson(second);
}

function reviewedPlan(operation, before, after, changes, expectedPlan) {
  const transitions = changes.map(({ agent, key, from, to }) => [agent, key, from, to]);
  const plan = canonicalJson({ operation, before, after, transitions });
  const planToken = createHash('sha256').update(plan).digest('hex');
  if (expectedPlan !== undefined && expectedPlan !== planToken) fail('PLAN_CHANGED');
  return planToken;
}

function changesBetween(roots, before, after, selected = agents) {
  const changes = [];
  for (const agent of selected) {
    const prior = before[agent]?.files ?? {};
    const next = after[agent]?.files ?? {};
    const keys = new Set([...Object.keys(prior), ...Object.keys(next)]);
    for (const key of [...keys].sort()) {
      const slash = key.indexOf('/');
      const skill = key.slice(0, slash);
      const relative = key.slice(slash + 1);
      changes.push({
        agent, key, skill, relative, from: prior[key] ?? null, to: next[key] ?? null,
        root: roots[agent], file: path.join(roots[agent], key)
      });
    }
  }
  return changes;
}

async function existing(change) {
  const contents = await readRegular(change.file, change.relative === 'SKILL.md' ? skillLimit : assetLimit, 'SKILL_DRIFT');
  return contents === null ? null : contents.toString('base64');
}

async function preflight(changes, restore = false) {
  await inBatches(changes, async (change) => {
    if (change.from === null) {
      if (await directoryTree(path.dirname(change.file)) &&
          ((!restore && change.relative === 'SKILL.md') || await lstat(change.file))) fail('UNMANAGED_SKILL');
    } else if (await existing(change) !== change.from) {
      fail('SKILL_DRIFT');
    }
  });
}

async function removeEmpty(directory) {
  await fs.rmdir(directory).catch((error) => {
    if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error;
  });
}

async function pruneDirectories(roots, directories) {
  const sorted = [...new Set(directories)].sort((first, second) => second.length - first.length);
  for (const entry of sorted) {
    const [agent, relative] = entry.split(':');
    const directory = path.join(roots[agent], relative);
    if (await directoryTree(directory)) await removeEmpty(directory);
  }
}

function removedDirectories(changes) {
  return changes.filter(({ from, to }) => from !== null && to === null).flatMap(({ agent, key }) =>
    parents(key).map((directory) => `${agent}:${directory}`));
}

async function apply(change, target, expected) {
  if (target === null || expected === target) {
    if (await existing(change) !== expected) fail('SKILL_DRIFT');
    if (expected === target) return;
    await fs.unlink(change.file);
  } else {
    await atomicWrite(change.file, Buffer.from(target, 'base64'), {
      replace: expected !== null,
      staging: change.root,
      createDirectory: false,
      beforeWrite: async () => {
        if (await existing(change) !== expected) fail('SKILL_DRIFT');
      }
    });
  }
  if (await existing(change) !== target) fail('SKILL_DRIFT');
}

async function applyChanges(changes) {
  const manifests = changes.filter(({ relative }) => relative === 'SKILL.md');
  const resources = changes.filter(({ relative }) => relative !== 'SKILL.md');
  const directories = new Set(changes.filter(({ from, to }) => from === null && to !== null)
    .map(({ file }) => path.dirname(file)));
  // Prepare shared directories serially after recording them in the journal.
  for (const directory of directories) await directoryTree(directory, true);
  const mutate = (change) => apply(change, change.to, change.from);
  await inBatches(manifests.filter(({ to }) => to === null), mutate);
  await inBatches(resources, mutate);
  await inBatches(manifests.filter(({ to }) => to !== null), mutate);
}

function summary(status, snapshot, changes = []) {
  const installations = agents.filter((agent) => snapshot[agent]).map((agent) => {
    const { profile, version } = snapshot[agent];
    return { agent, profile, version };
  });
  const common = (field) => installations.every((entry) => entry[field] === installations[0]?.[field])
    ? installations[0]?.[field] ?? null
    : null;
  return {
    status,
    agents: installations.map(({ agent }) => agent),
    profile: common('profile'),
    version: common('version'),
    installations,
    changes: changes.filter(({ from, to }) => from !== to).map(({ agent, skill, relative, from, to }) => ({
      agent, skill, path: relative, action: from === null ? 'add' : to === null ? 'remove' : 'replace'
    }))
  };
}

async function locked(context, operation) {
  await directoryTree(context.directory, true);
  try {
    await fs.mkdir(context.lock, { mode: 0o700 });
  } catch (error) {
    if (error.code === 'EEXIST') fail('LOCKED');
    throw error;
  }
  try {
    return await operation();
  } finally {
    await fs.rmdir(context.lock);
  }
}

async function lockExists(context) {
  return await directoryTree(context.directory) && Boolean(await lstat(context.lock));
}

async function recover(context, state, pending, { dryRun, expectedPlan } = {}) {
  const committed = same(state, pending.after);
  if (!committed && !same(state, pending.before)) fail('INVALID_STATE');
  const before = currentSnapshot(pending.before);
  const after = currentSnapshot(pending.after);
  const roots = relevantRoots(context, before, after);
  const transitions = changesBetween(roots, before, after).filter(({ from, to }) => from !== to);
  const corrections = await inBatches(transitions, async (transition) => {
    const actual = await existing(transition);
    if (actual !== transition.from && actual !== transition.to) fail('SKILL_DRIFT');
    const target = committed ? transition.to : transition.from;
    return { ...transition, from: actual, to: target };
  });
  const planToken = reviewedPlan('recover', pending, state, corrections, expectedPlan);
  if (!dryRun) {
    await applyChanges(corrections);
    const directories = committed ? removedDirectories(transitions) : [...(pending.newDirectories ?? [])];
    if (!committed && pending.schema === 1) directories.push(...removedDirectories(corrections));
    await pruneDirectories(roots, directories);
    await fs.unlink(context.pending);
  }
  return { ...summary(dryRun ? 'planned' : 'rolled-back', state.current, corrections), recovered: true, planToken };
}

async function commit(context, state, next, roots, changes) {
  const candidates = new Map();
  for (const change of changes) {
    if (change.from !== null || change.to === null) continue;
    for (const relative of parents(change.key)) {
      const entry = `${change.agent}:${relative}`;
      candidates.set(entry, path.join(change.root, relative));
    }
  }
  const newDirectories = await inBatches([...candidates], async ([entry, directory]) =>
    await directoryTree(directory) ? null : entry);
  const format = state.schema === 1 && next.schema === 1 ? 1 : schema;
  const pending = { schema: format, before: state, after: next, newDirectories: newDirectories.filter(Boolean).sort() };
  const pendingBytes = Buffer.from(JSON.stringify(pending));
  const nextBytes = Buffer.from(JSON.stringify(next));
  if (pendingBytes.length > stateLimit || nextBytes.length > stateLimit) fail('INVALID_STATE');
  await atomicWrite(context.pending, pendingBytes, { replace: false });
  try {
    await applyChanges(changes.filter(({ from, to }) => from !== to));
    await pruneDirectories(roots, removedDirectories(changes));
    await atomicWrite(context.state, nextBytes, {
      replace: Boolean(await lstat(context.state)),
      beforeWrite: async () => {
        if (!same(await readState(context.state), state)) fail('INVALID_STATE');
      }
    });
  } catch (error) {
    try {
      await recover(context, await readState(context.state), pending);
    } catch {
      fail('RECOVERY_REQUIRED');
    }
    throw error;
  }
  await fs.unlink(context.pending);
}

async function guarded(operation) {
  try {
    return await operation();
  } catch (error) {
    if (Object.hasOwn(messages, error.code)) throw error;
    fail('FILESYSTEM_ERROR');
  }
}

export async function install(options = {}) {
  return guarded(async () => {
    const context = local(options);
    const perform = async (write) => {
      if (await readPending(context.pending)) {
        if (!write && !options.dryRun && await lockExists(context)) fail('LOCKED');
        noPlan(options, 'RECOVERY_REQUIRED');
      }
      const state = await readState(context.state);
      const current = currentSnapshot(state);
      const selected = selectedAgents(options, current);
      const next = await desiredState(options, context, state, selected);
      const planned = currentSnapshot(next);
      const roots = relevantRoots(context, current, planned);
      const changes = changesBetween(roots, current, planned, selected);
      const planToken = reviewedPlan(options.update ? 'update' : 'install', state, next, changes, options.expectedPlan);
      await preflight(changes);
      if (!write) return { ...summary('planned', next.current, changes), planToken };
      if (state === next) return { ...summary('unchanged', next.current), planToken };
      await commit(context, state, next, roots, changes);
      return { ...summary('installed', next.current, changes), planToken };
    };
    if (!options.dryRun && await lockExists(context)) fail('LOCKED');
    const preview = await perform(false);
    if (options.dryRun) return preview;
    return locked(context, () => perform(true));
  });
}

export async function rollback(options = {}) {
  return guarded(async () => {
    const context = local(options);
    const perform = async (write) => {
      const state = await readState(context.state);
      const pending = await readPending(context.pending);
      if (pending) return recover(context, state, pending, { dryRun: !write, expectedPlan: options.expectedPlan });
      if (options.all ? Object.keys(state.current).length === 0 : state.previous === null) noPlan(options, 'NO_ROLLBACK');
      const next = !options.all && state.schema === schema && state.legacyState
        ? state.legacyState
        : { schema: state.schema, current: options.all ? {} : state.previous, previous: null };
      const current = currentSnapshot(state);
      const planned = currentSnapshot(next);
      const roots = relevantRoots(context, current, planned);
      const selected = agents.filter((agent) => !same(current[agent], planned[agent]));
      const changes = changesBetween(roots, current, planned, selected);
      const planToken = reviewedPlan(options.all ? 'uninstall' : 'rollback', state, next, changes, options.expectedPlan);
      await preflight(changes, true);
      if (write) await commit(context, state, next, roots, changes);
      return { ...summary(write ? 'rolled-back' : 'planned', next.current, changes), planToken };
    };
    if (!options.dryRun && await lockExists(context)) fail('LOCKED');
    const preview = await perform(false);
    if (options.dryRun) return preview;
    return locked(context, () => perform(true));
  });
}

export async function installationStatus(options = {}) {
  return guarded(async () => {
    const context = local(options);
    const state = await readState(context.state);
    if (await readPending(context.pending)) {
      return { ...summary('recovery-required', state.current), skills: [], canRollback: true };
    }
    const current = currentSnapshot(state);
    const roots = relevantRoots(context, current);
    const skills = await inBatches(changesBetween(roots, current, current), async (change) => {
      const data = await existing(change);
      return {
        agent: change.agent,
        skill: change.skill,
        path: change.relative,
        status: data === change.from ? 'ok' : data === null ? 'missing' : 'modified'
      };
    });
    const status = skills.length === 0 ? 'not-installed' : skills.every((entry) => entry.status === 'ok') ? 'installed' : 'drifted';
    return { ...summary(status, state.current), skills, canRollback: state.previous !== null };
  });
}
