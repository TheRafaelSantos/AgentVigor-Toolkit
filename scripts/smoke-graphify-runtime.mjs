import assert from 'node:assert/strict';
import { mkdir, mkdtemp, realpath, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { manageGraphifyBinary, verifyGraphifyBinary } from '../lib/graphify-binary.mjs';
import { configureGraphify } from '../lib/graphify-integration.mjs';
import { minimalEnv, runFile } from '../skills/agentvigor-toolkit/scripts/process.mjs';

const uvExecutable = process.argv[2];
assert.ok(isAbsolute(uvExecutable || '') && process.argv.includes('--allow-network'),
  'Pass the absolute official uv executable and --allow-network. Requires existing Python >=3.10; no models or client accounts are used.');
const home = await mkdtemp(join(await realpath(tmpdir()), 'agentvigor-graphify-runtime-smoke-'));
const env = { ...process.env, HOME: home, USERPROFILE: home,
  CODEX_HOME: join(home, 'codex'), CLAUDE_CONFIG_DIR: join(home, 'claude') };
try {
  const options = { home, env, uvExecutable };
  const plan = await manageGraphifyBinary({ ...options, dryRun: true });
  assert.equal((await manageGraphifyBinary({ ...options, expectedPlan: plan.planToken })).status, 'installed');
  const verified = await verifyGraphifyBinary(options);
  assert.equal(verified.status, 'verified');
  for (const agent of ['codex', 'claude']) {
    const root = env[agent === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR'];
    await mkdir(root);
    const instructions = join(root, agent === 'codex' ? 'AGENTS.md' : 'CLAUDE.md');
    const original = '# Preserve user instructions\r\n';
    await writeFile(instructions, original);
    const selected = { home, env, agent, executable: verified.executable };
    const setup = await configureGraphify({ ...selected, dryRun: true });
    assert.equal((await configureGraphify({ ...selected, expectedPlan: setup.planToken })).status, 'configured');
    const repeated = await configureGraphify({ ...selected, dryRun: true });
    assert.equal((await configureGraphify({ ...selected, expectedPlan: repeated.planToken })).status, 'unchanged');
    const removal = { home, env, agent, mode: 'rollback' };
    const rollback = await configureGraphify({ ...removal, dryRun: true });
    assert.equal((await configureGraphify({ ...removal, expectedPlan: rollback.planToken })).status, 'rolled-back');
    assert.equal(await readFile(instructions, 'utf8'), original);
    console.log(`${agent}: official Graphify configuration, repeat and offline rollback passed`);
  }
  const project = join(home, 'synthetic-project');
  await mkdir(project);
  const source = 'def leaf(value):\n    return value + 1\n\ndef caller(value):\n    return leaf(value)\n';
  await writeFile(join(project, 'service.py'), source);
  const python = join(plan.destination, 'tools', 'graphifyy', process.platform === 'win32' ? 'Scripts' : 'bin',
    process.platform === 'win32' ? 'python.exe' : 'python');
  const extracted = await runFile(python, ['-c', `import json, sys
from pathlib import Path
from graphify.extract import extract
root = Path(sys.argv[1])
result = extract([root / 'service.py'], cache_root=root, root=root)
print(json.dumps({'nodes': result['nodes'], 'edges': result['edges']}))`, project],
  { cwd: project, env: { ...minimalEnv(env), PYTHONNOUSERSITE: '1', PYTHONDONTWRITEBYTECODE: '1',
    GRAPHIFY_NO_UPDATE_CHECK: '1', DO_NOT_TRACK: '1' }, timeoutMs: 30000, maxOutputBytes: 128 * 1024 });
  assert.equal(extracted.code, 0, extracted.stderr);
  const graph = JSON.parse(extracted.stdout.trim().split(/\r?\n/).at(-1));
  assert.ok(graph.nodes.some(node => /leaf/.test(JSON.stringify(node))));
  assert.ok(graph.nodes.some(node => /caller/.test(JSON.stringify(node))));
  assert.ok(graph.edges.length > 0);
  assert.equal(await readFile(join(project, 'service.py'), 'utf8'), source);
  assert.equal((await verifyGraphifyBinary(options)).status, 'verified');
  const removal = { home, env: { ...env, PATH: '', Path: '' }, mode: 'rollback' };
  const rollback = await manageGraphifyBinary({ ...removal, dryRun: true });
  assert.equal((await manageGraphifyBinary({ ...removal, expectedPlan: rollback.planToken })).status, 'rolled-back');
  console.log(JSON.stringify({ platform: process.platform, node: process.version,
    version: '0.9.102', runtimeAndBothConfigurations: true, structuralExtraction: true,
    sourcePreserved: true, offlineRollback: true, passed: true }));
} finally { await rm(home, { recursive: true, force: true }); }
