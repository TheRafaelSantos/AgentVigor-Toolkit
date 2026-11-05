import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { detectTools } from './platform.mjs';
import { runFile, minimalEnv } from '../skills/agentvigor-toolkit/scripts/process.mjs';
import { snapshot } from './integration-files.mjs';
import { findSkillsSource } from './find-skills-integration.mjs';

const definitions = [
  { id: 'rtk', executable: 'rtk', version: '1.1.0', license: 'Apache-2.0 CLI; BUSL-1.1 engine in full edition',
    source: 'https://github.com/rtk-ai/rtk/blob/v1.1.0/INSTALL.md' },
  { id: 'superpowers', version: '7.0.2', license: 'MIT',
    source: 'https://github.com/obra/superpowers/blob/v7.0.2/README.md' },
  { id: 'ponytail', version: '5.3.3', license: 'MIT',
    source: 'https://github.com/DietrichGebert/ponytail/blob/v5.3.3/INSTALL.md' },
  { id: 'find-skills', version: '1.7.6', license: 'MIT',
    source: 'https://github.com/vercel-labs/skills/blob/v1.7.6/docs/commands.md' },
  { id: 'graphify', executable: 'graphify', version: '0.9.102', license: 'Apache-2.0 with preserved MIT contributions',
    source: 'https://github.com/Graphify-Labs/graphify/blob/v0.9.102/README.md' },
];
const failure = code => Object.assign(new Error(code), { code });
const unknown = reason => ({ state: 'UNVERIFIED', reason });

async function skillEvidence(home, agent, env) {
  const path = join(agent === 'codex' ? join(home, '.agents') : env.CLAUDE_CONFIG_DIR || join(home, '.claude'),
    'skills', 'find-skills', 'SKILL.md');
  try {
    const contents = (await snapshot(dirname(path), ['SKILL.md']))['SKILL.md'];
    if (contents === null) return { state: 'MISSING', evidence: 'Native user skill manifest absent.' };
    const bytes = Buffer.from(contents, 'base64');
    if (bytes.length > 128 * 1024) return unknown('Skill manifest has an unsupported size.');
    const valid = /^---\r?\n[\s\S]*?\bname:\s*find-skills\s*\r?\n/.test(bytes.toString('utf8'));
    return valid ? { state: 'INSTALLED', evidence: 'Native user skill manifest', sha256: createHash('sha256').update(bytes).digest('hex') }
      : unknown('The destination exists but the manifest identity was not confirmed.');
  } catch (error) {
    return error.code === 'ENOENT' ? { state: 'MISSING', evidence: 'Native user skill manifest absent.' }
      : { state: 'BLOCKED', reason: 'Cannot inspect native user skill manifest.' };
  }
}

function plan(id, agent) {
  const step = (kind, executable, args) => ({ kind, executable, args, executed: false });
  if (id === 'rtk') return [
    { kind: 'prerequisite', action: 'Select and verify an official platform asset and its checksum.', executed: false },
    step('configure', 'rtk', ['init', '-g', ...(agent === 'codex' ? ['--codex'] : []), '--dry-run']),
    step('configure-after-backup-and-consent', 'rtk', ['init', '-g', ...(agent === 'codex' ? ['--codex'] : [])]),
  ];
  if (id === 'graphify') return [
    step('install', 'uv', ['tool', 'install', 'graphifyy==0.9.102']),
    step('configure-after-backup-and-consent', 'graphify', ['install', '--platform', agent]),
  ];
  if (id === 'find-skills') return [step('install-after-backup-and-consent', 'npx', ['skills@1.7.6', 'add',
    'https://github.com/vercel-labs/skills/tree/v1.7.6/skills/find-skills',
    '--skill', 'find-skills', '--agent', agent === 'codex' ? 'codex' : 'claude-code', '--global'])];
  if (id === 'superpowers') return agent === 'claude'
    ? [step('native-client-command', 'claude', ['/plugin install superpowers@claude-plugins-official'])]
    : [{ kind: 'native-marketplace', action: 'Select Superpowers in the official Codex plugin marketplace.', executed: false }];
  return [
    step(agent === 'claude' ? 'native-client-command' : 'configure-marketplace', agent,
      agent === 'claude' ? ['/plugin marketplace add DietrichGebert/ponytail'] : ['plugin', 'marketplace', 'add', 'DietrichGebert/ponytail']),
    step(agent === 'claude' ? 'native-client-command' : 'install-after-backup-and-consent', agent,
      agent === 'claude' ? ['/plugin install ponytail@ponytail'] : ['plugin', 'add', 'ponytail@ponytail']),
  ];
}

export async function integrations({ tool, agent = 'codex', mode = 'status', env = process.env, home = homedir() } = {}) {
  if (!['codex', 'claude'].includes(agent)) throw failure('INVALID_AGENTS');
  if (!['status', 'plan'].includes(mode)) throw failure('INTEGRATION_MODE');
  if (tool !== undefined && !definitions.some(entry => entry.id === tool)) throw failure('INTEGRATION_TOOL');
  const tools = await detectTools({ env });
  const entries = [];
  for (const definition of definitions.filter(entry => tool === undefined || entry.id === tool)) {
    let installed = definition.executable
      ? { state: tools[definition.executable]?.available ? 'INSTALLED' : 'MISSING', evidence: 'Executable lookup on absolute PATH entries.' }
      : unknown('Native plugin registry inspection requires a supported client probe.');
    if (definition.id === 'find-skills') installed = await skillEvidence(home, agent, env);
    let executableVersion = null;
    const executable = tools[definition.executable]?.path;
    if (executable && (!/\.(?:cmd|bat|ps1)$/i.test(executable))) {
      try {
        const result = await runFile(executable, ['--version'], { env: minimalEnv(env), timeoutMs: 3000, maxOutputBytes: 4096 });
        executableVersion = result.code === 0 ? /\b\d+\.\d+\.\d+(?:[-+][\w.-]+)?\b/.exec(result.stdout)?.[0] ?? null : null;
        if (!executableVersion) installed = unknown('Executable found but version probe was inconclusive.');
      } catch {
        installed = { state: 'BLOCKED', reason: 'Executable version probe failed or exceeded limits.' };
      }
    }
    entries.push({ ...definition, installed, executableVersion,
      configured: definition.id === 'find-skills' && installed.sha256 === findSkillsSource.manifestSha256
        ? { state: 'CONFIGURED', evidence: 'Pinned native skill manifest bytes match the audited official source.', version: findSkillsSource.version }
        : unknown('Registration has not been validated for this client.'),
      discovered: unknown('Requires enumeration in a fresh native-client session.'),
      verified: unknown('Requires an observed scoped invocation.'),
      ...(mode === 'plan' ? { plan: plan(definition.id, agent) } : {}) });
  }
  const planToken = createHash('sha256').update(JSON.stringify({ agent, mode, home, entries })).digest('hex');
  return { mode, agent, entries, planToken, mutates: false };
}
