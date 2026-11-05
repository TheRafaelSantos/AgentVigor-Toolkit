import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { project } from '../skills/agentvigor-toolkit/scripts/project.mjs';

async function fixture(t) {
  const root = await mkdtemp(fileURLToPath(new URL('.tmp-project with spaces-', import.meta.url)));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('adoption plans without writes and preserves existing content with a managed proposal', async t => {
  const path = await fixture(t);
  await writeFile(join(path, 'AGENTS.md'), 'Project-specific instructions\n');
  const options = { path, mode: 'adopt', template: 'docs', lang: 'pt-BR' };
  const plan = await project({ ...options, dryRun: true });
  assert.equal(plan.status, 'planned');
  assert.ok(plan.changes.some(change => change.action === 'propose' && change.target === 'AGENTS.md'));
  assert.deepEqual(await readdir(path), ['AGENTS.md']);
  await assert.rejects(project(options), { code: 'CONFIRMATION_REQUIRED' });
  assert.equal((await project({ ...options, expectedPlan: plan.planToken })).status, 'applied');
  assert.match(await readFile(join(path, 'AGENTS.md'), 'utf8'), /Project-specific instructions/);
  assert.match(await readFile(join(path, '.agentvigor-project', 'proposals', 'AGENTS.md'), 'utf8'), /AgentVigor/);
  assert.match(await readFile(join(path, 'PRODUCT.md'), 'utf8'), /Produto/);
  const repeat = await project({ ...options, dryRun: true });
  assert.equal(repeat.changes.filter(change => change.action !== 'keep').length, 0);
  assert.equal((await project({ ...options, expectedPlan: repeat.planToken })).status, 'unchanged');
});

test('a stale preview cannot authorize different writes', async t => {
  const path = await fixture(t);
  const options = { path, mode: 'adopt', template: 'docs' };
  const plan = await project({ ...options, dryRun: true });
  await writeFile(join(path, 'AGENTS.md'), 'Created after the preview');
  await assert.rejects(project({ ...options, expectedPlan: plan.planToken }), { code: 'PLAN_CHANGED' });
  assert.deepEqual(await readdir(path), ['AGENTS.md']);
});

test('rollback preserves edited generated files and restores the remaining initial tree', async t => {
  const path = await fixture(t);
  const init = { path, mode: 'init', template: 'docs' };
  const plan = await project({ ...init, dryRun: true });
  await project({ ...init, expectedPlan: plan.planToken });
  await writeFile(join(path, 'PRODUCT.md'), 'Edited user work');
  const rollback = { path, mode: 'rollback' };
  const remove = await project({ ...rollback, dryRun: true });
  assert.ok(remove.changes.some(change => change.path === 'PRODUCT.md' && change.action === 'keep'));
  assert.equal((await project({ ...rollback, expectedPlan: remove.planToken })).status, 'rolled-back');
  assert.equal(await readFile(join(path, 'PRODUCT.md'), 'utf8'), 'Edited user work');
  await assert.rejects(readFile(join(path, 'AGENTS.md')), { code: 'ENOENT' });
  assert.equal((await project({ path, mode: 'status' })).managed.length, 0);
});

test('init refuses nonempty projects and adoption refuses linked destination folders', async t => {
  const path = await fixture(t);
  const outside = await fixture(t);
  await mkdir(join(path, 'existing'));
  await assert.rejects(project({ path, mode: 'init', template: 'next', dryRun: true }), { code: 'PROJECT_NOT_EMPTY' });
  await symlink(outside, join(path, 'docs'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(project({ path, mode: 'adopt', template: 'docs', dryRun: true }), { code: 'UNSAFE_PATH' });
  assert.deepEqual(await readdir(outside), []);
});

test('Next foundation contains pinned dependencies, App Router and a real quality plan', async t => {
  const path = await fixture(t);
  const options = { path, mode: 'init', template: 'next' };
  const plan = await project({ ...options, dryRun: true });
  await project({ ...options, expectedPlan: plan.planToken });
  const pkg = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'));
  assert.match(pkg.dependencies.next, /^16\.\d+\.\d+$/);
  assert.match(await readFile(join(path, 'src', 'app', 'page.tsx'), 'utf8'), /export default/);
  const gates = JSON.parse(await readFile(join(path, 'agentvigor.quality.json'), 'utf8'));
  assert.deepEqual(gates.checks.map(check => check.id), ['lint', 'typecheck', 'test', 'build']);
});

test('an interrupted adoption recovers only files still linked to managed objects', async t => {
  const path = await fixture(t);
  const options = { path, mode: 'adopt', template: 'docs' };
  const preview = await project({ ...options, dryRun: true });
  await project({ ...options, expectedPlan: preview.planToken });
  const statePath = join(path, '.agentvigor-project', 'state.json');
  const state = JSON.parse(await readFile(statePath, 'utf8'));
  await writeFile(statePath, JSON.stringify({
    ...state, managed: {}, pending: { action: 'add', files: state.managed, init: null },
  }));
  const replaced = join(path, 'PRODUCT.md');
  const copy = await readFile(replaced);
  await unlink(replaced);
  await writeFile(replaced, copy);
  assert.equal((await project({ path })).status, 'recovery-required');
  await assert.rejects(project({ ...options, dryRun: true }), { code: 'PROJECT_RECOVERY_REQUIRED' });
  const rollback = { path, mode: 'rollback' };
  const repair = await project({ ...rollback, dryRun: true });
  assert.equal((await project({ ...rollback, expectedPlan: repair.planToken })).status, 'recovered');
  assert.deepEqual(await readFile(replaced), copy);
  await assert.rejects(readFile(join(path, 'AGENTS.md')), { code: 'ENOENT' });
  assert.equal((await project({ path })).status, 'inspected');
});
