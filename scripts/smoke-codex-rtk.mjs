import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdtemp, readFile, realpath, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, isAbsolute, join, resolve } from 'node:path';
import { detectTools } from '../lib/platform.mjs';
import { runFile } from '../lib/process.mjs';

const executable = process.argv[2];
assert.ok(isAbsolute(executable || '') && process.argv.includes('--allow-live'),
  'Pass an absolute Codex executable and --allow-live. Requires an existing trusted RTK hook and account.');
const env = { ...process.env };
for (const key of Object.keys(env)) if (key.startsWith('CODEX_') && key !== 'CODEX_HOME') delete env[key];
const tools = await detectTools({ env });
assert.ok(tools.git?.path && tools.rtk?.path, 'Git and RTK required');
const root = await mkdtemp(join(await realpath(tmpdir()), 'agentvigor-rtk-observation-'));
try {
  const source = await realpath(tools.rtk.path);
  const binary = join(root, process.platform === 'win32' ? 'rtk.exe' : 'rtk');
  await copyFile(source, binary);
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash(await readFile(binary)), hash(await readFile(source)));
  const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path') ?? 'PATH';
  env[pathKey] = root + delimiter + (env[pathKey] ?? '');
  env.RTK_DB_PATH = join(root, 'rtk.sqlite');
  const git = await runFile(tools.git.path, ['init', '--quiet'], { cwd: root, env });
  assert.equal(git.code, 0, 'Git fixture initialization failed');
  const content = 'synthetic hook observation\n';
  await writeFile(join(root, 'fixture.txt'), content);
  const command = `git -c safe.directory='${root.replaceAll('\\', '/')}' status --short`;
  const result = await runFile(executable, ['exec', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'workspace-write', '--json', '--cd', root,
    `Run exactly ${command} once using your command tool. Submit that plain Git command without adding an rtk prefix. The safe.directory override is only for this synthetic repository and this command; do not persist it. Report the actual result and errors. Observe the already configured native hook. Do not edit files or settings, read credentials, use connectors, delegate, run other commands or access other projects.`],
  { cwd: root, env, timeoutMs: 120000, maxOutputBytes: 1024 * 1024 });
  const events = result.stdout.split(/\r?\n/).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const commands = events.filter(event => event.type === 'item.completed' && event.item?.type === 'command_execution').map(event => event.item);
  const observation = { code: result.code, commandCount: commands.length,
    rewritten: commands.length === 1 && /rtk(?:\.exe)?\s+git\s/i.test(commands[0].command),
    commandPassed: commands.length === 1 && commands[0].exit_code === 0,
    fixtureObserved: commands.length === 1 && commands[0].aggregated_output.includes('fixture.txt'),
    sourcePreserved: await readFile(join(root, 'fixture.txt'), 'utf8') === content };
  observation.passed = observation.code === 0 && Object.values(observation).every(value => value !== false);
  await mkdir(resolve('out'), { recursive: true });
  await writeFile(resolve('out/codex-rtk-hook.json'), JSON.stringify(observation, null, 2));
  console.log(JSON.stringify(observation));
  assert.ok(observation.passed, 'Native RTK hook observation failed; inspect the private summary');
} finally {
  await rm(root, { recursive: true, force: true });
}
