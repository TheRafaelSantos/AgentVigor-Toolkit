import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { manageRtkBinary } from '../lib/rtk-binary.mjs';

// Every write stays in this disposable home. Existing RTK/PATH/client configuration is untouched.
const home = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'agentvigor-binary-smoke-')));
try {
  for (const variant of ['oss', 'full']) {
    const options = { home, variant };
    const plan = await manageRtkBinary({ ...options, dryRun: true });
    assert.equal((await manageRtkBinary({ ...options, expectedPlan: plan.planToken })).status, 'installed');
    assert.equal((await manageRtkBinary({ ...options, mode: 'verify' })).status, 'verified');
    const offline = { ...options, mode: 'rollback', fetch: () => { throw new Error('Unexpected download'); } };
    const rollback = await manageRtkBinary({ ...offline, dryRun: true });
    assert.equal((await manageRtkBinary({ ...offline, expectedPlan: rollback.planToken })).status, 'rolled-back');
    await assert.rejects(fs.access(plan.executable), { code: 'ENOENT' });
    console.log(JSON.stringify({ variant, asset: plan.asset, sha256: plan.sha256, license: plan.license, status: 'passed' }));
  }
} finally { await fs.rm(home, { recursive: true, force: true }); }
