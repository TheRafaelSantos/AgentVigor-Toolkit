import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { runFile, minimalEnv } from '../skills/agentvigor-toolkit/scripts/process.mjs';

import { prepareIntegration, applyIntegration, snapshot } from './integration-files.mjs';

const names = {
  codex: ['AGENTS.md', 'RTK.md', 'hooks.json'],
  claude: ['CLAUDE.md', 'RTK.md', 'settings.json'],
};
const fail = code => { throw Object.assign(new Error(code), { code }); };

async function binaryHash(executable) {
  const info = await fs.stat(executable);
  if (!info.isFile() || info.size > 256 * 1024 * 1024) fail('RTK_UNRECOGNIZED');
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(executable)) digest.update(chunk);
  return digest.digest('hex');
}

async function generated(root, before, agent, executable, env, run) {
  const scratch = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'agentvigor-rtk-')));
  const config = join(scratch, 'config');
  try {
    await fs.mkdir(config);
    const awareness = join(root, 'RTK.md');
    for (const [name, bytes] of Object.entries(before)) {
      if (bytes === null) continue;
      let content = Buffer.from(bytes, 'base64');
      if (name === 'AGENTS.md') content = Buffer.from(content.toString().replaceAll('@' + awareness, '@' + join(config, 'RTK.md')));
      await fs.writeFile(join(config, name), content, { mode: 0o600 });
    }
    const childEnv = { ...minimalEnv(env), HOME: scratch, USERPROFILE: scratch,
      APPDATA: scratch, LOCALAPPDATA: scratch, XDG_CONFIG_HOME: scratch,
      XDG_DATA_HOME: scratch, XDG_STATE_HOME: scratch, XDG_CACHE_HOME: scratch,
      CODEX_HOME: config, CLAUDE_CONFIG_DIR: config, RTK_DB_PATH: join(scratch, 'metrics.db') };
    const args = ['init', '-g', ...(agent === 'codex' ? ['--codex'] : ['--auto-patch', '--no-trust-filters'])];
    const result = await run(executable, args, { env: childEnv, cwd: scratch, timeoutMs: 15000, maxOutputBytes: 128 * 1024 });
    if (result.code !== 0) fail('RTK_FAILED');
    const after = await snapshot(config, names[agent]);
    if (!after['RTK.md']) fail('RTK_UNRECOGNIZED');
    if (agent === 'codex' && after['AGENTS.md']) {
      const text = Buffer.from(after['AGENTS.md'], 'base64').toString()
        .replaceAll('@' + join(config, 'RTK.md'), '@' + awareness);
      after['AGENTS.md'] = Buffer.from(text).toString('base64');
    }
    const hooksFile = agent === 'codex' ? 'hooks.json' : 'settings.json';
    let hooks;
    try { hooks = JSON.parse(Buffer.from(after[hooksFile], 'base64').toString()).hooks; }
    catch { fail('RTK_UNRECOGNIZED'); }
    const commands = Object.values(hooks ?? {}).flatMap(groups => Array.isArray(groups)
      ? groups.flatMap(group => (group.hooks ?? []).map(hook => hook.command).filter(command => typeof command === 'string' && /rtk(?:\.exe)?["']?\s+hook\b/i.test(command))) : []);
    if (!commands.length) fail('RTK_UNRECOGNIZED');
    if (new Set(commands).size !== commands.length) fail('DUPLICATE_HOOKS');
    return after;
  } finally { await fs.rm(scratch, { recursive: true, force: true }); }
}

export async function configureRtk({
  home = homedir(), env = process.env, agent = 'codex', mode = 'configure',
  executable, run = runFile, dryRun = false, expectedPlan,
} = {}) {
  if (!Object.hasOwn(names, agent)) fail('INVALID_AGENTS');
  if (!['configure', 'rollback'].includes(mode)) fail('INTEGRATION_MODE');
  if (!isAbsolute(home) || (mode === 'configure' && (!executable || !isAbsolute(executable)))) fail('RTK_MISSING');
  const configuredRoot = (agent === 'codex' ? env.CODEX_HOME : env.CLAUDE_CONFIG_DIR) || join(home, '.' + agent);
  if (!isAbsolute(configuredRoot)) fail('UNSAFE_PATH');
  const context = await prepareIntegration({ home, root: configuredRoot, tool: 'rtk', agent, mode, names: names[agent] });
  const executableHash = mode === 'configure' ? await binaryHash(executable) : null;
  let after = context.after;
  if (mode === 'configure') {
    const probe = await run(executable, ['--version'], { env: minimalEnv(env), timeoutMs: 3000, maxOutputBytes: 4096 });
    if (probe.code !== 0 || probe.stdout.trim() !== 'rtk 1.1.0') fail('RTK_UNRECOGNIZED');
    after = await generated(context.root, context.before, agent, executable, env, run);
    if (await binaryHash(executable) !== executableHash) fail('PLAN_CHANGED');
  }
  return applyIntegration(context, { after, dryRun, expectedPlan, fingerprint: executableHash });
}
