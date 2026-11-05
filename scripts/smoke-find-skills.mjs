import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { manageFindSkills } from '../lib/find-skills-integration.mjs';
import { integrations } from '../lib/integrations.mjs';

// Explicit opt-in: the official CLI downloads from npm and GitHub; no model calls.
assert.ok(process.argv.includes('--allow-network'), 'Run with --allow-network to consent to the disposable official installs.');
const home = await fs.realpath(await fs.mkdtemp(resolve('.agentvigor-test-find-skills-official-')));
try {
  const env = { ...process.env, CODEX_HOME: join(home, '.codex'), CLAUDE_CONFIG_DIR: join(home, '.claude') };
  for (const agent of ['codex', 'claude']) {
    const options = { home, env, agent };
    const plan = await manageFindSkills({ ...options, dryRun: true });
    assert.equal((await manageFindSkills({ ...options, expectedPlan: plan.planToken })).status, 'installed');
    const entry = (await integrations({ home, env, agent, tool: 'find-skills' })).entries[0];
    assert.equal(entry.installed.state, 'INSTALLED');
    assert.equal(entry.configured.state, 'CONFIGURED');
    assert.equal(entry.discovered.state, 'UNVERIFIED');
    const repeated = await manageFindSkills({ ...options, dryRun: true });
    assert.equal(repeated.networkRequired, false);
    assert.equal((await manageFindSkills({ ...options, expectedPlan: repeated.planToken })).status, 'unchanged');
    const rollback = { ...options, mode: 'rollback', env: { ...env, PATH: '', Path: '' } };
    const removal = await manageFindSkills({ ...rollback, dryRun: true });
    assert.equal((await manageFindSkills({ ...rollback, expectedPlan: removal.planToken })).status, 'rolled-back');
    assert.equal((await integrations({ home, env, agent, tool: 'find-skills' })).entries[0].installed.state, 'MISSING');
    console.log(`${agent}: official Find Skills install, pinned manifest, registration, idempotency and offline rollback passed`);
  }
} finally { await fs.rm(home, { recursive: true, force: true }); }
