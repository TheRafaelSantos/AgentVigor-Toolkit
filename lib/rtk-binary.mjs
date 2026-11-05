import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { failure, hash, token, requirePlan, readRegular, minimalEnv, runFile } from '../skills/agentvigor-toolkit/scripts/process.mjs';

const release = 'https://github.com/rtk-ai/rtk/releases/download/v1.1.0/';
const checksumHash = '57622fe1d00db0cbd7473161ec264806402844cd0f5e9314195e0f8eb9f4b0b5';
const pins = {
  'win32-x64': ['x86_64-pc-windows-msvc.zip', 'c9a8f7a8bad471e64a343314168f38d2399a06fa327cdf5772fb0e645d99ea6f', '9b076379be9d86011ca3f3a0264d0be4851da5535453a47f67fa46b4e893fbb2'],
  'linux-x64': ['x86_64-unknown-linux-musl.tar.gz', '9454ad1b9489daa57ab0a9f4ebe2faaf4dc82b8a0f26c9e5135151abd7c9378d', '4dec94a64035e08189ae82fd5408fe4ae9ae27a665fc07e3e3ec3c4c2d8e8a3e'],
  'darwin-x64': ['x86_64-apple-darwin.tar.gz', '1e23e8b9542b58428e6409c49b1c3fb92c4c0d5125da72e80f002a46086a6c20', '559156238dd3e148c84c88c3a62a7594b874f68793208994e1b02e77a9d9abf9'],
  'darwin-arm64': ['aarch64-apple-darwin.tar.gz', '8da773b0954cf90b115ec95c4e4eb420f04c39de233c5db102246a6caf073ba7', '1623590dd8d65374f61589c599c764c08ba9ce993ebe6b601312a89a3c874558'],
};
const maxBinary = 128 * 1024 * 1024;
const fail = code => { throw failure(code); };

async function directory(path, create = false) {
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

async function read(path, limit = maxBinary) {
  if (!await directory(dirname(path))) return null;
  return readRegular(path, limit, 'UNSAFE_PATH');
}

async function download(url, limit, fetcher) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(60000), redirect: 'follow' });
  if (!response.ok || !response.body) fail('RTK_DOWNLOAD');
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > limit) fail('RTK_DOWNLOAD');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function stateAt(path, identity, names) {
  const bytes = await read(path, 16384);
  if (!bytes) return { bytes: null, state: null };
  let state;
  try { state = JSON.parse(bytes); } catch { fail('INVALID_STATE'); }
  if (state.schema !== 1 || state.identity !== identity || !['pending', 'installed', 'rolled-back'].includes(state.status)
    || !state.files || Object.keys(state.files).sort().join() !== [...names].sort().join()
    || Object.values(state.files).some(value => !/^[a-f0-9]{64}$/.test(value))) fail('INVALID_STATE');
  return { bytes: bytes.toString('utf8'), state };
}

async function contents(root, names) {
  return Object.fromEntries(await Promise.all(names.map(async name => {
    const bytes = await read(join(root, name));
    return [name, bytes === null ? null : hash(bytes)];
  })));
}

async function journal(path, record) {
  const stage = path + '.' + randomUUID() + '.tmp';
  try {
    const file = await fs.open(stage, 'wx', 0o600);
    try { await file.writeFile(JSON.stringify(record)); await file.sync(); }
    finally { await file.close(); }
    await fs.rename(stage, path);
  } finally { await fs.unlink(stage).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}

// Only reviewed archive members are read to stdout: no archive path is extracted to disk.
async function extract(archive, name) {
  const tar = process.platform === 'win32'
    ? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : '/usr/bin/tar';
  const { stdout } = await promisify(execFile)(tar, ['-xOf', archive, name], {
    encoding: 'buffer', maxBuffer: maxBinary, timeout: 30000, windowsHide: true, env: minimalEnv(process.env),
  });
  return stdout;
}

/** Optional isolated official RTK installation. Never changes PATH or an existing external executable. */
export async function manageRtkBinary({
  home = homedir(), platform = process.platform, arch = process.arch, variant = 'oss',
  mode = 'install', dryRun = false, expectedPlan, fetch: fetcher = globalThis.fetch, run = runFile,
} = {}) {
  if (!['install', 'verify', 'rollback'].includes(mode)) fail('INTEGRATION_MODE');
  if (!['full', 'oss'].includes(variant) || !Object.hasOwn(pins, platform + '-' + arch)) fail('INCOMPATIBLE');
  if (!isAbsolute(home) || !await directory(resolve(home))) fail('UNSAFE_PATH');
  const pin = pins[platform + '-' + arch];
  const asset = 'rtk-' + (variant === 'oss' ? 'oss-' : '') + pin[0];
  const sha256 = pin[variant === 'oss' ? 2 : 1];
  const license = variant === 'oss' ? 'Apache-2.0' : 'Apache-2.0 AND BUSL-1.1';
  const root = join(resolve(home), '.agentvigor', 'tools', 'rtk', platform + '-' + arch, '1.1.0-' + variant);
  const executable = join(root, platform === 'win32' ? 'rtk.exe' : 'rtk');
  const names = [platform === 'win32' ? 'rtk.exe' : 'rtk', 'LICENSE', ...(variant === 'full' ? ['LICENSE-ENGINE'] : [])];
  const stages = names.map(name => '.stage-' + name);
  const managedNames = [...names, ...stages];
  const identity = token(root, asset, sha256, checksumHash, license);
  const stateFile = join(root, 'state.json');
  const stored = await stateAt(stateFile, identity, names);
  const before = await contents(root, managedNames);
  if (await directory(root)) {
    const allowed = new Set([...managedNames, 'state.json', 'write.lock']);
    if ((await fs.readdir(root)).some(name => !allowed.has(name))) fail('SKILL_DRIFT');
  }
  if (stored.state) {
    for (const name of names) {
      const expected = stored.state.status === 'rolled-back' ? null : stored.state.files[name];
      if (before[name] !== expected && !(stored.state.status === 'pending' && before[name] === null)) fail('SKILL_DRIFT');
      const stage = before['.stage-' + name];
      if (stage !== null && !(stored.state.status === 'pending' && stage === stored.state.files[name])) fail('SKILL_DRIFT');
    }
  } else if (Object.values(before).some(Boolean)) fail('RTK_UNMANAGED');
  if (mode === 'rollback' && (!stored.state || stored.state.status === 'rolled-back')) fail('NO_ROLLBACK');
  if (mode !== 'rollback' && stored.state?.status === 'pending') fail('RECOVERY_REQUIRED');
  if (mode === 'verify' && stored.state?.status !== 'installed') fail('RTK_MISSING');
  const planToken = token(identity, mode, stored.bytes, before);
  const result = { tool: 'rtk', version: '1.1.0', variant, platform, arch, executable, asset,
    networkRequired: mode === 'install' && stored.state?.status !== 'installed',
    networkHosts: ['github.com', 'release-assets.githubusercontent.com'],
    url: release + asset, sha256, checksumUrl: release + 'checksums.txt', license,
    licenseNotice: variant === 'oss' ? 'Apache-2.0 edition: hook rewrite and filters without the BUSL compression engine.'
      : 'Includes BUSL-1.1 engine. Production use is granted; offering it as a paid or hosted service is excluded by the grant. Review engine/LICENSE.',
    licenseSources: ['https://github.com/rtk-ai/rtk/blob/v1.1.0/LICENSE',
      ...(variant === 'full' ? ['https://github.com/rtk-ai/rtk/blob/v1.1.0/engine/LICENSE'] : [])],
    changes: names.filter(name => mode === 'rollback' ? before[name] !== null : before[name] === null)
      .map(path => ({ path: join(root, path), action: mode === 'rollback' ? 'remove' : 'add' })), planToken };
  if (dryRun) return { ...result, status: 'planned' };
  if (mode !== 'verify') requirePlan(expectedPlan, planToken);
  if (mode === 'verify') {
    const probe = await run(executable, ['--version'], { env: minimalEnv(process.env), timeoutMs: 3000, maxOutputBytes: 4096 });
    if (probe.code !== 0 || probe.stdout.trim() !== 'rtk 1.1.0') fail('RTK_UNRECOGNIZED');
    if (JSON.stringify(await contents(root, managedNames)) !== JSON.stringify(before)) fail('PLAN_CHANGED');
    return { ...result, status: 'verified' };
  }
  await directory(root, true);
  const lock = join(root, 'write.lock');
  try { await fs.mkdir(lock, { mode: 0o700 }); }
  catch (error) { if (error.code === 'EEXIST') fail('LOCKED'); throw error; }
  let scratch;
  try {
    const current = await stateAt(stateFile, identity, names);
    if (current.bytes !== stored.bytes || JSON.stringify(await contents(root, managedNames)) !== JSON.stringify(before)) fail('PLAN_CHANGED');
    if (mode === 'rollback') {
      const record = { ...stored.state, status: 'pending' };
      await journal(stateFile, record);
      for (const name of managedNames) {
        const bytes = await read(join(root, name));
        if (bytes !== null) {
          if (hash(bytes) !== record.files[name.replace(/^\.stage-/, '')]) fail('SKILL_DRIFT');
          await fs.unlink(join(root, name));
        }
      }
      await journal(stateFile, { ...record, status: 'rolled-back' });
      return { ...result, status: 'rolled-back' };
    }
    if (stored.state?.status === 'installed') return { ...result, status: 'unchanged' };
    const checksums = await download(release + 'checksums.txt', 16384, fetcher);
    if (hash(checksums) !== checksumHash || !checksums.toString().split(/\r?\n/).includes(sha256 + '  ' + asset)) fail('RTK_CHECKSUM');
    const archive = await download(release + asset, 32 * 1024 * 1024, fetcher);
    if (hash(archive) !== sha256) fail('RTK_CHECKSUM');
    scratch = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'agentvigor-rtk-binary-')));
    const archiveFile = join(scratch, asset);
    await fs.writeFile(archiveFile, archive, { mode: 0o600 });
    const files = {};
    for (const name of names) files[name] = await extract(archiveFile, name);
    const binary = files[names[0]];
    if (!binary.length || (platform === 'win32' ? binary.subarray(0, 2).toString() !== 'MZ'
      : platform === 'linux' ? binary.subarray(0, 4).toString('hex') !== '7f454c46'
        : !['cffaedfe', 'feedfacf', 'cafebabe'].includes(binary.subarray(0, 4).toString('hex')))) fail('RTK_UNRECOGNIZED');
    if (!files.LICENSE.toString().includes('Apache License') || (variant === 'full'
      && !files['LICENSE-ENGINE'].toString().includes('Business Source License 1.1'))) fail('RTK_UNRECOGNIZED');
    const record = { schema: 1, identity, status: 'pending', files: Object.fromEntries(names.map(name => [name, hash(files[name])])) };
    await journal(stateFile, record);
    for (const name of names) {
      await directory(root);
      if (await read(join(root, name)) !== null) fail('SKILL_DRIFT');
      const stage = join(root, '.stage-' + name);
      await fs.writeFile(stage, files[name], { mode: name === names[0] ? 0o700 : 0o600, flag: 'wx' });
      await fs.link(stage, join(root, name));
      await fs.unlink(stage);
    }
    await journal(stateFile, { ...record, status: 'installed' });
    return { ...result, status: 'installed' };
  } finally {
    if (scratch) await fs.rm(scratch, { recursive: true, force: true });
    await fs.rmdir(lock);
  }
}
