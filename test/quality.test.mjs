import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runFile } from '../skills/agentvigor-toolkit/scripts/process.mjs';
import { quality } from '../skills/agentvigor-toolkit/scripts/quality.mjs';

const configName = 'agentvigor.quality.json';

async function fixture(t) {
  const base = join(process.cwd(), 'out');
  await mkdir(base, { recursive: true });
  const path = await mkdtemp(join(base, 'quality with spaces '));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}

async function config(path, checks, extra = {}) {
  await writeFile(join(path, configName), JSON.stringify({ schemaVersion: 1, checks, ...extra }));
}

async function execute(path, options = {}) {
  const plan = await quality({ path, dryRun: true, ...options });
  return quality({ path, expectedPlan: plan.planToken, ...options });
}

test('quality shows a read-only plan, requires consent and runs a Node entry with exact argv and minimal environment', async (t) => {
  const path = await fixture(t);
  await writeFile(join(path, 'check with spaces.mjs'), `
    import { writeFileSync } from 'node:fs';
    if (process.env.GITHUB_TOKEN !== undefined) process.exit(10);
    writeFileSync('observed.txt', JSON.stringify(process.argv.slice(2)));
    console.log(JSON.stringify({ sample: process.env.SYNTHETIC_VALUE }));
  `);
  const env = { ...process.env, GITHUB_TOKEN: 'private-test-value', SYNTHETIC_VALUE: 'explicit-secret-fixture' };
  await config(path, [{ id: 'node-check', type: 'node', file: 'check with spaces.mjs', args: ['a b & ;', '--literal'] }], { passEnv: ['SYNTHETIC_VALUE'] });
  const plan = await quality({ path, dryRun: true, env });
  assert.equal(plan.status, 'planned');
  assert.deepEqual(plan.passEnv, ['SYNTHETIC_VALUE']);
  assert.ok(!JSON.stringify(plan).includes('explicit-secret-fixture'));
  assert.ok(!(await readdir(path)).includes('observed.txt'));
  await assert.rejects(quality({ path, env }), { code: 'CONFIRMATION_REQUIRED' });
  const result = await quality({ path, expectedPlan: plan.planToken, env });
  assert.equal(result.status, 'passed');
  assert.equal(result.checks[0].status, 'passed');
  assert.equal(result.checks[0].code, 0);
  assert.match(result.checks[0].stdout, /\[redacted\]/);
  assert.doesNotMatch(JSON.stringify(result), /private-test-value|explicit-secret-fixture/);
  assert.deepEqual(JSON.parse(await readFile(join(path, 'observed.txt'), 'utf8')), ['a b & ;', '--literal']);
});

test('quality rejects traversal and stale plans before running a changed entry', async (t) => {
  const path = await fixture(t);
  await config(path, [{ id: 'escape', type: 'node', file: '../escape.mjs' }]);
  await assert.rejects(quality({ path, dryRun: true }), { code: 'QUALITY_CONFIG' });
  await config(path, [{ id: 'escape', type: 'node', file: '.. /escape.mjs' }]);
  await assert.rejects(quality({ path, dryRun: true }), { code: 'QUALITY_CONFIG' });
  await writeFile(join(path, 'check.mjs'), 'process.exit(0)');
  await config(path, [{ id: 'node-check', type: 'node', file: 'check.mjs' }]);
  const plan = await quality({ path, dryRun: true });
  await writeFile(join(path, 'check.mjs'), `import { writeFileSync } from 'node:fs'; writeFileSync('unexpected.txt', 'ran');`);
  await assert.rejects(quality({ path, expectedPlan: plan.planToken }), { code: 'PLAN_CHANGED' });
  assert.ok(!(await readdir(path)).includes('unexpected.txt'));
});

test('quality reports missing configuration, empty checks, missing entry and npm without claiming pass', async (t) => {
  const path = await fixture(t);
  assert.equal((await quality({ path, dryRun: true })).status, 'unavailable');
  await config(path, []);
  assert.equal((await quality({ path, dryRun: true })).status, 'unavailable');
  await config(path, [{ id: 'missing', type: 'node', file: 'missing.mjs' }]);
  assert.equal((await quality({ path, dryRun: true })).checks[0].status, 'unavailable');
  await config(path, [{ id: 'npm', type: 'npm-script', script: 'verify' }]);
  await writeFile(join(path, 'package.json'), JSON.stringify({ scripts: { verify: 'node check.mjs' } }));
  const absent = await quality({ path, dryRun: true, env: { PATH: '' } });
  assert.equal(absent.status, 'unavailable');
  assert.equal(absent.checks[0].error, 'NPM_UNAVAILABLE');
});

test('quality executes an actual installed npm JavaScript entry without a shell shim', async (t) => {
  const path = await fixture(t);
  await writeFile(join(path, 'package.json'), JSON.stringify({ name: 'quality-fixture', scripts: { verify: 'node "check with spaces.mjs"' } }));
  await writeFile(join(path, 'check with spaces.mjs'), 'console.log("npm fixture reached");');
  await config(path, [{ id: 'npm', type: 'npm-script', script: 'verify' }]);
  const plan = await quality({ path, dryRun: true });
  if (plan.status === 'unavailable' && !process.env.npm_execpath) {
    t.skip('This standalone Node distribution has no npm installation on PATH.');
    return;
  }
  assert.equal(plan.status, 'planned');
  const result = await quality({ path, expectedPlan: plan.planToken });
  assert.equal(result.status, 'passed', JSON.stringify(result.checks));
  assert.match(result.checks[0].stdout, /npm fixture reached/);
});

test('quality records real failures, timeouts and bounded output', async (t) => {
  const path = await fixture(t);
  await writeFile(join(path, 'bad.mjs'), 'process.stderr.write("reason"); process.exitCode = 9;');
  await writeFile(join(path, 'forever.mjs'), 'setInterval(() => {}, 1000);');
  await writeFile(join(path, 'noisy.mjs'), 'process.stdout.write("x".repeat(512 * 1024));');
  await config(path, [
    { id: 'bad', type: 'node', file: 'bad.mjs' },
    { id: 'timeout', type: 'node', file: 'forever.mjs', timeoutMs: 200 },
    { id: 'noisy', type: 'node', file: 'noisy.mjs' },
  ]);
  const result = await execute(path);
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.checks.map(({ status, code, error }) => [status, code, error]), [
    ['failed', 9, undefined], ['failed', undefined, 'PROCESS_TIMEOUT'], ['failed', undefined, 'PROCESS_OUTPUT_LIMIT'],
  ]);
  assert.match(result.checks[0].stderr, /reason/);
});

test('quality does not start checks after cancellation', async (t) => {
  const path = await fixture(t);
  await writeFile(join(path, 'forever.mjs'), 'setInterval(() => {}, 1000);');
  await config(path, [{ id: 'cancelled', type: 'node', file: 'forever.mjs' }]);
  const signal = AbortSignal.timeout(150);
  const result = await execute(path, { signal });
  assert.equal(result.status, 'cancelled');
});

test('the pinned ESLint runs the original RuleTester and enforces all three rules in a flat config', async (t) => {
  const path = await fixture(t);
  const { ESLint } = await import('eslint');
  assert.equal(ESLint.version, '10.14.0');
  const templates = new URL('../skills/agentvigor-toolkit/references/upstream/templates/eslint/', import.meta.url);
  const verify = fileURLToPath(new URL('verify.mjs', templates));
  const rules = new URL('eslint-rules/index.cjs', templates);
  const selfCheck = await runFile(process.execPath, [verify, fileURLToPath(rules)], { cwd: path, timeoutMs: 90_000 });
  assert.equal(selfCheck.code, 0, selfCheck.stderr);
  assert.deepEqual(selfCheck.stdout.trim().split(/\r?\n/), [
    'quality/max-lines: ok', 'quality/no-direct-console: ok', 'quality/no-direct-data-access: ok',
  ]);

  const configFile = join(path, 'eslint.config.mjs');
  await writeFile(configFile, `import quality from ${JSON.stringify(rules.href)};
    export default [{ plugins: { quality }, rules: {
      'quality/max-lines': ['error', { max: 5 }],
      'quality/no-direct-console': 'error',
      'quality/no-direct-data-access': ['error', { modules: ['@/db'], layers: ['/src/app/'] }],
    } }];`);
  const eslint = new ESLint({ cwd: path, overrideConfigFile: configFile });
  const [rejected] = await eslint.lintText([
    "import { db as database } from '@/db';", 'console.log(database);', 'export const one = 1;',
    'export const two = 2;', 'export const three = 3;', 'export const four = 4;',
  ].join('\n'), { filePath: 'src/app/page.js' });
  assert.equal(rejected.errorCount, 3);
  assert.deepEqual(rejected.messages.map(({ ruleId }) => ruleId).sort(), [
    'quality/max-lines', 'quality/no-direct-console', 'quality/no-direct-data-access',
  ]);
  const [accepted] = await eslint.lintText("import { db } from '@/db'; export const read = () => db;", { filePath: 'src/server/repository.js' });
  assert.equal(accepted.errorCount, 0);
});
