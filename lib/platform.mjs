import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { homedir, release as osRelease } from 'node:os';
import { posix, win32 } from 'node:path';

export function detectPlatform({
  env = process.env, platform = process.platform, arch = process.arch,
  release = osRelease(), home = homedir(),
} = {}) {
  const windows = platform === 'win32';
  const wsl = platform === 'linux' && Boolean(env.WSL_DISTRO_NAME || env.WSL_INTEROP || /microsoft|wsl/i.test(release));
  const system = windows ? 'windows' : platform === 'darwin' ? 'macos' : wsl ? 'wsl' : platform;
  const interpreter = env.SHELL || (windows ? env.ComSpec || env.COMSPEC : '');
  const shell = interpreter ? (windows ? win32 : posix).basename(interpreter) : 'unknown';
  const graphicalSession = windows
    ? /^(console|rdp-)/i.test(env.SESSIONNAME || '')
    : platform === 'darwin'
      ? !env.SSH_CONNECTION && !env.SSH_TTY
      : Boolean(env.WAYLAND_DISPLAY || env.DISPLAY);
  const gui = !env.CI && graphicalSession;
  return { system, platform, arch, release, shell, home, gui };
}

const toolNames = [
  'codex', 'claude', 'rtk', 'node', 'git', 'npm', 'pnpm', 'yarn', 'corepack',
  'brew', 'winget', 'choco', 'scoop', 'cargo', 'apt', 'dnf', 'pacman', 'zypper', 'xdg-open',
];

async function findTool(name, directories, windows) {
  const paths = windows ? win32 : posix;
  const extensions = !windows ? [''] : name === 'rtk' ? ['.exe'] : ['.exe', '.com', '.cmd', '.bat', '.ps1'];
  for (const directory of directories) {
    for (const extension of extensions) {
      const candidate = paths.join(directory, `${name}${extension}`);
      try {
        if (!(await stat(candidate)).isFile()) continue;
        if (!windows) await access(candidate, constants.X_OK);
        return { available: true, path: candidate };
      } catch {
        // Missing and inaccessible entries are both unavailable.
      }
    }
  }
  return { available: false };
}

export async function detectTools({ env = process.env, platform = process.platform } = {}) {
  const windows = platform === 'win32';
  const paths = windows ? win32 : posix;
  const value = windows ? Object.entries(env).find(([key]) => key.toUpperCase() === 'PATH')?.[1] : env.PATH;
  const directories = [...new Set((value || '').split(paths.delimiter).map((entry) => entry.trim().replace(/^"(.*)"$/, '$1')))]
    .filter((entry) => windows ? /^[a-z]:[\\/]/i.test(entry) : posix.isAbsolute(entry));
  const entries = await Promise.all(toolNames.map(async (name) => {
    const found = name === 'node' ? { available: true, path: process.execPath } : await findTool(name, directories, windows);
    return [name, found];
  }));
  return Object.fromEntries(entries);
}
