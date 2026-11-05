import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { manageRtkBinary } from '../lib/rtk-binary.mjs';
import { hash, token } from '../skills/agentvigor-toolkit/scripts/process.mjs';

async function fixture(t) {
  const home = await fs.mkdtemp(resolve('.agentvigor-test-binary-'));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  const options = { home, platform: 'win32', arch: 'x64', variant: 'oss' };
  const plan = await manageRtkBinary({ ...options, dryRun: true });
  return { options, plan, root: dirname(plan.executable) };
}

async function installed(fixture, status = 'installed') {
  const { root, plan } = fixture;
  await fs.mkdir(root, { recursive: true });
  const files = { 'rtk.exe': Buffer.from('MZfixture'), LICENSE: Buffer.from('Apache License fixture') };
  for (const [name, bytes] of Object.entries(files)) await fs.writeFile(join(root, name), bytes);
  const state = { schema: 1,
    identity: token(root, plan.asset, plan.sha256, '57622fe1d00db0cbd7473161ec264806402844cd0f5e9314195e0f8eb9f4b0b5', plan.license),
    status, files: Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, hash(bytes)])) };
  await fs.writeFile(join(root, 'state.json'), JSON.stringify(state));
}

test('RTK preview is offline, names the exact variant/license/checksum, and requires scoped consent', async t => {
  const { options, plan, root } = await fixture(t);
  assert.equal(plan.license, 'Apache-2.0');
  assert.match(plan.asset, /^rtk-oss-/);
  assert.ok(plan.executable.startsWith(options.home));
  await assert.rejects(fs.access(root), { code: 'ENOENT' });
  await assert.rejects(manageRtkBinary(options), { code: 'CONFIRMATION_REQUIRED' });
  await assert.rejects(manageRtkBinary({ ...options, variant: 'full', expectedPlan: plan.planToken }), { code: 'PLAN_CHANGED' });
  await assert.rejects(manageRtkBinary({ ...options, platform: 'linux', arch: 'arm64', dryRun: true }), { code: 'INCOMPATIBLE' });
  const full = await manageRtkBinary({ ...options, variant: 'full', dryRun: true });
  assert.match(full.license, /BUSL-1.1/);
  assert.match(full.licenseNotice, /paid or hosted/);
});

test('mocked modified checksums and failed downloads never install executable bytes', async t => {
  const { options, plan } = await fixture(t);
  const fetch = async () => new Response('untrusted checksum fixture');
  await assert.rejects(manageRtkBinary({ ...options, fetch, expectedPlan: plan.planToken }), { code: 'RTK_CHECKSUM' });
  await assert.rejects(fs.access(plan.executable), { code: 'ENOENT' });
  const failed = async () => new Response('not found', { status: 404 });
  await assert.rejects(manageRtkBinary({ ...options, fetch: failed, expectedPlan: plan.planToken }), { code: 'RTK_DOWNLOAD' });
});

test('existing unmanaged executables, stale plans and user edits are preserved', async t => {
  const f = await fixture(t);
  await fs.mkdir(f.root, { recursive: true });
  await fs.writeFile(f.plan.executable, 'user tool');
  await assert.rejects(manageRtkBinary({ ...f.options, dryRun: true }), { code: 'RTK_UNMANAGED' });
  assert.equal(await fs.readFile(f.plan.executable, 'utf8'), 'user tool');
  await installed(f);
  await assert.rejects(manageRtkBinary({ ...f.options, expectedPlan: f.plan.planToken }), { code: 'PLAN_CHANGED' });
  await fs.writeFile(f.plan.executable, 'user edit');
  await assert.rejects(manageRtkBinary({ ...f.options, mode: 'rollback', dryRun: true }), { code: 'SKILL_DRIFT' });
  await assert.rejects(manageRtkBinary({ ...f.options, mode: 'verify' }), { code: 'SKILL_DRIFT' });
  assert.equal(await fs.readFile(f.plan.executable, 'utf8'), 'user edit');
});

test('verify checks integrity/version; interrupted install rolls back offline without running a binary', async t => {
  const f = await fixture(t);
  await installed(f);
  let calls = 0;
  const run = async (path, args) => {
    assert.equal(path, f.plan.executable);
    assert.deepEqual(args, ['--version']);
    calls++;
    return { code: 0, stdout: 'rtk 1.1.0\n' };
  };
  assert.equal((await manageRtkBinary({ ...f.options, mode: 'verify', run })).status, 'verified');
  assert.equal(calls, 1);
  await installed(f, 'pending');
  await fs.unlink(join(f.root, 'LICENSE'));
  await fs.copyFile(f.plan.executable, join(f.root, '.stage-rtk.exe'));
  await assert.rejects(manageRtkBinary({ ...f.options, dryRun: true }), { code: 'RECOVERY_REQUIRED' });
  const options = { ...f.options, mode: 'rollback', fetch: () => assert.fail('rollback cannot download'),
    run: () => assert.fail('rollback cannot run') };
  const plan = await manageRtkBinary({ ...options, dryRun: true });
  assert.equal((await manageRtkBinary({ ...options, expectedPlan: plan.planToken })).status, 'rolled-back');
  assert.deepEqual(await fs.readdir(f.root), ['state.json']);
});

test('linked tool directories and executable files are refused', async t => {
  const f = await fixture(t);
  const elsewhere = join(f.options.home, 'elsewhere');
  await fs.mkdir(elsewhere);
  await fs.mkdir(dirname(f.root), { recursive: true });
  await fs.symlink(elsewhere, f.root, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(manageRtkBinary({ ...f.options, dryRun: true }), { code: 'UNSAFE_PATH' });
  assert.deepEqual(await fs.readdir(elsewhere), []);
});
