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
| J. Publicação e reprodução | [Candidato rc.3](CANDIDATE-0.3-rc.3.md), [rc.2](CANDIDATE-0.3-rc.2.md) e comandos abaixo. Os dois pré-releases anteriores permanecem preservados. |

### Inventário observado na máquina

| Ferramenta | Instalação observada | Configuração | Descoberta / invocação |
| --- | --- | --- | --- |
| RTK | 1.1.0 no PATH | UNVERIFIED no inventário do perfil real | UNVERIFIED |
| Superpowers | Registro nativo 7.0.2 instalado e habilitado | Gerenciamento do perfil real UNVERIFIED | DISCOVERED no cache nativo; invocação TDD delimitada VERIFIED. Demais skills/hooks UNVERIFIED |
| Ponytail | Registro nativo 5.3.3 instalado e habilitado | Gerenciamento do perfil real UNVERIFIED | DISCOVERED no cache nativo; invocação delimitada VERIFIED junto ao TDD. Demais skills/hooks UNVERIFIED |
| Find Skills | Manifesto da versão auditada presente | CONFIGURED | DISCOVERED no Codex, scope user e enabled. Invocação UNVERIFIED |
| Graphify | 0.9.10 no PATH. Versão gerenciada auditada é 0.9.102 | UNVERIFIED no perfil real | Skill pessoal DISCOVERED no Codex. Invocação da versão gerenciada UNVERIFIED |

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

### Estado de aceitação (5 de novembro de 2026)

| Requisito | Estado | Evidência | Pendência |
| --- | --- | --- | --- |
| Revisão FULL e auditoria FULL em fixture | PASS | [Registro nativo](NATIVE-CLIENT-VALIDATION.md); quatro artefatos conferidos e revisão com dois revisores | Scanners, advisories, privacidade exclusiva e segurança de produção não foram homologados |
| Ondas multiagentes | PASS | [Registro nativo](NATIVE-CLIENT-VALIDATION.md); dois workers sobrepostos, testes independentes aprovados e fixture preservada | Não generaliza para projetos ou cargas arbitrárias |
| Migração PostgreSQL real | PASS | [Preset PostgreSQL](NEXT-POSTGRES-PRESET.md); PostgreSQL 16.15 no WSL/Linux, repetição sem duplicação e transação revertida | Reproduzir somente se o script ou preset mudar |
| Claude Code nativo | BLOCKED | [Homologação Claude](CLAUDE-ACCEPTANCE.md); launcher ausente no PATH e locais padrão verificados nesta retomada | Executar a matriz quando houver cliente e sessão autenticada |
| Invocação de integrações gerenciadas no cliente | UNVERIFIED | [Inventário](INTEGRATION-MANAGEMENT.md) e provas delimitadas no [registro nativo](NATIVE-CLIENT-VALIDATION.md) | Separar descoberta pessoal, instalação gerenciada e execução real por integração |
| Segurança de produção, scanners e advisories | UNVERIFIED | Auditoria nativa em fixture sintética; [política de segurança](../SECURITY.md) | Nenhuma certificação de produção ou varredura geral nesta retomada |
| Instalação limpa do pacote rc.3 | PASS | Smoke Windows isolado, 320 arquivos, CLI, ambos os roots, catálogo QUICK/FULL, instalação repetida, update idempotente e rollback | A CI final ainda precisa empacotar e validar a mesma revisão |
| Suíte local completa | PASS | `npm.cmd test`: 116 aprovados, zero falhas, ignorados ou cancelados nesta revisão candidata | Nenhuma; repetir somente se o código mudar |
| CI de seis plataformas em `df74976` | PASS | [Run 41991406823](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/actions/runs/41991406823) | Essa CI antecede o candidato rc.3 |
| CI final do candidato rc.3 | UNVERIFIED | Será executada na revisão candidata publicada para avaliação | Aguardar os seis jobs antes de publicar o pré-release |
| Coerência dos documentos EN/PT-BR/ES | PASS | READMEs, relatório, política de segurança, PostgreSQL e homologação Claude revisados | Claude continua sem homologação nativa |
| Economia total de tokens | UNVERIFIED | Ilustração conceitual nos READMEs; benchmark pareado não medido | Não anunciar percentual como resultado do AgentVigor |
| Estável v1.0.0 | BLOCKED | Claude real e gates finais de candidato pendentes | Não publicar estável enquanto requisitos essenciais estiverem bloqueados |

O [v0.3.0-rc.2](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/releases/tag/v0.3.0-rc.2) e seus assets permanecem preservados. O candidato rc.3 foi validado localmente; sua publicação depende da CI de seis plataformas. A aceitação completa do Vibe Toolkit não é reivindicada.

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

The prior checkpoint records six passing CI jobs on commit `df74976`; this
candidate's 116-test local suite and package smoke also passed.
The native FULL audit, two-worker wave and live PostgreSQL migration also passed
in bounded fixtures. Claude Code acceptance is BLOCKED because no client
launcher was found during the 2026-11-05 retake. Managed integration invocation,
production security scanning and the final candidate's package/CI gates remain
UNVERIFIED. The pause checkpoint itself has no CI; the rc.3 matrix remains to
run before publication.
The local inventory separates installation from configuration, discovery and
invocation. Windows official smokes and the six-job package/code matrix cover
different validation scopes. The [PostgreSQL record](NEXT-POSTGRES-PRESET.md)
includes a real PostgreSQL 16.15 migration in WSL/Linux, repeat migration and
transaction rollback. Total token savings have not been measured.

The rc.1 and rc.2 pre-release artifacts remain preserved. Candidate rc.3 updates
acceptance records and security/reporting guidance; its local suite and isolated
package smoke passed. Publication still requires its six-job CI matrix. Use the
reproduction commands above with `npm` on macOS/Linux.

## Español

La tabla A–J enlaza las entregas solicitadas con sus evidencias. Los 16
procedimientos originales completos y el snapshot de 121 archivos están
disponibles sin conexión. AgentVigor añade skills globales, cinco especialistas
propias, CLI, planes acotados, gestión opcional de integraciones y reversión.

El checkpoint registra 116 pruebas locales y seis trabajos CI aprobados en
`df74976`. La auditoría FULL, la ola de dos workers y la migración PostgreSQL
real también pasaron en fixtures delimitadas. Claude Code está BLOCKED: no se
encontró un launcher el 2026-11-05. La invocación de integraciones gestionadas,
el escaneo de seguridad de producción y los gates del paquete/CI candidato
siguen UNVERIFIED. El checkpoint actual no tiene CI propia aprobada.
El inventario distingue instalación, configuración, descubrimiento e invocación.
Los smokes oficiales Windows y la matriz de seis jobs validan alcances distintos.
El [registro PostgreSQL](NEXT-POSTGRES-PRESET.md) incluye una migración real en
PostgreSQL 16.15 en WSL/Linux, repetición y rollback transaccional. El ahorro
total de tokens sigue sin medición controlada.

Los artefactos pre-release rc.1 y rc.2 siguen intactos. El candidato rc.3
actualiza los registros de aceptación y la política de seguridad; la suite local
y el smoke aislado del paquete pasaron. Aún requiere la matriz CI de seis jobs.
Usa los comandos anteriores con `npm` en macOS/Linux.
