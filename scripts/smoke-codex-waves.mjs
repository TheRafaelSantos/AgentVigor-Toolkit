import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, realpath, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { runAppServer } from './codex-appserver.mjs';
import { dispatchedReviewers } from './panel-evidence.mjs';
import { runFile } from '../lib/process.mjs';
import { detectTools } from '../lib/platform.mjs';

const executable = process.argv[2];
assert.ok(isAbsolute(executable || '') && process.argv.includes('--allow-live'),
  'Pass an absolute native Codex executable and --allow-live; uses the current account in a disposable project.');
const env = { ...process.env };
for (const name of Object.keys(env)) if (name.startsWith('CODEX_') && name !== 'CODEX_HOME') delete env[name];
const git = (await detectTools({ env })).git?.path;
assert.ok(git, 'Native Git required');
const cwd = await mkdtemp(join(await realpath(tmpdir()), 'agentvigor-native-waves-'));
const testSource = `import assert from 'node:assert/strict'; import {test} from 'node:test';
import {totalCents} from './invoice.mjs'; import {canRead} from './access.mjs';
test('invoice quantities', () => {
  assert.equal(totalCents([{unitCents: 100, quantity: 3}]), 300);
  assert.equal(totalCents([{unitCents: 100, quantity: 0}]), 0);
  assert.equal(totalCents([]), 0);
});
test('tenant isolation', () => {
  assert.equal(canRead({tenantId:'A'}, {tenantId:'A'}), true);
  assert.equal(canRead({tenantId:'A'}, {tenantId:'B'}), false);
  assert.equal(canRead(null, {tenantId:'A'}), false);
  assert.equal(canRead({tenantId:'A'}, null), false);
  assert.equal(canRead({}, {}), false);
  assert.equal(canRead({tenantId:''}, {tenantId:''}), false);
  assert.equal(canRead({tenantId:null}, {tenantId:null}), false);
});
`;
const files = {
  'invoice.mjs': 'export function totalCents(rows) { return 0; }\n',
  'access.mjs': 'export function canRead(user, document) { return false; }\n',
  'workflow.test.mjs': testSource,
  'USER-NOTE.txt': 'Preserve this existing user work.\n',
};
try {
  for (const [name, content] of Object.entries(files)) await writeFile(join(cwd, name), content);
  const invokeGit = async args => {
    const result = await runFile(git, args, { cwd, env });
    assert.equal(result.code, 0, result.stderr); return result.stdout.trim();
  };
  await invokeGit(['init', '--quiet']); await invokeGit(['add', '.']);
  await invokeGit(['-c', 'user.name=AgentVigor Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Synthetic independent tasks']);
  const revision = await invokeGit(['rev-parse', 'HEAD']);
  assert.notEqual((await runFile(process.execPath, ['--test', 'workflow.test.mjs'], { cwd, env })).code, 0);
  const router = resolve('skills/agentvigor-toolkit');
  const prompt = `Read ${JSON.stringify(join(router, 'SKILL.md'))}, then execute the complete original FULL parallel-wave-dispatch procedure at ${JSON.stringify(join(router, 'references/full/source/docs/prompts/05-parallel-wave-dispatch.md'))} and its linked orchestration guide in this synthetic project. The supplied tests are the approved specification. Plan dependencies and ownership first. Two independent tasks are authorized in one wave: invoice worker owns only invoice.mjs; authorization worker owns only access.mjs. Native subagents are explicitly authorized. Tell each worker they are not alone and must preserve others' work. Both read the same immutable test file; neither may run shared checks, edit tests/notes, commit or install anything. The coordinator alone runs checks, reviews both diffs against contracts and verifies the final result after both finish. Do not simulate a wave if native dispatch is unavailable. HEAD is ${revision}; preserve it. Preserve workflow.test.mjs and USER-NOTE.txt byte-for-byte, create no additional files. Use the direct Git executable ${JSON.stringify(git)} with command-only -c safe.directory=${JSON.stringify(cwd.replaceAll('\\', '/'))} -c core.excludesFile=${JSON.stringify(join(cwd, 'USER-NOTE.txt').replaceAll('\\', '/'))}; never persist configuration. Run only inspected local Node tests. Scope is this fixture and the specified skill resources only: no credentials, connectors, external services, installs, unrelated projects, account/model/provider changes or publishing. Report the wave, ownership, reviewer evidence and actual checks.`;
  const result = await runAppServer(executable, prompt, { cwd, env, timeoutMs: 900000,
    sandbox: 'workspace-write', allowSubagents: true });
  const events = result.stdout.split('\n').filter(Boolean).map(line => JSON.parse(line));
  const items = events.filter(event => event.type === 'item.completed').map(event => event.item);
  const reviewers = dispatchedReviewers(items);
  const finished = new Set(items.filter(item => item.type === 'subAgentActivity' && item.kind === 'completed').map(item => item.agentThreadId));
  const starts = items.map((item, index) => ({ item, index })).filter(({ item }) => item.type === 'subAgentActivity' && item.kind === 'started');
  const firstCompletion = items.findIndex(item => item.type === 'subAgentActivity' && item.kind === 'completed');
  const check = await runFile(process.execPath, ['--test', 'workflow.test.mjs'], { cwd, env });
  const observation = { code: result.code, fullRead: items.some(item => item.type === 'command_execution' && item.exit_code === 0 && item.command.includes('05-parallel-wave-dispatch.md')),
    twoNativeWorkers: reviewers.length === 2, workersCompleted: reviewers.length === 2 && reviewers.every(id => finished.has(id)),
    parallelWaveObserved: starts.length === 2 && firstCompletion > Math.max(...starts.map(({ index }) => index)),
    independentTestsPassed: check.code === 0, revisionPreserved: await invokeGit(['rev-parse', 'HEAD']) === revision,
    testPreserved: await readFile(join(cwd, 'workflow.test.mjs'), 'utf8') === testSource,
    userNotePreserved: await readFile(join(cwd, 'USER-NOTE.txt'), 'utf8') === files['USER-NOTE.txt'],
    noExtraFiles: (await readdir(cwd)).filter(name => name !== '.git').sort().join() === Object.keys(files).sort().join() };
  observation.passed = observation.code === 0 && Object.values(observation).every(value => value !== false);
  await mkdir(resolve('out'), { recursive: true });
  await writeFile(resolve('out/codex-native-wave.json'), JSON.stringify({ ...observation,
    final: events.filter(event => event.type === 'item.completed' && event.threadId === result.rootThreadId && event.item.type === 'agent_message').at(-1)?.item.text }, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(observation)); assert.ok(observation.passed, 'Native parallel-wave acceptance failed');
} finally { await rm(cwd, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 }); }
