import { realpath } from 'node:fs/promises';
import { basename, delimiter, dirname, extname, isAbsolute, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  failure, hash, minimalEnv, projectDirectory, readProjectFile, readRegular, redactOutput, requirePlan, runFile, token,
} from './process.mjs';

const configName = 'agentvigor.quality.json';
const limit = 4 * 1024 * 1024;
const windows = process.platform === 'win32';
const idPattern = /^[a-z0-9][a-z0-9_.:-]{0,63}$/i;
const envPattern = /^[A-Z][A-Z0-9_]{0,63}$/;
const unsafeEnv = /^(?:NODE_OPTIONS|NODE_PATH|LD_|DYLD_|BASH_ENV|ENV$|NPM_CONFIG_|PATH$|PATHEXT$|COMSPEC$|SYSTEMROOT$|WINDIR$)/i;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const only = (object, keys) => Object.keys(object).every(key => keys.includes(key));

function json(bytes, code) {
  try { return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')); }
  catch { throw failure(code); }
}

function parseConfig(bytes) {
  const value = json(bytes, 'QUALITY_CONFIG');
  if (!record(value) || !only(value, ['schemaVersion', 'checks', 'passEnv']) || value.schemaVersion !== 1
    || !Array.isArray(value.checks) || value.checks.length > 32) throw failure('QUALITY_CONFIG');
  const passEnv = Object.hasOwn(value, 'passEnv') ? value.passEnv : [];
  if (!Array.isArray(passEnv) || passEnv.length > 16 || new Set(passEnv).size !== passEnv.length
    || passEnv.some(name => typeof name !== 'string' || !envPattern.test(name) || unsafeEnv.test(name))) throw failure('QUALITY_CONFIG');
  const ids = new Set();
  for (const check of value.checks) {
    if (!record(check) || typeof check.id !== 'string' || !idPattern.test(check.id) || ids.has(check.id)) throw failure('QUALITY_CONFIG');
    ids.add(check.id);
    if (Object.hasOwn(check, 'timeoutMs') && (!Number.isInteger(check.timeoutMs) || check.timeoutMs < 1 || check.timeoutMs > 600_000)) {
      throw failure('QUALITY_CONFIG');
    }
    if (check.type === 'npm-script') {
      if (!only(check, ['id', 'type', 'script', 'timeoutMs']) || typeof check.script !== 'string' || !idPattern.test(check.script)) {
        throw failure('QUALITY_CONFIG');
      }
    } else if (check.type === 'node') {
      if (!only(check, ['id', 'type', 'file', 'args', 'timeoutMs']) || typeof check.file !== 'string' || check.file.length > 1024
        || /[\\:\x00-\x1f]/.test(check.file) || check.file.split('/').some(segment => !segment || /[ .]$/.test(segment))
        || !['.mjs', '.cjs', '.js'].includes(extname(check.file))) throw failure('QUALITY_CONFIG');
      if (Object.hasOwn(check, 'args') && (!Array.isArray(check.args) || check.args.length > 32
        || check.args.some(arg => typeof arg !== 'string' || arg.length > 2048 || arg.includes('\0')))) throw failure('QUALITY_CONFIG');
    } else throw failure('QUALITY_CONFIG');
  }
  return { checks: value.checks, passEnv };
}

function environmentValue(env, name) {
  return windows ? Object.entries(env).find(([key]) => key.toUpperCase() === name.toUpperCase())?.[1] : env[name];
}

async function npmEntry(env) {
  const directories = (environmentValue(env, 'PATH') ?? '').split(delimiter)
    .map(path => path.trim().replace(/^"(.*)"$/, '$1'))
    .filter(path => windows ? /^[a-z]:[\\/]/i.test(path) : isAbsolute(path));
  if (directories.length) directories.unshift(dirname(process.execPath));
  const candidates = [environmentValue(env, 'npm_execpath'), ...new Set(directories.flatMap(directory => [
    join(directory, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(directory, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    ...(!windows ? [join(directory, 'npm')] : []),
  ]))];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !isAbsolute(candidate)) continue;
    try {
      const file = await realpath(candidate);
      if (basename(file) !== 'npm-cli.js' || basename(dirname(file)) !== 'bin') continue;
      const metadata = await readRegular(join(dirname(file), '..', 'package.json'), limit, 'NPM_UNAVAILABLE');
      if (!metadata) continue;
      const pkg = json(metadata, 'NPM_UNAVAILABLE');
      if (pkg.name !== 'npm' || pkg.bin?.npm !== 'bin/npm-cli.js') continue;
      const bytes = await readRegular(file, limit, 'NPM_UNAVAILABLE');
      if (bytes) return { file, fingerprint: token(file, hash(bytes), hash(metadata)) };
    } catch {
      // Continue searching verified npm package layouts.
    }
  }
  return null;
}

async function prepare(root, env) {
  const manifest = await readProjectFile(root, configName, 64 * 1024, 'QUALITY_CONFIG');
  if (!manifest) return { status: 'unavailable', error: 'QUALITY_MISSING', planToken: null, passEnv: [], checks: [] };
  const { checks, passEnv } = parseConfig(manifest);
  const needsNpm = checks.some(check => check.type === 'npm-script');
  const pkgBytes = needsNpm ? await readProjectFile(root, 'package.json', limit, 'QUALITY_CONFIG') : null;
  const npmConfig = needsNpm ? await readProjectFile(root, '.npmrc', 64 * 1024, 'QUALITY_CONFIG') : null;
  const pkg = pkgBytes ? json(pkgBytes, 'QUALITY_CONFIG') : {};
  if (!record(pkg)) throw failure('QUALITY_CONFIG');
  const npm = needsNpm ? await npmEntry(env) : null;
  const planned = [];
  for (const check of checks) {
    const timeoutMs = check.timeoutMs ?? 120_000;
    if (check.type === 'node') {
      const args = check.args ?? [];
      const bytes = await readProjectFile(root, check.file, limit, 'QUALITY_CONFIG');
      planned.push({
        entry: { id: check.id, type: check.type, file: check.file, argsCount: args.length, timeoutMs, status: bytes ? 'planned' : 'unavailable',
          ...(!bytes ? { error: 'QUALITY_ENTRY_MISSING' } : {}) },
        args: [join(root, ...check.file.split('/')), ...args], fingerprint: bytes ? hash(bytes) : null,
      });
    } else {
      const script = record(pkg.scripts) && Object.hasOwn(pkg.scripts, check.script) ? pkg.scripts[check.script] : null;
      const error = !npm ? 'NPM_UNAVAILABLE' : typeof script !== 'string' || !script.trim() ? 'QUALITY_SCRIPT_MISSING' : null;
      planned.push({
        entry: { id: check.id, type: check.type, script: check.script, timeoutMs, status: error ? 'unavailable' : 'planned',
          ...(error ? { error } : {}) },
        args: npm ? [npm.file, 'run', check.script] : null,
        fingerprint: npm?.fingerprint ?? null,
      });
    }
  }
  const planToken = token('quality-v1', root, process.execPath, process.version, hash(manifest), pkgBytes ? hash(pkgBytes) : null,
    npmConfig ? hash(npmConfig) : null,
    planned.map(({ entry, fingerprint }) => [entry.status, fingerprint]));
  const status = planned.some(item => item.entry.status === 'planned') ? 'planned' : 'unavailable';
  return { status, planToken, passEnv, checks: planned.map(item => item.entry), planned };
}

export async function quality({ path = process.cwd(), dryRun = false, expectedPlan, signal, env = process.env } = {}) {
  const root = await projectDirectory(path);
  const { planned, ...plan } = await prepare(root, env);
  if (dryRun) return plan;
  if (expectedPlan !== undefined || plan.status === 'planned') requirePlan(expectedPlan, plan.planToken);
  if (plan.status !== 'planned') return plan;

  const secrets = plan.passEnv.map(name => environmentValue(env, name)).filter(value => typeof value === 'string');
  const childEnv = { ...minimalEnv(env, plan.passEnv), npm_config_logs_max: '0', npm_config_update_notifier: 'false' };
  const inheritedPath = environmentValue(childEnv, 'PATH');
  for (const key of Object.keys(childEnv).filter(key => windows && key.toUpperCase() === 'PATH')) delete childEnv[key];
  childEnv.PATH = [dirname(process.execPath), inheritedPath].filter(Boolean).join(delimiter);
  const checks = [];
  for (const { entry, args, fingerprint } of planned) {
    if (signal?.aborted) { checks.push({ ...entry, status: 'cancelled' }); continue; }
    if (entry.status === 'unavailable') { checks.push(entry); continue; }
    if (entry.type === 'node') {
      const bytes = await readProjectFile(root, entry.file, limit, 'QUALITY_CONFIG');
      if (!bytes || hash(bytes) !== fingerprint) throw failure('PLAN_CHANGED');
    } else {
      const current = await prepare(root, env);
      if (current.planToken !== plan.planToken) throw failure('PLAN_CHANGED');
    }
    const started = performance.now();
    try {
      const { code, stdout, stderr } = await runFile(process.execPath, args, { cwd: root, env: childEnv, signal, timeoutMs: entry.timeoutMs });
      checks.push({ ...entry, status: code === 0 ? 'passed' : 'failed', code, durationMs: Math.round(performance.now() - started),
        stdout: redactOutput(stdout, secrets), stderr: redactOutput(stderr, secrets) });
    } catch (error) {
      checks.push({ ...entry, status: error.code === 'PROCESS_ABORTED' ? 'cancelled' : 'failed',
        error: error.code ?? 'PROCESS_START', durationMs: Math.round(performance.now() - started) });
    }
  }
  const status = checks.some(check => check.status === 'cancelled') ? 'cancelled'
    : checks.some(check => check.status === 'failed') ? 'failed'
      : checks.some(check => check.status === 'unavailable') ? 'unavailable' : 'passed';
  return { ...plan, status, checks };
}
