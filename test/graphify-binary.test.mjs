import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { manageGraphifyBinary, verifyGraphifyBinary } from '../lib/graphify-binary.mjs';

test('Graphify private runtime requires consent and detects drift before offline rollback', async t => {
  const home = await fs.mkdtemp(resolve('.agentvigor-test-graphify-runtime-'));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  let installs = 0;
  let executable;
  const run = async (_, args, { env }) => {
    if (args[0] === '--version') return { code: 0, stdout: 'graphify 0.9.102' };
    installs++;
    assert.deepEqual(args.slice(0, 3), ['tool', 'install', 'graphifyy==0.9.102']);
    assert.ok(args.includes('--no-build') && args.includes('--no-python-downloads'));
    const pkg = join(env.UV_TOOL_DIR, 'graphifyy', process.platform === 'win32' ? 'Lib' : 'lib/python3.12',
      'site-packages', 'graphifyy-0.9.102.dist-info');
    await fs.mkdir(pkg, { recursive: true });
    await fs.writeFile(join(pkg, 'METADATA'), 'Name: graphifyy\nVersion: 0.9.102\nProject-URL: Repository, https://github.com/Graphify-Labs/graphify\n');
    await fs.mkdir(env.UV_TOOL_BIN_DIR);
    await fs.writeFile(executable, 'audited fixture');
    return { code: 0 };
  };
  const options = { home, run, uvExecutable: process.execPath };
  const plan = await manageGraphifyBinary({ ...options, dryRun: true });
  executable = plan.executable;
  assert.equal(plan.networkRequired, true);
  assert.equal(installs, 0);
  await assert.rejects(manageGraphifyBinary(options), { code: 'CONFIRMATION_REQUIRED' });
  assert.deepEqual(await fs.readdir(home), []);
  assert.equal((await manageGraphifyBinary({ ...options, expectedPlan: plan.planToken })).status, 'installed');
  assert.equal((await verifyGraphifyBinary(options)).status, 'verified');
  const rollback = { home, mode: 'rollback', run: async () => { throw new Error('Rollback must be offline'); } };
  const removal = await manageGraphifyBinary({ ...rollback, dryRun: true });
  await fs.appendFile(executable, 'changed');
  await assert.rejects(manageGraphifyBinary({ ...rollback, expectedPlan: removal.planToken }), { code: 'BINARY_DRIFT' });
  await fs.writeFile(executable, 'audited fixture');
  assert.equal((await manageGraphifyBinary({ ...rollback, expectedPlan: removal.planToken })).status, 'rolled-back');
  await assert.rejects(fs.lstat(executable), { code: 'ENOENT' });
  assert.equal(installs, 1);
});
