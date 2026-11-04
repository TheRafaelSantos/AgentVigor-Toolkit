import { createHash, randomUUID } from 'node:crypto';
import { constants, realpath } from 'node:fs';
import * as fs from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const agents = ['codex', 'claude'];
const basic = ['agentvigor-grounded-code', 'agentvigor-agent-doctor'];
const balanced = [...basic, 'agentvigor-diff-guardian', 'agentvigor-token-budget'];
const profiles = { minimal: basic, balanced, rigorous: [...balanced, 'agentvigor-safe-resume'] };
const schema = 1;
const skillLimit = 32 * 1024;
const stateLimit = 4 * 1024 * 1024;
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
        || /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(component)) fail(code);
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
    const contents = Buffer.alloc(limit + 1);
    let offset = 0;
    while (offset <= limit) {
      const { bytesRead } = await handle.read(contents, offset, contents.length - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset > limit) fail(limitError);
    return contents.subarray(0, offset);
  } finally {
    await handle.close();
  }
}

async function atomicWrite(file, contents, { replace, staging = path.dirname(file), beforeWrite }) {
  const directory = path.dirname(file);
  await directoryTree(directory, true);
  const staged = path.join(staging, `.agentvigor-${randomUUID()}.tmp`);
  const handle = await fs.open(staged, 'wx', 0o600);
  try {
    try {
      await handle.writeFile(contents);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await directoryTree(directory);
    await beforeWrite?.();
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

function validVersion(version) {
  return typeof version === 'string' && version.length <= 128
    && !/[^a-z0-9.+-]/i.test(version) && versionPattern.test(version);
}

function validSkill(bytes, skill) {
  return bytes.length <= skillLimit && bytes.toString('utf8').startsWith(`---\nname: ${skill}\n`);
}

function validateSnapshot(snapshot) {
  if (!isRecord(snapshot)) fail('INVALID_STATE');
  for (const [agent, entry] of Object.entries(snapshot)) {
    if (!agents.includes(agent) || !isRecord(entry) || !Object.hasOwn(profiles, entry.profile)
      || !validVersion(entry.version)
      || typeof entry.root !== 'string' || !/^[a-f0-9]{64}$/.test(entry.root) || !isRecord(entry.files)) fail('INVALID_STATE');
    const expected = profiles[entry.profile];
    if (Object.keys(entry.files).length !== expected.length) fail('INVALID_STATE');
    for (const skill of expected) {
      const data = entry.files[skill];
      if (typeof data !== 'string' || data.length > Math.ceil(skillLimit / 3) * 4) fail('INVALID_STATE');
      const bytes = Buffer.from(data, 'base64');
      if (!validSkill(bytes, skill) || bytes.toString('base64') !== data) fail('INVALID_STATE');
    }
  }
}

function validateState(value) {
  if (!isRecord(value) || value.schema !== schema) fail('INVALID_STATE');
  validateSnapshot(value.current);
  if (value.previous !== null) validateSnapshot(value.previous);
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
  if (pending.schema !== schema) fail('INVALID_STATE');
  validateState(pending.before);
  validateState(pending.after);
  if (pending.newDirectories !== undefined) {
    if (!Array.isArray(pending.newDirectories) || pending.newDirectories.length > 10 ||
        new Set(pending.newDirectories).size !== pending.newDirectories.length) fail('INVALID_STATE');
    for (const entry of pending.newDirectories) {
      if (typeof entry !== 'string') fail('INVALID_STATE');
      const [agent, skill, extra] = entry.split(':');
      if (extra !== undefined || !agents.includes(agent) || !profiles.rigorous.includes(skill) ||
          pending.before.current[agent]?.files[skill] != null ||
          pending.after.current[agent]?.files[skill] == null) fail('INVALID_STATE');
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
  let contents;
  try {
    contents = (await fs.readFile(new URL(`../skills/${skill}/SKILL.md`, import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
  } catch {
    fail('BUNDLE_ERROR');
  }
  const bytes = Buffer.from(contents);
  if (!validSkill(bytes, skill)) fail('BUNDLE_ERROR');
  return bytes.toString('base64');
}

async function desiredState(options, context, state, selected) {
  const current = state.current;
  if (options.profile !== undefined && !Object.hasOwn(profiles, options.profile)) fail('INVALID_PROFILE');
  if (!validVersion(options.version)) fail('INVALID_VERSION');
  const next = { ...current };
  for (const agent of selected) {
    const profile = options.update ? current[agent].profile : options.profile ?? 'balanced';
    const files = {};
    for (const skill of profiles[profile]) files[skill] = await bundledSkill(skill);
    next[agent] = { profile, version: options.version, root: fingerprint(skillRoot(agent, context)), files };
  }
  return same(next, current) ? state : { schema, current: next, previous: current };
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
  const transitions = changes.map(({ agent, skill, from, to }) => [agent, skill, from, to]);
  const plan = canonicalJson({ operation, before, after, transitions });
  const planToken = createHash('sha256').update(plan).digest('hex');
  if (expectedPlan !== undefined && expectedPlan !== planToken) fail('PLAN_CHANGED');
  return planToken;
}

function changesBetween(roots, before, after, selected = agents) {
  const changes = [];
  for (const agent of selected) {
    for (const skill of profiles.rigorous) {
      const from = before[agent]?.files[skill] ?? null;
      const to = after[agent]?.files[skill] ?? null;
      if (from !== null || to !== null) {
        changes.push({ agent, skill, from, to, file: path.join(roots[agent], skill, 'SKILL.md') });
      }
    }
  }
  return changes;
}

async function existing(change) {
  const contents = await readRegular(change.file, skillLimit, 'SKILL_DRIFT');
  return contents === null ? null : contents.toString('base64');
}

async function preflight(changes, restore = false) {
  for (const change of changes) {
    if (change.from === null) {
      if (await directoryTree(path.dirname(change.file)) && (!restore || await lstat(change.file))) fail('UNMANAGED_SKILL');
    } else if (await existing(change) !== change.from) {
      fail('SKILL_DRIFT');
    }
  }
}

async function removeEmpty(directory) {
  await fs.rmdir(directory).catch((error) => {
    if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error;
  });
}

async function apply(change, target, expected) {
  if (await existing(change) !== expected) fail('SKILL_DRIFT');
  if (expected === target) return;
  if (target === null) {
    await fs.unlink(change.file);
    await removeEmpty(path.dirname(change.file));
  } else {
    await atomicWrite(change.file, Buffer.from(target, 'base64'), {
      replace: expected !== null,
      staging: path.dirname(path.dirname(change.file)),
      beforeWrite: async () => {
        if (await existing(change) !== expected) fail('SKILL_DRIFT');
      }
    });
  }
  if (await existing(change) !== target) fail('SKILL_DRIFT');
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
    changes: changes.filter(({ from, to }) => from !== to).map(({ agent, skill, from, to }) => ({
      agent, skill, action: from === null ? 'add' : to === null ? 'remove' : 'replace'
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
  const roots = relevantRoots(context, pending.before.current, pending.after.current);
  const transitions = changesBetween(roots, pending.before.current, pending.after.current).filter(({ from, to }) => from !== to);
  const corrections = [];
  for (const transition of transitions) {
    const actual = await existing(transition);
    if (actual !== transition.from && actual !== transition.to) fail('SKILL_DRIFT');
    const target = committed ? transition.to : transition.from;
    corrections.push({ ...transition, from: actual, to: target });
  }
  const planToken = reviewedPlan('recover', pending, state, corrections, expectedPlan);
  if (!dryRun) {
    for (const correction of corrections) {
      await apply(correction, correction.to, correction.from);
      if (!committed && correction.to === null &&
          pending.newDirectories?.includes(`${correction.agent}:${correction.skill}`)) {
        if (await directoryTree(path.dirname(correction.file))) {
          await removeEmpty(path.dirname(correction.file));
        }
      }
    }
    await fs.unlink(context.pending);
  }
  return { ...summary(dryRun ? 'planned' : 'rolled-back', state.current, corrections), recovered: true, planToken };
}

async function commit(context, state, next, changes) {
  const newDirectories = [];
  for (const change of changes) {
    if (change.from === null && change.to !== null && !await directoryTree(path.dirname(change.file))) {
      newDirectories.push(`${change.agent}:${change.skill}`);
    }
  }
  const pending = { schema, before: state, after: next, newDirectories };
  await atomicWrite(context.pending, JSON.stringify(pending), { replace: false });
  try {
    for (const change of changes) {
      if (change.from !== change.to) await apply(change, change.to, change.from);
    }
    await atomicWrite(context.state, JSON.stringify(next), {
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
      const selected = selectedAgents(options, state.current);
      const next = await desiredState(options, context, state, selected);
      const roots = relevantRoots(context, state.current, next.current);
      const changes = changesBetween(roots, state.current, next.current, selected);
      const planToken = reviewedPlan(options.update ? 'update' : 'install', state, next, changes, options.expectedPlan);
      await preflight(changes);
      if (!write) return { ...summary('planned', next.current, changes), planToken };
      if (state === next) return { ...summary('unchanged', next.current), planToken };
      await commit(context, state, next, changes);
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
      const next = { schema, current: options.all ? {} : state.previous, previous: null };
      const roots = relevantRoots(context, state.current, next.current);
      const selected = agents.filter((agent) => !same(state.current[agent], next.current[agent]));
      const changes = changesBetween(roots, state.current, next.current, selected);
      const planToken = reviewedPlan(options.all ? 'uninstall' : 'rollback', state, next, changes, options.expectedPlan);
      await preflight(changes, true);
      if (write) await commit(context, state, next, changes);
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
    const roots = relevantRoots(context, state.current);
    const skills = [];
    for (const change of changesBetween(roots, state.current, state.current)) {
      const data = await existing(change);
      skills.push({
        agent: change.agent,
        skill: change.skill,
        status: data === change.from ? 'ok' : data === null ? 'missing' : 'modified'
      });
    }
    const status = skills.length === 0 ? 'not-installed' : skills.every((entry) => entry.status === 'ok') ? 'installed' : 'drifted';
    return { ...summary(status, state.current), skills, canRollback: state.previous !== null };
  });
}
