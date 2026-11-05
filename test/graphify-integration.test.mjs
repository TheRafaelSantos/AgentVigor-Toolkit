import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { configureGraphify } from '../lib/graphify-integration.mjs';

const refs = ['add-watch.md', 'exports.md', 'extraction-spec.md', 'github-and-merge.md',
  'hooks.md', 'query.md', 'transcribe.md', 'update.md'];
async function fixture(t, agent = 'codex') {
  const home = await fs.mkdtemp(resolve('.agentvigor-test-graphify-'));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  const root = join(home, '.' + agent);
  const executable = join(home, 'graphify.exe');
  await fs.writeFile(executable, 'fixture binary');
  await fs.mkdir(root);
  await fs.writeFile(join(root, agent === 'codex' ? 'AGENTS.md' : 'CLAUDE.md'), '# User rules\r\n');
  let initializers = 0;
  const run = async (_, args, { env, cwd }) => {
    assert.notEqual(env.HOME, home);
    assert.equal(env.OPENAI_API_KEY, undefined);
    assert.equal(env.ANTHROPIC_API_KEY, undefined);
    assert.equal(env.PYTHONPATH, undefined);
    if (args[0] === '--version') return { code: 0, stdout: 'graphify 0.9.102\n', stderr: '' };
    initializers++;
    assert.deepEqual(args, ['install', '--platform', agent]);
    assert.equal(cwd, env.HOME);
    const config = agent === 'codex' ? join(env.HOME, '.codex') : env.CLAUDE_CONFIG_DIR;
    const skill = join(config, 'skills', 'graphify');
    await fs.mkdir(join(skill, 'references'), { recursive: true });
    for (const name of ['SKILL.md', ...refs.map(ref => 'references/' + ref)]) {
      await fs.copyFile(new URL('../lib/assets/graphify/' + agent + '/' + name, import.meta.url), join(skill, name));
    }
    await fs.writeFile(join(skill, '.graphify_version'), '0.9.102');
    if (agent === 'claude') {
      let before = '';
      try { before = await fs.readFile(join(config, 'CLAUDE.md'), 'utf8'); } catch {}
      const newline = before.includes('\r\n') ? '\r\n' : '\n';
      const marker = before.indexOf('# graphify');
      if (marker >= 0) before = before.slice(0, marker);
      const block = '# graphify\n- **graphify** (`' + join(skill, 'SKILL.md') + '`) - any input to knowledge graph. Trigger: `/graphify`\n' +
        'When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.\n';
      await fs.writeFile(join(config, 'CLAUDE.md'), before.trimEnd() + newline + newline + block.replaceAll('\n', newline));
    }
    return { code: 0, stdout: '', stderr: '' };
  };
  return { home, env: { OPENAI_API_KEY: 'must-not-inherit', ANTHROPIC_API_KEY: 'must-not-inherit', PYTHONPATH: 'must-not-inherit' },
    agent, executable, run, root, initializers: () => initializers };
}

for (const agent of ['codex', 'claude']) {
  test('Graphify ' + agent + ' offline preview, scoped consent, complete assets, idempotency and rollback', async t => {
    const options = await fixture(t, agent);
    const preview = await configureGraphify({ ...options, dryRun: true });
    assert.equal(options.initializers(), 0);
    assert.equal(preview.initializerExecuted, false);
    assert.equal(preview.networkRequired, false);
    assert.equal(preview.changes.length, agent === 'claude' ? 14 : 13);
    assert.equal(Object.hasOwn(preview, 'files'), false);
    await assert.rejects(configureGraphify(options), { code: 'CONFIRMATION_REQUIRED' });
    assert.equal(options.initializers(), 0);
    const installed = await configureGraphify({ ...options, expectedPlan: preview.planToken });
    assert.equal(installed.status, 'configured');
    assert.equal(options.initializers(), 1);
    assert.equal(installed.discovered.state, 'UNVERIFIED');
    for (const license of ['LICENSE', 'LICENSE-MIT', 'NOTICE']) {
      assert.deepEqual(await fs.readFile(join(options.root, 'skills/graphify/licenses', license)),
        await fs.readFile(new URL('../lib/assets/graphify/' + license, import.meta.url)));
    }
    const repeat = await configureGraphify({ ...options, dryRun: true });
    assert.equal((await configureGraphify({ ...options, expectedPlan: repeat.planToken })).status, 'unchanged');
    assert.equal(options.initializers(), 1);
    const rollback = { ...options, executable: undefined, mode: 'rollback' };
    const removal = await configureGraphify({ ...rollback, dryRun: true });
    assert.equal((await configureGraphify({ ...rollback, expectedPlan: removal.planToken })).status, 'rolled-back');
    assert.equal(await fs.readFile(join(options.root, agent === 'codex' ? 'AGENTS.md' : 'CLAUDE.md'), 'utf8'), '# User rules\r\n');
    await assert.rejects(fs.stat(join(options.root, 'skills')), { code: 'ENOENT' });
  });
}

test('Graphify refuses unpinned or missing runtimes, unmanaged skills, duplicate destinations and registration', async t => {
  const options = await fixture(t);
  await assert.rejects(configureGraphify({ ...options, executable: undefined, dryRun: true }), { code: 'GRAPHIFY_MISSING' });
  await assert.rejects(configureGraphify({ ...options, dryRun: true,
    run: async () => ({ code: 0, stdout: 'graphify 0.9.10', stderr: '' }) }), { code: 'GRAPHIFY_UNRECOGNIZED' });
  const duplicate = join(options.home, '.agents', 'skills', 'graphify');
  await fs.mkdir(duplicate, { recursive: true });
  await assert.rejects(configureGraphify({ ...options, dryRun: true }), { code: 'DUPLICATE_SKILL' });
  await fs.rmdir(duplicate);
  await fs.mkdir(join(options.root, 'skills/graphify'), { recursive: true });
  await assert.rejects(configureGraphify({ ...options, dryRun: true }), { code: 'UNMANAGED_SKILL' });
  const claude = await fixture(t, 'claude');
  await fs.writeFile(join(claude.root, 'CLAUDE.md'), '# graphify\nUser content');
  await assert.rejects(configureGraphify({ ...claude, dryRun: true }), { code: 'UNMANAGED_REGISTRATION' });
});

test('Graphify preserves post-install edits and rejects stale preview or broken official output', async t => {
  const options = await fixture(t, 'claude');
  const preview = await configureGraphify({ ...options, dryRun: true });
  await fs.writeFile(join(options.root, 'CLAUDE.md'), '# Edited rules\n');
  await assert.rejects(configureGraphify({ ...options, expectedPlan: preview.planToken }), { code: 'PLAN_CHANGED' });
  const fresh = await configureGraphify({ ...options, dryRun: true });
  const broken = async (executable, args, settings) => args[0] === '--version'
    ? options.run(executable, args, settings) : { code: 0, stdout: '', stderr: '' };
  await assert.rejects(configureGraphify({ ...options, run: broken, expectedPlan: fresh.planToken }), { code: 'GRAPHIFY_UNRECOGNIZED' });
  await assert.rejects(fs.stat(join(options.root, 'skills/graphify')), { code: 'ENOENT' });
  await configureGraphify({ ...options, expectedPlan: fresh.planToken });
  await fs.writeFile(join(options.root, 'skills/graphify/references/query.md'), 'user edit');
  await assert.rejects(configureGraphify({ ...options, mode: 'rollback', dryRun: true }), { code: 'SKILL_DRIFT' });
  await assert.rejects(configureGraphify({ ...options, dryRun: true }), { code: 'SKILL_DRIFT' });
});

test('Graphify rejects executable byte changes between reviewed plan and apply', async t => {
  const options = await fixture(t);
  options.executable = join(options.home, 'graphify.exe');
  await fs.writeFile(options.executable, 'fixture-one');
  const plan = await configureGraphify({ ...options, dryRun: true });
  await fs.writeFile(options.executable, 'fixture-two');
  await assert.rejects(configureGraphify({ ...options, expectedPlan: plan.planToken }), { code: 'PLAN_CHANGED' });
});
