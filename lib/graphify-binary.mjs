import * as fs from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import { hash, minimalEnv, readRegular, requirePlan, runFile } from '../skills/agentvigor-toolkit/scripts/process.mjs';
import { graphifySource } from './graphify-integration.mjs';

const fail = code => { throw Object.assign(new Error(code), { code }); };
const version = graphifySource.version;
const limit = 1024 * 1024 * 1024;

async function safeDirectory(path, create = false) {
  let cursor = parse(path).root;
  for (const part of relative(cursor, path).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    let info;
    try { info = await fs.lstat(cursor); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!create) return false;
      await fs.mkdir(cursor, { mode: 0o700 }).catch(error => { if (error.code !== 'EEXIST') throw error; });
      info = await fs.lstat(cursor);
    }
    if (!info.isDirectory() || info.isSymbolicLink()) fail('UNSAFE_PATH');
  }
  return true;
}

async function inventory(root) {
  if (!await safeDirectory(root)) return null;
  const entries = [];
  let size = 0;
  async function walk(directory, prefix = '') {
    for (const name of (await fs.readdir(directory)).sort()) {
      if (name.includes('/') || name.includes('\\') || name === '.' || name === '..') fail('UNSAFE_PATH');
      const path = join(directory, name), key = prefix + name, info = await fs.lstat(path);
      if (++entries.length > 30000) fail('BINARY_LIMIT');
      if (info.isSymbolicLink()) entries[entries.length - 1] = [key, 'link', await fs.readlink(path)];
      else if (info.isDirectory()) {
        entries[entries.length - 1] = [key, 'directory'];
        await walk(path, key + '/');
      } else if (info.isFile()) {
        size += info.size;
        if (size > limit || info.size > 256 * 1024 * 1024) fail('BINARY_LIMIT');
        const bytes = await readRegular(path, info.size, 'UNSAFE_PATH');
        if (!bytes) fail('PLAN_CHANGED');
        entries[entries.length - 1] = [key, 'file', hash(bytes), info.mode & 0o777];
      } else fail('UNSAFE_PATH');
    }
  }
  await walk(root);
  return hash(JSON.stringify(entries));
}

async function stateAt(file, root) {
  const bytes = await readRegular(file, 16 * 1024, 'INVALID_STATE');
  if (!bytes) return null;
  let state;
  try { state = JSON.parse(bytes); } catch { fail('INVALID_STATE'); }
  if (state.schema !== 1 || state.root !== hash(root) || state.version !== version ||
      !['pending', 'installed', 'failed', 'rolled-back'].includes(state.status) ||
      !(state.digest === null || /^[a-f0-9]{64}$/.test(state.digest))) fail('INVALID_STATE');
  return state;
}

async function saveState(file, state) {
  const temporary = file + '.tmp';
  const handle = await fs.open(temporary, 'wx', 0o600);
  try { await handle.writeFile(JSON.stringify(state)); await handle.sync(); }
  finally { await handle.close(); }
  await fs.rename(temporary, file);
}

function paths(home) {
  if (!isAbsolute(home) || resolve(home) === parse(resolve(home)).root) fail('UNSAFE_PATH');
  const root = join(resolve(home), '.agentvigor', 'tools', 'graphify-' + version);
  const stateRoot = join(resolve(home), '.agentvigor', 'integrations', 'graphify-binary');
  return { root, stateRoot, stateFile: join(stateRoot, 'state.json'),
    executable: join(root, 'bin', process.platform === 'win32' ? 'graphify.exe' : 'graphify') };
}

async function checkRuntime(root, executable, env, run) {
  const packageRoot = join(root, 'tools', 'graphifyy');
  const candidates = process.platform === 'win32'
    ? [join(packageRoot, 'Lib', 'site-packages')]
    : (await fs.readdir(join(packageRoot, 'lib'))).filter(name => /^python3\.\d+$/.test(name))
      .map(name => join(packageRoot, 'lib', name, 'site-packages'));
  if (candidates.length !== 1) fail('GRAPHIFY_UNRECOGNIZED');
  const metadata = await readRegular(join(candidates[0], 'graphifyy-' + version + '.dist-info', 'METADATA'),
    512 * 1024, 'GRAPHIFY_UNRECOGNIZED');
  if (!metadata || !/^Name: graphifyy\r?$/m.test(metadata.toString()) ||
      !/^Version: 0\.9\.102\r?$/m.test(metadata.toString()) ||
      !/^Project-URL: Repository, https:\/\/github\.com\/Graphify-Labs\/graphify\r?$/m.test(metadata.toString())) fail('GRAPHIFY_UNRECOGNIZED');
  const scratch = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'agentvigor-graphify-probe-')));
  try {
    const probe = await run(executable, ['--version'], { cwd: scratch,
      env: { ...minimalEnv(env), HOME: scratch, USERPROFILE: scratch, APPDATA: scratch, LOCALAPPDATA: scratch,
        CODEX_HOME: join(scratch, '.codex'), CLAUDE_CONFIG_DIR: join(scratch, '.claude'), PYTHONNOUSERSITE: '1' },
      timeoutMs: 10000, maxOutputBytes: 4096 });
    if (probe.code !== 0 || !/^(?:graphify\s+)?0\.9\.102$/i.test(probe.stdout.trim())) fail('GRAPHIFY_UNRECOGNIZED');
  } finally { await fs.rm(scratch, { recursive: true, force: true }); }
}

/** Installs the pinned base package into a private stable prefix; never edits PATH. */
export async function manageGraphifyBinary({ home = homedir(), env = process.env, mode = 'install',
  uvExecutable, dryRun = false, expectedPlan, run = runFile } = {}) {
  if (!['install', 'rollback'].includes(mode)) fail('INTEGRATION_MODE');
  const { root, stateRoot, stateFile, executable } = paths(home);
  if (!await safeDirectory(resolve(home))) fail('UNSAFE_PATH');
  await safeDirectory(stateRoot);
  const state = await stateAt(stateFile, root), before = await inventory(root);
  if (mode === 'install' && ['pending', 'failed'].includes(state?.status)) fail('RECOVERY_REQUIRED');
  if (mode === 'install' && before !== null && state?.status !== 'installed') fail('UNMANAGED_BINARY');
  if (state?.status === 'installed' && before !== state.digest) fail('BINARY_DRIFT');
  if (mode === 'rollback') {
    if (!state || state.status === 'rolled-back') fail('NO_ROLLBACK');
    if (state.digest === null && before !== null) fail('RECOVERY_REQUIRED');
    if (before !== state.digest) fail('BINARY_DRIFT');
  }
  let uvHash = null;
  if (mode === 'install' && before === null) {
    if (!uvExecutable || !isAbsolute(uvExecutable)) fail('UV_MISSING');
    const bytes = await readRegular(uvExecutable, 256 * 1024 * 1024, 'UV_UNRECOGNIZED');
    if (!bytes) fail('UV_MISSING');
    uvHash = hash(bytes);
  }
  const planToken = hash(JSON.stringify({ root, mode, state, before, uvHash }));
  const details = { tool: 'graphify-binary', source: graphifySource, destination: root, executable,
    planToken, networkRequired: mode === 'install' && before === null,
    networkHosts: mode === 'install' && before === null ? ['pypi.org', 'files.pythonhosted.org'] : [],
    changes: mode === 'install' && before !== null ? [] : [{ path: root, action: mode === 'install' ? 'add' : 'remove' }],
    providerChanges: false, pathChanges: false, extras: [] };
  if (dryRun) return { ...details, status: 'planned' };
  requirePlan(expectedPlan, planToken);
  await safeDirectory(stateRoot, true);
  const lock = join(stateRoot, 'write.lock');
  try { await fs.mkdir(lock, { mode: 0o700 }); }
  catch (error) { if (error.code === 'EEXIST') fail('LOCKED'); throw error; }
  try {
    if (JSON.stringify(await stateAt(stateFile, root)) !== JSON.stringify(state) || await inventory(root) !== before) fail('PLAN_CHANGED');
    if (mode === 'rollback') {
      // Only this fixed, ownership-checked private prefix can be removed.
      if (resolve(root) !== join(resolve(home), '.agentvigor', 'tools', 'graphify-' + version)) fail('UNSAFE_PATH');
      if (before !== null) await fs.rm(root, { recursive: true });
      await saveState(stateFile, { ...state, status: 'rolled-back', digest: null });
      return { ...details, status: 'rolled-back' };
    }
    if (before !== null) return { ...details, status: 'unchanged' };
    const record = { schema: 1, root: hash(root), version, status: 'pending', digest: null };
    if (hash(await readRegular(uvExecutable, 256 * 1024 * 1024, 'UV_UNRECOGNIZED')) !== uvHash) fail('PLAN_CHANGED');
    await saveState(stateFile, record);
    await safeDirectory(dirname(root), true);
    await fs.mkdir(root, { mode: 0o700 });
    const scratch = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'agentvigor-graphify-download-')));
    try {
      const installed = await run(uvExecutable, ['tool', 'install', 'graphifyy==' + version, '--no-config',
        '--index-url', 'https://pypi.org/simple', '--no-build', '--no-python-downloads', '--no-progress'],
      { cwd: scratch, env: { ...minimalEnv(env), UV_TOOL_DIR: join(root, 'tools'), UV_TOOL_BIN_DIR: join(root, 'bin'),
        UV_CACHE_DIR: join(scratch, 'cache'), UV_NO_CONFIG: '1', UV_KEYRING_PROVIDER: 'disabled',
        UV_PYTHON_DOWNLOADS: 'never', UV_PYTHON_INSTALL_DIR: env.UV_PYTHON_INSTALL_DIR || join(home, '.local', 'share', 'uv', 'python') },
      timeoutMs: 180000, maxOutputBytes: 128 * 1024 });
      if (installed.code !== 0) fail('GRAPHIFY_INSTALL_FAILED');
      await checkRuntime(root, executable, env, run);
      record.digest = await inventory(root);
      record.status = 'installed';
      await saveState(stateFile, record);
      return { ...details, status: 'installed' };
    } catch (error) {
      record.status = 'failed';
      record.digest = await inventory(root);
      await saveState(stateFile, record);
      throw error;
    } finally { await fs.rm(scratch, { recursive: true, force: true }); }
  } finally { await fs.rmdir(lock); }
}

export async function verifyGraphifyBinary({ home = homedir(), env = process.env, run = runFile } = {}) {
  const { root, stateRoot, stateFile, executable } = paths(home);
  await safeDirectory(stateRoot);
  const state = await stateAt(stateFile, root);
  if (!state || state.status !== 'installed') fail('GRAPHIFY_MISSING');
  if (await inventory(root) !== state.digest) fail('BINARY_DRIFT');
  await checkRuntime(root, executable, env, run);
  // A runtime that unexpectedly mutates its package is not treated as verified.
  if (await inventory(root) !== state.digest) fail('BINARY_DRIFT');
  const resolved = await fs.realpath(executable);
  const location = relative(root, resolved);
  if (!location || isAbsolute(location) || location === '..' || location.startsWith('..' + sep)) fail('UNSAFE_PATH');
  return { status: 'verified', executable: resolved, version, scope: 'Managed package integrity and --version only; native-client invocation remains unverified.' };
}
