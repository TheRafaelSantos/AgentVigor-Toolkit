# Revisão do desenho de integração funcional

Este documento propõe a próxima evolução. As interfaces e estruturas descritas aqui ainda precisam de implementação e validação. A inspeção usou o AgentVigor no commit `0b3a036` e o snapshot local do Vibe Coding Toolkit em `out/upstream-vibe/soumatheusgomes-vibe-coding-toolkit-21b71b6`, correspondente à revisão `21b71b68679c11184f49c23168852014bf6dde8b`.

## Recomendação

Adicionar uma skill global `agentvigor-toolkit` com uma descrição curta e referências locais que carregam apenas o fluxo escolhido. Distribuir com ela roteiros, modelos e recursos auditados. Manter as cinco skills originais para seus gatilhos específicos. Implementar no CLI o catálogo, a criação de uma base de projeto, a adoção em projeto existente e a execução de verificações reais.

Isso dá ao Codex e ao Claude Code um ponto de entrada descoberto globalmente para as capacidades do toolkit. Os recursos acompanham a skill instalada e funcionam sem depender do caminho do checkout, de acesso ao GitHub ou da presença do executável `agentvigor` no PATH. Quando uma operação requer o CLI, a skill verifica a instalação e apresenta o comando compatível com a distribuição disponível.

Uma skill por cada prompt do Vibe acrescentaria descrições repetidas de revisão, planejamento, memória e orquestração ao contexto de descoberta. A roteadora permite começar com uma superfície pequena. Uma capacidade merece skill própria posteriormente quando houver evidência de que seu gatilho independente melhora a descoberta. A roteadora não pode usar um gatilho genérico como “qualquer tarefa de programação”. Seu gatilho deve se limitar à configuração do ambiente ou de projetos e às capacidades publicadas no catálogo.

## Evidências da arquitetura atual

| Componente observado | Consequência para a evolução |
| --- | --- |
| `lib/install.mjs` declara perfis com exatamente duas, quatro ou cinco skills e `schema = 1`. | Alterar as listas atuais sem preservar a definição antiga invalida estados rc.1 antes da atualização. |
| Cada entrada de `files` representa somente o conteúdo Base64 de um `SKILL.md`. | Referências, modelos e scripts precisam passar a ser arquivos gerenciados pela transação. |
| `validateSnapshot` verifica a quantidade exata de arquivos do perfil e exige frontmatter de skill em cada conteúdo. | Copiar uma pasta recursivamente por fora do instalador deixaria backup, drift, status e rollback incompletos. |
| Instalação usa raízes distintas para Codex e Claude, journal, lock compartilhado e `planToken`. | Essas garantias podem ser reaproveitadas para recursos adicionais e migração. |
| O CLI atual oferece instalação, diagnóstico, estado, monitor, atualização, benchmark e rollback. | Catálogo, configuração de projeto e quality gates precisam de comandos implementados e anunciados separadamente. |
| `test/skills.test.mjs` fixa exatamente cinco diretórios de skill. | O teste precisa passar a validar o catálogo publicado e seus recursos, mantendo assertions para as cinco originais. |
| `test/docs.test.mjs` consulta a ajuda dos comandos apresentados nos três READMEs. | Novos exemplos devem entrar na ajuda e nas verificações de documentação no mesmo incremento. |
| `lib/process.mjs` exige executável absoluto e, no Windows, aceita somente `.exe` ou `.com`. | Invocar diretamente `npm.cmd`, `pnpm.cmd` ou `eslint.cmd` não funciona nesse contrato. |
| O pacote permite apenas built-ins de Node e contém `skills/` e `docs/` no tarball. | Os recursos podem permanecer dentro da pasta da roteadora e já se enquadram no empacotamento. |
| Os avisos atuais declaram que nenhum material Vibe é redistribuído. | Essa declaração precisa mudar no mesmo commit que introduzir qualquer adaptação ou cópia. |

O estado no disco e a descoberta por um cliente são verificações distintas. A instalação da roteadora precisa ser seguida por um teste em sessão nova de cada cliente. O disparo automático continua sujeito às políticas e à seleção do cliente.

## Escopo funcional herdado

O Vibe apresenta duas frentes principais, preparação da máquina e configuração de projetos. Sua revisão auditada contém dezesseis prompts, templates de documentação e aplicação, três regras locais de ESLint e scripts de validação. A distribuição AgentVigor deve preservar essa utilidade com adaptações explícitas.

| Capacidade do Vibe | Entrega recomendada no AgentVigor | Evidência necessária |
| --- | --- | --- |
| Preparar máquina e integrações | Roteiro `environment-setup`, inventário do doctor e plano por cliente. | Executável, versão, configuração, descoberta e teste real identificados separadamente. |
| Criar projeto Next.js | Roteiro `next-bootstrap` e operação `project` com plano revisável. | Gerador oficial com versão resolvida, projeto descartável, instalação, lint, tipos, testes e build. |
| Adotar toolkit em projeto existente | Roteiro `existing-project` e operação de adoção sem substituição silenciosa. | Baseline, mudanças previstas, preservação de customizações, idempotência e rollback. |
| ESLint, Biome e regras próprias | Recurso `quality-gates` com modelos e executor local de checks. | Casos válidos e inválidos detectados pelas regras realmente instaladas. |
| Sanear projeto, reduzir warnings e dividir arquivos | Referências específicas selecionadas pela roteadora. | Contratos e testes preservados, diferença de avisos medida. |
| Brainstorming, ondas e revisão multiagente | Referência curta que usa ferramentas e skills já disponíveis. | Dono por arquivo, tarefas independentes e integração validada. |
| Memória e continuidade | Fluxo de adoção de documentos existentes e integração com Safe Resume. | Recuperação em contexto novo e revalidação das fontes. |
| Harness e melhoria do harness | Fixture descartável e roteiro de avaliação. | Falha inicial, correção, resultado da fixture e limites observados. |
| Revisão e auditoria de segurança | Roteiro de revisão com escopo, evidências e relatório privado por padrão. | Caminho de ataque alcançável, confirmação ou hipótese explícita e reteste. |
| Ferramentas opcionais do catálogo | Registros que informam pré-requisitos, mecanismo, licença, escopo e setup oficial. | Instalação e execução verificadas individualmente antes de anunciar compatibilidade. |

Na fonte auditada, a validação de harness cobre um contrato sintético de autorização por dono e tenant. A execução desse teste não certifica aplicações do usuário. A validação Next do upstream instala dependências e skills, cria probes e executa comandos no projeto descartável. Esse script precisa de revisão e adaptação antes de se tornar uma operação pública.

O prompt de configuração global da fonte inclui permissões amplas, atualização de componentes e ativação de integrações obrigatórias. A adaptação AgentVigor deve interpretar o pedido atual, apresentar as ações globais e limitar mudanças aos agentes e componentes selecionados. Conteúdo de terceiros dentro de um roteiro não amplia a autorização da sessão.

## Estrutura proposta

Uma possível estrutura pequena e auditável é a seguinte.

```text
skills/agentvigor-toolkit/
  SKILL.md
  references/
    environment-setup.md
    next-bootstrap.md
    existing-project.md
    quality-gates.md
    project-sanitation.md
    warning-burndown.md
    file-size-refactor.md
    orchestration.md
    memory.md
    harness-evaluation.md
    security-review.md
  templates/
    project/
    eslint/
    next/
    harness/
  licenses/
    vibe-coding-toolkit-MIT.txt
lib/
  catalog.mjs
  project.mjs
  quality.mjs
```

`lib/catalog.mjs` deve ser o registro central dos identificadores, arquivos distribuídos, capacidade e suporte por cliente. Os testes, o instalador e a saída do catálogo consultam esse registro para evitar três listas divergentes. Esse registro permanece estático e local. Nenhum arquivo baixado pode alterar o catálogo em tempo de execução.

A skill roteadora instrui o agente a selecionar uma referência correspondente ao objetivo. Cada referência aponta apenas para os modelos necessários e registra origem, versão, pré-requisitos, ação, verificação e reversão. Scripts distribuídos como recurso ficam sujeitos ao mesmo inventário e aos mesmos hashes dos demais arquivos.

Evitar colocar o catálogo completo de vinte e três ferramentas ou os dezesseis prompts no corpo da skill. A lista detalhada deve ficar em uma referência consultada conforme a tarefa. As cinco skills originais devem ser reutilizadas quando o fluxo exigir evidência, revisão, economia, diagnóstico ou retomada.

## Interfaces propostas

Os comandos abaixo são contratos de desenho e precisam ser implementados antes de aparecerem como disponíveis na documentação de uso.

| Interface proposta | Comportamento |
| --- | --- |
| `agentvigor catalog --json` | Lista identificadores, tipo, origem, estado da implementação, clientes e pré-requisitos. |
| `agentvigor catalog --id existing-project` | Mostra a capacidade específica e seu roteiro local, sem iniciar ações. |
| `agentvigor install --agent codex --profile balanced --dry-run` | Mantém a interface atual, acrescentando a roteadora e os recursos previstos na nova versão. |
| `agentvigor project --mode init --template next --path <directory> --dry-run` | Inspeciona destino e apresenta arquivos, gerador, versão, comandos, acesso à rede e verificações. |
| `agentvigor project --mode adopt --path <directory> --dry-run` | Apresenta diagnóstico e artefatos aplicáveis ao projeto existente. |
| `agentvigor project --mode adopt --path <directory> --yes` | Aplica somente as alterações aceitas e compatíveis com o estado revalidado. |
| `agentvigor quality --path <directory> --dry-run --json` | Resolve as verificações configuradas e apresenta executáveis, argumentos e limites. |
| `agentvigor quality --path <directory> --yes --json` | Executa as verificações reais e retorna sucesso, falha, cancelamento ou ausência de configuração. |

`--yes` autoriza a operação explicitamente selecionada em automação. Na execução interativa, o CLI pede confirmação depois da prévia e vincula a decisão ao `planToken`. Um plano novo deve ser exigido se os arquivos, as versões resolvidas ou os comandos mudarem. Um plano antigo confirmado no terminal não deve ser aplicado depois de outra execução concorrente.

O retorno do catálogo pode manter o seguinte contrato por entrada.

```json
{
  "id": "quality-gates",
  "kind": "workflow",
  "delivery": "bundled",
  "status": "implemented",
  "agents": ["codex", "claude"],
  "source": {
    "repository": "soumatheusgomes/vibe-coding-toolkit",
    "revision": "21b71b68679c11184f49c23168852014bf6dde8b",
    "license": "MIT"
  },
  "requires": ["node", "project-eslint"],
  "entry": "references/quality-gates.md"
}
```

Esse é um exemplo de formato. `status: implemented` só pode ser atribuído quando a entrega correspondente estiver implementada e validada. Uma entrada de orientação para instalar ferramenta externa deve usar um tipo que identifique integração externa e informar o que o AgentVigor efetivamente automatiza.

## Instalação e migração do rc.1

Introduzir o schema 2 para snapshots de arquivos adicionais. Congelar as listas de perfis do schema 1 com exatamente os identificadores e limites do rc.1. O leitor de estado identifica o schema, valida com seu contrato histórico e normaliza em memória. Um `status` ou `--dry-run` não migra o disco.

No novo formato, cada artefato gerenciado precisa de agente, identificador da skill, caminho relativo allowlisted, conteúdo ou backup verificável e hash. O catálogo do pacote define os arquivos instaláveis. A validação rejeita caminhos absolutos, travessia, links, tipos de arquivo inesperados e raiz alterada. Recursos antigos necessários para reversão também precisam de um layout histórico reconhecido, inclusive quando o recurso sair do pacote corrente.

Reaproveitar o mesmo diretório de estado, lock, journal, validação de conteúdo e confirmação. A transação deve abranger todos os `SKILL.md`, referências, modelos e licenças selecionados. Um recurso alterado pelo usuário bloqueia a operação que o substituiria. Arquivos irmãos fora do inventário são preservados.

A migração só ocorre na primeira mutação confirmada. O journal precisa aceitar o estado anterior schema 1 e o novo schema 2. O backup anterior deve manter a representação completa, inclusive o histórico de rollback anterior. A reversão imediata da migração deve restaurar os arquivos do rc.1 e seu estado schema 1. Isso permite voltar a usar o binário antigo após a reversão concluída.

Se o usuário executar o binário rc.1 antes dessa reversão, ele deve parar diante do schema 2. A documentação precisa orientar o uso do binário novo para reverter. Não escrever um estado schema 1 contendo artefatos novos, porque o binário antigo não conhece esses arquivos e poderia removê-los ou ignorá-los de forma inconsistente.

O plano de migração deve mostrar que a roteadora e os recursos serão adicionados. Uma atualização não deve instalar silenciosamente plugins ou ferramentas externas. A descoberta se apoia nas raízes globais já existentes e não requer modificar `AGENTS.md`, `CLAUDE.md` ou hooks globais.

Para os novos perfis, recomenda-se oferecer a roteadora em todos eles. O perfil continua determinando as cinco skills especializadas instaladas. Essa decisão muda as contagens documentadas para três, cinco e seis skills, respectivamente, e deve constar no changelog. Caso o usuário deseje conservar um conjunto estritamente legado, ele continua usando o rc.1 ou reverte a atualização.

## Projetos novos e existentes

O comando de projeto deve distinguir recursos próprios gerenciáveis e arquivos da aplicação. A primeira entrega pode criar documentos e configurações somente quando ausentes. Em um destino com `AGENTS.md`, `CLAUDE.md`, configuração ESLint ou documentação já existentes, a operação deve fornecer um arquivo de proposta ou um diff para revisão. Evitar concatenar blocos repetidos ou substituir instruções de terceiros.

Registrar os arquivos efetivamente criados e seus hashes em estado local do projeto. A reaplicação é idempotente. Uma reversão remove um arquivo novo somente quando seu conteúdo ainda coincide com o registro. Um arquivo com alterações posteriores precisa de uma proposta de reversão que preserve essas edições.

Para Next.js, resolver a versão do gerador antes de apresentar o plano. Usar a versão exata e argumentos suportados observados, com preferência por gerador oficial. Executar o scaffold em diretório temporário com dono e escopo conhecidos. Verificar o resultado antes de promovê-lo para um destino vazio. Em projeto existente, preservar framework, gerenciador, banco e lockfile. Migração de stack permanece uma mudança específica, decidida separadamente.

A criação de uma base mínima Next precisa cobrir entrada, runtime, scripts, instruções e checks. Drizzle, PostgreSQL, autenticação, MCP e serviços devem ser selecionados conforme o produto. Os modelos do upstream que incluem bibliotecas adicionais precisam ser distribuídos como perfis identificados, com pré-requisitos e limites. Um bootstrap sem necessidade de banco não deve instalar cliente e migrações apenas por estarem no modelo.

Os documentos gerados devem registrar valores observados e campos pendentes. Um template preenchido não é evidência de teste executado. A ponte de `CLAUDE.md` para `AGENTS.md` é apropriada em arquivo novo ou após reconciliação autorizada. Um arquivo Claude já customizado precisa ser preservado e revisado.

## Execução real dos controles de qualidade

O executor pode começar com projetos Node e verificações explícitas em um arquivo de configuração local versionado. Cada check define um identificador, um executável suportado ou script Node local, argumentos em array, timeout e resultado esperado. Configuração local é código potencialmente executável e exige uma prévia antes da primeira execução autorizada.

Reutilizar `runFile` com limites de tempo, bytes e cancelamento. Resolver ESLint e outros CLIs Node para seus scripts locais e invocá-los por `process.execPath`. Para gerenciadores de pacotes no Windows, resolver a entrada JS oficial instalada e suportada, ou declarar o gerenciador indisponível. Evitar montar uma linha de shell com diretório e argumentos, bem como inferir comandos de dentro de arquivos `.cmd` arbitrários.

Não baixar executáveis por `npx` como efeito colateral de uma verificação. O catálogo informa a dependência ausente e seu setup separado. Scripts do projeto e seus ciclos de vida precisam constar no plano. Lint e build podem carregar código do projeto e plugins, acessar rede ou criar artefatos. A execução deve ocorrer no projeto explicitamente selecionado e com autorização adequada a esse código.

Para as regras de ESLint adaptadas do Vibe, validar as três regras com casos positivos e negativos, além da integração na configuração efetiva do projeto. Executar o self-check junto à versão de ESLint selecionada. O runner deve devolver falha quando a configuração estiver ausente, o executável não existir, uma regra não estiver ativa, houver timeout ou qualquer check falhar.

O resultado deve separar `passed`, `failed`, `skipped`, `unavailable` e `cancelled`. Um conjunto sem verificações executáveis não passa. O resultado final precisa incluir duração, exit code, versão das ferramentas e quais verificações rodaram. Logs detalhados são locais e opt-in, com orientação para revisão antes do compartilhamento.

O cancelamento precisa encerrar o processo e seus descendentes. O `runFile` atual encerra apenas o processo filho direto, portanto essa garantia precisa de implementação e teste específicos para um runner que execute scripts capazes de gerar outros processos.

## Integrações externas e duplicação

O catálogo deve indicar se cada item é skill, plugin, hook, executável, MCP ou instrução. A presença de uma referência bundled não significa que a ferramenta correspondente esteja instalada.

Antes de propor instalação, verificar o binário no PATH, as raízes suportadas, os registros do cliente e a origem quando observável. Diferenciar instalação conhecida, equivalente externo, descoberta não confirmada e conflito. Não adotar nem sobrescrever arquivos externos apenas porque o nome coincide.

Ferramentas como RTK, Superpowers e Ponytail mantêm seus próprios instaladores e mecanismos oficiais. Se um fluxo futuro automatizar esses instaladores, precisa de revisão de versão, integridade, backup e reversão próprios. A primeira entrega funcional pode oferecer diagnóstico e plano verificado para essas integrações, enquanto as capacidades de projeto e quality gates já são executáveis pelo AgentVigor.

A seleção de modelos e subagentes usa os controles efetivamente expostos pelo cliente e a política autorizada na sessão. O recurso de orquestração deve falar em responsabilidades e evidências. Nomes ilustrativos de agentes ou comandos do upstream não viram ferramentas disponíveis por estarem no catálogo.

## Licenças, origem e autoria

O snapshot Vibe auditado tem licença MIT e copyright de 2026 Matheus Gomes. Guardar uma cópia integral da licença ao lado dos recursos adaptados e incluir o aviso no tarball. `THIRD_PARTY_NOTICES.md` deve listar cada grupo reaproveitado, revisão, localização original, destino e natureza da alteração.

Preservar o LICENSE MIT principal com Rafael Pereira. A implementação do CLI, migração, catálogo e executor pode ser original do AgentVigor. Textos, modelos e regras adaptados recebem a atribuição correspondente. A referência a uma ferramenta externa dentro do Vibe não concede automaticamente direito a redistribuir o código ou a skill dessa ferramenta.

Registrar a origem por arquivo em um manifesto pequeno permite verificar a atribuição no CI e separar adaptações de material original. Não copiar os assets visuais do upstream, que não são necessários para obter suas capacidades funcionais.

## Plano incremental verificável

1. Consolidar a matriz de capacidades e o inventário de arquivos aprovados. Publicar créditos e licença antes de redistribuir os arquivos.
2. Implementar schema 2 e migração com fixtures rc.1. Validar rollback, retomada, drift, concorrência e `planToken` antes de instalar novos recursos.
3. Entregar a roteadora, referências, catálogo e instalação global dos recursos em ambos os clientes. Verificar descoberta em sessões novas e execução de um fluxo por cliente.
4. Entregar adoção de projeto existente com criação aditiva de artefatos, proposals para conflitos e estado local reversível.
5. Entregar quality gates reais com a versão suportada de ESLint e os self-checks das regras.
6. Entregar bootstrap Next executável e validado em fixtures descartáveis com versões resolvidas. Documentar instalação com rede separadamente dos testes offline do toolkit.
7. Integrar harness, memória, refatoração, segurança e orquestração como fluxos utilizáveis, com evidências de aceitação proporcionais.
8. Atualizar os três idiomas, smoke do tarball e matriz de CI. Publicar candidato com limites e capacidades identificados individualmente.

Versionar essa evolução como `0.2.0-rc.1` é apropriado porque muda a superfície funcional, o formato do estado e o conteúdo dos perfis. Um novo candidato `0.1.0-rc.2` seria possível se a linha 0.1 ainda fosse tratada explicitamente como incompleta, mas exigiria a mesma migração e as mesmas notas de mudança. A recomendação é 0.2 para tornar o incremento visível.

## Critérios de aceitação e limites

| Grupo | Verificação necessária |
| --- | --- |
| Migração | Instalar com o tarball rc.1 em home isolado, atualizar com o novo candidato, validar todos os recursos, reverter e executar novamente o CLI rc.1. |
| Falhas | Interromper antes e depois de criar pastas, gravar recursos e confirmar estado. Preservar irmãos, staging não identificado e arquivos alterados. |
| Seleção | Codex somente, Claude somente e ambos, com perfis distintos e `CLAUDE_CONFIG_DIR` com espaços. |
| Descoberta | Sessão nova fora do checkout encontra a roteadora e acessa suas referências instaladas. |
| Contexto | Manifest curto e carga de apenas uma referência relevante. Medir o conteúdo carregado quando o cliente expuser essa informação. |
| Projeto | Destino vazio, existente limpo, existente alterado, conflito de instruções, reaplicação e reversão. |
| Gates | Caso correto aprovado, erro real rejeitado, executável ausente, regra inativa, timeout, cancelamento e processo descendente encerrado. |
| Supply chain | Sem download durante checks, fontes e versões identificadas, licenças preservadas, pacote inspecionado. |
| Documentação | Ajuda, catálogo, READMEs e funcionalidades concordam nos três idiomas. |
| Sistemas | Windows, Linux, macOS Intel e Apple Silicon conforme jobs realmente executados. WSL e aceitação no cliente são registrados separadamente. |

Esta revisão é estática e descreve o desenho recomendado. Não executa bootstrap de aplicações, installs externos, migração ou testes de descoberta. Os limites de processo e a migração são os riscos principais a resolver antes de publicar a evolução como disponível.
