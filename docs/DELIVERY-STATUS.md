# Delivery status / Estado da entrega / Estado de entrega

## Português brasileiro

Este relatório registra a política de suporte da v1.0.0: OpenAI Codex é o
cliente principal estável; Claude Code permanece experimental, sem homologação
nativa. A paridade completa com o Vibe não é reivindicada. A consulta ao HEAD
do Vibe retornou novamente
`21b71b68679c11184f49c23168852014bf6dde8b`. A atribuição MIT de Matheus Gomes é
preservada. Rafael Pereira mantém as implementações originais do AgentVigor.

| Entrega solicitada | Fonte e evidência atual |
| --- | --- |
| A. Matriz detalhada | [Paridade](upstream-audit/PARITY.md), [matriz por recurso](upstream-audit/MATRIX.md), [inventário de conteúdo](upstream-audit/CONTENT-AUDIT.md) e [engenharia](upstream-audit/ENGINEERING-AUDIT.md). As 121 entradas do snapshot têm hashes. |
| B. Procedimentos completos offline | Os 16 IDs abaixo têm QUICK localizado e FULL com procedimento original completo e links locais. `test/full-workflows.test.mjs` verifica cobertura, bytes e referências. |
| C. Funcionalidades executáveis | CLI de skills, projeto, qualidade, harness, monitor, catálogo e integrações opcionais. `test/*.test.mjs` cobre os contratos. O preset `next-postgres` acrescenta módulos originais e testes de ambiente, logs e pool. [Validação](NEXT-POSTGRES-PRESET.md). |
| D. Ferramentas externas | [Gerenciamento](INTEGRATION-MANAGEMENT.md) separa os estados de instalação, configuração, descoberta e invocação. O inventário da máquina está na tabela seguinte. |
| E. Sessões reais | Evidências nativas delimitadas do Codex cobrem sete categorias, descoberta global, leitura FULL, revisão, auditoria e onda multiagente. Claude Code é experimental; execução nativa UNVERIFIED. Escopo no [registro nativo](NATIVE-CLIENT-VALIDATION.md). |
| F. Regressões e mudanças | Preset PostgreSQL opt-in. Tailwind agora limita a busca a `src` nos presets Next. O leitor de arquivos trata leituras parciais em WSL. Hooks e registros preexistentes exigem controle de propriedade. [Changelog](../CHANGELOG.md). |
| G. Compatibilidade | O commit `1dbdf09` passou nos seis jobs de CI, incluindo download oficial, versão e rollback offline de RTK OSS e Full em Windows x64, Ubuntu x64 e macOS Intel/ARM. CLI/benchmark e transações também foram executados em WSL. [CI](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/actions/runs/41977347205). |
| H. Comparação | Vibe fornece procedimentos, templates, regras ESLint, harness e práticas. AgentVigor acrescenta roteamento global, cinco skills próprias, CLI, planos vinculados ao conteúdo, instalação opcional, inventário e rollback. [Comparação detalhada](upstream-audit/MATRIX.md). |
| I. Lacunas | Prioridades e impactos abaixo. Referências e arquivos presentes são classificados separadamente de comportamento homologado. |
| J. Publicação e reprodução | v1.0.0 é distribuída por GitHub Releases, sem publicação npm. O histórico dos [pré-releases](CANDIDATE-0.3-rc.3.md) permanece preservado. |

### Inventário observado na máquina

| Ferramenta | Instalação observada | Configuração | Descoberta / invocação |
| --- | --- | --- | --- |
| RTK | 1.1.0 no PATH | UNVERIFIED no inventário do perfil real | UNVERIFIED |
| Superpowers | Registro nativo 7.0.2 instalado e habilitado | Gerenciamento do perfil real UNVERIFIED | DISCOVERED no cache nativo; invocação TDD delimitada VERIFIED. Demais skills/hooks UNVERIFIED |
| Ponytail | Registro nativo 5.3.3 instalado e habilitado | Gerenciamento do perfil real UNVERIFIED | DISCOVERED no cache nativo; invocação delimitada VERIFIED junto ao TDD. Demais skills/hooks UNVERIFIED |
| Find Skills | Manifesto da versão auditada presente | CONFIGURED | DISCOVERED no Codex, scope user e enabled. Invocação UNVERIFIED |
| Graphify | 0.9.10 no PATH. Versão gerenciada auditada é 0.9.102 | UNVERIFIED no perfil real | Skill pessoal DISCOVERED no Codex. Invocação da versão gerenciada UNVERIFIED |
| Claude Code | Launcher ausente na verificação de 2026-11-05 | Adaptador e raízes compatíveis preservados | EXPERIMENTAL; descoberta e invocação nativas UNVERIFIED |

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

### Matriz de suporte e aceitação v1.0.0

| Requisito | Estado | Evidência | Pendência |
| --- | --- | --- | --- |
| OpenAI Codex como cliente principal | STABLE | Descoberta e invocação delimitadas no [registro nativo](NATIVE-CLIENT-VALIDATION.md), mais CI e smoke do pacote | Evidência vale para cenários e plataformas descritos; não implica comportamento universal |
| Instalação global, descoberta, idempotência e rollback Codex | PASS | Instalação em home isolado, descoberta nativa, repetição/update e rollback sem perda das skills de terceiros | Revalidar somente perante regressão |
| Catálogo de 16 fluxos QUICK/FULL | PASS | Procedimentos localizados e snapshot upstream offline; cobertura/bytes/links verificados pela suíte | FULL documentado não significa execução completa de todos os procedimentos |
| Revisão FULL e auditoria FULL em fixture | PASS | [Registro nativo](NATIVE-CLIENT-VALIDATION.md); quatro artefatos conferidos e revisão com dois revisores | Scanners, advisories, privacidade exclusiva e segurança de produção não foram homologados |
| Skills Codex e procedimentos QUICK/FULL | PASS | As seis skills aparecem no `skills/list` nativo em escopo de usuário; o roteador carregou um fluxo FULL em sessão real. [Registro](NATIVE-CLIENT-VALIDATION.md) | Invocações de todas as skills e execução completa de todos os fluxos não foram comprovadas |
| Ondas multiagentes | PASS | [Registro nativo](NATIVE-CLIENT-VALIDATION.md); dois workers sobrepostos, testes independentes aprovados e fixture preservada | Não generaliza para projetos ou cargas arbitrárias |
| Migração PostgreSQL real | PASS | [Preset PostgreSQL](NEXT-POSTGRES-PRESET.md); PostgreSQL 16.15 no WSL/Linux, repetição sem duplicação e transação revertida | Reproduzir somente se o script ou preset mudar |
| Claude Code | EXPERIMENTAL / UNVERIFIED | Adaptador, manifests, raízes, skills e procedimentos preservados; testes de filesystem isolado | Nenhuma homologação nativa; não é gate da estabilidade Codex |
| Invocação de integrações gerenciadas no cliente | UNVERIFIED | [Inventário](INTEGRATION-MANAGEMENT.md) e provas delimitadas no [registro nativo](NATIVE-CLIENT-VALIDATION.md) | Separar descoberta pessoal, instalação gerenciada e execução real por integração |
| Segurança do pacote e licenças | PASS | `LICENSE`, avisos upstream, inventário e varredura de padrões de credenciais no artefato; [política](../SECURITY.md) | Não equivale a análise geral com scanners/advisories ou certificação de produção |
| Scanners gerais e advisories | UNVERIFIED | Não foram executados como auditoria geral para esta release | Não declarar segurança completa; revisar separadamente se exigido pelo ambiente de implantação |
| Economia total de tokens | UNVERIFIED | Ilustração conceitual nos READMEs; benchmark pareado não medido | Não anunciar percentual como resultado do AgentVigor |
| Revisão candidata, CI e pacote v1.0.0 | PASS quando publicada | O commit da release, a matriz Actions, o inventário do tarball e o SHA-256 são registrados na [release oficial](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/releases/tag/v1.0.0) | Comparar tag, commit, asset e checksum antes de instalar |

Os pré-releases anteriores e seus assets permanecem preservados. A release estável cobre Codex conforme os limites acima; Claude segue experimental. O relatório não declara paridade completa com o Vibe, segurança de produção nem medição geral de economia de tokens.

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

The A–J table above links the requested deliverables and evidence. All sixteen
original FULL procedures and the 121-file pinned snapshot are available offline.
The stable support tier is OpenAI Codex; Claude Code is experimental. Codex
native evidence includes bounded discovery and invocation, review, fixture audit,
and a two-worker implementation wave. See the linked records for each limit.

The prior rc.3 checkpoint records 116 passing local tests and six passing CI jobs.
The v1.0.0 release must pass its own full local suite, isolated package smoke and
six-job matrix. Claude native behavior remains UNVERIFIED and is not a release
gate. Integration-specific invocation and general production security scanning
also remain UNVERIFIED. PostgreSQL migration evidence covers a synthetic project
against a temporary PostgreSQL 16.15 instance; it is not production certification.
Token savings have not been measured. The 90% illustration is conceptual.

Use the reproduction commands above with `npm.cmd` in Windows PowerShell or
`npm` on macOS/Linux. Check release notes, package hash and the exact client
support tier before installing.

## Español

La tabla A–J enlaza las entregas y sus evidencias. Los dieciséis procedimientos
FULL originales y el snapshot fijado de 121 archivos están disponibles offline.
El nivel de soporte estable es OpenAI Codex; Claude Code es experimental. Las
pruebas nativas de Codex cubren descubrimiento e invocación delimitados, revisión,
auditoría en fixture y una ola de dos workers. Consulta cada registro para ver
los límites.

El checkpoint rc.3 anterior registra 116 pruebas locales aprobadas y seis jobs
CI aprobados. La release v1.0.0 debe pasar su propia suite local, smoke aislado
del paquete y matriz de seis jobs. El comportamiento nativo de Claude sigue
UNVERIFIED y no es un gate de release. La invocación de integraciones y el
escaneo general de seguridad de producción también siguen UNVERIFIED. PostgreSQL
se probó con un proyecto sintético y una instancia temporal 16.15; no certifica
producción. El ahorro de tokens no se midió; la ilustración del 90% es conceptual.

Usa los comandos anteriores con `npm.cmd` en PowerShell de Windows o `npm` en
macOS/Linux. Comprueba las notas, el hash del paquete y el nivel de soporte del
cliente antes de instalar.
