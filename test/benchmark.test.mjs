import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compare, benchmark } from '../lib/benchmark.mjs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const metadata = {
  environment: 'Test runner', revision: 'fixture', agent: 'Codex', agentVersion: 'test',
  model: null, scenario: 'Idempotency',
};
const result = durationMs => ({ durationMs, testsPassed: 2, testsFailed: 0 });
const report = pairs => ({ schemaVersion: 1, metadata, pairs });

test('benchmark reads valid observations beyond a single filesystem chunk', async t => {
  const root = await mkdtemp(resolve('.agentvigor-test-benchmark-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = join(root, 'observations.json');
  await writeFile(input, ' '.repeat(200000) + JSON.stringify(report([
    { baseline: result(10), agentvigor: result(6) },
  ])));
  const outcome = await benchmark(input);
  assert.equal(outcome.repetitions, 1);
  assert.equal(outcome.metrics.durationMs.pairedDeltaMedian, -4);
});

test('reports paired deltas and keeps unavailable token metrics empty', () => {
  const pairs = [[1, 2], [4, 5], [8, 1]].map(([baseline, agentvigor]) => ({
    baseline: result(baseline), agentvigor: result(agentvigor),
  }));
  pairs[0].agentvigor.rtkSavedOutputTokens = 50;
  const outcome = compare(report(pairs));
  assert.equal(outcome.repetitions, 3);
  assert.deepEqual(outcome.metrics.durationMs, {
    pairedSamples: 3, baselineMedian: 4, agentvigorMedian: 2, pairedDeltaMedian: 1,
  });
  assert.deepEqual(outcome.metrics.rtkSavedOutputTokens, {
    pairedSamples: 0, baselineMedian: null, agentvigorMedian: null, pairedDeltaMedian: null,
  });
});

test('rejects fabricated zero-duration data types, malformed pairs and unknown fields', () => {
  for (const baseline of [
    { ...result(1), observedTokens: -2 },
    { ...result(1), testsFailed: 0.5 },
    { ...result(1), durationMs: '1' },
    { ...result(1), log: 'private' },
    null,
  ]) {
    assert.throws(() => compare(report([{ baseline, agentvigor: result(5) }])), { code: 'BENCHMARK_INPUT' });
  }
  assert.throws(() => compare(report([])), { code: 'BENCHMARK_INPUT' });
});
