import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { runFile } from '../lib/process.mjs';

const executable = process.argv[2];
assert.ok(isAbsolute(executable || '') && process.argv.includes('--allow-live'),
  'Pass an absolute Codex executable and --allow-live. Requires existing native Ponytail and Superpowers registrations.');
const env = { ...process.env };
for (const key of Object.keys(env)) if (key.startsWith('CODEX_') && key !== 'CODEX_HOME') delete env[key];
const root = await mkdtemp(join(await realpath(tmpdir()), 'agentvigor-plugin-behavior-'));
const test = `import assert from 'node:assert/strict'; import { test } from 'node:test';
import { total } from './invoice.mjs';
test('quantities', () => {
  assert.equal(total([{unitCents: 100, quantity: 3}]), 300);
  assert.equal(total([{unitCents: 100, quantity: 0}]), 0);
  assert.equal(total([{unitCents: 100}]), 100);
});
`;
try {
  await writeFile(join(root, 'invoice.mjs'), 'export function total(rows) { return rows.reduce((sum, row) => sum + row.unitCents, 0); }\n');
  await writeFile(join(root, 'invoice.test.mjs'), test);
  await writeFile(join(root, 'USER-NOTE.txt'), 'preserve this user note\n');
  const baseline = await runFile(process.execPath, ['--test', 'invoice.test.mjs'], { cwd: root, env });
  assert.notEqual(baseline.code, 0);
  const prompt = 'Use $ponytail:ponytail and $superpowers:test-driven-development explicitly from their native plugin caches. Read both complete SKILL.md files using your command tool so the invocation is observable. Fix the existing invoice quantity bug with the smallest correct change. The supplied test is the approved specification: observe it failing before editing production code, then rerun the same test after the fix. Do not edit the test or USER-NOTE.txt. No dependencies or extra features. Scope is only this synthetic fixture and the named native plugin skill resources. Do not inspect host credentials, call connectors, access other projects, install or configure tools, change client settings, delegate or publish anything. Report commands and actual results.';
  const result = await runFile(executable, ['exec', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'workspace-write',
    '-c', 'features.multi_agent=false', '--json', '--cd', root, prompt], { cwd: root, env, timeoutMs: 300000, maxOutputBytes: 2 * 1024 * 1024 });
  const events = result.stdout.split(/\r?\n/).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const commands = events.filter(event => event.type === 'item.completed' && event.item?.type === 'command_execution').map(event => event.item);
  const tests = commands.filter(item => /--test/.test(item.command));
  const red = tests.findIndex(item => item.exit_code !== 0);
  const independent = await runFile(process.execPath, ['--test', 'invoice.test.mjs'], { cwd: root, env });
  const skillRead = name => commands.some(item => item.exit_code === 0 && item.command.includes('plugins') && item.command.includes(name) && item.command.includes('SKILL.md'));
  const observation = { code: result.code, ponytailRead: skillRead('ponytail'), superpowersTddRead: skillRead('test-driven-development'),
    redThenGreen: red >= 0 && tests.slice(red + 1).some(item => item.exit_code === 0),
    independentPass: independent.code === 0, testPreserved: await readFile(join(root, 'invoice.test.mjs'), 'utf8') === test,
    userNotePreserved: await readFile(join(root, 'USER-NOTE.txt'), 'utf8') === 'preserve this user note\n' };
  observation.passed = observation.code === 0 && Object.values(observation).every(value => value !== false);
  await mkdir(resolve('out'), { recursive: true });
  await writeFile(resolve('out/codex-native-plugin-behavior.json'), JSON.stringify(observation, null, 2));
  console.log(JSON.stringify(observation));
  assert.ok(observation.passed, 'Native plugin behavior observation failed');
} finally { await rm(root, { recursive: true, force: true }); }
