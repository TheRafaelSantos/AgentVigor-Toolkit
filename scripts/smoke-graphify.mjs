import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { configureGraphify } from '../lib/graphify-integration.mjs';

const executable = process.argv[2];
if (!executable || !isAbsolute(executable)) {
  console.error('Prerequisite: an absolute path to the official graphifyy 0.9.102 executable. No installation is performed.');
  process.exitCode = 1;
} else {
  const home = await mkdtemp(resolve('.agentvigor-test-graphify-official-'));
  try {
    for (const agent of ['codex', 'claude']) {
      // Exercise explicit custom-root mapping as well as the upstream native destination.
      const root = join(home, 'custom-' + agent);
      await mkdir(root);
      const instructions = join(root, agent === 'codex' ? 'AGENTS.md' : 'CLAUDE.md');
      await writeFile(instructions, '# Preserve these user rules\r\n');
      const options = { home, env: { ...process.env, CODEX_HOME: root, CLAUDE_CONFIG_DIR: root }, agent, executable };
      const plan = await configureGraphify({ ...options, dryRun: true });
      assert.equal(plan.initializerExecuted, false);
      assert.equal((await configureGraphify({ ...options, expectedPlan: plan.planToken })).status, 'configured');
      const repeat = await configureGraphify({ ...options, dryRun: true });
      assert.equal((await configureGraphify({ ...options, expectedPlan: repeat.planToken })).status, 'unchanged');
      const rollback = { ...options, mode: 'rollback', executable: undefined };
      const removal = await configureGraphify({ ...rollback, dryRun: true });
      assert.equal((await configureGraphify({ ...rollback, expectedPlan: removal.planToken })).status, 'rolled-back');
      assert.equal(await readFile(instructions, 'utf8'), '# Preserve these user rules\r\n');
      console.log(agent + ' official 0.9.102 configure, idempotency, custom-root mapping and rollback passed');
    }
  } finally { await rm(home, { recursive: true, force: true }); }
}
