# AgentVigor Toolkit — checkpoint de pausa

Data: 2026-11-05. Fuso de referência: America/Sao_Paulo.

**PAUSADO por instrução explícita do usuário.** Não continuar automaticamente,
iniciar agentes, repetir auditorias, executar testes longos ou publicar releases.
Retomar somente mediante nova instrução do usuário. O objetivo anterior foi
removido da sessão; não recriá-lo automaticamente.

## 1. Estado do projeto e Git

- Repositório: https://github.com/TheRafaelSantos/AgentVigor-Toolkit
- Branch: `main`.
- HEAD antes deste checkpoint: `df74976c1ef4ac22ac19fb4f95e0e25f510dd887`.
- Nesse momento, `origin/main` e o HEAD remoto apontavam para o mesmo commit;
  não havia commits locais sem push.
- O commit que contém este arquivo preserva os scripts já executados e os
  registros locais de homologação. Identifique-o com
  `git log -1 --format=fuller -- docs/PAUSE-HANDOFF.md`.
- O checkpoint usa `[skip ci]` para respeitar a pausa e não iniciar outra matriz
  de testes. Seu HEAD não deve ser apresentado como um novo commit aprovado em CI.
- Não houve force push, reset destrutivo ou alteração de releases anteriores.

## 2. Último commit validado e publicação

Último commit aprovado na matriz completa:
`df74976c1ef4ac22ac19fb4f95e0e25f510dd887`.

[CI 41991406823](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/actions/runs/41991406823):
seis jobs concluídos com sucesso — Windows Node 22/24, Ubuntu Node 24/26,
macOS Intel Node 24 e macOS ARM Node 24. Inclui testes, empacotamento,
RTK OSS/Full, Find Skills oficial e Graphify oficial com extração AST e rollback.

Versão publicada: [v0.3.0-rc.2](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/releases/tag/v0.3.0-rc.2),
pré-release, revisão `11e7762731e3fa156a9fb80411f1d17d7adad85d`.
Tarball: `agentvigor-0.3.0-rc.2.tgz`, 8.152.636 bytes.
SHA-256: `fe801fcbaaec64ec4fa545177dfd47a194e87e6bd6f501cf9d35581af2f686a6`.
O digest do asset GitHub foi conferido. Não há publicação no registro npm nem
versão estável. Commits posteriores ao tarball incluem provas adicionais;
não confundir a cobertura do pacote publicado com a do checkout atual.

## 3. Trabalho preservado neste checkpoint

Alterações concluídas e verificadas, antes locais:

- `docs/GRAPHIFY-MANAGEMENT.md`: resultado da matriz oficial Graphify.
- `docs/NATIVE-CLIENT-VALIDATION.md`: auditoria FULL concluída e ondas nativas,
  com limites e tentativas anteriores preservados.
- `docs/upstream-audit/PARITY.md`: estados das provas de auditoria e ondas.
- `scripts/smoke-codex-waves.mjs`: prova real com dois workers, sobreposição,
  testes independentes e preservação do trabalho do usuário.
- `scripts/smoke-postgres.sh`: migração real do preset em cluster PostgreSQL
  temporário do Linux, repetição e rollback de transação.

**Rascunho incompleto, preservado localmente e fora do commit:**

- `docs/CLAUDE-ACCEPTANCE.md`, 10.051 bytes.
- SHA-256: `0ab1934245839e0191eb174a1a6b2faf0853df48ddfa47e216fcdcbe8b94486f`.
- Guia manual de homologação do Claude, ainda sem revisão final de completude,
  exemplos e traduções. Não foi executado com Claude. Não tratá-lo como entrega
  concluída, nem removê-lo com `git clean`.

Backup local das seis alterações anteriores ao checkpoint:
`out/pause-checkpoint-2026-11-05/`, com cópias dos arquivos e `FILES.json`
contendo hashes e tamanhos. Essa pasta é ignorada pelo Git.

## 4. Testes concluídos

- Última suíte local completa: **116 aprovados, zero falhas, zero ignorados**.
  Registro local: `out/expanded-integration-tests.log`.
- Matriz completa de seis jobs aprovada no commit indicado na seção 2.
- Pacote rc.2: smoke Windows de 317 arquivos e instalação offline do mesmo
  tarball em WSL, catálogo FULL, instalação de seis skills e rollback.
- Codex real: um caso delimitado em desenvolvimento, revisão, depuração,
  segurança, contexto, recuperação e bootstrap; descoberta global das seis skills.
- Revisão FULL: dois revisores nativos iniciados/concluídos, validação e
  deduplicação pelo coordenador, código zero e fonte/HEAD preservados.
- Auditoria FULL: código zero, leitura FULL, quatro relatórios atuais, validação
  estrutural/IDs/evidências, fonte e HEAD preservados. Um achado confirmado e um
  candidato separados. Rollback das skills retornou a `not-installed`, zero arquivos.
- Onda FULL: dois workers sobrepostos, ambos concluídos; dois testes com dez
  asserções passaram. Casos de tenant ausente/vazio/nulo incluídos. HEAD, testes
  e nota do usuário preservados; nenhum arquivo extra.
- Ponytail/Superpowers TDD: invocação por nomes qualificados do cache nativo,
  falha antes da correção, mesmo teste aprovado depois e checagem independente.
- RTK: reescrita e execução observadas em fixture isolada usando uma cópia
  temporária byte-idêntica do binário. Nenhum PATH persistente foi alterado.
- Graphify: runtime privado 0.9.102, configuração dos dois destinos, extração
  estrutural sem modelo, integridade após uso e rollback offline. Aprovado no
  Windows, WSL e nos seis jobs de CI.
- PostgreSQL real: WSL/Linux, Node 24.15.0, PostgreSQL 16.15 dos pacotes Ubuntu.
  Preset gerado, SQL gerado e aplicado, segunda migração sem duplicação,
  inserção/leitura/rollback confirmados e TCP desabilitado. Cluster temporário
  encerrado pelo trap do script; nenhuma instalação global ou Docker utilizado.

## 5. Falhas e limites que não devem ser ocultados

- CI `41990956937`, commit `aef99e0`, falhou no Windows porque o caminho de uv
  retornado pela action não continha `.exe`. Corrigido em `df74976`; a nova
  matriz passou. Linux e macOS já haviam passado na tentativa anterior.
- Auditorias anteriores tiveram timeouts, uma falha de acesso após alteração
  de ACL pela sessão e uma saída de cliente com código 1. Não foram contadas
  como sucesso. Artefatos recuperados e observações continuam locais.
- O primeiro transporte de revisão encerrava ao receber a conclusão de um
  filho. Foi corrigido para esperar o coordenador, com teste de regressão.
- O detector antigo não reconhecia `subAgentActivity`. O atual rejeita evidência
  composta apenas de waits, narrativa ou IDs duplicados.
- O primeiro smoke PostgreSQL tentou escrever o schema num caminho inexistente.
  Corrigido para `src/db/schema/index.ts`; o script atual passou com banco real.
- O primeiro cenário de ondas tinha cobertura menor de identidade. A cobertura
  foi ampliada e a execução com dez asserções passou.
- O caminho pessoal WinGet do RTK falhou no sandbox. A prova com cópia temporária
  não homologa automaticamente esse caminho nem todos os runtimes gerenciados.
- A auditoria registrou uma entrada herdada adicional na ACL, de origem não
  verificada. Privacidade exclusiva e igualdade de ACL não foram homologadas.
- Scanners/advisories e controles de produção não foram certificados pela
  auditoria da fixture. Nenhuma economia de tokens foi medida nesta homologação.

## 6. Funcionalidades prontas e pendências

Disponíveis: cinco skills autorais e roteador; 16 procedimentos QUICK/FULL;
snapshot offline de 121 arquivos com hashes, links e atribuição MIT a Matheus
Gomes; instalação/rollback gerenciados; CLI de projeto/qualidade/harness/monitor;
presets Next e PostgreSQL; integrações opcionais documentadas; README com as
quatro imagens conceituais, sem tratar seus números como benchmark.

Pendente para uma retomada autorizada:

1. Revisar/finalizar o rascunho de homologação Claude. O launcher não foi
   encontrado; não criar conta ou alterar autenticação para forçar provas.
2. Homologar Claude e seus plugins quando o cliente estiver disponível. Operações
   gerenciadas não homologadas permanecem BLOCKED/UNVERIFIED conforme os guias.
3. Ampliar invocação de integrações dentro dos clientes; separar instalações
   pessoais, registros nativos, runtime gerenciado e execução efetiva.
4. Atualizar a consolidação documental: `docs/DELIVERY-STATUS.md` e partes de
   `docs/NEXT-POSTGRES-PRESET.md` ainda descrevem auditoria/ondas/migração como
   pendentes. Este checkpoint registra as provas posteriores; esses documentos
   não foram reformulados durante a pausa.
5. Rever comparabilidade/benchmarks apenas se solicitado; não inferir redução
   de tokens, risco ou custo dos casos sintéticos e das imagens.
6. Fazer auditoria final de aceitação contra os requisitos originais antes de
   declarar paridade completa ou considerar qualquer versão estável.

## 7. Processos e agentes na pausa

- Nenhum subagente em execução na árvore desta tarefa. Dois agentes estavam em
  erro por limite de uso e um concluído; nenhum escrevia arquivos.
- Nenhum processo de smoke desta tarefa encontrado no Windows ou WSL.
- Nenhum servidor PostgreSQL com prefixo de teste nem diretório de cluster
  `agentvigor-pg-integration.*` permaneceu em `/tmp` na verificação final.
- O estado das seis skills temporárias foi conferido: `not-installed`, zero
  arquivos gerenciados. Diários privados são preservados.
- O Codex principal do aplicativo e outro processo do aplicativo não identificado
  como smoke foram preservados. Processos WSL/Node/serviços preexistentes não
  foram encerrados. Nenhuma parada global de Docker, WSL ou serviços foi feita.
- Não há operação em andamento desta tarefa aguardando continuação. O CI do
  último commit validado já estava concluído; o checkpoint não dispara nova CI.

## 8. Evidências locais e transporte para outra máquina

Preservar a pasta ignorada `out/` localmente. Ela pode conter caminhos, metadados
e logs privados: **não adicionar integralmente ao Git nem copiar para relatórios
públicos**. Este documento não contém credenciais nem transcrições privadas.

Referências locais úteis:

- `out/codex-full-panel.json`, `out/codex-full-audit.json` e seus receipts/falhas.
- `out/full-security-artifacts/`: quatro relatórios da fixture sintética.
- `out/codex-native-wave.json`: resultado final; primeira especificação preservada
  separadamente em `out/codex-native-wave-first-spec.json`.
- `out/codex-native-plugin-behavior.json`, `out/codex-rtk-hook.json`.
- `out/release-0.3.0-rc.2/`: tarball, checksum e metadados da publicação.
- `out/wsl-node/`, `out/wsl-uv/`, `out/wsl-postgres/`: ferramentas/artefatos locais
  dos testes. Não são dependências globais nem conteúdo da release.
- `out/pause-checkpoint-2026-11-05/`: backup e hashes do trabalho antes da pausa.

Ao mudar de máquina, um clone não recuperará o rascunho não rastreado nem `out/`.
Copiar esses itens por um canal privado e conferir seus hashes. Não usar limpeza
de arquivos ignorados, reinstalação global ou reset para "organizar" a retomada.

## 9. Comandos para retomar — somente após nova autorização

Abra o PowerShell pelo Explorer na pasta do checkout, que contém `package.json`.
Primeiro leia e confira o estado; nenhum comando abaixo inicia testes ou agentes:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git log -1 --format=fuller -- docs/PAUSE-HANDOFF.md
git log --oneline origin/main..HEAD
git ls-remote origin refs/heads/main
Get-Content docs/PAUSE-HANDOFF.md
Get-FileHash docs/CLAUDE-ACCEPTANCE.md -Algorithm SHA256
gh run view 41991406823 --json status,conclusion,headSha
```

Preserve o rascunho e reconcilie alterações novas antes de qualquer pull, edição
ou teste. Não repetir automaticamente os testes já aprovados. Após definir a
próxima alteração e receber autorização de retomada, usar apenas o check pertinente:

```powershell
# Verificadores locais, caso sejam alterados:
node --test test/codex-appserver.test.mjs test/audit-artifacts.test.mjs test/panel-evidence.test.mjs
# Suíte completa apenas se as próximas mudanças justificarem:
npm.cmd test
```

Para reproduzir os testes reais posteriormente, selecione uma única prova;
eles usam a conta atual e precisam de autorização explícita de retomada:

```powershell
$nativeCodex = Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\bin') -Filter codex.exe -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First 1
& $nativeCodex.FullName --version
# Escolha apenas o caso necessário:
node scripts/smoke-codex-full-procedures.mjs $nativeCodex.FullName --allow-live audit
# Alternativa para a onda, em outra execução deliberada:
node scripts/smoke-codex-waves.mjs $nativeCodex.FullName --allow-live
```

Auditoria/revisão do runner exigem ausência de instalação AgentVigor gerenciada
preexistente; não removê-la para forçar o teste. Conferir `status` e os guias.

O teste PostgreSQL usa somente os binários locais já preservados. Se faltarem,
registrar o pré-requisito ausente e planejar sua preparação separadamente:

```powershell
$checkout = (git rev-parse --show-toplevel).Trim()
$linuxCheckout = (& wsl.exe -d Ubuntu --exec wslpath -a $checkout).Trim()
wsl.exe -d Ubuntu --cd $linuxCheckout --exec bash scripts/smoke-postgres.sh "$linuxCheckout/out/wsl-node/node-v24.15.0-linux-x64/bin/node" "$linuxCheckout/out/wsl-postgres/root"
```

## 10. Encerramento

Checkpoint exclusivamente de preservação. Nenhuma nova auditoria, implementação,
release ou rodada de melhorias foi iniciada após a instrução de pausa. Retomada
pendente de uma nova solicitação do usuário; não continuar automaticamente.
