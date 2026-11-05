import * as fs from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { skillRoot } from './install.mjs';
import { applyIntegration, prepareIntegration } from './integration-files.mjs';
import { npmEntry } from '../skills/agentvigor-toolkit/scripts/quality.mjs';
import { hash, minimalEnv, readRegular, runFile } from '../skills/agentvigor-toolkit/scripts/process.mjs';

export const findSkillsSource = Object.freeze({
  version: '1.7.6',
  license: 'MIT',
  source: 'https://github.com/vercel-labs/skills/tree/v1.7.6/skills/find-skills',
  manifestSha256: 'c00eeea0e13e74fe4a9d84ba0a8542205a1b736d65f13134fe1a6647eb14976f',
  licenseSha256: '661142e53c313d2bb5e1b055f5c0a39001450ff1b5e27b89dc4bc7de9a6352ca',
  integrity: 'sha512-dAee29yRGin7ub6VHwmifLEfHrysGD41yq4RkY0gg7QQh0wyQKWfhiORGb/r6uNpKWc9A1GY8yowV07Lh+4rCg==',
});
const names = ['find-skills/SKILL.md', 'find-skills/licenses/MIT.txt'];
const fail = code => { throw Object.assign(new Error(code), { code }); };

async function officialInstall(env, agent, run) {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major === 22 && minor < 20) fail('INTEGRATION_RUNTIME');
  const npm = await npmEntry(env);
  if (!npm) fail('NPM_UNAVAILABLE');
  const scratch = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'agentvigor-find-skills-')));
  try {
    const childEnv = { ...minimalEnv(env), HOME: scratch, USERPROFILE: scratch,
      APPDATA: scratch, LOCALAPPDATA: scratch, XDG_CONFIG_HOME: scratch,
      XDG_DATA_HOME: scratch, XDG_CACHE_HOME: scratch, XDG_STATE_HOME: scratch,
      CODEX_HOME: join(scratch, '.codex'), CLAUDE_CONFIG_DIR: join(scratch, '.claude'),
      DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1', GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: join(scratch, 'gitconfig'), GIT_TEMPLATE_DIR: join(scratch, 'git-template'),
      NPM_CONFIG_USERCONFIG: join(scratch, 'npmrc'), NPM_CONFIG_GLOBALCONFIG: join(scratch, 'global-npmrc'),
      NPM_CONFIG_CACHE: join(scratch, 'npm-cache'), CI: '1' };
    await fs.mkdir(childEnv.GIT_TEMPLATE_DIR);
    for (const file of [childEnv.GIT_CONFIG_GLOBAL, childEnv.NPM_CONFIG_USERCONFIG, childEnv.NPM_CONFIG_GLOBALCONFIG]) {
      await fs.writeFile(file, '', { mode: 0o600 });
    }
    const prefix = join(scratch, 'tool');
    const installed = await run(process.execPath, [npm.file, 'install', '--prefix', prefix, '--ignore-scripts',
      '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org', 'skills@' + findSkillsSource.version],
    { cwd: scratch, env: childEnv, timeoutMs: 120000, maxOutputBytes: 128 * 1024 });
    if (installed.code !== 0) fail('INTEGRATION_FAILED');
    const lockBytes = await readRegular(join(prefix, 'package-lock.json'), 1024 * 1024, 'INTEGRATION_FAILED');
    const metadata = await readRegular(join(prefix, 'node_modules/skills/package.json'), 128 * 1024, 'INTEGRATION_FAILED');
    let lock, pkg;
    try { lock = JSON.parse(lockBytes); pkg = JSON.parse(metadata); } catch { fail('INTEGRATION_FAILED'); }
    if (pkg?.name !== 'skills' || pkg.version !== findSkillsSource.version ||
        pkg.bin?.skills !== './bin/cli.mjs' || lock?.packages?.['node_modules/skills']?.integrity !== findSkillsSource.integrity) {
      fail('INTEGRATION_FAILED');
    }
    const result = await run(process.execPath, [join(prefix, 'node_modules/skills/bin/cli.mjs'), 'add',
      findSkillsSource.source, '--skill', 'find-skills', '--agent', agent === 'codex' ? 'codex' : 'claude-code',
      '--global', '--copy', '--yes'], { cwd: scratch, env: childEnv, timeoutMs: 120000, maxOutputBytes: 128 * 1024 });
    if (result.code !== 0) fail('INTEGRATION_FAILED');
    const manifest = await readRegular(join(skillRoot(agent, { home: scratch, env: childEnv }), 'find-skills/SKILL.md'),
      128 * 1024, 'INTEGRATION_FAILED');
    if (!manifest || hash(manifest) !== findSkillsSource.manifestSha256) fail('INTEGRATION_FAILED');
  } finally { await fs.rm(scratch, { recursive: true, force: true }); }
}

export async function manageFindSkills({ home = homedir(), env = process.env, agent = 'codex', mode = 'install',
  dryRun = false, expectedPlan, run = runFile } = {}) {
  if (!['codex', 'claude'].includes(agent)) fail('INVALID_AGENTS');
  if (!['install', 'rollback'].includes(mode)) fail('INTEGRATION_MODE');
  const context = await prepareIntegration({ home, root: skillRoot(agent, { home, env }),
    tool: 'find-skills', agent, mode, names });
  let after = context.after;
  if (mode === 'install') {
    if (context.state?.status !== 'installed') {
      try { await fs.lstat(join(context.root, 'find-skills')); fail('UNMANAGED_SKILL'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    const manifest = await fs.readFile(new URL('./assets/find-skills/SKILL.md', import.meta.url));
    const license = await fs.readFile(new URL('./assets/find-skills/LICENSE', import.meta.url));
    if (hash(manifest) !== findSkillsSource.manifestSha256 || hash(license) !== findSkillsSource.licenseSha256) {
      fail('BUNDLE_ERROR');
    }
    after = { [names[0]]: manifest.toString('base64'), [names[1]]: license.toString('base64') };
  }
  const result = await applyIntegration(context, { after, dryRun, expectedPlan, fingerprint: findSkillsSource,
    beforeWrite: mode === 'install' ? () => officialInstall(env, agent, run) : undefined });
  return { ...result, source: findSkillsSource, destination: context.root,
    networkRequired: mode === 'install' && result.changes.length > 0,
    networkHosts: mode === 'install' ? ['registry.npmjs.org', 'github.com'] : [],
    discovered: { state: 'UNVERIFIED', reason: 'Requires a fresh native-client session.' },
    verified: { state: 'UNVERIFIED', reason: 'Requires an observed scoped invocation.' } };
}
