// Adapted from Vibe Coding Toolkit's scripts/validate-harness.mjs.
// Copyright (c) 2026 Matheus Gomes. See references/upstream/LICENSE (MIT).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { failure, hash, minimalEnv, projectDirectory, readProjectFile, requirePlan, runFile, token } from './process.mjs';

const evaluator = fileURLToPath(import.meta.url);
const marker = 'AGENTVIGOR_HARNESS_RESULT ';
const maxFixtureBytes = 256 * 1024;
const accessFile = 'access.mjs';
const notesFile = 'local-notes.txt';
const baselineNotes = new URL('../references/upstream/templates/harness-evaluation/local-notes.txt', import.meta.url);
const actor = Object.freeze({ id: 'user-1', tenantId: 'tenant-a' });
const record = Object.freeze({ ownerId: 'user-1', tenantId: 'tenant-a' });

const cases = {
  'same-owner': canRead => assert.equal(canRead({ ...actor }, { ...record }), true),
  'other-owner': canRead => assert.equal(canRead({ ...actor, id: 'user-2' }, { ...record }), false),
  'cross-tenant': canRead => assert.equal(canRead({ ...actor, tenantId: 'tenant-b' }, { ...record }), false),
  'missing-record-or-actor': canRead => {
    assert.equal(canRead(null, { ...record }), false);
    assert.equal(canRead({ ...actor }, undefined), false);
  },
  'invalid-identity': canRead => {
    for (const value of [undefined, null, '', 0, false, 1, true, {}, []]) {
      assert.equal(canRead({ ...actor, id: value }, { ...record, ownerId: value }), false);
      assert.equal(canRead({ ...actor, tenantId: value }, { ...record, tenantId: value }), false);
    }
  },
  'no-mutation': canRead => {
    const frozenActor = Object.freeze({ ...actor });
    const frozenRecord = Object.freeze({ ...record });
    assert.equal(canRead(frozenActor, frozenRecord), true);
    assert.deepEqual(frozenActor, actor);
    assert.deepEqual(frozenRecord, record);
  },
  'preserved-notes': async (_, root) => {
    const [current, original] = await Promise.all([readFile(join(root, notesFile)), readFile(baselineNotes)]);
    assert.deepEqual(current, original);
  },
};

async function evaluate(root) {
  const { canReadRecord } = await import(pathToFileURL(join(root, accessFile)).href);
  if (typeof canReadRecord !== 'function') throw failure('HARNESS_EXPORT');
  const checks = [];
  for (const [id, check] of Object.entries(cases)) {
    try {
      await check(canReadRecord, root);
      checks.push({ id, status: 'passed' });
    } catch {
      checks.push({ id, status: 'failed' });
    }
  }
  return checks;
}

async function prepare(root) {
  const [access, notes] = await Promise.all([
    readProjectFile(root, accessFile, maxFixtureBytes, 'HARNESS_INPUT'),
    readProjectFile(root, notesFile, maxFixtureBytes, 'HARNESS_INPUT'),
  ]);
  const checks = Object.keys(cases).map(id => ({ id, status: 'planned' }));
  if (!access) return { status: 'unavailable', error: 'HARNESS_MISSING', planToken: null, checks: [] };
  const planToken = token('harness-v1', root, process.execPath, process.version, hash(await readFile(evaluator)),
    hash(await readFile(baselineNotes)), hash(access), notes ? hash(notes) : null);
  return { status: 'planned', planToken, checks };
}

export async function harness({ path = process.cwd(), dryRun = false, expectedPlan, signal, env = process.env } = {}) {
  const root = await projectDirectory(path);
  const plan = await prepare(root);
  if (dryRun) return plan;
  if (expectedPlan !== undefined || plan.status === 'planned') requirePlan(expectedPlan, plan.planToken);
  if (plan.status !== 'planned') return plan;

  try {
    const result = await runFile(process.execPath, [evaluator, '--evaluate', root], {
      cwd: root, env: minimalEnv(env), signal, timeoutMs: 10_000, maxOutputBytes: 64 * 1024,
    });
    const line = result.stdout.split(/\r?\n/).findLast(value => value.startsWith(marker));
    const checks = result.code === 0 && line ? JSON.parse(line.slice(marker.length)) : null;
    if (!Array.isArray(checks) || checks.length !== plan.checks.length || checks.some((check, index) =>
      check?.id !== plan.checks[index].id || !['passed', 'failed'].includes(check.status))) throw failure('HARNESS_EXECUTION');
    const status = checks.some(check => check.status === 'failed') ? 'failed' : 'passed';
    return { ...plan, status, checks: checks.map(({ id, status }) => ({ id, status })) };
  } catch (error) {
    const cancelled = error.code === 'PROCESS_ABORTED';
    const status = cancelled ? 'cancelled' : 'failed';
    return { ...plan, status, error: typeof error.code === 'string' ? error.code : 'HARNESS_EXECUTION',
      checks: plan.checks.map(check => ({ ...check, status: cancelled ? 'cancelled' : 'unavailable' })) };
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url && process.argv[2] === '--evaluate') {
  try {
    const checks = await evaluate(process.argv[3]);
    process.stdout.write(`\n${marker}${JSON.stringify(checks)}\n`);
  } catch {
    process.exitCode = 1;
  }
}
