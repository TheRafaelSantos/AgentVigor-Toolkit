import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { install, rollback, installationStatus } from '../lib/install.mjs';

async function fixture(t) {
  const home = await fs.mkdtemp(path.resolve('.agentvigor-test-home-'));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  return { home, env: {}, agents: ['codex'], version: '0.1.0-rc.1' };
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

test('dry-run plans the default Codex profile without changing any files', async (t) => {
  const options = await fixture(t);
  const result = await install({ ...options, dryRun: true });
  assert.equal(result.status, 'planned');
  assert.equal(result.profile, 'balanced');
  assert.equal(result.changes.length, 4);
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
  assert.equal(result.changes.length, 8);
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
  assert.equal((await fs.readdir(claudeSkills)).length, 5);
  assert.equal((await fs.readdir(codexSkills(options.home))).length, 2);
  const newer = { ...options, agents: undefined, version: '0.1.0-rc.2', update: true };
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
  await write(journalPath(options.home), JSON.stringify({ schema: 1, before, after }));
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
  assert.deepEqual((await fs.readdir(codexSkills(options.home))).sort(), ['agentvigor-agent-doctor', 'agentvigor-grounded-code']);
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
    schema: 1,
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
