import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { install, installationStatus, rollback } from '../lib/install.mjs';
import { runFile } from '../lib/process.mjs';
import pkg from '../package.json' with { type: 'json' };

const executable = process.argv[2];
assert.ok(isAbsolute(executable || '') && process.argv.includes('--allow-live'),
  'Pass the absolute Codex executable and --allow-live. Uses the current account and temporarily registers six AgentVigor skills.');
const cli = fileURLToPath(new URL('../bin/agentvigor.mjs', import.meta.url));
const nodeCommand = `node "${cli}"`;
const note = 'Existing user note. Keep these exact bytes.\n';
const cases = [
  { id: 'development', skill: 'agentvigor-grounded-code', write: true,
    files: { 'price.mjs': 'export const price = cents => cents;\n', 'NOTE.txt': note },
    prompt: 'Implement price(cents, quantity = 1) as integer cents times quantity. Return 0 when quantity is 0. Change only price.mjs and run a local Node check.',
    check: `import assert from 'node:assert/strict'; import { price } from './price.mjs'; assert.equal(price(125, 3), 375); assert.equal(price(125, 0), 0); assert.equal(price(125), 125);` },
  { id: 'debugging', skill: 'agentvigor-agent-doctor', write: true,
    files: { 'window.mjs': 'export const contains = (start, end, value) => value >= start && value <= end;\n',
      'window.test.mjs': "import { test } from 'node:test'; import assert from 'node:assert/strict'; import { contains } from './window.mjs';\ntest('end is exclusive', () => { assert.equal(contains(1, 3, 1), true); assert.equal(contains(1, 3, 3), false); });\n" },
    prompt: 'Diagnose the failing test with node --test window.test.mjs, fix the production function only, then rerun that exact test. Keep window.test.mjs unchanged.',
    test: 'window.test.mjs' },
  { id: 'context', skill: 'agentvigor-token-budget',
    files: { 'build.log': 'INFO heartbeat\n'.repeat(18000) + 'ERROR AV_FIXTURE_473: cache key missing\n' + 'INFO heartbeat\n'.repeat(18000) },
    prompt: 'Find the single actionable error in build.log with a targeted search for ERROR. Do not dump the log or read its full contents. Return the error code and cause.' },
  { id: 'recovery', skill: 'agentvigor-safe-resume', write: true,
    files: { 'HANDOFF.md': '# Handoff\nObjective: export releaseReady = true in status.mjs.\nPrevious session claimed the change was written and tested. Verify current files first. NOTE.txt is an existing user edit and must be preserved.\n',
      'status.mjs': 'export const releaseReady = false;\n', 'NOTE.txt': note },
    prompt: 'Read the Safe Resume SKILL.md and HANDOFF.md using observable local read commands. Inspect status.mjs before acting, correct it if needed, preserve NOTE.txt and run a local Node check. Explain which handoff claim was stale.',
    check: `import assert from 'node:assert/strict'; import { releaseReady } from './status.mjs'; assert.equal(releaseReady, true);` },
  { id: 'bootstrap', skill: 'agentvigor-toolkit', write: true,
    files: {},
    prompt: `Complete only this bounded acceptance case with the next-project-bootstrap workflow. The current directory is empty. Run exactly these three shell commands in order: (1) ${nodeCommand} catalog --id next-project-bootstrap --mode quick --lang en (2) ${nodeCommand} project --mode init --template next --path . --dry-run (3) ${nodeCommand} project --mode init --template next --path . --yes. The disposable project is authorized for this write. Verify package.json, next.config.mjs and src/app/page.tsx exist, then stop. Dependency installation, external capability setup and build are out of this case's scope.` },
];

const selected = process.argv.slice(3).filter(arg => arg !== '--allow-live');
assert.ok(selected.every(id => cases.some(sample => sample.id === id)), 'Unknown scenario');
const env = { ...process.env };
for (const name of Object.keys(env)) if (name.startsWith('CODEX_') && name !== 'CODEX_HOME') delete env[name];
const options = { home: homedir(), env, agents: ['codex'], profile: 'rigorous', version: pkg.version };
const prior = await installationStatus(options);
assert.equal(prior.status, 'not-installed', 'This proof requires no prior AgentVigor installation');
await mkdir(resolve('out'), { recursive: true });
const temp = await realpath(tmpdir());
const root = await mkdtemp(join(temp, 'agentvigor-workflows-'));
let installed = false;
let failed = false;
try {
  const preview = await install({ ...options, dryRun: true });
  installed = (await install({ ...options, expectedPlan: preview.planToken })).status === 'installed';
  assert.ok(installed);
  for (const sample of cases.filter(item => selected.length === 0 || selected.includes(item.id))) {
    const cwd = join(root, sample.id);
    await mkdir(cwd);
    for (const [path, bytes] of Object.entries(sample.files)) await writeFile(join(cwd, path), bytes);
    const runNode = args => runFile(process.execPath, args, { cwd, env, timeoutMs: 15000 });
    const before = sample.test ? (await runNode(['--test', sample.test])).code : null;
    const prompt = `Use $${sample.skill} explicitly. ${sample.prompt} Only inspect this fixture and the requested AgentVigor skill. Work locally. Do not use external connectors, credentials, other projects, dependency installation, network tools or subagents.`;
    try {
      const result = await runFile(executable, ['exec', '--ephemeral', '--skip-git-repo-check', '--sandbox',
        sample.write ? 'workspace-write' : 'read-only', '-c', 'mcp_servers={}', '--json', '--cd', cwd, prompt],
      { cwd, env, timeoutMs: 300000, maxOutputBytes: 2 * 1024 * 1024 });
      const events = result.stdout.split(/\r?\n/).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
      const commands = events.filter(event => event.type === 'item.completed' && event.item?.type === 'command_execution').map(event => event.item);
      const successful = commands.filter(command => command.exit_code === 0);
      const final = events.filter(event => event.type === 'item.completed' && event.item?.type === 'agent_message').at(-1)?.item.text ?? '';
      const observed = { case: sample.id, code: result.code, skillRead: successful.some(command =>
        command.command.includes(sample.skill) && command.command.includes('SKILL.md')) };
      if (sample.check) observed.behaviorPassed = (await runNode(['--input-type=module', '-e', sample.check])).code === 0;
      if (sample.test) {
        observed.failedBefore = before !== 0;
        observed.failedTestObserved = commands.some(command => command.command.includes(sample.test) && command.exit_code === 1);
        observed.passedTestObserved = successful.some(command => command.command.includes(sample.test) && /--test/.test(command.command));
        observed.behaviorPassed = (await runNode(['--test', sample.test])).code === 0;
        observed.testsPreserved = await readFile(join(cwd, sample.test), 'utf8') === sample.files[sample.test];
      }
      if (sample.files['NOTE.txt']) observed.userNotePreserved = await readFile(join(cwd, 'NOTE.txt'), 'utf8') === note;
      if (sample.id === 'context') {
        observed.seededErrorFound = /AV_FIXTURE_473/.test(final) && /cache key missing/i.test(final);
        const logReads = successful.filter(command => command.command.includes('build.log'));
        observed.boundedSearch = logReads.length > 0 && logReads.every(command =>
          /ERROR/.test(command.command) && /rg|Select-String|grep|findstr/i.test(command.command) &&
          (command.aggregated_output?.length ?? Infinity) < 4096);
      }
      if (sample.id === 'recovery') observed.handoffRead = successful.some(command => command.command.includes('HANDOFF.md'));
      if (sample.id === 'bootstrap') {
        observed.quickRead = successful.some(command => /catalog.*--mode quick/.test(command.command));
        observed.previewObserved = successful.some(command => /project.*--dry-run/.test(command.command));
        observed.applyObserved = successful.some(command => /project.*--yes/.test(command.command));
        observed.foundationPresent = await Promise.all(['package.json', 'next.config.mjs', 'src/app/page.tsx'].map(path =>
          readFile(join(cwd, path)).then(bytes => bytes.length > 0).catch(() => false))).then(values => values.every(Boolean));
      }
      observed.passed = observed.code === 0 && Object.values(observed).every(value => value !== false);
      await writeFile(resolve(`out/codex-acceptance-${sample.id}.json`), JSON.stringify({ ...observed, final }, null, 2));
      console.log(JSON.stringify(observed));
      if (!observed.passed) failed = true;
    } catch (error) {
      const failure = { case: sample.id, passed: false, error: error.code ?? error.name };
      await writeFile(resolve(`out/codex-acceptance-${sample.id}.json`), JSON.stringify(failure, null, 2));
      console.log(JSON.stringify(failure));
      failed = true;
    }
  }
} finally {
  if (installed) {
    const plan = await rollback({ ...options, dryRun: true });
    await rollback({ ...options, expectedPlan: plan.planToken });
  }
  const after = await installationStatus(options);
  console.log(JSON.stringify({ restored: after.status === prior.status, files: after.skills.length }));
  assert.ok(root.startsWith(join(temp, 'agentvigor-workflows-')));
  await rm(root, { recursive: true, force: true });
}
if (failed) process.exitCode = 1;
