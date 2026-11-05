import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { manageFindSkills, findSkillsSource } from '../lib/find-skills-integration.mjs';
import { skillRoot } from '../lib/install.mjs';
import { integrations } from '../lib/integrations.mjs';

async function fixture(t, agent = 'codex') {
  const home = await fs.mkdtemp(resolve('.agentvigor-test-find-skills-'));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  let calls = 0;
  const run = async (_, args, { env, cwd }) => {
    calls++;
    assert.equal(env.DISABLE_TELEMETRY, '1');
    assert.equal(env.DO_NOT_TRACK, '1');
    assert.equal(env.USERPROFILE, env.HOME);
    assert.notEqual(env.HOME, home);
    assert.equal(env.FIND_SKILLS_TEST_SECRET, undefined);
    if (args.includes('--prefix')) {
      assert.ok(args.includes('--ignore-scripts') && args.includes('--no-audit'));
      const prefix = args[args.indexOf('--prefix') + 1];
      await fs.mkdir(join(prefix, 'node_modules/skills'), { recursive: true });
      await fs.writeFile(join(prefix, 'node_modules/skills/package.json'), JSON.stringify({
        name: 'skills', version: '1.7.6', bin: { skills: './bin/cli.mjs' },
      }));
      await fs.writeFile(join(prefix, 'package-lock.json'), JSON.stringify({
        packages: { 'node_modules/skills': { integrity: findSkillsSource.integrity } },
      }));
    } else {
      assert.ok(args.includes('--copy') && args.includes('--yes'));
      assert.equal(args[args.indexOf('--agent') + 1], agent === 'codex' ? 'codex' : 'claude-code');
      const path = join(skillRoot(agent, { home: cwd, env }), 'find-skills');
      await fs.mkdir(path, { recursive: true });
      await fs.copyFile(new URL('../lib/assets/find-skills/SKILL.md', import.meta.url), join(path, 'SKILL.md'));
    }
    return { code: 0, stdout: '', stderr: '' };
  };
  return { options: { home, agent, env: { ...process.env, CLAUDE_CONFIG_DIR: join(home, 'custom-claude'),
    FIND_SKILLS_TEST_SECRET: 'must-not-reach-installers' }, run }, calls: () => calls };
}

for (const agent of ['codex', 'claude']) {
  test(`Find Skills ${agent} previews offline, installs officially, preserves ownership and rolls back offline`, async t => {
    const { options, calls } = await fixture(t, agent);
    const plan = await manageFindSkills({ ...options, dryRun: true });
    assert.equal(calls(), 0);
    assert.equal(plan.networkRequired, true);
    assert.equal(plan.changes.length, 2);
    assert.deepEqual(await fs.readdir(options.home), []);
    await assert.rejects(manageFindSkills(options), { code: 'CONFIRMATION_REQUIRED' });
    assert.equal(calls(), 0);
    const result = await manageFindSkills({ ...options, expectedPlan: plan.planToken });
    assert.equal(result.status, 'installed');
    assert.equal(result.discovered.state, 'UNVERIFIED');
    assert.equal(calls(), 2);
    const root = skillRoot(agent, options);
    assert.match(await fs.readFile(join(root, 'find-skills/SKILL.md'), 'utf8'), /name: find-skills/);
    assert.match(await fs.readFile(join(root, 'find-skills/licenses/MIT.txt'), 'utf8'), /Vercel, Inc/);
    const inventory = (await integrations({ ...options, tool: 'find-skills' })).entries[0];
    assert.equal(inventory.configured.state, 'CONFIGURED');
    assert.equal(inventory.discovered.state, 'UNVERIFIED');
    const repeated = await manageFindSkills({ ...options, dryRun: true });
    assert.equal(repeated.networkRequired, false);
    assert.equal((await manageFindSkills({ ...options, expectedPlan: repeated.planToken })).status, 'unchanged');
    assert.equal(calls(), 2);
    const rollback = { ...options, env: { ...options.env, PATH: '', Path: '' }, mode: 'rollback' };
    const removal = await manageFindSkills({ ...rollback, dryRun: true });
    assert.equal(removal.networkRequired, false);
    await manageFindSkills({ ...rollback, expectedPlan: removal.planToken });
    await assert.rejects(fs.lstat(join(root, 'find-skills')), { code: 'ENOENT' });
    assert.equal(calls(), 2);
  });
}

test('Find Skills refuses existing skills, stale plans and modified managed content', async t => {
  const { options } = await fixture(t);
  const plan = await manageFindSkills({ ...options, dryRun: true });
  const root = join(skillRoot('codex', options), 'find-skills');
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(join(root, 'SKILL.md'), 'User skill');
  await assert.rejects(manageFindSkills({ ...options, expectedPlan: plan.planToken }), { code: 'UNMANAGED_SKILL' });
  assert.equal(await fs.readFile(join(root, 'SKILL.md'), 'utf8'), 'User skill');
  await fs.rm(root, { recursive: true });
  await manageFindSkills({ ...options, expectedPlan: plan.planToken });
  await fs.appendFile(join(root, 'SKILL.md'), '\nUser modification');
  await assert.rejects(manageFindSkills({ ...options, mode: 'rollback', dryRun: true }), { code: 'SKILL_DRIFT' });
});

test('failed or changed official output never registers Find Skills', async t => {
  const { options } = await fixture(t);
  const plan = await manageFindSkills({ ...options, dryRun: true });
  await assert.rejects(manageFindSkills({ ...options, expectedPlan: plan.planToken,
    run: async () => ({ code: 1, stdout: '', stderr: 'private error' }) }), { code: 'INTEGRATION_FAILED' });
  const root = join(skillRoot('codex', options), 'find-skills');
  await assert.rejects(fs.lstat(root), { code: 'ENOENT' });
  await assert.rejects(manageFindSkills({ ...options, expectedPlan: plan.planToken,
    run: async (exe, args, execution) => {
      const result = await options.run(exe, args, execution);
      if (args.includes('add')) await fs.appendFile(join(execution.cwd, '.agents/skills/find-skills/SKILL.md'), 'Unexpected');
      return result;
    } }), { code: 'INTEGRATION_FAILED' });
  await assert.rejects(fs.lstat(root), { code: 'ENOENT' });
});
