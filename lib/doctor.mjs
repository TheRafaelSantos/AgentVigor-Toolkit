import { lstat } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { installationStatus } from './install.mjs';
import { detectPlatform, detectTools } from './platform.mjs';
import { probeRtk } from './monitor.mjs';
import { readRegular } from '../skills/agentvigor-toolkit/scripts/process.mjs';

const MAX_CONFIG = 1024 * 1024;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function duplicateHooks(hooks) {
  if (hooks === undefined) return 0;
  if (!record(hooks)) throw new TypeError('Invalid hooks');
  let count = 0;
  for (const groups of Object.values(hooks)) {
    if (!Array.isArray(groups)) throw new TypeError('Invalid hook groups');
    const seen = new Set();
    for (const group of groups) {
      if (!record(group) || !Array.isArray(group.hooks)) throw new TypeError('Invalid hook group');
      for (const hook of group.hooks) {
        if (!record(hook)) throw new TypeError('Invalid hook');
        // Normalize only the outer key order. Config content never leaves this check.
        const identity = JSON.stringify([group.matcher ?? '', Object.entries(hook).sort(([a], [b]) => a.localeCompare(b))]);
        if (seen.has(identity)) count++;
        seen.add(identity);
      }
    }
  }
  return count;
}

async function inspectHooks(id, root, name) {
  try {
    if (!isAbsolute(root) || !(await lstat(root)).isDirectory()) return { id, state: 'unreadable' };
    const path = join(root, name);
    const bytes = await readRegular(path, MAX_CONFIG, 'CONFIG_UNREADABLE');
    if (bytes === null) return { id, state: 'missing' };
    const contents = bytes.toString('utf8');
    try {
      const settings = JSON.parse(contents.replace(/^\uFEFF/, ''));
      if (!record(settings)) return { id, state: 'invalid' };
      const duplicates = duplicateHooks(settings.hooks);
      return { id, state: duplicates ? 'duplicates' : 'ok', duplicates };
    } catch {
      return { id, state: 'invalid' };
    }
  } catch (error) {
    return { id, state: error.code === 'ENOENT' ? 'missing' : 'unreadable' };
  }
}

export async function doctor({ env = process.env, home, version }) {
  const { system, arch, release, shell } = detectPlatform({ env, home });
  const tools = await detectTools({ env });
  const [codexHooks, claudeHooks, installation, rtkVersion] = await Promise.all([
    inspectHooks('codexHooks', env.CODEX_HOME || join(home, '.codex'), 'hooks.json'),
    inspectHooks('claudeHooks', env.CLAUDE_CONFIG_DIR || join(home, '.claude'), 'settings.json'),
    installationStatus({ env, home, version }).catch(error => ({ status: 'unreadable', error: error.code ?? 'ERROR' })),
    tools.rtk?.available
      ? probeRtk(tools.rtk.path, { env }).then(result => result.version)
        .catch(() => null)
      : null,
  ]);
  return {
    platform: { system, arch, release, shell },
    node: process.versions.node,
    tools: Object.fromEntries(Object.entries(tools).map(([id, { available }]) => [id, available])),
    checks: [codexHooks, claudeHooks],
    rtkVersion,
    installation,
  };
}
