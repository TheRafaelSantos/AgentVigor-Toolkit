import { readFile } from 'node:fs/promises';

const upstream = new URL('../references/upstream/templates/', import.meta.url);
const fullNext = new URL('../references/full/source/templates/next/', import.meta.url);
const license = new URL('../licenses/VIBE-CODING-TOOLKIT-MIT.txt', import.meta.url);
const json = value => JSON.stringify(value, null, 2) + '\n';
const upstreamText = name => readFile(new URL(name, upstream), 'utf8');

const words = {
  en: {
    project: 'Project', product: 'Product', setup: 'Setup', architecture: 'Architecture',
    design: 'Design', onboarding: 'Onboarding', quality: 'Quality', handoff: 'Task handoff',
    guide: 'AgentVigor project guidance',
    productBody: 'Record the problem, audience, MVP, exclusions and observable acceptance criteria.',
    setupBody: 'Record the actual OS, runtime, package manager, setup commands and checked integrations.',
    architectureBody: 'Document the current stack, boundaries, data and decisions with their evidence.',
    designBody: 'Record interface flows, accessibility requirements and decisions from the user.',
    onboardingBody: 'List prerequisites, setup, development and troubleshooting commands that were verified.',
    qualityBody: 'Record configured lint, type, test and build checks. Report skipped checks and their reasons.',
    handoffBody: 'Record objective, branch, changes, actual tests, evidence, blockers and next safe action.',
    instruction: 'Read the current source and project docs. Preserve the existing stack, user changes and public contracts. Choose the smallest change that meets the objective. Use the installed AgentVigor toolkit skill for specific workflows. Report executed tests and remaining limits. Review external services and mutations with the user.',
    next: 'Install dependencies with `npm install --ignore-scripts --no-audit --no-fund`. Run `agentvigor quality --yes` to execute lint, typecheck, tests and build. Run `npm run dev` to start the application.',
    eslint: 'Install ESLint in this project using a supported version. Run ESLint with `--config .agentvigor-quality/eslint.config.mjs` to apply the supplemental rules. Review data-access modules and layers before enabling additional settings.',
    harness: 'Evaluate this disposable exercise with `agentvigor harness --yes`. The initial authorization function is deliberately vulnerable. Keep this fixture separate from application code.',
  },
  'pt-BR': {
    project: 'Projeto', product: 'Produto', setup: 'Configuração', architecture: 'Arquitetura',
    design: 'Design', onboarding: 'Primeiros passos', quality: 'Qualidade', handoff: 'Passagem de contexto',
    guide: 'Orientações de projeto do AgentVigor',
    productBody: 'Registre problema, público, MVP, exclusões e critérios de aceitação observáveis.',
    setupBody: 'Registre sistema, runtime, gerenciador, comandos de configuração e integrações verificadas.',
    architectureBody: 'Documente stack atual, limites, dados e decisões com suas evidências.',
    designBody: 'Registre fluxos de interface, requisitos de acessibilidade e decisões do usuário.',
    onboardingBody: 'Liste pré-requisitos e comandos de configuração, desenvolvimento e diagnóstico verificados.',
    qualityBody: 'Registre os checks de lint, tipos, testes e build. Identifique os checks pulados e os motivos.',
    handoffBody: 'Registre objetivo, branch, alterações, testes executados, evidências, bloqueios e próxima ação segura.',
    instruction: 'Leia o código e a documentação atuais. Preserve stack, alterações do usuário e contratos públicos. Faça a menor mudança que cumpra o objetivo. Use a skill AgentVigor Toolkit instalada para fluxos específicos. Informe os testes executados e limites. Confirme serviços externos e alterações com o usuário.',
    next: 'Instale dependências com `npm install --ignore-scripts --no-audit --no-fund`. Execute `agentvigor quality --yes` para rodar lint, tipos, testes e build. Execute `npm run dev` para iniciar a aplicação.',
    eslint: 'Instale uma versão suportada do ESLint neste projeto. Rode ESLint com `--config .agentvigor-quality/eslint.config.mjs` para aplicar as regras complementares. Confira módulos e camadas de dados antes de ativar regras adicionais.',
    harness: 'Avalie este exercício descartável com `agentvigor harness --yes`. A função de autorização inicial é intencionalmente vulnerável. Mantenha o exercício separado do código da aplicação.',
  },
  es: {
    project: 'Proyecto', product: 'Producto', setup: 'Configuración', architecture: 'Arquitectura',
    design: 'Diseño', onboarding: 'Primeros pasos', quality: 'Calidad', handoff: 'Traspaso de contexto',
    guide: 'Orientaciones de proyecto de AgentVigor',
    productBody: 'Registra problema, público, MVP, exclusiones y criterios de aceptación observables.',
    setupBody: 'Registra sistema, runtime, gestor, comandos de configuración e integraciones comprobadas.',
    architectureBody: 'Documenta stack actual, límites, datos y decisiones con sus evidencias.',
    designBody: 'Registra flujos de interfaz, requisitos de accesibilidad y decisiones del usuario.',
    onboardingBody: 'Enumera requisitos y comandos de configuración, desarrollo y diagnóstico comprobados.',
    qualityBody: 'Registra lint, tipos, pruebas y build. Identifica las verificaciones omitidas y sus motivos.',
    handoffBody: 'Registra objetivo, rama, cambios, pruebas ejecutadas, evidencias, bloqueos y próximo paso seguro.',
    instruction: 'Lee el código y la documentación vigentes. Conserva stack, cambios del usuario y contratos públicos. Haz el cambio más pequeño que cumpla el objetivo. Usa la skill AgentVigor Toolkit para flujos concretos. Informa pruebas ejecutadas y límites. Confirma servicios externos y cambios con el usuario.',
    next: 'Instala las dependencias con `npm install --ignore-scripts --no-audit --no-fund`. Ejecuta `agentvigor quality --yes` para lint, tipos, pruebas y build. Ejecuta `npm run dev` para iniciar la aplicación.',
    eslint: 'Instala una versión compatible de ESLint en este proyecto. Ejecuta ESLint con `--config .agentvigor-quality/eslint.config.mjs` para aplicar las reglas adicionales. Revisa módulos y capas de datos antes de habilitar reglas adicionales.',
    harness: 'Evalúa este ejercicio desechable con `agentvigor harness --yes`. La función de autorización inicial es deliberadamente vulnerable. Mantén el ejercicio separado del código de la aplicación.',
  },
};

const docs = ['README.md', 'PRODUCT.md', 'AGENTS.md', 'CLAUDE.md', 'docs/setup.md', 'docs/architecture.md',
  'docs/design.md', 'docs/onboarding.md', 'docs/quality.md', 'docs/task-handoff.md'];
const rules = ['index.cjs', 'core-rules.cjs', 'utils.cjs'];
const qualityPaths = rules.map(name => '.agentvigor-quality/eslint-rules/' + name);
const eslint = ['.agentvigor-quality/eslint.config.mjs', ...qualityPaths, 'docs/agentvigor-eslint.md',
  'agentvigor.quality.json', '.agentvigor-quality/LICENSE-MIT.txt'];
const harness = ['access.mjs', 'local-notes.txt', 'AGENTS.md', 'README.md', 'LICENSE-VIBE-MIT.txt'];
const next = [...docs, ...eslint, 'package.json', 'tsconfig.json', 'next-env.d.ts', '.gitignore',
  'postcss.config.mjs', 'next.config.mjs', 'src/app/layout.tsx', 'src/app/page.tsx', 'src/app/globals.css',
  'src/lib/site.mjs', 'test/site.test.mjs'];
const postgres = ['.env.example', 'drizzle.config.ts', 'vitest.config.mts', 'src/db/index.ts', 'src/db/index.test.ts',
  'src/db/schema/index.ts', 'src/lib/env.ts', 'src/lib/env-schema.ts', 'src/lib/env.test.ts', 'src/lib/logger.ts',
  'src/lib/logger.test.ts', 'src/lib/utils.ts'];
const templates = { docs, eslint, harness, next, 'next-postgres': [...next, ...postgres] };
export const projectTemplates = Object.keys(templates);
export const projectPaths = new Set(Object.values(templates).flat());

const gate = (...scripts) => json({
  schemaVersion: 1,
  checks: scripts.map(script => ({
    id: script, type: 'npm-script', script, ...(script === 'build' ? { timeoutMs: 180000 } : {}),
  })),
});

const baseRules = `{
  "quality/max-lines": ["error", { max: 350 }],
  "quality/no-direct-console": ["error", { allow: ["error", "warn"] }],
}`;

function docsFiles(w) {
  const note = (name, body) => '# ' + w[name] + '\n\n' + w[body] + '\n';
  return {
    'README.md': '# ' + w.project + '\n\n[PRODUCT.md](PRODUCT.md) · [Setup](docs/setup.md) · [Quality](docs/quality.md)\n',
    'PRODUCT.md': note('product', 'productBody'),
    'AGENTS.md': '# ' + w.guide + '\n\n' + w.instruction + '\n\n[PRODUCT.md](PRODUCT.md) · [Setup](docs/setup.md) · [Quality](docs/quality.md)\n',
    'CLAUDE.md': '@AGENTS.md\n',
    'docs/setup.md': note('setup', 'setupBody'),
    'docs/architecture.md': note('architecture', 'architectureBody'),
    'docs/design.md': note('design', 'designBody'),
    'docs/onboarding.md': note('onboarding', 'onboardingBody'),
    'docs/quality.md': note('quality', 'qualityBody'),
    'docs/task-handoff.md': note('handoff', 'handoffBody'),
  };
}

async function eslintFiles(w, withNext) {
  const files = {};
  for (const name of rules) {
    files['.agentvigor-quality/eslint-rules/' + name] = await upstreamText('eslint/eslint-rules/' + name);
  }
  files['.agentvigor-quality/LICENSE-MIT.txt'] = await readFile(license, 'utf8');
  const nextImport = withNext ? 'import nextVitals from "eslint-config-next/core-web-vitals";\nimport nextTypes from "eslint-config-next/typescript";\n' : '';
  const nextConfig = withNext ? '  ...nextVitals,\n  ...nextTypes,\n' : '';
  files['.agentvigor-quality/eslint.config.mjs'] = `import quality from "./eslint-rules/index.cjs";
${nextImport}
export default [
  { ignores: [".next/**", "dist/**", "out/**", "coverage/**", ".agentvigor-project/**", ".agentvigor-quality/**", "next-env.d.ts"] },
${nextConfig}  {
    files: ["**/*.{${withNext ? 'js,mjs,cjs,jsx,ts,tsx' : 'js,mjs,cjs'}}"],
    plugins: { quality },
    rules: ${baseRules},
  },
];
`;
  files['docs/agentvigor-eslint.md'] = '# ESLint\n\n' + w.eslint + '\n\n' +
    'Vibe Coding Toolkit rules by Matheus Gomes. See [.agentvigor-quality/LICENSE-MIT.txt](../.agentvigor-quality/LICENSE-MIT.txt).\n';
  return files;
}

function nextFiles(w) {
  return {
    'README.md': '# ' + w.project + '\n\n' + w.next + '\n\n[PRODUCT.md](PRODUCT.md) · [Setup](docs/setup.md)\n',
    'package.json': json({
      name: 'agentvigor-next-foundation', private: true, version: '0.0.0',
      scripts: { dev: 'next dev', lint: 'eslint --config .agentvigor-quality/eslint.config.mjs . --max-warnings 0',
        typecheck: 'tsc --noEmit', test: 'node --test', build: 'next build', start: 'next start' },
      dependencies: { next: '16.4.5', react: '19.3.1', 'react-dom': '19.3.1' },
      devDependencies: { typescript: '5.9.3', eslint: '10.14.0', 'eslint-config-next': '16.4.5',
        '@types/node': '24.10.1', '@types/react': '19.3.0', '@types/react-dom': '19.3.0',
        tailwindcss: '4.3.4', '@tailwindcss/postcss': '4.3.4' },
    }),
    'tsconfig.json': json({
      compilerOptions: { target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true,
        skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: 'esnext',
        moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'react-jsx',
        incremental: true, plugins: [{ name: 'next' }], paths: { '@/*': ['./src/*'] } },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts', '.next/dev/types/**/*.ts'],
      exclude: ['node_modules'],
    }),
    'next-env.d.ts': '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n',
    '.gitignore': 'node_modules/\n.next/\n*.tsbuildinfo\n.env*\n!.env.example\n.agentvigor-project/\n',
    'postcss.config.mjs': 'const config = { plugins: { "@tailwindcss/postcss": {} } };\nexport default config;\n',
    'next.config.mjs': 'const config = { turbopack: { root: import.meta.dirname } };\nexport default config;\n',
    'src/app/globals.css': '@import "tailwindcss" source("../");\n',
    'src/app/layout.tsx': `import type { ReactNode } from 'react';
import './globals.css';

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
`,
    'src/app/page.tsx': `import { siteTitle } from '../lib/site.mjs';

export default function Home() {
  return <main className="mx-auto max-w-3xl p-8"><h1 className="text-3xl font-semibold">{siteTitle}</h1></main>;
}
`,
    'src/lib/site.mjs': 'export const siteTitle = "AgentVigor Next foundation";\n',
    'test/site.test.mjs': `import assert from 'node:assert/strict';
import { test } from 'node:test';
import { siteTitle } from '../src/lib/site.mjs';

test('the generated home page has a title', () => {
  assert.match(siteTitle, /AgentVigor/);
});
`,
    'agentvigor.quality.json': gate('lint', 'typecheck', 'test', 'build'),
  };
}

export async function preset(name, lang = 'en') {
  const w = Object.hasOwn(words, lang) ? words[lang] : words.en;
  if (name === 'docs') return docsFiles(w);
  if (name === 'next') return { ...docsFiles(w), ...await eslintFiles(w, true), ...nextFiles(w) };
  if (name === 'next-postgres') {
    const foundation = await preset('next', lang);
    const manifest = JSON.parse(foundation['package.json']);
    manifest.name = 'agentvigor-next-postgres';
    Object.assign(manifest.dependencies, { 'drizzle-orm': '0.45.4', pg: '8.23.1', 'server-only': '0.0.1',
      zod: '4.6.7', pino: '10.4.0', clsx: '2.1.1', 'tailwind-merge': '3.7.0' });
    Object.assign(manifest.devDependencies, { 'drizzle-kit': '0.31.11', '@types/pg': '8.23.1',
      '@next/env': manifest.dependencies.next, vitest: '5.1.0' });
    Object.assign(manifest.scripts, { test: 'node --test "test/*.test.mjs" && vitest run', 'test:watch': 'vitest',
      'db:generate': 'drizzle-kit generate', 'db:migrate': 'drizzle-kit migrate' });
    const files = await Promise.all(postgres.map(async path => [path, await readFile(
      new URL(path === '.env.example' ? path : path + '.example', fullNext), 'utf8')]));
    return { ...foundation, ...Object.fromEntries(files), 'package.json': json(manifest) };
  }
  if (name === 'eslint') {
    return { ...await eslintFiles(w, false), 'agentvigor.quality.json': json({
      schemaVersion: 1,
      checks: [{ id: 'eslint', type: 'node', file: 'node_modules/eslint/bin/eslint.js',
        args: ['--config', '.agentvigor-quality/eslint.config.mjs', '.', '--max-warnings', '0'] }],
    }) };
  }
  if (name === 'harness') {
    return {
      'README.md': '# AgentVigor · Harness\n\n' + w.harness + '\n',
      'access.mjs': await upstreamText('harness-evaluation/access.mjs'),
      'local-notes.txt': await upstreamText('harness-evaluation/local-notes.txt'),
      'AGENTS.md': await upstreamText('harness-evaluation/AGENTS.md'),
      'LICENSE-VIBE-MIT.txt': await readFile(license, 'utf8'),
    };
  }
  throw new Error('Unknown project preset');
}
