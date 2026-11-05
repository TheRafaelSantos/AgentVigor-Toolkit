import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { harness } from '../skills/agentvigor-toolkit/scripts/harness.mjs';

const note = await readFile(new URL('../skills/agentvigor-toolkit/references/upstream/templates/harness-evaluation/local-notes.txt', import.meta.url));
const good = `export function canReadRecord(actor, record) {
  return Boolean(actor && record && typeof actor.id === 'string' && actor.id.length &&
    typeof actor.tenantId === 'string' && actor.tenantId.length && actor.id === record.ownerId && actor.tenantId === record.tenantId);
}`;
const bad = 'export const canReadRecord = (actor, record) => Boolean(actor && record && actor.id === record.ownerId);';

async function fixture(t) {
  const base = join(process.cwd(), 'out');
  await mkdir(base, { recursive: true });
  const path = await mkdtemp(join(base, 'harness with spaces '));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}

async function evaluate(path) {
  const plan = await harness({ path, dryRun: true });
  assert.equal(plan.status, 'planned');
  return harness({ path, expectedPlan: plan.planToken });
}

test('harness evaluates all seven checks on vulnerable, repaired and modified-note fixtures', async (t) => {
  const path = await fixture(t);
  await writeFile(join(path, 'access.mjs'), bad);
  await writeFile(join(path, 'local-notes.txt'), note);
  const baseline = await evaluate(path);
  assert.equal(baseline.status, 'failed');
  assert.equal(baseline.checks.length, 7);
  assert.deepEqual(baseline.checks.filter(({ status }) => status === 'failed').map(({ id }) => id), ['cross-tenant', 'invalid-identity']);
  await writeFile(join(path, 'access.mjs'), good);
  const repaired = await evaluate(path);
  assert.equal(repaired.status, 'passed');
  assert.equal(repaired.checks.filter(({ status }) => status === 'passed').length, 7);
  await writeFile(join(path, 'local-notes.txt'), 'overwritten');
  const overwritten = await evaluate(path);
  assert.deepEqual(overwritten.checks.filter(({ status }) => status === 'failed').map(({ id }) => id), ['preserved-notes']);
});

test('harness plan does not import fixture code and cannot execute after fixture changes', async (t) => {
  const path = await fixture(t);
  assert.equal((await harness({ path, dryRun: true })).status, 'unavailable');
  await writeFile(join(path, 'access.mjs'), `throw new Error('not called on preview');`);
  await writeFile(join(path, 'local-notes.txt'), note);
  const plan = await harness({ path, dryRun: true });
  assert.equal(plan.status, 'planned');
  await assert.rejects(harness({ path }), { code: 'CONFIRMATION_REQUIRED' });
  await writeFile(join(path, 'access.mjs'), good);
  await assert.rejects(harness({ path, expectedPlan: plan.planToken }), { code: 'PLAN_CHANGED' });
});
