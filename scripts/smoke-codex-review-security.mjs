import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { install, installationStatus, rollback } from '../lib/install.mjs';
import { runFile } from '../lib/process.mjs';
import pkg from '../package.json' with { type: 'json' };

const executable = process.argv[2];
assert.ok(isAbsolute(executable || '') && process.argv.includes('--allow-live'),
  'Pass the absolute Codex executable and --allow-live. Uses the current account and temporarily registers the six AgentVigor skills.');
const home = homedir();
const env = { ...process.env };
for (const name of Object.keys(env)) if (name.startsWith('CODEX_') && name !== 'CODEX_HOME') delete env[name];
const options = { home, env, agents: ['codex'], profile: 'rigorous', version: pkg.version };
const prior = await installationStatus(options);
assert.equal(prior.status, 'not-installed', 'This proof requires no prior AgentVigor installation');
await mkdir(resolve('out'), { recursive: true });
const root = await realpath(await mkdtemp(join(tmpdir(), 'agentvigor-acceptance-')));
let installed = false;
let failed = false;
const cases = [
  { id: 'review', skill: 'agentvigor-diff-guardian', file: 'invoices.mjs',
    content: 'export function totalCents(rows) {\n  return rows.reduce((sum, row) => sum + row.unitCents, 0);\n}\n',
    prompt: 'Review the changed function in invoices.mjs. Product requirement: the invoice total must include each row’s quantity. Report only the most actionable finding with filename, line, trigger and impact. Do not edit files.',
    verify: output => /invoices\.mjs/i.test(output) && /unitCents/.test(output) && /quantity|quantidade/i.test(output) },
  { id: 'security', skill: 'agentvigor-grounded-code', file: 'document.mjs',
    content: 'export async function getDocument(db, user, id) {\n  if (!user) return { status: 401 };\n  const doc = await db.findDocument(id);\n  return doc ? { status: 200, body: doc } : { status: 404 };\n}\n',
    prompt: 'Perform a local security review of document.mjs. Each document belongs to one tenant. Report the most serious authorization flaw with filename and line, an exploit scenario, and a fix including a regression check. Do not edit files.',
    verify: output => /document\.mjs/i.test(output) && /tenant/i.test(output) && /403|404|IDOR|BOLA|authorization|autorização/i.test(output) },
];
try {
  const preview = await install({ ...options, dryRun: true });
  installed = (await install({ ...options, expectedPlan: preview.planToken })).status === 'installed';
  assert.ok(installed);
  for (const sample of cases) {
    const cwd = join(root, sample.id);
    await mkdir(cwd);
    await writeFile(join(cwd, sample.file), sample.content);
    const prompt = `Use $${sample.skill} explicitly. ${sample.prompt} Inspect only the seeded fixture and the requested skill. Do not use connectors, credentials, other repositories, network tools or subagents.`;
    const result = await runFile(executable, ['exec', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'read-only',
      '-c', 'mcp_servers={}', '--json', '--cd', cwd, prompt], { cwd, env, timeoutMs: 150000, maxOutputBytes: 2 * 1024 * 1024 });
    const events = result.stdout.split(/\r?\n/).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
    const commands = events.filter(event => event.type === 'item.completed' && event.item?.type === 'command_execution');
    const final = events.filter(event => event.type === 'item.completed' && event.item?.type === 'agent_message').at(-1)?.item.text ?? '';
    const observed = { case: sample.id, code: result.code, skillRead: commands.some(event =>
      event.item.exit_code === 0 && event.item.command.includes(sample.skill) && event.item.command.includes('SKILL.md')),
    fixtureRead: commands.some(event => event.item.exit_code === 0 && event.item.command.includes(sample.file)),
    seededFinding: sample.verify(final), final };
    await writeFile(resolve(`out/codex-acceptance-${sample.id}.json`), JSON.stringify(observed, null, 2));
    console.log(JSON.stringify({ ...observed, final: undefined }));
    if (observed.code !== 0 || !observed.skillRead || !observed.fixtureRead || !observed.seededFinding) failed = true;
  }
} finally {
  if (installed) {
    const plan = await rollback({ ...options, dryRun: true });
    await rollback({ ...options, expectedPlan: plan.planToken });
  }
  const after = await installationStatus(options);
  console.log(JSON.stringify({ restored: after.status === prior.status, files: after.skills.length }));
  assert.ok(root.startsWith(await realpath(tmpdir())) && /agentvigor-acceptance-[^\\/]+$/.test(root));
  await rm(root, { recursive: true, force: true });
}
if (failed) process.exitCode = 1;
