import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import test, { after } from 'node:test';
import { pathToFileURL } from 'node:url';
import * as live from '../lib/install.mjs';

async function fixture(t) {
  const home = await fs.mkdtemp(path.resolve('.agentvigor-test-home-'));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  return { home, env: {}, agents: ['codex'], version: '0.2.0-rc.1' };
}

const codexSkills = (home) => path.join(home, '.agents', 'skills');
const skill = (directory, name = 'grounded-code') => path.join(directory, `agentvigor-${name}`, 'SKILL.md');
const stateDirectory = (home) => path.join(home, '.agentvigor');
const statePath = (home) => path.join(stateDirectory(home), 'state.json');
const journalPath = (home) => path.join(stateDirectory(home), 'pending.json');

async function write(file, contents) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, contents);
}

// Keep repeated transaction cases focused. The migration case also installs the entire real bundle.
const fixturePackage = await fs.mkdtemp(path.resolve('.agentvigor-test-package-'));
after(() => fs.rm(fixturePackage, { recursive: true, force: true }));
for (const relative of [
  'lib/install.mjs',
  'skills/agentvigor-agent-doctor/SKILL.md',
  'skills/agentvigor-diff-guardian/SKILL.md',
  'skills/agentvigor-grounded-code/SKILL.md',
  'skills/agentvigor-safe-resume/SKILL.md',
  'skills/agentvigor-token-budget/SKILL.md',
  'skills/agentvigor-toolkit/SKILL.md',
]) {
  const contents = await fs.readFile(new URL(`../${relative}`, import.meta.url));
  await write(path.join(fixturePackage, relative), contents);
}
const testRouter = path.join(fixturePackage, 'skills', 'agentvigor-toolkit');
const fixtureReference = '# Nested resource\r\n';
await write(path.join(testRouter, 'references', 'en', 'fixture.md'), fixtureReference);
await write(path.join(testRouter, 'scripts', 'fixture.mjs'), 'export const ready = true;\n');
const { install, rollback, installationStatus } = await import(pathToFileURL(path.join(fixturePackage, 'lib', 'install.mjs')));

async function legacyFixture(options) {
  const root = codexSkills(options.home);
  const binding = createHash('sha256').update(process.platform === 'win32' ? root.toLowerCase() : root).digest('hex');
  const files = {};
  for (const id of ['agentvigor-grounded-code', 'agentvigor-agent-doctor', 'agentvigor-diff-guardian',
    'agentvigor-token-budget', 'agentvigor-safe-resume']) {
    const contents = (await fs.readFile(new URL(`../skills/${id}/SKILL.md`, import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
    files[id] = Buffer.from(contents).toString('base64');
    await write(path.join(root, id, 'SKILL.md'), contents);
  }
  const entry = { profile: 'rigorous', version: '0.1.0-rc.1', root: binding, files };
  const basic = Object.fromEntries(Object.entries(files).slice(0, 2));
  const previous = { ...entry, profile: 'minimal', files: basic };
  const fixture = { schema: 1, current: { codex: entry }, previous: { codex: previous } };
  await write(statePath(options.home), JSON.stringify(fixture));
  return fixture;
}

test('reads an rc.1 snapshot, migrates only on write, then restores the complete old state', async (t) => {
  const options = await fixture(t);
  const legacy = await legacyFixture(options);
  const migration = { ...options, agents: undefined, update: true };
  assert.equal((await live.installationStatus(options)).version, '0.1.0-rc.1');
  const preview = await live.install({ ...migration, dryRun: true });
  const resource = preview.changes.find(({ skill, path }) => skill === 'agentvigor-toolkit' && path?.includes('/'));
  assert.ok(resource, 'migration should preview a nested router resource');
  assert.deepEqual(JSON.parse(await fs.readFile(statePath(options.home), 'utf8')), legacy);
  await assert.rejects(fs.stat(path.dirname(skill(codexSkills(options.home), 'toolkit'))), { code: 'ENOENT' });
  assert.equal((await live.install({ ...migration, expectedPlan: preview.planToken })).status, 'installed');
  const upgraded = JSON.parse(await fs.readFile(statePath(options.home), 'utf8'));
  assert.equal(upgraded.schema, 2);
  assert.equal((await live.installationStatus(options)).version, options.version);
  const bundledRouter = new URL('../skills/agentvigor-toolkit/', import.meta.url);
  const bundled = (await fs.readdir(bundledRouter, { recursive: true, withFileTypes: true })).filter((file) => file.isFile());
  const routerPlan = preview.changes.filter(({ skill }) => skill === 'agentvigor-toolkit');
  assert.equal(routerPlan.length, bundled.length);
  const installedRouter = path.dirname(skill(codexSkills(options.home), 'toolkit'));
  for (const { skill, path: relative } of routerPlan) {
    const source = await fs.readFile(new URL(relative, bundledRouter));
    const expected = relative === 'SKILL.md' ? Buffer.from(source.toString('utf8').replaceAll('\r\n', '\n')) : source;
    const actual = await fs.readFile(path.join(codexSkills(options.home), skill, relative));
    assert.deepEqual(actual, expected);
  }
  const provenance = JSON.parse(await fs.readFile(path.join(installedRouter, 'references', 'provenance.json'), 'utf8'));
  for (const entry of provenance.files) {
    const installed = await fs.readFile(path.join(installedRouter, entry.destination));
    const hash = createHash('sha256').update(installed).digest('hex');
    assert.equal(hash, entry.destinationSha256 ?? entry.sha256, entry.destination);
  }
  assert.equal((await live.rollback(options)).status, 'rolled-back');
  assert.deepEqual(JSON.parse(await fs.readFile(statePath(options.home), 'utf8')), legacy);
  await assert.rejects(fs.stat(path.dirname(skill(codexSkills(options.home), 'toolkit'))), { code: 'ENOENT' });
  assert.equal((await rollback(options)).status, 'rolled-back');
  assert.equal((await installationStatus(options)).profile, 'minimal');
});

test('status and rollback preserve a nested router resource edited by the user', async (t) => {
  const options = await fixture(t);
  const result = await install({ ...options, profile: 'minimal' });
  const resource = result.changes.find(({ skill, path }) => skill === 'agentvigor-toolkit' && path?.startsWith('references/'));
  assert.ok(resource);
  const installedFile = path.join(codexSkills(options.home), resource.skill, resource.path);
  await fs.writeFile(installedFile, 'personal resource edit');
  const status = await installationStatus(options);
  assert.equal(status.status, 'drifted');
  assert.equal(status.skills.find(({ skill, path }) => skill === resource.skill && path === resource.path).status, 'modified');
  await assert.rejects(rollback({ ...options, all: true }), { code: 'SKILL_DRIFT' });
  assert.equal(await fs.readFile(installedFile, 'utf8'), 'personal resource edit');
});

test('update refuses an unmanaged asset at a new bundled path in an existing router', async (t) => {
  const options = await fixture(t);
  const result = await install({ ...options, profile: 'minimal' });
  const resource = result.changes.find(({ skill, path }) => skill === 'agentvigor-toolkit' && path.startsWith('references/'));
  const installedFile = path.join(codexSkills(options.home), resource.skill, resource.path);
  const state = JSON.parse(await fs.readFile(statePath(options.home), 'utf8'));
  delete state.current.codex.files[`${resource.skill}/${resource.path}`];
  await write(statePath(options.home), JSON.stringify(state));
  await fs.writeFile(installedFile, 'unmanaged asset');
  await assert.rejects(install({ ...options, update: true }), { code: 'UNMANAGED_SKILL' });
  assert.equal(await fs.readFile(installedFile, 'utf8'), 'unmanaged asset');
});

test('an interrupted migration removes transaction-created empty nested directories and can be retried', async (t) => {
  const options = await fixture(t);
  const before = await legacyFixture(options);
  const migration = { ...options, agents: undefined, update: true };
  const result = await install(migration);
  const after = JSON.parse(await fs.readFile(statePath(options.home), 'utf8'));
  const router = path.dirname(skill(codexSkills(options.home), 'toolkit'));
  const dirs = new Set(['codex:agentvigor-toolkit']);
  for (const { skill, path: relative } of result.changes) {
    if (skill !== 'agentvigor-toolkit') continue;
    const parts = relative.split('/');
    parts.pop();
    while (parts.length > 0) {
      dirs.add(`codex:agentvigor-toolkit/${parts.join('/')}`);
      parts.pop();
    }
  }
  const nested = result.changes.find(({ skill, path }) => skill === 'agentvigor-toolkit' && path.startsWith('references/'));
  await fs.unlink(path.join(router, nested.path));
  const neighbor = path.join(codexSkills(options.home), 'unrelated', 'keep.txt');
  await write(neighbor, 'untouched');
  await write(statePath(options.home), JSON.stringify(before));
  await write(journalPath(options.home), JSON.stringify({ schema: 2, before, after, newDirectories: [...dirs] }));
  assert.equal((await installationStatus(options)).status, 'recovery-required');
  assert.equal((await rollback(options)).recovered, true);
  assert.deepEqual(JSON.parse(await fs.readFile(statePath(options.home), 'utf8')), before);
  await assert.rejects(fs.stat(router), { code: 'ENOENT' });
  assert.equal(await fs.readFile(neighbor, 'utf8'), 'untouched');
  assert.equal((await install(migration)).status, 'installed');
});

test('schema 2 rejects paths that escape the router or collide on a supported filesystem', async (t) => {
  const options = await fixture(t);
  await install({ ...options, profile: 'minimal' });
  const state = JSON.parse(await fs.readFile(statePath(options.home), 'utf8'));
  const asset = 'YQ==';
  const invalid = [
    ['agentvigor-toolkit/references/../../other'],
    ['agentvigor-toolkit/references/example.txt:stream'],
    ['agentvigor-toolkit/references/AUX.txt'],
    ['agentvigor-toolkit/settings.json'],
    ['agentvigor-grounded-code/scripts/exploit.mjs'],
    ['agentvigor-toolkit/references/Case/a', 'agentvigor-toolkit/references/case/b'],
    ['agentvigor-toolkit/references/test', 'agentvigor-toolkit/references/test/file'],
  ];
  for (const keys of invalid) {
    const tampered = structuredClone(state);
    for (const key of keys) tampered.current.codex.files[key] = asset;
    await write(statePath(options.home), JSON.stringify(tampered));
    await assert.rejects(rollback({ ...options, all: true }), { code: 'INVALID_STATE' });
  }
  assert.ok((await fs.stat(skill(codexSkills(options.home), 'toolkit'))).isFile());
});

test('dry-run plans the default Codex profile without changing any files', async (t) => {
  const options = await fixture(t);
  const result = await install({ ...options, dryRun: true });
  assert.equal(result.status, 'planned');
  assert.equal(result.profile, 'balanced');
  assert.equal(result.changes.filter(({ path }) => path === 'SKILL.md').length, 5);
  assert.ok(result.changes.some(({ path }) => path.startsWith('references/')));
  assert(result.changes.every(({ agent, action }) => agent === 'codex' && action === 'add'));
  assert.deepEqual(await fs.readdir(options.home), []);
});

test('installs on selected agents, supports a Claude path with spaces, and is idempotent', async (t) => {
  const options = await fixture(t);
  const claude = path.join(options.home, 'Claude Settings');
  const settings = path.join(claude, 'settings.json');
  await write(settings, '{"hooks":{"example":[]}}');
  const installOptions = { ...options, agents: ['codex', 'claude'], env: { CLAUDE_CONFIG_DIR: claude } };
  const result = await install(installOptions);
  assert.equal(result.status, 'installed');
  assert.equal(result.changes.filter(({ path }) => path === 'SKILL.md').length, 10);
  const nested = result.changes.find(({ path }) => path.startsWith('references/'));
  assert.ok(nested);
  const installedResource = (root) => fs.readFile(path.join(root, nested.skill, nested.path), 'utf8');
  assert.equal(await installedResource(codexSkills(options.home)), fixtureReference);
  assert.equal(await installedResource(path.join(claude, 'skills')), fixtureReference);
  assert.match(await fs.readFile(skill(codexSkills(options.home)), 'utf8'), /name: agentvigor-grounded-code/);
  assert.match(await fs.readFile(skill(path.join(claude, 'skills')), 'utf8'), /name: agentvigor-grounded-code/);
  assert.equal((await install(installOptions)).status, 'unchanged');
  assert.equal(await fs.readFile(settings, 'utf8'), '{"hooks":{"example":[]}}');
  const status = await installationStatus(installOptions);
  assert.equal(status.status, 'installed');
  assert.deepEqual(status.agents, ['codex', 'claude']);
  assert(status.skills.every(({ status }) => status === 'ok'));
  assert.equal(status.canRollback, true);
});

test('reconfiguring one agent preserves the other and update reuses each selection', async (t) => {
  const options = await fixture(t);
  await install({ ...options, profile: 'minimal' });
  await install({ ...options, agents: ['claude'], profile: 'rigorous' });
  const claudeSkills = path.join(options.home, '.claude', 'skills');
  assert.equal((await fs.readdir(claudeSkills)).length, 6);
  assert.equal((await fs.readdir(codexSkills(options.home))).length, 3);
  const newer = { ...options, agents: undefined, version: '0.2.0-rc.2', update: true };
  assert.equal((await install(newer)).status, 'installed');
  const status = await installationStatus(options);
  assert.equal(status.profile, null);
  assert.equal(status.version, newer.version);
  assert.deepEqual(status.installations.map(({ profile }) => profile), ['minimal', 'rigorous']);
});

test('a Codex-only change leaves an unselected, modified Claude skill intact', async (t) => {
  const options = await fixture(t);
  await install({ ...options, agents: ['claude'] });
  const file = skill(path.join(options.home, '.claude', 'skills'));
  await fs.writeFile(file, 'personal edits');
  assert.equal((await install(options)).status, 'installed');
  assert.equal(await fs.readFile(file, 'utf8'), 'personal edits');
  assert.equal((await rollback(options)).status, 'rolled-back');
  assert.equal(await fs.readFile(file, 'utf8'), 'personal edits');
  assert.equal((await installationStatus(options)).status, 'drifted');
});

test('rollback restores the prior profile and uninstall removes only owned files', async (t) => {
  const options = await fixture(t);
  await install({ ...options, profile: 'minimal' });
  await install({ ...options, profile: 'rigorous' });
  const directory = codexSkills(options.home);
  const additional = path.join(path.dirname(skill(directory)), 'notes.txt');
  const thirdParty = path.join(directory, 'third-party', 'SKILL.md');
  await write(additional, 'keep notes');
  await write(thirdParty, 'keep third party');
  assert.equal((await rollback({ ...options, dryRun: true })).changes.length, 3);
  assert.equal((await rollback(options)).status, 'rolled-back');
  assert.equal((await installationStatus(options)).profile, 'minimal');
  assert.equal((await rollback({ ...options, all: true })).status, 'rolled-back');
  assert.equal((await installationStatus(options)).status, 'not-installed');
  await assert.rejects(fs.readFile(skill(directory)), { code: 'ENOENT' });
  assert.equal(await fs.readFile(additional, 'utf8'), 'keep notes');
  assert.equal(await fs.readFile(thirdParty, 'utf8'), 'keep third party');
});

test('rollback can restore a skill alongside personal files left by a profile change', async (t) => {
  const options = await fixture(t);
  await install({ ...options, profile: 'rigorous' });
  const file = skill(codexSkills(options.home), 'safe-resume');
  const notes = path.join(path.dirname(file), 'notes.txt');
  await write(notes, 'keep notes');
  const contents = await fs.readFile(file, 'utf8');
  await install({ ...options, profile: 'minimal' });
  await assert.rejects(fs.readFile(file), { code: 'ENOENT' });
  assert.equal((await rollback(options)).status, 'rolled-back');
  assert.equal(await fs.readFile(file, 'utf8'), contents);
  assert.equal(await fs.readFile(notes, 'utf8'), 'keep notes');
});

test('unmanaged paths abort a multi-agent install before any writes', async (t) => {
  const options = await fixture(t);
  const claudeSkill = skill(path.join(options.home, '.claude', 'skills'));
  await write(claudeSkill, 'other content');
  await assert.rejects(install({ ...options, agents: ['codex', 'claude'] }), { code: 'UNMANAGED_SKILL' });
  assert.equal(await fs.readFile(claudeSkill, 'utf8'), 'other content');
  assert.deepEqual(await fs.readdir(options.home), ['.claude']);
});

test('edited and missing managed skills are reported and block destructive changes', async (t) => {
  const options = await fixture(t);
  await install(options);
  const directory = codexSkills(options.home);
  await fs.writeFile(skill(directory), 'personal edits');
  await fs.unlink(skill(directory, 'agent-doctor'));
  const status = await installationStatus(options);
  assert.equal(status.status, 'drifted');
  assert.equal(status.skills.find(({ skill }) => skill === 'agentvigor-grounded-code').status, 'modified');
  assert.equal(status.skills.find(({ skill }) => skill === 'agentvigor-agent-doctor').status, 'missing');
  await assert.rejects(install({ ...options, update: true }), { code: 'SKILL_DRIFT' });
  await assert.rejects(rollback(options), { code: 'SKILL_DRIFT' });
  assert.equal(await fs.readFile(skill(directory), 'utf8'), 'personal edits');
});

test('directory links are rejected and the link target stays untouched', async (t) => {
  const options = await fixture(t);
  const target = path.join(options.home, 'redirect');
  await fs.mkdir(target);
  await fs.symlink(target, path.join(options.home, '.agents'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(install(options), { code: 'UNSAFE_PATH' });
  assert.deepEqual(await fs.readdir(target), []);
});

test('busy locks block writes and leave dry-run read-only', async (t) => {
  const options = await fixture(t);
  await fs.mkdir(path.join(stateDirectory(options.home), 'write.lock'), { recursive: true });
  await assert.rejects(install(options), { code: 'LOCKED' });
  assert.equal((await install({ ...options, dryRun: true })).status, 'planned');
  assert.deepEqual(await fs.readdir(stateDirectory(options.home)), ['write.lock']);
});

test('parallel installs serialize state and leave one coherent installation', async (t) => {
  const options = await fixture(t);
  const results = await Promise.allSettled([install(options), install(options)]);
  assert(results.some((entry) => entry.status === 'fulfilled' && entry.value.status === 'installed'));
  for (const result of results.filter((entry) => entry.status === 'rejected')) {
    assert.equal(result.reason.code, 'LOCKED');
  }
  assert.equal((await installationStatus(options)).status, 'installed');
  assert.deepEqual((await fs.readdir(stateDirectory(options.home))).sort(), ['state.json']);
});

test('install rejects a confirmed preview after another install changes the managed state', async (t) => {
  const options = await fixture(t);
  const preview = await install({ ...options, dryRun: true });
  assert.match(preview.planToken, /^[a-f0-9]{64}$/);
  assert.equal((await install({ ...options, dryRun: true })).planToken, preview.planToken);
  await install({ ...options, agents: ['claude'] });
  await assert.rejects(install({ ...options, expectedPlan: preview.planToken }), { code: 'PLAN_CHANGED' });
  await assert.rejects(fs.readdir(codexSkills(options.home)), { code: 'ENOENT' });
  const fresh = await install({ ...options, dryRun: true });
  assert.notEqual(fresh.planToken, preview.planToken);
  assert.equal((await install({ ...options, expectedPlan: fresh.planToken })).status, 'installed');
});

test('rollback rejects a confirmed preview when a later update changes what it restores', async (t) => {
  const options = await fixture(t);
  await install({ ...options, profile: 'minimal' });
  await install({ ...options, profile: 'rigorous' });
  const preview = await rollback({ ...options, dryRun: true });
  await install({ ...options, profile: 'balanced' });
  await assert.rejects(rollback({ ...options, expectedPlan: preview.planToken }), { code: 'PLAN_CHANGED' });
  assert.equal((await installationStatus(options)).profile, 'balanced');
});

test('an interrupted transaction can restore state before the last successful change', async (t) => {
  const options = await fixture(t);
  await install({ ...options, profile: 'minimal' });
  const before = JSON.parse(await fs.readFile(statePath(options.home), 'utf8'));
  await install({ ...options, profile: 'balanced' });
  const after = JSON.parse(await fs.readFile(statePath(options.home), 'utf8'));
  await write(statePath(options.home), JSON.stringify(before));
  await write(journalPath(options.home), JSON.stringify({
    schema: 2, before, after, newDirectories: ['codex:agentvigor-diff-guardian', 'codex:agentvigor-token-budget']
  }));
  assert.equal((await installationStatus(options)).status, 'recovery-required');
  await assert.rejects(install(options), { code: 'RECOVERY_REQUIRED' });
  const preview = await rollback({ ...options, dryRun: true });
  const alreadyReverted = skill(codexSkills(options.home), 'diff-guardian');
  await fs.unlink(alreadyReverted);
  await assert.rejects(rollback({ ...options, expectedPlan: preview.planToken }), { code: 'PLAN_CHANGED' });
  const fresh = await rollback({ ...options, dryRun: true });
  assert.notEqual(fresh.planToken, preview.planToken);
  // A killed process can leave an empty directory when a skill write has not finished.
  await fs.rmdir(path.dirname(alreadyReverted));
  const result = await rollback({ ...options, expectedPlan: fresh.planToken });
  assert.equal(result.status, 'rolled-back');
  assert.equal(result.recovered, true);
  assert.equal((await installationStatus(options)).profile, 'minimal');
  assert.deepEqual((await fs.readdir(codexSkills(options.home))).sort(),
    ['agentvigor-agent-doctor', 'agentvigor-grounded-code', 'agentvigor-toolkit']);
});

test('recovery prunes only empty skill directories planned by the interrupted transaction', async (t) => {
  const options = await fixture(t);
  await install({ ...options, profile: 'minimal' });
  const before = JSON.parse(await fs.readFile(statePath(options.home), 'utf8'));
  await install({ ...options, profile: 'rigorous' });
  const after = JSON.parse(await fs.readFile(statePath(options.home), 'utf8'));
  const directory = codexSkills(options.home);
  const empty = skill(directory, 'diff-guardian');
  const withSibling = skill(directory, 'token-budget');
  const preExisting = skill(directory, 'safe-resume');
  const notes = path.join(path.dirname(withSibling), 'notes.txt');
  const staging = path.join(directory, '.agentvigor-unknown.tmp');
  for (const file of [empty, withSibling, preExisting]) await fs.unlink(file);
  await write(notes, 'keep notes');
  await write(staging, 'keep untracked staging');
  await write(statePath(options.home), JSON.stringify(before));
  await write(journalPath(options.home), JSON.stringify({
    schema: 2,
    before,
    after,
    newDirectories: ['codex:agentvigor-diff-guardian', 'codex:agentvigor-token-budget']
  }));
  assert.equal((await rollback(options)).recovered, true);
  await assert.rejects(fs.stat(path.dirname(empty)), { code: 'ENOENT' });
  assert.equal(await fs.readFile(notes, 'utf8'), 'keep notes');
  assert.equal(await fs.readFile(staging, 'utf8'), 'keep untracked staging');
  assert.deepEqual(await fs.readdir(path.dirname(preExisting)), []);
});

test('relative Claude config is rejected and a changed config binding cannot relocate managed data', async (t) => {
  const options = await fixture(t);
  const claudeOnly = { ...options, agents: ['claude'] };
  await assert.rejects(install({ ...claudeOnly, env: { CLAUDE_CONFIG_DIR: 'relative' } }), { code: 'INVALID_CLAUDE_CONFIG' });
  await install(claudeOnly);
  const modified = { ...claudeOnly, env: { CLAUDE_CONFIG_DIR: path.join(options.home, 'other') } };
  await assert.rejects(install(modified), { code: 'ROOT_CHANGED' });
  await assert.rejects(rollback(modified), { code: 'ROOT_CHANGED' });
});

test('unsupported or tampered state schemas are rejected without treating records as filesystem paths', async (t) => {
  const options = await fixture(t);
  const sentinel = path.join(options.home, 'sentinel');
  await write(sentinel, 'unchanged');
  const digest = createHash('sha256').update(sentinel).digest('hex');
  const invalid = { schema: 1, current: { codex: { profile: 'minimal', version: options.version, root: digest, files: { '../sentinel': 'YQ==' } } }, previous: null };
  await write(statePath(options.home), JSON.stringify(invalid));
  await assert.rejects(rollback(options), { code: 'INVALID_STATE' });
  assert.equal(await fs.readFile(sentinel, 'utf8'), 'unchanged');
});

test('update without a previous installation and rollback without history fail safely', async (t) => {
  const options = await fixture(t);
  assert.equal((await installationStatus(options)).status, 'not-installed');
  await assert.rejects(install({ ...options, update: true }), { code: 'NOT_INSTALLED' });
  await assert.rejects(rollback(options), { code: 'NO_ROLLBACK' });
  assert.deepEqual(await fs.readdir(options.home), []);
});
