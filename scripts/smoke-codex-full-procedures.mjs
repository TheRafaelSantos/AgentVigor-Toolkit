import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { install, installationStatus, rollback } from '../lib/install.mjs';
import { detectTools } from '../lib/platform.mjs';
import { runFile } from '../lib/process.mjs';
import { readProjectFile } from '../skills/agentvigor-toolkit/scripts/process.mjs';
import pkg from '../package.json' with { type: 'json' };
import { validateAuditArtifacts } from './audit-artifacts.mjs';
import { dispatchedReviewers } from './panel-evidence.mjs';
import { runAppServer } from './codex-appserver.mjs';

const executable = process.argv[2];
assert.ok(isAbsolute(executable || '') && process.argv.includes('--allow-live'),
  'Pass the absolute Codex executable and --allow-live. Uses the current account and temporarily installs the six AgentVigor skills.');
const selected = process.argv.slice(3).filter(value => value !== '--allow-live');
assert.ok(selected.every(value => ['panel', 'audit'].includes(value)), 'Unknown procedure');
const env = { ...process.env };
for (const name of Object.keys(env)) if (name.startsWith('CODEX_') && name !== 'CODEX_HOME') delete env[name];
const git = (await detectTools({ env })).git?.path;
assert.ok(git, 'Native Git required');
const options = { home: homedir(), env, agents: ['codex'], profile: 'rigorous', version: pkg.version };
const prior = await installationStatus(options);
assert.equal(prior.status, 'not-installed', 'This smoke requires no existing managed AgentVigor installation');
const temp = await realpath(tmpdir());
const root = await mkdtemp(join(temp, 'agentvigor-full-procedure-'));
await mkdir(resolve('out'), { recursive: true });
const source = `export async function documentFor(db, user, id) {
  if (!user) return { status: 401 };
  const document = await db.findDocument(id);
  return document ? { status: 200, body: document } : { status: 404 };
}
export function totalCents(rows) {
  return rows.reduce((total, row) => total + row.unitCents, 0);
}
`;
const files = {
  'service.mjs': source,
  'package.json': JSON.stringify({ name: 'agentvigor-synthetic-review', private: true, type: 'module',
    version: '0.0.0', scripts: { test: 'node --test' } }, null, 2) + '\n',
  'service.test.mjs': `import assert from 'node:assert/strict'; import { test } from 'node:test';
import { documentFor, totalCents } from './service.mjs';
test('anonymous requests are rejected', async () => assert.equal((await documentFor({}, null, 'one')).status, 401));
test('single-unit total', () => assert.equal(totalCents([{unitCents: 100, quantity: 1}]), 100));
`,
  'README.md': '# Synthetic service\nDocuments belong to tenants. Users may read documents only in their own tenant. Invoice rows have unitCents and quantity. Authentication is supplied by a trusted caller. The db fixture returns documents by id without additional authorization. No HTTP server, deployment, accounts or external database exists.\n',
  '.gitignore': 'private-audit/\n',
  'SOURCES.md': '# Public references checked by the coordinator on 2026-11-05\n' +
    '- OWASP ASVS 5.0.0, stable published 2025-05-30, https://asvs.owasp.org/\n' +
    '- OWASP API Security 2023 API1 Broken Object Level Authorization, https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/\n' +
    'Use these for scoped authorization analysis. No dependency advisory or tool scan has been performed. Do not infer live deployment controls.\n',
};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const cases = [
  { id: 'panel', workflow: 'multi-agent-code-review', sourceFile: '03-multi-agent-code-review.md',
    sandbox: 'read-only', prompt: 'Review the unstaged Git diff against HEAD using the full original multi-agent-code-review procedure. Establish the base commit and freeze the current working-tree snapshot before dispatch. Use one independent general-quality reviewer and one security reviewer in the same dispatch batch. Pure JavaScript backend without a framework permits dropping static-typing/framework lenses with reasons. Each reviewer is read-only. After both report, verify against the connected caller contract and tests, deduplicate by cause and produce one ranked report with reviewer attribution, failure scenarios, checks and limits. One panel round is authorized. Do not fix files or publish anything.' },
  { id: 'audit', workflow: 'security-audit', sourceFile: '16-security-audit.md',
    sandbox: 'workspace-write', prompt: 'Execute the full security-audit procedure in AUDIT mode for this entire small synthetic repository. Authorize only local static analysis and safe in-memory Node checks after inspecting the test source. Write all four prescribed artifacts in private-audit/ after verifying its Git-ignore status. Produce SECURITY-AUDIT.md, SECURITY-FINDINGS.json (schemaVersion 1 and a findings array), REMEDIATION-PROMPTS.md and AUDIT-HANDOFF.md. Keep stable finding IDs, severity, confidence, concrete evidence, counterevidence, coverage and first-batch remediation. Inventory all interfaces, dependencies and runtime. Mark nonexistent HTTP, browser, deployment and account surfaces N/A with reasons. SOURCES.md records current public guidance checked by the coordinator. Document unavailable scans and advisory coverage explicitly. Limit report writes to private-audit/. Preserve every source/config/test file and do not apply fixes or install anything. The entire fixture has only six files and no dependencies. Use concise evidence tables and references between artifacts instead of repeating prose. Report completeness and final validation take priority over an arbitrary output size. Do not create fictional surfaces or findings to fill a checklist. Complete the four reports and verify JSON syntax and finding-ID consistency before the final answer.' },
];
let installed = false;
let failed = false;
try {
  const plan = await install({ ...options, dryRun: true });
  installed = (await install({ ...options, expectedPlan: plan.planToken })).status === 'installed';
  assert.ok(installed);
  for (const sample of cases.filter(item => !selected.length || selected.includes(item.id))) {
    const cwd = join(root, sample.id);
    await mkdir(cwd);
    const invokeGit = async args => {
      const result = await runFile(git, args, { cwd, env, timeoutMs: 15000 });
      assert.equal(result.code, 0, result.stderr);
      return result.stdout.trim();
    };
    for (const [name, content] of Object.entries(files)) await writeFile(join(cwd, name), content);
    await invokeGit(['init', '--quiet']);
    if (sample.id === 'panel') await writeFile(join(cwd, 'service.mjs'), source
      .replace('return document ?', 'return document && document.tenantId === user.tenantId ?')
      .replace('row.unitCents,', 'row.unitCents * row.quantity,'));
    await invokeGit(['add', '.']);
    await invokeGit(['-c', 'user.name=AgentVigor Fixture', '-c', 'user.email=fixture@example.invalid',
      '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Synthetic procedure baseline']);
    if (sample.id === 'panel') await writeFile(join(cwd, 'service.mjs'), source);
    if (sample.id === 'audit') {
      await mkdir(join(cwd, 'private-audit'), { mode: 0o700 });
      sample.prompt += ' The coordinator already provisioned private-audit/. Preserve its existing owner and permissions; do not run chmod, icacls, takeown or change ACLs. Verify ignore status and write access, and record any unverified privacy property instead of excluding the coordinator from its own output directory.';
    }
    const revision = await invokeGit(['rev-parse', 'HEAD']);
    const prompt = `Use $agentvigor-toolkit explicitly. Load the complete original FULL procedure ${sample.workflow} and the linked usage guide from the global skill resources. ${sample.prompt} Target revision is ${revision}; the working tree may contain the seeded changes. The Windows sandbox can use a different OS account. For Git commands only, use -c safe.directory=${JSON.stringify(cwd.replaceAll('\\', '/'))} and -c core.excludesFile=${JSON.stringify(join(cwd, '.gitignore').replaceAll('\\', '/'))}; never persist these overrides. If the RTK executable is inaccessible, invoke the detected Git executable ${JSON.stringify(git)} directly and record that limitation. Scope is this repository and its original skill resources only. All data is synthetic. Do not inspect host credentials, call external connectors, access other projects, create accounts, change client settings or contact services. Native subagents are explicitly authorized only for the panel. Record observations without inventing successful commands.`;
    try {
      let result;
      try {
        result = sample.id === 'panel' ? await runAppServer(executable, prompt, { cwd, env, timeoutMs: 600000 })
          : await runFile(executable, ['exec', '--ephemeral', '--skip-git-repo-check', '--sandbox', sample.sandbox,
          ...(sample.id === 'audit' ? ['-c', 'features.multi_agent=false'] : []),
          '--json', '--cd', cwd, prompt], { cwd, env, timeoutMs: sample.id === 'audit' ? 900000 : 600000, maxOutputBytes: 4 * 1024 * 1024 });
      } catch (error) {
        result = { code: null, stdout: '', processError: error.code ?? error.name };
      }
      const events = result.stdout.split(/\r?\n/).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
      const completed = events.filter(event => event.type === 'item.completed').map(event => event.item);
      const commands = completed.filter(item => item?.type === 'command_execution' && item.exit_code === 0);
      const final = events.filter(event => event.type === 'item.completed' && event.item?.type === 'agent_message'
        && (!result.rootThreadId || event.threadId === result.rootThreadId)).at(-1)?.item.text ?? '';
      const failures = events.filter(event => event.type === 'error' || event.type === 'turn.failed')
        .map(event => ({ type: event.type, message: event.message ?? event.error?.message ?? null }));
      await writeFile(resolve(`out/codex-full-${sample.id}-failures.json`), JSON.stringify(failures, null, 2), { mode: 0o600 });
      const observed = { case: sample.id, code: result.code,
        ...(result.processError ? { processError: result.processError } : {}),
        fullRead: commands.some(command => command.command.includes(sample.sourceFile)),
        revisionPreserved: await invokeGit(['rev-parse', 'HEAD']) === revision,
        sourcePreserved: (await Promise.all(Object.entries(files).map(async ([name, bytes]) =>
          digest(await readFile(join(cwd, name))) === digest(bytes)))).every(Boolean) };
      await writeFile(resolve(`out/codex-full-${sample.id}-receipt.json`), JSON.stringify({ ...observed, final, eventItemTypes: [...new Set(completed.map(item => item?.type))] }, null, 2));
      if (sample.id === 'panel') {
        const collaboration = events.map(event => event.item).filter(item => /collab|agent.*tool|subAgentActivity/i.test(item?.type ?? ''));
        observed.collaboration = collaboration;
        observed.nativeDispatchObserved = dispatchedReviewers(collaboration).length >= 2;
        const finished = new Set(collaboration.filter(item => item.type === 'subAgentActivity' && item.kind === 'completed').map(item => item.agentThreadId));
        observed.nativeReviewersCompleted = observed.nativeDispatchObserved && dispatchedReviewers(collaboration).every(id => finished.has(id));
        observed.reportedBothSeededDefects = /tenant/i.test(final) && /quantity|quantidade/i.test(final);
      } else {
        const names = ['SECURITY-AUDIT.md', 'SECURITY-FINDINGS.json', 'REMEDIATION-PROMPTS.md', 'AUDIT-HANDOFF.md'];
        observed.artifacts = [];
        const currentArtifacts = {};
        const output = resolve('out', 'full-security-artifacts');
        await mkdir(output, { recursive: true });
        for (const name of names) {
          try {
            const bytes = await readProjectFile(cwd, `private-audit/${name}`, 256 * 1024, 'AUDIT_ARTIFACT_INVALID');
            if (!bytes) continue;
            currentArtifacts[name] = bytes.toString('utf8');
            await writeFile(join(output, name), bytes, { mode: 0o600 });
            observed.artifacts.push({ name, bytes: bytes.length, sha256: digest(bytes) });
          } catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
        observed.fourArtifacts = observed.artifacts.length === 4;
        observed.structuredFindings = validateAuditArtifacts(currentArtifacts);
      }
      observed.passed = observed.code === 0 && Object.values(observed).every(value => value !== false);
      await writeFile(resolve(`out/codex-full-${sample.id}.json`), JSON.stringify({ ...observed, final, eventItemTypes: [...new Set(completed.map(item => item?.type))] }, null, 2));
      console.log(JSON.stringify({ ...observed, collaboration: undefined }));
      if (!observed.passed) failed = true;
    } catch (error) {
      const observation = { case: sample.id, passed: false, error: error.code ?? error.name };
      await writeFile(resolve(`out/codex-full-${sample.id}.json`), JSON.stringify(observation, null, 2));
      console.log(JSON.stringify(observation));
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
  assert.ok(root.startsWith(join(temp, 'agentvigor-full-procedure-')));
  await rm(root, { recursive: true, force: true });
}
if (failed) process.exitCode = 1;
