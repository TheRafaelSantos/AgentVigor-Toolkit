# Delivery status / Estado da entrega / Estado de entrega

## Português brasileiro

Este relatório registra a situação em 5 de novembro de 2026. O objetivo de
paridade permanece ativo. A consulta ao HEAD do Vibe retornou novamente
`21b71b68679c11184f49c23168852014bf6dde8b`. A atribuição MIT de Matheus Gomes é
preservada. Rafael Pereira mantém as implementações originais do AgentVigor.

| Entrega solicitada | Fonte e evidência atual |
| --- | --- |
| A. Matriz detalhada | [Paridade](upstream-audit/PARITY.md), [matriz por recurso](upstream-audit/MATRIX.md), [inventário de conteúdo](upstream-audit/CONTENT-AUDIT.md) e [engenharia](upstream-audit/ENGINEERING-AUDIT.md). As 121 entradas do snapshot têm hashes. |
| B. Procedimentos completos offline | Os 16 IDs abaixo têm QUICK localizado e FULL com procedimento original completo e links locais. `test/full-workflows.test.mjs` verifica cobertura, bytes e referências. |
| C. Funcionalidades executáveis | CLI de skills, projeto, qualidade, harness, monitor, catálogo e integrações opcionais. `test/*.test.mjs` cobre os contratos. O preset `next-postgres` acrescenta módulos originais e testes de ambiente, logs e pool. [Validação](NEXT-POSTGRES-PRESET.md). |
| D. Ferramentas externas | [Gerenciamento](INTEGRATION-MANAGEMENT.md) separa os estados de instalação, configuração, descoberta e invocação. O inventário da máquina está na tabela seguinte. |
| E. Sessões reais | Há um caso delimitado em cada uma das sete categorias do Codex e uma sessão de leitura FULL. Os resultados e limites estão no [registro nativo](NATIVE-CLIENT-VALIDATION.md). Claude Code continua sem launcher no PATH inspecionado. |
| F. Regressões e mudanças | Preset PostgreSQL opt-in. Tailwind agora limita a busca a `src` nos presets Next. O leitor de arquivos trata leituras parciais em WSL. Hooks e registros preexistentes exigem controle de propriedade. [Changelog](../CHANGELOG.md). |
| G. Compatibilidade | O commit `1dbdf09` passou nos seis jobs de CI, incluindo download oficial, versão e rollback offline de RTK OSS e Full em Windows x64, Ubuntu x64 e macOS Intel/ARM. CLI/benchmark e transações também foram executados em WSL. [CI](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/actions/runs/41977347205). |
| H. Comparação | Vibe fornece procedimentos, templates, regras ESLint, harness e práticas. AgentVigor acrescenta roteamento global, cinco skills próprias, CLI, planos vinculados ao conteúdo, instalação opcional, inventário e rollback. [Comparação detalhada](upstream-audit/MATRIX.md). |
| I. Lacunas | Prioridades e impactos abaixo. Referências e arquivos presentes são classificados separadamente de comportamento homologado. |
| J. Publicação e reprodução | [Candidato rc.2](CANDIDATE-0.3-rc.2.md) e comandos abaixo. O rc.2 reúne o preset PostgreSQL e a correção WSL. O [rc.1](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/releases/tag/v0.3.0-rc.1) e seu tarball são preservados. |

### Inventário observado na máquina

| Ferramenta | Instalação observada | Configuração | Descoberta / invocação |
| --- | --- | --- | --- |
| RTK | 1.1.0 no PATH | UNVERIFIED no inventário do perfil real | UNVERIFIED |
| Superpowers | Manifesto nativo presente | UNVERIFIED no perfil real | UNVERIFIED no perfil real. Registro nativo validado em perfil descartável |
| Ponytail | Manifesto nativo presente | UNVERIFIED no perfil real | UNVERIFIED no perfil real. Registro nativo validado em perfil descartável |
| Find Skills | Manifesto da versão auditada presente | CONFIGURED | UNVERIFIED |
| Graphify | 0.9.10 no PATH. Versão gerenciada auditada é 0.9.102 | UNVERIFIED no perfil real | UNVERIFIED |

O inventário preservou as instalações pessoais. As seis skills AgentVigor usadas
nas sessões foram registradas temporariamente e revertidas para o estado inicial.

### Procedimentos completos

```text
project-sanitation
eslint-warning-burndown
multi-agent-code-review
brainstorm-to-plan
parallel-wave-dispatch
memory-bootstrap
eslint-complete-setup
eslint-quality-gates-install
file-size-refactor
development-environment-setup
next-project-bootstrap
existing-project-setup
security-review
harness-evaluation
harness-improvement
security-audit
```

### Lacunas por prioridade e impacto

| Prioridade | Lacuna | Impacto / próximo critério |
| --- | --- | --- |
| P1 | Revisão multiagente, dispatch e auditoria completa ainda sem execução integral do procedimento original | Casos delimitados de uma skill não provam todas as etapas. Executar procedimentos com evidências por etapa |
| P1 | Hooks automáticos e uso das integrações dentro dos clientes | Registro e instalação estão testados. Observar evento de hook e efeito real, com o cliente selecionado |
| P1 | Claude Code indisponível no PATH inspecionado | Homologação real e lifecycle dos plugins dependem de um cliente disponível. Manter handoff nativo e estados BLOCKED/UNVERIFIED |
| P2 | PostgreSQL real e aplicação de migração | Testes de pool usam mocks. SQL foi gerado sem conexão. Docker indisponível impede a prova local da migração |
| P2 | Smokes oficiais fora do Windows | RTK OSS/Full passou em todos os seis jobs, incluindo macOS Intel/ARM. Graphify, Find Skills e plugins precisam de smokes oficiais próprios fora do Windows |
| P2 | Economia de tokens | Busca seletiva observada. Comparação controlada e custo por modelo ainda sem medição |
| P2 | Publicação do rc.2 com as correções de WSL e o preset PostgreSQL | Publicar somente após os gates da revisão escolhida. O tarball rc.1 preserva a revisão anterior |

### Reprodução em PowerShell

Abra o PowerShell na pasta do repositório e execute:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
npm.cmd test
npm.cmd run smoke:package
node bin/agentvigor.mjs catalog --id security-audit --mode full --lang pt-BR
node bin/agentvigor.mjs integrations --agent codex --json
```

Os comandos de homologação real estão nos guias de cada integração e no registro
nativo. Os testes com conta real exigem `--allow-live`. Os smokes que baixam
ferramentas exigem o consentimento de rede indicado pelo respectivo script.
O rollback de instalação e de projetos é descrito nos guias correspondentes.

## English

The A–J table above links the requested deliverables and their evidence. All
16 complete original procedures and the 121-file pinned snapshot are offline.
AgentVigor adds global skills, five original specialists, the CLI, scoped plans,
optional integration management and rollback to the upstream Vibe resources.

Bounded native Codex cases ran in all seven requested categories. Full multi-agent
procedures, automatic hook execution and Claude Code acceptance remain pending.
The local inventory separates installation from configuration, discovery and
invocation. Windows official smokes and the six-job package/code matrix cover
different validation scopes. The PostgreSQL preset passed lint, types, nine
tests, build and synthetic SQL generation. A live PostgreSQL migration requires
an available database. Token savings have not been measured.

The published rc.1 tarball is preserved. The rc.2 candidate incorporates WSL
fixes and the PostgreSQL preset. Use the reproduction commands above with `npm` on
macOS/Linux. See the linked guides for scoped consent and rollback.

## Español

La tabla A–J enlaza las entregas solicitadas con sus evidencias. Los 16
procedimientos originales completos y el snapshot de 121 archivos están
disponibles sin conexión. AgentVigor añade skills globales, cinco especialistas
propias, CLI, planes acotados, gestión opcional de integraciones y reversión.

Se ejecutó un caso nativo delimitado en cada categoría de Codex. Siguen pendientes
los procedimientos multiagente completos, los hooks automáticos y Claude Code.
El inventario distingue instalación, configuración, descubrimiento e invocación.
Los smokes oficiales Windows y la matriz de seis jobs validan alcances distintos.
El preset PostgreSQL pasó lint, tipos, nueve pruebas, compilación y generación
de SQL sintético. Aplicar migraciones requiere una base disponible. El ahorro
de tokens sigue sin medición controlada.

El tarball rc.1 publicado se conserva. El candidato rc.2 incorpora las correcciones
WSL y el preset PostgreSQL. Usa los comandos anteriores con `npm`
en macOS/Linux y consulta cada guía para consentimiento y reversión.
