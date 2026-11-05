import { performance } from 'node:perf_hooks';
import { readRegular } from '../skills/agentvigor-toolkit/scripts/process.mjs';

const MAX_BYTES = 1024 * 1024;
const fields = ['observedTokens', 'rtkSavedOutputTokens', 'durationMs', 'testsPassed', 'testsFailed',
  'errorsFound', 'regressionsFound', 'unsupportedClaims', 'toolkitMs'];
const required = ['durationMs', 'testsPassed', 'testsFailed'];
const labels = ['environment', 'agent', 'agentVersion', 'revision', 'scenario'];
const text = value => typeof value === 'string' && /^[\p{L}\d][\p{L}\d ._:/+@-]{0,99}$/u.test(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validMetric = (field, value) => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER &&
  (field.endsWith('Ms') || Number.isSafeInteger(value));

function invalid() {
  return Object.assign(new Error('Invalid paired benchmark input'), { code: 'BENCHMARK_INPUT' });
}

function observations(value) {
  if (!object(value) || Object.keys(value).some(key => !fields.includes(key))) throw invalid();
  for (const key of required) if (!validMetric(key, value[key])) throw invalid();
  for (const [key, amount] of Object.entries(value)) {
    if (amount !== null && !validMetric(key, amount)) throw invalid();
  }
  return value;
}

function median(values) {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const mid = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[mid] : ordered[mid - 1] / 2 + ordered[mid] / 2;
}

export function compare(data) {
  if (!object(data) || data.schemaVersion !== 1 || !object(data.metadata) ||
      Object.keys(data.metadata).some(key => ![...labels, 'model'].includes(key)) ||
      labels.some(key => !text(data.metadata[key])) ||
      (data.metadata.model != null && !text(data.metadata.model)) ||
      !Array.isArray(data.pairs) || data.pairs.length < 1 || data.pairs.length > 1000 ||
      Object.keys(data).some(key => !['schemaVersion', 'metadata', 'pairs'].includes(key))) throw invalid();

  const pairs = data.pairs.map(pair => {
    if (!object(pair) || Object.keys(pair).length !== 2) throw invalid();
    return [observations(pair.baseline), observations(pair.agentvigor)];
  });
  const metrics = Object.fromEntries(fields.map(field => {
    const paired = pairs.filter(([baseline, agentvigor]) => baseline[field] != null && agentvigor[field] != null);
    return [field, {
      pairedSamples: paired.length,
      baselineMedian: median(paired.map(([baseline]) => baseline[field])),
      agentvigorMedian: median(paired.map(([, agentvigor]) => agentvigor[field])),
      pairedDeltaMedian: median(paired.map(([baseline, agentvigor]) => agentvigor[field] - baseline[field])),
    }];
  }));
  return { schemaVersion: 1, metadata: data.metadata, repetitions: pairs.length, metrics };
}

export async function benchmark(path) {
  const started = performance.now();
  try {
    const bytes = await readRegular(path, MAX_BYTES, 'BENCHMARK_INPUT');
    if (bytes === null) throw invalid();
    const data = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
    return { ...compare(data), reportMs: performance.now() - started };
  } catch {
    throw invalid();
  }
}
