import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { detectTools } from '../lib/platform.mjs';
import { configureRtk } from '../lib/rtk-integration.mjs';

const { rtk } = await detectTools();
assert.ok(rtk.available, 'Official RTK 1.1.0 must be on PATH');
const home = await mkdtemp(resolve('.agentvigor-test-rtk-official-'));
try {
  const env = { ...process.env, HOME: home, USERPROFILE: home,
    CODEX_HOME: join(home, '.codex'), CLAUDE_CONFIG_DIR: join(home, '.claude') };
  for (const agent of ['codex', 'claude']) {
    const root = join(home, '.' + agent);
    await mkdir(root);
    const instructions = join(root, agent === 'codex' ? 'AGENTS.md' : 'CLAUDE.md');
    await writeFile(instructions, '# Preserve these user rules\n');
    const options = { home, env, agent, executable: rtk.path };
    const plan = await configureRtk({ ...options, dryRun: true });
    assert.equal((await configureRtk({ ...options, expectedPlan: plan.planToken })).status, 'configured');
    const repeat = await configureRtk({ ...options, dryRun: true });
    assert.equal((await configureRtk({ ...options, expectedPlan: repeat.planToken })).status, 'unchanged');
    const rollback = { ...options, mode: 'rollback', executable: undefined };
    const removal = await configureRtk({ ...rollback, dryRun: true });
    assert.equal((await configureRtk({ ...rollback, expectedPlan: removal.planToken })).status, 'rolled-back');
    assert.equal(await readFile(instructions, 'utf8'), '# Preserve these user rules\n');
    console.log(agent + ' official RTK configuration, idempotency and rollback passed');
  }
} finally {
  await rm(home, { recursive: true, force: true });
}
