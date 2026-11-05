# Auditoria de engenharia do Vibe Coding Toolkit

Auditoria realizada em 4 de novembro de 2026. O escopo cobre scripts, quality gates, ESLint, templates de servidor, segurança, avaliação de harness e dependências. A leitura usou o snapshot `21b71b68679c11184f49c23168852014bf6dde8b`, extraído em `out/upstream-vibe/soumatheusgomes-vibe-coding-toolkit-21b71b6`. A árvore extraída não possui repositório Git próprio. Não foi criado Git aninhado. O código do AgentVigor permaneceu fora das alterações desta auditoria.

O upstream oferece recursos executáveis que podem complementar o AgentVigor. Os candidatos mais imediatos são as três regras ESLint com verificador, a fixture de autorização com avaliador independente e os testes dos templates de servidor. A integração depende de adaptar caminhos, versões, isolamento e consentimento. Publicar somente prompts deixaria esses recursos de fora.

Os arquivos de origem estão sob MIT, com `Copyright (c) 2026 Matheus Gomes`. Cópias e adaptações substanciais devem distribuir esse aviso e o texto da licença. Contribuições e adaptações do AgentVigor devem ter identificação própria. A licença MIT do AgentVigor não substitui o crédito da origem. [Fonte e licença fixadas](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/LICENSE)

## Evidência executada

Os subprocessos de teste receberam ambiente reduzido. `HOME`, `USERPROFILE`, `TEMP`, `TMP` e `TMPDIR` apontaram para uma pasta de teste exclusiva em `out/`. As pastas temporárias criadas foram removidas ao final. Nenhum cliente de IA ou integração global foi instalado, e os testes não chamaram modelos ou serviços externos.

| Verificação | Windows nativo x64, Node 24.15.0 | Ubuntu em WSL2 x64, Node 24.15.0 | Limite da evidência |
| --- | --- | --- | --- |
| `node --test scripts/validate-harness.test.mjs` | 2 testes aprovados | 2 testes aprovados | Os testes verificam rejeição do código vulnerável, correção completa, correção incompleta e perda das notas locais |
| `node scripts/validate-harness.mjs templates/harness-evaluation` | 5 aprovados e 2 falhas esperadas | 5 aprovados e 2 falhas esperadas | Falham a leitura entre tenants e identidades inválidas. A fixture foi mantida vulnerável |
| Sintaxe dos 18 arquivos JavaScript executáveis do domínio | 18 aprovados | Não executado | `node --check` com conteúdo por stdin, sem carregar imports ou dependências |
| `parseHookEvent` importado por URL de dados | Aceitou `42`, `true` e `[]`; retornou `null` para JSON inválido e literal `null` | Não executado | Comportamento real do helper, incompatível com a afirmação de que seu retorno válido é sempre objeto |
| `scripts/validate-docs.mjs` e seus 9 testes | Não executados | Não executados | O script depende de `git ls-files` e os testes criam repositórios. É necessário adaptar o inventário sem Git aninhado |
| `templates/eslint/verify.mjs` | Três regras aprovadas no ESLint 10.14.0 isolado em `out/npm-eslint` | Não executado | RuleTester cobre regras. Os presets completos Next/TypeScript exigem suas dependências próprias |
| `scripts/check-eslint.mjs` | Não executado | Não executado | Requer app Next descartável com os plugins e todos os presets |
| `scripts/validate-next.mjs` | Não executado | Não executado | Usa versões móveis, rede, instalações de skills e ambiente herdado. Precisa ser adaptado antes |
| Vitest, PostgreSQL/PGlite, build, HTTP, auditoria npm | Não executados | Não executados | Dependem do laboratório Next e de dependências externas |
| Casos com agente real, Harness2 oficial e observação de ações | Não executados | Não executados | Os resultados determinísticos não provam comportamento de Codex ou Claude Code |

Os resultados publicados pelo upstream em `docs/05-toolkit-validation.md` pertencem às execuções dele. Versões, auditorias e resultados históricos desse documento não foram convertidos em evidência do AgentVigor. macOS Intel e Apple Silicon não foram executados nesta auditoria. [Validação upstream](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/05-toolkit-validation.md)

## Matriz dos scripts e da automação

Os caminhos das matrizes abaixo são relativos à revisão fixada do upstream.

| Arquivo | Contrato observado | Portabilidade e clientes | Integração pequena e verificável |
| --- | --- | --- | --- |
| `scripts/validate-docs.mjs` | Lista arquivos com `git ls-files --cached --others --exclude-standard -z`, valida JSON, links locais, imagens/srcset, âncoras e destinos de manifesto. Reconhece URLs do próprio repositório em `main` | Node e Git. Independente de cliente. Windows recebe paths por `path.resolve` | Receber raiz e lista explícita de arquivos ou manifesto. Confirmar contenção, rejeitar links externos por symlink e parametrizar owner/repo/revisão. Incluir caminhos do pacote sem depender de `.git` |
| `scripts/validate-docs.test.mjs` | Nove casos de regressão. Cria Git temporário, documentos, imagens e manifesto | Node e Git em cada host. Sem modelos | Retirar `git init` e passar inventário explícito ao validador. Manter casos de imagens ausentes, âncoras duplicadas, URLs e documentos gerados |
| `scripts/validate-harness.mjs` | Importa `access.mjs` do diretório escolhido. Sete verificações sobre ownership, tenant, identidades, mutação e notas locais | Node puro. Windows e WSL executados. Serve aos dois clientes como avaliador externo | Copiar com sua fixture e licença, fixar hash e manter fora do escopo de escrita do agente avaliado. Executar apenas cópias de código confiável e descartável |
| `scripts/validate-harness.test.mjs` | Dois testes executam o avaliador em processos filhos com timeout de 10 segundos, provando baseline rejeitado, fix completo aceito, fix incompleto e notas alteradas rejeitados | Node puro. Windows e WSL executados | Mudar somente a raiz temporária para pasta autorizada e rastrear limpeza. Preservar teste negativo do próprio avaliador |
| `scripts/check-eslint.mjs` | Carrega ESLint do `package.json` do app atual. Exercita perfis full/light/advanced/typed e controles Next, TypeScript, console, Drizzle, imports e tamanho | Node e dependências do app. Processo filho evita DLL/addon aberto no Windows | Executar em fixture exclusiva. Garantir limpeza em `finally` de todos os configs temporários. Não executar no projeto real porque o script copia/substitui arquivos e remove probes |
| `scripts/validate-next.mjs` | Cria Next temporário, instala runtime/dev/15 skills, aplica templates, testa SQL, tipos limpos, `server-only`, lint, build, audits e HTTP, depois remove o laboratório | Exige exatamente Node 24, npm, Git e rede. Upstream CI tem Windows/Ubuntu. Cliente não participa dos testes de app | Dividir laboratório do teste de distribuição de skills. Fixar versões e revisões. Reduzir ambiente, cache e home. Rede somente por seleção explícita com plano/`--yes`. Usar argv e timeout de encerramento |
| `.github/workflows/validate.yml` | Node 24 em `ubuntu-latest`/`windows-latest`, timeout de 20 minutos, Actions por SHA, `contents: read`, checkout sem credencial persistida | Não cobre macOS nessa revisão. Executa dependências móveis no job Next | Preservar permissões mínimas e fixação. Separar job offline de Next com rede. Incluir macOS Intel/ARM conforme suporte declarado e registrar OS/arch/versões |

O validador Next instala skills **locais** ao app descartável nos comandos lidos, sem `--global`. Ainda assim, ele herda home/cache/config do operador e chama ferramentas externas. Essa implementação não garante isolamento do cliente ou do ambiente por si só. O modo de integração do AgentVigor deve escolher explicitamente agentes e escopo em vez de instalar sempre os dois. [Scripts fixados](https://github.com/soumatheusgomes/vibe-coding-toolkit/tree/21b71b68679c11184f49c23168852014bf6dde8b/scripts)

## Matriz de ESLint e quality gates

| Arquivo | Função e limite observado | Dependências e adaptação |
| --- | --- | --- |
| `templates/eslint/eslint-rules/index.cjs` | Exporta somente `quality/max-lines`, `quality/no-direct-console` e `quality/no-direct-data-access` | Preservar as três regras e recursos da mesma revisão, além de MIT/Matheus. Não anunciar regras de auth, dinheiro ou UI como implementadas |
| `templates/eslint/eslint-rules/utils.cjs` | Normaliza barras Windows, classifica testes por diretório/sufixo, exclui vendor/build/generated/declarações e compara baseline por sufixo de caminho | Testar espaços, barras, letras de unidade, nomes quase iguais e configuração da raiz. Os ignores de baseline precisam de política visível |
| `templates/eslint/eslint-rules/core-rules.cjs` | Tamanho padrão 350 linhas, com exceções AST de reexports/tipos. Console usa `MemberExpression`. Acesso a dados usa import estático com módulo e binding configurados | As duas últimas são heurísticas de convenção. Não resolvem todos os aliases, imports dinâmicos, CommonJS ou wrappers. Calibrar para o projeto e testar positivo/negativo |
| `templates/eslint/verify.mjs` | Usa `RuleTester` para as três regras, sem framework de teste adicional. Exibe três linhas terminadas em `: ok` e lança erro no primeiro caso inválido | Necessita `eslint` resolvido pelo local do verificador. Copiá-lo junto ao projeto instalado ou resolver explicitamente a instalação local. Rodar em todos os SOs suportados |
| `templates/eslint/eslint.config.mjs.example` | Preset avançado rápido. JS recommended + TS strict, resolutor de alias, zonas error/warn separadas, complexidade warn, tamanho error, logger e DB boundaries | `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-import-x`, `eslint-import-resolver-typescript`. Remover completamente imports/regras de blocos não adotados. Ajustar globals e globs |
| `templates/eslint/eslint.typed.config.mjs.example` | Estende o rápido e usa `projectService`, com conjunto amplo de regras type-aware em warning para migração | Mesmo major suportado e peers compatíveis. Depende de tsconfig real. Tempo e memória devem ser medidos. Warning não equivale a gate bloqueante |
| `templates/eslint/eslint-rules/next-base.mjs` | Presets oficiais Next core-web-vitals/TypeScript, tamanho error e ignores de artefatos/clientes | `eslint`, `eslint-config-next` e TypeScript compatíveis com o app. Verificar conjunto de extensões adotado |
| `templates/eslint/next.config.mjs.example` | Perfil Next leve que reexporta `next-base` | Não adiciona Drizzle ou logger. Adequado a app sem essas necessidades |
| `templates/eslint/next-app.config.mjs.example` | Perfil Next full com logger, imports de `db/getDb` e guards delete/update de Drizzle | Acrescenta `eslint-plugin-drizzle`. A regra é configurada para objeto `db`; aliases ou outras formas precisam de casos próprios |
| `templates/eslint/next.typed.config.mjs.example` | Perfil focado em promises flutuantes e callbacks async atribuídos a void, ambos como error | TS project service, inclusão pelo tsconfig. Gate separado do lint rápido e coberto por casos que realmente falham |

Os templates são Node e, em princípio, independentes do cliente de IA. A instalação/adoção deve produzir os mesmos scripts para Codex e Claude, preservando comandos e severidades existentes. O perfil avançado pressupõe `src/`; copiar sem adaptar pode deixar arquivos reais fora do gate. O CLI do AgentVigor usa saída de terminal como interface, portanto uma proibição global de `console` no próprio toolkit seria incompatível com esse contrato. [Templates ESLint fixados](https://github.com/soumatheusgomes/vibe-coding-toolkit/tree/21b71b68679c11184f49c23168852014bf6dde8b/templates/eslint)

## Matriz dos templates de servidor

Esses arquivos pertencem a um perfil opcional de aplicação Next. Eles não justificam instalar Next, PostgreSQL ou bibliotecas de app como dependências de runtime do CLI AgentVigor.

| Arquivo em `templates/next/` | Contrato observado | Teste/adaptação necessária |
| --- | --- | --- |
| `.env.example` | Campos vazios `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, log level info | Não contém credenciais. A cópia deve permanecer exemplo, com valores reais em arquivo ignorado |
| `drizzle.config.ts.example` | Carrega ambiente Next, configura PostgreSQL, usa URL direta opcional ou normal, permite gerar SQL sem conexão | A execução pode carregar `.env` do cwd. Laboratório com home/cwd próprios e sem credenciais herdadas. Migração real exige destino autorizado |
| `vitest.config.mts.example` | Ambiente Node, alias `@`, testes `src/**/*.test.ts`, restaura mocks | Vitest compatível com runtime. Testa servidor, sem DOM/E2E implícitos |
| `src/lib/env-schema.ts.example` | Zod valida URL PostgreSQL e nível de log. Erro mostra somente nome da variável | Testar URL inválida, ausente e erros sem valor sensível. Não valida a conectividade do banco |
| `src/lib/env.ts.example` | `server-only`, lê variáveis ao usar a função | Build de Client Component precisa rejeitar import servidor. Não requer DB para configurações independentes |
| `src/lib/env.test.ts.example` | Quatro testes de ausência, protocolos, URL inválida, log level e não vazamento | Incluídos no conjunto de oito Vitest do upstream, ainda não executados nesta auditoria |
| `src/lib/logger.ts.example` | Pino com redaction de campos comuns, headers e URLs de banco, `server-only` | Lista específica de paths. Mensagens livres e estruturas não listadas podem vazar. Ajustar nomes reais e profundidade |
| `src/lib/logger.test.ts.example` | Um teste de redaction com contexto permitido preservado | Adicionar regressões para campos efetivos do projeto e evitar descrever a lista inicial como scrubber universal |
| `src/db/index.ts.example` | Pool global lazy reutilizado entre HMR, limite 5, conexão 5s, idle 30s, ORM cacheado, `closeDatabase` explícito | Driver `pg` exige Node, não Edge. Shutdown/erros testados com mocks. Dimensionar pool conforme instâncias e limites reais |
| `src/db/index.test.ts.example` | Três testes de URL ausente, reuse/shutdown e log sem erro sensível | Não prova conexão TCP, TLS ou credenciais. Ensaiar concorrência de shutdown se o app precisar dela |
| `src/db/schema/index.ts.example` | Schema vazio, sem tabelas fictícias | Tabelas vêm do produto. SQL no laboratório PGlite é sintético e descartável |
| `src/lib/utils.ts.example` | Helper `cn` com `clsx` e `tailwind-merge` | Só pertence a UI Tailwind. Não é requisito de qualidade para todo projeto |

O teste SQL do validador gera uma tabela sintética, reaplica migrações, executa CRUD parametrizado e prova rollback de transação no PGlite. Isso tem valor como teste local, com custo adicional de dependência dev. Mantém separados o driver real `pg`, o mock de lifecycle e o engine embarcado. [Templates Next fixados](https://github.com/soumatheusgomes/vibe-coding-toolkit/tree/21b71b68679c11184f49c23168852014bf6dde8b/templates/next)

## Matriz de segurança e harness

| Recurso | O que existe | Adaptação e aceitação |
| --- | --- | --- |
| `templates/harness-evaluation/access.mjs` | Função deliberadamente vulnerável que só compara ownership | Manter fora de código de produção, com aviso. Baseline deve continuar falhando dois testes |
| `templates/harness-evaluation/AGENTS.md` | Define escopo da fixture, identidade/tenant, preservação, avaliador externo e restrições de serviços/publicação | Adaptar caminho do avaliador sem passar a solução ao agente. Incluir ponte Claude quando o cliente exigir |
| `templates/harness-evaluation/local-notes.txt` | Customização que deve permanecer byte a byte | Verificada pelo avaliador. Preservar hash/revisão e conteúdo da fixture |
| `templates/hooks/hook-io.mjs.example` | Leitura síncrona ilimitada do stdin e parse JSON que rejeita inválido/null | Implementar limite de tamanho e objeto não-array, validar campos por evento, escolher fail-open/closed conforme cliente. Não registrar payload bruto |
| `templates/security-review.md.template` | Relatório privado com revisão, escopo, fluxo alcançável, pré-requisito, impacto, contraprova e limitações | Distribuir template público. Resultado de auditoria real precisa destino privado e consentimento para transmissão |
| `docs/prompts/13-security-review.md` | Fluxo read-only de baseline ou diff exato, sem instalar ferramentas, produzir fixes ou enviar código | Converter em skill/adotação sob demanda, preservando autor e limites. Testar revisão de fixture sem alterar seu hash |
| `docs/prompts/14-harness-evaluation.md` | Seleção de casos, execução em cópias descartáveis e avaliador protegido | Tornar invocação local e versionada. Resultado por caso com pass/fail/not-run e evidência independente |
| `docs/prompts/15-harness-improvement.md` | Método nativo inspirado em Harness2 com um candidato e comparação com mesma entrada | Pode ser capacidade do AgentVigor sem novo backend. Manter teste fixo e limite. Não prometer ganhos dos benchmarks oficiais |
| `docs/prompts/16-security-audit.md` | Auditoria avançada opt-in com modos AUDIT/PLAN/FIX/VERIFY e quatro artefatos privados | Incorporar workflow sob seleção explícita. Não acionar auditoria ampla automaticamente por instalar toolkit |
| `docs/07-harness-evaluation.md` | Sete casos, dos quais fix, handoff obsoleto e review usam a fixture. Rerun setup, conflito, bloqueio e resume exigem observação do host | Implementar laboratório determinístico primeiro. Uso real de skill, pausa/reinício e ausência de rede exigem observação externa |
| `docs/tools/23-harness2.md` | Método nativo e laboratório oficial claramente distintos. Demo fixada em `1cfe254e8d25b15f37048c3730134686abe60335` | Integrar método nativo primeiro. CLI oficial pede Python/uv, ambiente isolado e decisões separadas sobre modelo/custos |
| `docs/08-security-audit.md`, `docs/tools/20-security-review.md` | Guias de limites, fonte de padrões, severidade/confiança e privacidade | Manter coverage e incertezas. Advisory ou scanner ausente não prova exposição nem segurança |
| `docs/tools/10-hooks-best-practices.md` | Explica hooks de Claude e exemplos, com os helpers acima | Hook e código de saída são contratos do cliente. Exemplo de formatter com `execFileSync('npx', ...)` não é portátil ao `.cmd` do Windows |
| `templates/project-docs/quality.md.template`, `setup.md.template` | Locais canônicos para comandos e evidência, sem inventar cobertura | Incorporar a documentação da configuração realmente aplicada, omitindo recursos que não foram selecionados |

O `validate-harness.mjs` importa e executa código do diretório fornecido. Ele é avaliador de fixture confiável em ambiente descartável, não sandbox para executar submissões hostis. Um agente que pode alterar o avaliador ou ler respostas/rubricas pode invalidar o experimento. [Harness upstream fixado](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/07-harness-evaluation.md)

Os comandos oficiais do laboratório Harness2 são `harness2-demo`, `harness2-setup`, `harness2-check` e `harness2`, conforme a revisão do guia. A instalação usa Python 3.12–3.13 com `uv`; o upstream recomenda Linux para benchmarks. O demo determinístico não exige credenciais de modelo. Benchmarks reais usam serviços/modelos, dependências extras e podem cobrar API. A rota Codex documentada usa Responses API e não prova reuso de login ChatGPT. Não foi instalado ou executado aqui. [Metadados oficiais fixados](https://github.com/google-research/harness2/blob/1cfe254e8d25b15f37048c3730134686abe60335/pyproject.toml), [setup oficial fixado](https://github.com/google-research/harness2/blob/1cfe254e8d25b15f37048c3730134686abe60335/docs/SETUP.md)

## Guias e prompts técnicos lidos integralmente

Além de todos os recursos executáveis listados, a auditoria leu os arquivos a seguir. Suas instruções são material de origem a adaptar, sem autoridade para mudar o ambiente por conta própria.

| Arquivo | Contrato técnico relevante |
| --- | --- |
| `AGENTS.md`, `CLAUDE.md` | Repositório de receitas sem app na raiz, preservação, escopos e ponte Claude |
| `docs/05-toolkit-validation.md` | Comandos de validação e limites de evidência, separando resultados históricos do upstream |
| `docs/06-project-defaults.md` | Perfil Next/Drizzle/Pino/Zod, schema vazio, comandos de migração explícitos e nove documentos gerados |
| `docs/tools/06-eslint-biome-quality-gates.md` | Adoção proporcional, typed lint separado, Biome opcional e tratamento de warnings |
| `docs/tools/17-nextjs-runtime-and-performance.md` | Skills Next requerem versão/bundler/browser e preflight MCP. HTTP 200 sozinho não valida o loop |
| `docs/tools/18-postgresql-skills.md` | PostgreSQL independente de fornecedor. `EXPLAIN ANALYZE` executa e depende de alvo autorizado |
| `docs/tools/19-github-ci-repair.md` | `gh-fix-ci` tem foco Codex. Arquivos copiados para Claude não demonstram compatibilidade de workflow |
| `docs/prompts/01-project-sanitation.md` | Baseline real, inventário antes de remover dependência/código e mudanças pequenas |
| `docs/prompts/02-eslint-warning-burndown.md` | Contagem por regra/arquivo, preservação de comportamento e plano por ondas |
| `docs/prompts/07-eslint-complete-setup.md` | Seções 7.4–7.6 descrevem dinheiro, inputs e auth como ideias de regras a construir. O plugin entregue não as contém |
| `docs/prompts/08-eslint-quality-gates-install.md` | Copiar arquivos da mesma revisão, adaptar ao projeto e medir sem consertar todas as violações |
| `docs/prompts/09-file-size-refactor.md` | Separar por responsabilidade, preservar API, executar testes entre mudanças. Commits e parada por lote precisam seguir o pedido atual |

## Adaptações necessárias antes da incorporação

1. **Corrigir a base de versões do ESLint.** Os prompts 07 e 08 prescrevem major 9, e o prompt 08 informa genericamente que os helpers dependem de ESLint 9. `defineConfig` e `globalIgnores` entraram em 9.22.0. A página oficial também registra EOL do major 9 em 6 de agosto de 2026. Para novos perfis, selecionar uma versão suportada com peers compatíveis, fixar versões testadas e registrar exceção quando um projeto existente exigir manutenção do major anterior. Não copiar `eslint@^9` como padrão atual. [Release oficial](https://eslint.org/blog/2025/03/eslint-v9.22.0-released/)

2. **Remover dependência do Git implícito no validador de documentos.** `scripts/validate-docs.mjs:8` executa Git no diretório do snapshot. Sem `.git` próprio, Git pode descobrir o repositório pai e usar seu inventário. Os testes criam Git temporário. Receber um manifesto explícito torna o validador funcional em pacote npm, arquivo ZIP e checkout, preservando regressões sem repositórios aninhados. Validar também que alvos normalizados permanecem dentro da raiz autorizada.

3. **Conter ambiente e dependências do laboratório Next.** `scripts/validate-next.mjs:16` copia todo `process.env` e remove só URLs DB/log level específicos. Isso deixa outros tokens disponíveis aos processos baixados. `@latest`, `main` e `canary` não fixam a entrada. Usar ambiente permitido, homes/cache exclusivos, versões exatas e lockfile com integridade. Separar obtenção de dependências autorizada de execução offline quando possível. `npm audit` transmite metadados da árvore a um serviço e deve ser uma etapa de rede explícita.

4. **Separar qualidade de app e instalação de integrações.** O laboratório full instala 15 skills opcionais para os dois clientes. Um teste de Drizzle/lint não deve depender desses downloads. Distribuição, descoberta nativa e execução de workflow precisam de testes independentes por cliente. Os comandos atuais são locais ao projeto, mas a herança de ambiente torna o teste insuficiente para garantir isolamento global.

5. **Completar limites de subprocessos.** O runner Next usa strings estáticas em `execSync`, com timeout por comando, porém no `checkHttp` espera `await exited` sem limite após sinal. Uma falha de encerramento pode impedir cleanup até o timeout externo do CI. Adotar argv, cancelamento, timeout total/por etapa e encerramento escalonado apenas de processos próprios. Separar retenção de logs redigidos de limpeza da fixture.

6. **Validar eventos de hook de verdade.** O helper aceita arrays e primitivas e lê stdin sem limite. `parseHookEvent('42')`, `('true')` e `('[]')` foram reproduzidos. Exigir objeto não-array, tamanho e schema mínimo do evento antes de agir. O tutorial também converte caminho de tipo errado implicitamente em regex. Falha de conveniência e falha de controle de acesso precisam de políticas próprias, verificadas no cliente selecionado.

7. **Documentar alcance das regras.** `no-direct-console` não reconhece `console['log']`, destructuring ou aliases e não resolve shadowing. `no-direct-data-access` examina imports estáticos exatos. São controles úteis de convenção, sem provar isolamento de dados ou segurança de logging. Escolher pequenas extensões com testes reais somente quando esses padrões existirem no alvo.

8. **Corrigir exemplos conceituais que mudam lógica.** O guia ESLint/Biome divide a validação de `PREFIX-SUFFIX` com `const [prefix, suffix] = value.split('-')`, aceitando um terceiro segmento antes rejeitado pela regex original. O prompt 07 agrupa `eqeqeq` com formatação, embora a regra controle coerção/igualdade. A adaptação deve manter cardinalidade do input e revisar regras de correção sem removê-las como estilo. Esses exemplos não devem virar comandos/código publicados sem regressão.

9. **Preservar escopo e autorizações nas receitas.** Prompt 09 manda fazer commit a cada arquivo. Prompt 02 tem instruções divergentes de default e espera de decisão. A receita AgentVigor deve seguir a autorização já existente, manter mudanças verificáveis e não transformar seu padrão em permissão de publicar. A auditoria de conteúdo cobre essas contradições em maior detalhe.

10. **Manter relatórios de vulnerabilidade privados.** Templates/workflows podem ser distribuídos publicamente. Findings reais, traces e handoffs de auditoria precisam destino privado, redaction e escolha de transmissão. O arquivo presente é auditoria de implementação pública do toolkit, sem dados de sistemas privados.

## Dependências, custo e manutenção

| Grupo | Dependências efetivas | Custo e decisão |
| --- | --- | --- |
| Fixtures/avaliação local | Node, stdlib | Sem conta, rede ou API. Consome apenas CPU/tempo local |
| Docs original | Node e Git | Sem API. Adaptação por manifesto elimina Git como dependência operacional |
| Regras ESLint | ESLint local | Dev dependency no projeto selecionado, sem serviço ou cobrança de modelo |
| Preset avançado TS | ESLint, `@eslint/js`, `typescript-eslint`, import-x/resolver e TypeScript | Mais dependências e typed lint mais caro em CPU/RAM. Não ativar em JS ou stack incompatível |
| Next leve | Next/React/TypeScript, preset Next, ESLint | Somente perfil de app. Build instala dependências e pode consumir recursos relevantes |
| Next servidor completo | `drizzle-orm`, `pg`, `server-only`, `zod`, `pino`, `clsx`, `tailwind-merge` | Runtime do app criado. Não aumentar dependências do CLI por distribuir os templates |
| Dev do laboratório Next | `@types/node`, `@types/pg`, `drizzle-kit`, `@next/env`, `vitest`, plugin Drizzle, `@electric-sql/pglite` e ferramentas de lint | Download/CPU/armazenamento, auditorias dinâmicas. `@next/env` deve acompanhar exatamente a versão de Next testada |
| Skills opcionais do full smoke | CLI `skills` e 15 diretórios de fontes diferentes | Download/revisão/licenças e instruções específicas por host. Não obrigatórios para validar um app básico |
| Harness nativo | Agente atual e capacidades realmente disponíveis | Pode consumir a franquia/tokens do agente. Um candidato limitado, sem troca implícita de provider/modelo |
| Harness2 oficial | Python 3.12–3.13, uv, pacote com extras conforme benchmark, ferramentas de SO | Demo local pode funcionar sem modelo. Benchmarks exigem orçamento separado e fontes/datasets/licenças próprios |

Não há lockfile de app na raiz do upstream, que é um repositório de receitas. As versões históricas documentadas pertencem a apps descartáveis de execuções anteriores. A integração deverá introduzir um manifesto de combinações realmente validadas e hashes de origem. O resultado do audit de dependências precisa ser datado e contextualizado por alcance e uso, sem supressão de erros para produzir um status verde.

## Plano de integração sugerido

1. Distribuir assets de origem fixada sob namespace próprio de terceiro, incluindo MIT/Matheus e um manifesto com path, hash, revisão e classificação `copied`/`adapted`/`original`. Impedir que o inventário do pacote publique cache, banco ou relatório de teste.
2. Integrar fixture/avaliador de autorização como segundo cenário do laboratório, mantendo o cenário original do AgentVigor. Validar baseline deliberadamente vermelho, solução correta verde e preservação de arquivos. Separar observações fornecidas ao benchmark de resultados executados pelo avaliador.
3. Adaptar validador docs para inventário explícito. Reaproveitar os nove casos, retirando Git temporário. Validar README dos três idiomas, imagens e links gerados sobre o pacote real.
4. Oferecer adoção de quality gates por projeto, começando pelas três regras e verificador, com planejamento, dry-run, backup e recusa de sobrescrita. Preservar lint existente. Instalar dependências só quando selecionado e autorizado. O relatório precisa informar regras, comandos, contagens e limitações.
5. Publicar perfil Next como recurso opcional separado da instalação global de skills. Usar destino descartável inicialmente, versões exatas e scripts completos. Executar lint rápido, typed lint, self-check, Vitest, tipos, server-only e build, depois SQL e HTTP locais. Ativar rede e audits separadamente com consentimento observável.
6. Incorporar segurança, avaliação e melhoria de harness como workflows/skills sob demanda que apontam para assets locais fixados. Manter avançado audit opt-in, relatórios privados e uma comparação por falha observada. Só afirmar descoberta/uso após consulta ou tarefa observada no cliente correspondente.
7. Validar matriz Windows/macOS Intel/macOS ARM/Linux/WSL. Testes de filesystem precisam registrar características do volume. Executar o artefato instalado, incluindo launchers reais, com caminhos contendo espaços. CI remoto passa a compor a evidência somente após observar seu resultado.

As opções novas desse plano são propostas. Esta auditoria não adicionou novos comandos ao CLI nem instalou esses perfis no computador.

## Comandos observados e reprodução

Os comandos abaixo correspondem a entry points que existem no snapshot. No PowerShell, executar dentro da pasta extraída indicada no início deste relatório, com `TEMP/TMP` apontando para diretório de teste autorizado. O coordenador usou um wrapper Node em memória para isolar essas variáveis, passar ambiente mínimo, impor timeout de 30 segundos e limpar a pasta exclusiva.

```powershell
node --test scripts/validate-harness.test.mjs
node scripts/validate-harness.mjs templates/harness-evaluation
```

O primeiro comando deve aprovar dois testes. O segundo deve sair com código 1, cinco testes aprovados e duas falhas, porque mede a fixture original deliberadamente insegura. Ele não deve ser colocado como gate que espera verde para o código original.

Em WSL Ubuntu, o coordenador executou os mesmos entry points pelo Node Linux 24.15.0 disponível no laboratório local `out/wsl-node/`, com `TMPDIR` isolado. Isso comprova o comportamento dos avaliadores em WSL, sem estabelecer equivalência a todos os mounts/distribuições Linux.

Após adaptar o inventário do validador de documentos e preparar uma fixture com ESLint compatível, os entry points existentes a validar são os seguintes. Eles permanecem pendentes nesta auditoria.

```text
node --test scripts/validate-docs.test.mjs
node scripts/validate-docs.mjs
node templates/eslint/verify.mjs templates/eslint/eslint-rules/index.cjs
node scripts/check-eslint.mjs
node scripts/validate-next.mjs
```

`check-eslint` deve usar cwd de um app descartável com suas dependências. `validate-next` original não deve ser executado automaticamente até concluir as adaptações de isolamento, versões, rede e encerramento descritas neste relatório. Os testes de app gerados usam `lint`, `typecheck`, `lint:typed`, `lint:rules`, `test`, `build`, `db:generate` e `db:migrate`; a escolha de migração para um banco real exige destino autorizado.

## Próximo passo

Implementar primeiro o inventário fixado de componentes e o avaliador de harness preservando a origem. Em seguida, adaptar o validador de documentos sem Git aninhado e preparar uma fixture ESLint com versão suportada/peers verificados. O laboratório Next e sua instalação de dependências devem permanecer separados até sua configuração ser revisável e reproduzível.
