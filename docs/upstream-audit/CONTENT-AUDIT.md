# Auditoria de conteúdo do Vibe Coding Toolkit

Revisão auditada `21b71b68679c11184f49c23168852014bf6dde8b`, de
[soumatheusgomes/vibe-coding-toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit/tree/21b71b68679c11184f49c23168852014bf6dde8b).
Data da inspeção 2026-11-04. Autor original Matheus Gomes, licença MIT.

A árvore local fornecida para esta leitura contém **121 arquivos e 888.972
bytes**. Esta frente cobre **63 arquivos**, listados individualmente abaixo e em
[content-files.json](content-files.json). O domínio inclui os três READMEs,
instruções e licença, nove guias gerais, dezesseis prompts e seu índice, dez
guias de contexto/processo/cliente e seu índice, e vinte templates de
documentação, inventário e configuração.

O restante tem responsabilidade explícita na auditoria conjunta. A frente de
engenharia cobre scripts, workflow, regras ESLint, fixtures, núcleo Next,
hook, regra de paralelismo, `.gitignore` e os treze guias técnicos restantes.
Os dez SVGs pertencem à frente visual. Este relatório não atribui a esta
leitura os testes ou as revisões dessas outras frentes.

## Resultado funcional e estado atual

A referência atende quatro entradas operacionais. Preparar a máquina e iniciar
um projeto são duas delas. As outras são adotar ou atualizar a configuração
de um projeto existente e selecionar um componente isolado. O material traz
receitas detalhadas, configurações e código executável em templates e
validadores, com limites de execução documentados.
[Entradas oficiais no README](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/README.md#L54-L130).

O CLI AgentVigor existente nesta etapa instala suas cinco skills autorais,
oferece diagnóstico, monitor RTK, snapshots/rollback e análise de observações
de benchmark. Ele ainda não expõe o catálogo upstream, não aplica seus nove
templates documentais a um projeto, não produz seu inventário de máquina e
não executa o bootstrap Next. A inspeção de `bin/agentvigor.mjs`,
`lib/install.mjs` e `package.json` fundamenta essa comparação. Similaridade
entre Grounded Code e os princípios de evidência, ou entre Safe Resume e o
handoff, não comprova incorporação funcional dos workflows completos.

As palavras **Incorporar**, **Adaptar**, **Substituir** e **Excluir da
aplicação** são decisões propostas para o destino de cada arquivo. O campo
`stage: proposed` no inventário legível por máquina registra isso. A
existência desta auditoria não marca a incorporação como concluída. Uma cópia
upstream mantida como referência pode estar no pacote sem ser uma entrada
autorizada do roteador.

## Mudanças necessárias antes da incorporação

| Tema | Evidência observada | Adaptação concreta |
| --- | --- | --- |
| Agentes selecionados | O setup de máquina instala Codex **e** Claude e trata seis extensões como obrigatórias. | Selecionar Codex, Claude ou ambos. Tornar ferramentas e integrações dependentes do perfil e da necessidade, com estados não selecionado, bloqueado e validado. |
| Permissões | Prompt 10 pede full access e ausência de prompts. O manifesto inclui `danger-full-access` e `never`. | Preservar a política efetiva do cliente. Alteração de permissões exige ação específica escolhida pelo usuário, com backup e verificação em nova sessão. |
| Alcance global | Prompt 10 também autoriza atualizar globais fora da lista, corrigir PATH e remover duplicatas. | Produzir plano finito de alvos selecionados. Resolver o proprietário de cada instalação e preservar componentes fora do plano. |
| Silêncio e autorização | O prompt 02 descreve opção A como default sem resposta e também manda aguardar decisão. | Enquanto falta uma decisão requerida, executar só trabalho independente previamente autorizado. |
| Commits e lotes | Prompt 09 manda criar um commit por arquivo e parar após um lote. | Respeitar a autorização vigente e o escopo do trabalho. O coordenador controla Git e checkpoints. |
| Ativação e economia | Playbook exige três plugins para continuar e chama o proxy de ganho puro. Guias descrevem garantias absolutas de preservação e composição. | Validar disponibilidade e comportamento por cliente. Reportar medições próprias, custos observáveis, casos não executados e limitações. |
| Reprodução | O manifesto é um modelo JSON com valores nulos e estados pendentes. | Implementar produtor, validação, plano e execução. Um manifesto não transporta autenticação, ferramentas, dados ou configurações efetivas. |
| Hooks e MCP | O exemplo settings referencia scripts ausentes. O vault usa pacote placeholder e hook de caminhos literais. | Guardar como referência e gerar registros somente para componentes reais selecionados e testados. O hook de convenção não fornece isolamento. |
| Contexto e memória | Guias oferecem índices, metadados de validade, migração e read-back. | Reusar armazenamento canônico, conferir carregamento no cliente e respeitar autorização para escrita. Não instalar vault ou consolidar dados pessoais automaticamente. |
| Versões e receitas | Atalhos usam `main`, instalações usam `latest`, e há evidência histórica em datas anteriores. | Distribuir revisão fixa com origem verificável. Revisar APIs, engine/peer requirements e conteúdo remoto antes de execução. Preservar resultados históricos como históricos. |

As evidências por tema estão em
[prompt 10](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/10-development-environment-setup.md#L42-L116),
[permissões do Codex](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/15-codex-workflow.md#L107-L128),
[prompt 02](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/02-eslint-warning-burndown.md#L92-L110),
[prompt 09](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/09-file-size-refactor.md#L133-L158),
[playbook](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/02-playbook-onboarding.md#L673-L729),
[memória](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/09-claude-memory-system.md#L30-L70) e
[vault opcional](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/08-obsidian-memory.md#L28-L61).

## Contratos que precisam código executável

| Capacidade a incorporar | O que o conteúdo já oferece | Código que o AgentVigor precisa entregar | Checkpoint de aceitação |
| --- | --- | --- | --- |
| Catálogo local e roteamento | Índices, descrições e 16 prompts | Catálogo com IDs estáveis, revisão, licença, cliente, dependências, escopo e leitura sob demanda. Roteador seleciona o bloco adaptado e suas referências locais, sem depender de `main`. | Cada entrada resolve offline dentro do bundle. Comando mostra o que foi carregado e a origem. Entradas com efeitos globais ficam identificadas. |
| Preparação de máquina | Inventário de 27 componentes e receita 10 | Coletor read-only e plano por componente escolhido, com detecção de instalação existente, versão, gerenciador, permissões e validação. Aplicação precisa confirmação e recuperação por alteração gerenciada. | Em mocks, Codex isolado, Claude isolado e ambos produzem planos distintos. Sem consentimento não há alteração global. Reaplicação preserva configuração. |
| Documentação de projeto | Mapa de nove destinos e conteúdo dos templates | Planejador e escritor limitados ao alvo. Validar caminho, tipo, links, conflitos, case folding, conteúdo existente e drift. Renderizar produto e comandos reais ou marcar rascunho. | Dry-run deixa alvo intacto. Apply é idempotente. Falha parcial e rollback preservam arquivos do usuário e vizinhos. Nenhum placeholder é apresentado como evidência. |
| Novo projeto Next | Receita de scaffold oficial e módulos complementares | Preset opt-in com preflight de Node, gerenciador e dependências. Executar argumentos separados com timeout, staging isolado, merge seguro e ledger de comandos. | App descartável inicia e passa checks aplicáveis. Não há dados de produção, migração implícita nem cópia do toolkit inteiro. |
| Adoção existente | Prompt 12 exige uma decisão por componente | Inventário de stack e configurações, mapeamento de docs canônicas, diff e etapas selecionadas. Nunca regenerar aplicação existente para seguir o preset. | Uma aplicação customizada conserva stack, lockfile, instruções e serviços. Segunda aplicação não duplica seções, MCPs, skills ou scripts. |
| Regras de qualidade | Invariantes e templates executáveis | Instalador específico de projeto, resolução de versões compatíveis, cópia verificável das regras, merge e self-check. Confirmar detalhes com auditoria de engenharia. | Casos positivos e negativos exercitam regras reais. Gates existentes mantêm sua força e novos warnings recebem baseline próprio. |
| Memória e retomada | Formato de memória e handoff com evidência | Gerar/validar handoff somente quando pedido e observar estado atual ao retomar. Adaptar caminhos e descoberta. Persistência durável usa destino autorizado. | Um handoff falso não evita inspeção de Git/arquivos/processos. Migração só elimina original após read-back confirmado. |
| Avaliação do harness | Sete casos propostos e fixture de auth | Distribuir fixture/evaluator de revisão fixa e comando determinístico. Turnos de agentes e observações de host são uma etapa separada e explícita. | Baseline quebrado falha, correção passa, notas do usuário são preservadas. Resultado distingue teste do evaluator e ensaio de modelo. |
| Revisão e auditoria | Prompts 13/16 e relatório estruturado | Workflow selecionável e validador de formato/destino privado. Manual tracing permanece válido sem scanner. O gerador de relatório não inventa achados. | Modos read-only mantêm repo/index. Nenhuma chamada a alvo ativo ou upload decorre apenas da seleção do prompt. |
| Integrações de cliente | TOML/JSON, catálogo e guias | Adapters por cliente, seleção de escopo e merge transacional. Diagnóstico verifica arquivos separadamente da descoberta e operação real. | Configuração existente sobrevive, servidor equivalente não duplica, OAuth acontece no fluxo oficial e segredos não entram no bundle. |

O catálogo e o roteador representam uma primeira entrega utilizável. As
promessas de preparação automática de máquinas, aplicação de templates e
bootstrap exigem os contratos executáveis das respectivas linhas antes de
serem anunciadas como prontas. Leitura de prompt pode conduzir o agente,
mas verificação mecânica deve ficar nos testes e nas transações do toolkit.

## Inventário por arquivo

**Suportado** significa que a instrução é utilizável por esse cliente com
acesso ao projeto. **Condicional** depende da versão, ferramenta, serviço,
permissão ou capacidade observável do host. **Referência** identifica conteúdo
sobre outro cliente ou evidência histórica, sem afirmar suporte executável.
As fontes apontam para a revisão imutável e o inventário JSON conserva os
intervalos relevantes.

### Raiz e identidade

| Arquivo e finalidade | Dependências | Codex / Claude | Destinação e motivo |
| --- | --- | --- | --- |
| [AGENTS.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/AGENTS.md#L1). Convenções e escopo de manutenção do toolkit. | README.md, docs/04-project-bootstrap.md, templates/project-docs/manifest.json | Suportado / Suportado | **Adaptar**. Preservar disciplina e rastreio de fontes, remover restrições de arquitetura próprias do repositório de referência. Ainda não instalado pelo CLI. |
| [CLAUDE.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/CLAUDE.md#L1). Ponte Claude para as instruções compartilhadas. | AGENTS.md. suporte a imports do Claude | Referência / Suportado | **Adaptar**. Manter ponte curta por cliente e mesclar conteúdo existente. Não usar sintaxe de import Claude como configuração Codex. |
| [LICENSE](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/LICENSE#L1). Concessão MIT e copyright original. | Copyright Matheus Gomes | Referência / Referência | **Incorporar**. Preservar integralmente junto de qualquer material redistribuído e registrar derivação. A licença raiz de Rafael permanece a do AgentVigor. |
| [README.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/README.md#L54). Portal canônico com quatro rotas e contratos de escopo. | docs/*. docs/prompts/*. docs/tools/*. templates/*. assets. scripts | Suportado / Suportado | **Substituir**. README AgentVigor mantém identidade própria. Incorporar navegação funcional por objetivo e somente anunciar rotas entregues. |
| [README.pt-BR.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/README.pt-BR.md#L1). Tradução do portal em português. | README.md. mesmos destinos e âncoras | Suportado / Suportado | **Substituir**. Manter README próprio em português com paridade de comandos/escopos. Guias upstream permanecem canônicos em inglês. |
| [README.es.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/README.es.md#L1). Tradução do portal em espanhol. | README.md. mesmos destinos e âncoras | Suportado / Suportado | **Substituir**. Manter README próprio em espanhol com paridade de comandos/escopos e identidade AgentVigor. |

### Guias gerais

| Arquivo e finalidade | Dependências | Codex / Claude | Destinação e motivo |
| --- | --- | --- | --- |
| [docs/00-overview.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/00-overview.md#L7). Mapa de adoção, decisões de produto, contexto e qualidade. | Guias 01–08. prompts 10–16. ferramentas selecionadas | Suportado / Suportado | **Adaptar**. Transformar em mapa de capacidades atuais e futuras. Opções e aplicações existentes continuam preservadas. |
| [docs/01-installation.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/01-installation.md#L7). Referência de instalação por cliente e escopo. | Instaladores oficiais. plugins. RTK. Graphify. Context7 | Condicional / Condicional | **Adaptar**. Atualizar versões/fontes e manter seleção por agente, confirmação e detecção de duplicatas. Comandos escritos não equivalem a instalação executada. |
| [docs/02-playbook-onboarding.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/02-playbook-onboarding.md#L34). Tutorial narrado Claude, fluxo de trabalho, memória e adoção lint. | Plugins opcionais. templates. prompts 01–12. shell | Condicional / Suportado | **Adaptar**. Reconciliar plugins obrigatórios, política warn e alegação de ganho puro com escolhas explícitas, evidência e defaults AgentVigor. |
| [docs/03-environment-setup.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/03-environment-setup.md#L7). Uso, retomada e reprodução da preparação de máquina. | Prompt 10. manifest de ambiente. gerenciadores. autenticação | Condicional / Condicional | **Adaptar**. Gerar inventário read-only e plano por componente selecionado. Reconciliar ambos agentes obrigatórios e alterações globais amplas. |
| [docs/04-project-bootstrap.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/04-project-bootstrap.md#L72). Receita de produto até fundação Next funcional. | create-next-app. Node. gerenciador. templates/next. ESLint. skills | Condicional / Condicional | **Adaptar**. Preset explícito para projeto novo. Necessita executor e transações reais, preflight, compatibilidade e sandbox de teste. |
| [docs/05-toolkit-validation.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/05-toolkit-validation.md#L12). Registro histórico e escopo da validação upstream. | scripts/validate-docs*. validate-next. validate-harness. CI upstream | Referência / Referência | **Excluir da aplicação**. Reter como evidência histórica da referência. Resultados/versões/revisões upstream não podem ser atribuídos ao AgentVigor. |
| [docs/06-project-defaults.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/06-project-defaults.md#L7). Defaults de stack, arquitetura, documentação e adaptações. | Next. Drizzle/PostgreSQL. Zod. Pino. Vitest. manifest docs | Condicional / Condicional | **Adaptar**. Oferecer preset revisado opt-in e preservar stacks existentes. Decisões de stack não pertencem a todas as instalações globais. |
| [docs/07-harness-evaluation.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/07-harness-evaluation.md#L9). Protocolo de avaliação comportamental com casos descartáveis. | Prompt 14. fixture auth. evaluator externo ao escopo do agente | Condicional / Condicional | **Incorporar**. Incorporar casos e separar execução determinística, comportamento de modelo e reinício real de cliente. Hoje o benchmark próprio não os substitui. |
| [docs/08-security-audit.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/08-security-audit.md#L5). Guia de auditoria avançada e retomada de remediações. | Prompts 13/16. saídas privadas. fontes atuais | Suportado / Suportado | **Adaptar**. Disponibilizar workflow opt-in com quatro artefatos e validação de destino privado. Não acoplar ao install/bootstrap. |

### Biblioteca de prompts

| Arquivo e finalidade | Dependências | Codex / Claude | Destinação e motivo |
| --- | --- | --- | --- |
| [docs/prompts/README.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/README.md#L3). Índice de 16 workflows. | Prompts 01–16 | Suportado / Suportado | **Adaptar**. Expor catálogo local por objetivo e dependências reais. O índice não executa as receitas. |
| [docs/prompts/01-project-sanitation.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/01-project-sanitation.md#L48). Inventário e limpeza proporcional com baseline. | Comandos do projeto. manifests. busca de referências | Suportado / Suportado | **Adaptar**. Checar scripts antes de executar e não tratar zero referências textuais como prova de remoção segura. Ações arriscadas dependem de escopo. |
| [docs/prompts/02-eslint-warning-burndown.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/02-eslint-warning-burndown.md#L78). Redução mensurada de warnings e decisão sobre migração. | ESLint existente. comandos reais. prompt 05 | Condicional / Condicional | **Adaptar**. Eliminar ambiguidade entre 'default sem resposta' e aguardar decisão, sem interpretar silêncio como autorização de escopo. |
| [docs/prompts/03-multi-agent-code-review.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/03-multi-agent-code-review.md#L35). Revisão por lentes com síntese e alvo congelado. | Diff/ref imutável. ferramentas nativas de revisão. callers/testes | Condicional / Condicional | **Adaptar**. Usar lentes proporcionais e fallback inline. Verificar disponibilidade de subagentes, sem criar painel ou multiplicar custos por padrão. |
| [docs/prompts/04-brainstorm-to-plan.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/04-brainstorm-to-plan.md#L43). Clarificação e plano com aceite verificável. | Requisitos. critérios. comandos de verificação | Suportado / Suportado | **Adaptar**. Preservar decisões/autorizações existentes e perguntar apenas o que muda resultado. Não repetir aprovações já concedidas. |
| [docs/prompts/05-parallel-wave-dispatch.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/05-parallel-wave-dispatch.md#L37). Planejar ondas por arquivos, recursos e dependências. | Plano. host com delegação. Git somente autorizado | Condicional / Condicional | **Incorporar**. Incorporar contrato de um escritor por arquivo e recursos independentes. Execução depende do host, sem daemon/orquestrador novo. |
| [docs/prompts/06-memory-bootstrap.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/06-memory-bootstrap.md#L62). Índice pequeno, proveniência e migração confirmada de memória. | Memória nativa/docs. destino autorizado. leitura de confirmação | Condicional / Condicional | **Adaptar**. Reusar memória/docs existentes, exigir escrita autorizada e verificar mecanismo de carregamento. Sem vault automático ou limite universal rígido. |
| [docs/prompts/07-eslint-complete-setup.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/07-eslint-complete-setup.md#L65). Configuração lint por stack e desenho de invariantes. | ESLint. plugins aplicáveis. runtime. profile typed | Condicional / Condicional | **Adaptar**. Atualizar contrato técnico com auditor runtime. Tratar regras monetária/input/auth descritas como propostas, não código já implementado. |
| [docs/prompts/08-eslint-quality-gates-install.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/08-eslint-quality-gates-install.md#L82). Copiar regras auditadas e medir adoção. | Módulos ESLint mesma revisão. self-check. config atual | Condicional / Condicional | **Adaptar**. Precisará instalador de projeto, diff, backup, verificador de cópia e resolução de versões. Sem reescrever regras para esconder falhas. |
| [docs/prompts/09-file-size-refactor.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/09-file-size-refactor.md#L75). Refatorar por responsabilidade preservando APIs. | Regra de tamanho. testes. typecheck. limite de lote | Condicional / Condicional | **Adaptar**. Remover commit automático e parada de lote incondicionais quando divergem do escopo aprovado. Preservar coesão e interfaces. |
| [docs/prompts/10-development-environment-setup.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/10-development-environment-setup.md#L42). Preparar, atualizar, validar e inventariar máquina. | OS/managers. Git/gh. runtimes. agentes. plugins. Docker | Condicional / Condicional | **Adaptar**. Não executar original como default. Adaptar agentes opcionais, perfis selecionados, plano/consentimento por alteração global e privilégios mínimos. |
| [docs/prompts/11-next-project-bootstrap.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/11-next-project-bootstrap.md#L18). Roteiro integrado de bootstrap de projeto novo. | Guias04/06. catálogo. manifest docs. templates executáveis | Condicional / Condicional | **Adaptar**. Manter produto e preset opcionais. Evitar instalar todos web skills sem necessidade e tornar geração/merge verificáveis. |
| [docs/prompts/12-existing-project-setup.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/12-existing-project-setup.md#L38). Adoção completa em projeto existente com cobertura por componente. | Inventário real. contexto. ferramentas. testes. revisão | Condicional / Condicional | **Adaptar**. Workflow próprio com plano/diff e etapas aplicáveis, preservando frameworks e conteúdo. Conteúdo remoto não concede autoridade. |
| [docs/prompts/13-security-review.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/13-security-review.md#L19). Revisão read-only de repo/diff com relatório privado. | Git/history quando houver. tracer manual. skill opcional | Suportado / Suportado | **Incorporar**. Incorporar bloco independente e política de relatórios. Diferenciar análise estática, testes isolados e serviços reais. |
| [docs/prompts/14-harness-evaluation.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/14-harness-evaluation.md#L15). Avaliar harness em cópias descartáveis. | Guias07. fixture. evaluator fixo. host observável | Condicional / Condicional | **Incorporar**. Incorporar protocolo como workflow e checks determinísticos reais separados dos turnos de modelo. |
| [docs/prompts/15-harness-improvement.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/15-harness-improvement.md#L15). Comparar baseline e uma mudança mínima de harness. | Prompt14. casos/evaluator. host nativo. CLIlab separado | Condicional / Condicional | **Adaptar**. Disponibilizar comparação limitada quando há falha observada. Harness2 não será dependência nem execução automática em toda instalação. |
| [docs/prompts/16-security-audit.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/16-security-audit.md#L17). Auditoria universal com findings e remediações em lotes. | Saídas privadas. fontes atuais. modo AUDIT/PLAN/FIX/VERIFY | Suportado / Suportado | **Incorporar**. Incorporar workflow opt-in e contrato dos quatro artefatos. Scanners, produção, uploads e correções têm autorização própria. |

### Guias de contexto, processo e clientes

| Arquivo e finalidade | Dependências | Codex / Claude | Destinação e motivo |
| --- | --- | --- | --- |
| [docs/tools/README.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/README.md#L3). Catálogo e matriz de máquina/projeto. | 23 guias técnicos. evidência por capacidade | Suportado / Suportado | **Adaptar**. Converter matriz para catálogo local navegável com escopo/cliente/dependências e estados reais. |
| [docs/tools/01-superpowers.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/01-superpowers.md#L14). Guia de processo e skills Superpowers. | Distribuição oficial. skills realmente disponíveis | Condicional / Condicional | **Adaptar**. Atualizar descrição à versão auditada e retirar garantias absolutas de invocação/conflito. Parte é orientação de workflow, não API. |
| [docs/tools/02-subagent-orchestration.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/02-subagent-orchestration.md#L35). Delegação, modelos, recursos, revisão e retomada. | Capacidades/slots do host. briefs. recursos separados | Condicional / Condicional | **Incorporar**. Incorporar padrão e folha de tarefa. Nomes de especialistas e política de seleção não instalam agentes nem expõem modelos. |
| [docs/tools/04-ponytail.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/04-ponytail.md#L33). Engenharia proporcional e limites de implementação. | Plugin/skill oficial. comandos atuais | Condicional / Condicional | **Adaptar**. Reusar integração oficial. Atualizar instruções em vez de duplicar todo o conteúdo do plugin ou fixar resposta em três linhas. |
| [docs/tools/05-caveman.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/05-caveman.md#L16). Comunicação concisa e medição de uso. | Distribuição oficial e client commands disponíveis | Condicional / Condicional | **Adaptar**. Preferência opcional. Não prometer invariância de números/negativas nem porcentagens promocionais como resultado medido. |
| [docs/tools/07-graphify.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/07-graphify.md#L11). Grafo local, exclusões, extração e consulta. | Python. uv/pipx. Graphify. skill cliente | Condicional / Condicional | **Adaptar**. Usar adapter de versão e modo code-only explícito. Verificar seleção de plataforma, flags e origem; sem API/backend implícito. |
| [docs/tools/08-obsidian-memory.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/08-obsidian-memory.md#L16). Padrão opcional de vault com validação MCP. | Servidor não escolhido. schemas/templates. cliente MCP | Condicional / Condicional | **Adaptar**. Manter referência opt-in. Um servidor abstrato/placeholder não constitui integração funcional; hook literal não é barreira de acesso. |
| [docs/tools/09-claude-memory-system.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/09-claude-memory-system.md#L30). Memória leve, validade, índice e migração. | Memória nativa ou docs. fonte/evidência. carregamento cliente | Condicional / Suportado | **Adaptar**. Verificar carregamento por cliente e autorização de escrita. Atualizar/aposentar conhecimento com fonte e validade. |
| [docs/tools/15-codex-workflow.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/15-codex-workflow.md#L26). Codex instructions, plugins, skills, MCP e permissões. | Codex suportado. AGENTS. TOML. serviços opcionais | Condicional / Referência | **Adaptar**. Manter adapter Codex próprio e remover full-access como baseline de instalação. Verificar configuração efetiva em sessão nova. |
| [docs/tools/16-vercel-skills.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/16-vercel-skills.md#L3). Seleção e instalação local de skills oficiais. | Skills CLI. fontes/nomes. lockfile. clientes selecionados | Condicional / Condicional | **Adaptar**. Fixar versão auditada quando distribuir, resolver nomes reais, inventariar duplicatas e explicitar telemetria upstream. Catálogo não é número permanente. |
| [docs/tools/23-harness2.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/tools/23-harness2.md#L7). Método nativo inspirado em Harness2 e lab CLI separado. | Prompt15. evaluator. Python3.12/uv no lab opcional | Condicional / Condicional | **Adaptar**. Preservar distinção entre método, demo e benchmark. Não automatizar providers/custos nem desativar sandbox para testar. |

### Templates de contexto e configuração

| Arquivo e finalidade | Dependências | Codex / Claude | Destinação e motivo |
| --- | --- | --- | --- |
| [templates/README.md](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/README.md#L3). Mapa de origens e destinos dos templates. | Guias04/06. manifest e todas templates | Suportado / Suportado | **Adaptar**. Usar como contrato de catálogo e planos. A presença de templates não equivale a geração ou integração. |
| [templates/AGENTS.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/AGENTS.md.template#L5). Instruções por projeto, continuidade e descoberta progressiva. | Produto. comandos reais. docs. client capabilities | Suportado / Suportado | **Adaptar**. Reduzir ao contexto do preset, manter regras genéricas e incluir apenas ferramentas adotadas. Evitar stack e preferências não selecionadas. |
| [templates/CLAUDE.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/CLAUDE.md.template#L1). Import curto do AGENTS no Claude. | AGENTS.md. import oficial | Referência / Suportado | **Incorporar**. Manter conteúdo mínimo e mesclar CLAUDE existente. Não gerar para Codex isolado sem decisão do projeto. |
| [templates/environment-manifest.json.example](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/environment-manifest.json.example#L1). Schema informal e inventário de 27 componentes. | Inventário real. perfis. evidência. configurações privadas | Condicional / Condicional | **Adaptar**. Necessita produtor/validador real e export sanitizado. Remover instalação de ambos agentes, Caveman e full-access como defaults. |
| [templates/product.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/product.md.template#L1). Brief de produto, MVP e critérios. | Descrição do usuário. decisões de escopo | Suportado / Suportado | **Adaptar**. Usar fonte para render de documentação e registrar origem. Stack Next/Drizzle será preset selecionado, não requisito genérico. |
| [templates/security-review.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/security-review.md.template#L1). Contrato de relatório privado de revisão. | Workflow13. destino privado. achados reais | Suportado / Suportado | **Incorporar**. Reusar estrutura e proveniência com destino privado e placeholders preenchidos por evidência. |
| [templates/settings.json.example](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/settings.json.example#L1). Formato Claude de dois hooks ilustrativos. | Scripts example-command-proxy e example-session-banner ausentes | Referência / Condicional | **Excluir da aplicação**. Não instalar arquivo como configuração pronta. Guardar apenas referência upstream e gerar entrada somente para script real selecionado/verificado. |
| [templates/task-handoff.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/task-handoff.md.template#L1). Checkpoint de tarefa com evidência e recursos. | Registro existente de tarefa. estado Git/processos | Suportado / Suportado | **Incorporar**. Ampliar Safe Resume com saída de arquivo opcional que registra estado observado e recursos. Nenhuma continuidade automática. |
| [templates/project/.graphifyignore.example](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project/.graphifyignore.example#L1). Exclusões de secrets e conteúdo gerado. | Projeto real. Graphify. política de dados | Condicional / Condicional | **Adaptar**. Mesclar exclusões em projeto selecionado e verificar matcher instalado. Aplicar só dentro do alvo planejado. |
| [templates/project/codex.config.toml.example](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project/codex.config.toml.example#L1). Context7 remoto no Codex. | Cliente trusted. MCP. conexão não duplicada | Condicional / Referência | **Adaptar**. Mesclar TOML apenas com seleção e suporte confirmado. Necessita backup e preservação de configuração existente. |
| [templates/project/mcp.json.example](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project/mcp.json.example#L1). Context7 remoto no Claude. | Claude MCP HTTP. conexão não duplicada | Referência / Condicional | **Adaptar**. Mesclar objeto com seleção explícita. Autenticação fora do repositório, sem presumir formatos iguais. |
| [templates/project/sentry.codex.config.toml.example](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project/sentry.codex.config.toml.example#L1). Sentry por organização/projeto no Codex. | Sentry escolhido. slugs reais. OAuth | Condicional / Referência | **Adaptar**. Manter opt-in e substituir slugs por escopo fornecido. Verificar login no cliente sem transportar tokens. |
| [templates/project/sentry.mcp.json.example](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project/sentry.mcp.json.example#L1). Sentry por organização/projeto no Claude. | Sentry escolhido. slugs reais. OAuth | Referência / Condicional | **Adaptar**. Manter opt-in e merge independente do Codex, sem SDK automático. |
| [templates/project-docs/architecture.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project-docs/architecture.md.template#L1). Mapa da arquitetura e fronteiras observadas. | Código. stack. decisões reais. dados se houver | Suportado / Suportado | **Adaptar**. Renderizar conforme projeto/preset, sem camadas vazias nem diagrama de implementação inexistente. |
| [templates/project-docs/design.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project-docs/design.md.template#L1). Design, acessibilidade e estados UI. | Produto. tokens/componentes reais. interface quando aplicável | Suportado / Suportado | **Adaptar**. Omitir ou marcar N/A para projetos sem UI. Preservar fonte visual do projeto existente. |
| [templates/project-docs/manifest.json](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project-docs/manifest.json#L1). Mapa exato de nove documentos. | Fontes relativas. destinos sem traversal | Suportado / Suportado | **Incorporar**. Reusar mapa como allowlist e validar fontes/destinos/links. AgentVigor precisa aplicar plano transacionalmente. |
| [templates/project-docs/onboarding.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project-docs/onboarding.md.template#L1). Preparação e primeiro fluxo local. | Comandos reais. runtime. dados/integrações selecionados | Suportado / Suportado | **Adaptar**. Gerar instruções específicas do ambiente com espaço em paths, sem valores de secrets. |
| [templates/project-docs/quality.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project-docs/quality.md.template#L1). Checks, limites e workflows de revisão/harness. | Comandos/testes reais. preset lint. workflow13/14/15 | Suportado / Suportado | **Adaptar**. Preservar checks existentes, separar preparado/executado e tornar etapas opcionais conforme risco. |
| [templates/project-docs/README.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project-docs/README.md.template#L1). Entrada de execução e mapa de docs do projeto. | Produto. comandos reais. manifest documental | Suportado / Suportado | **Adaptar**. Gerar conteúdo preenchido ou rascunho claramente marcado. Não sobrescrever README existente em aplicação. |
| [templates/project-docs/setup.md.template](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/templates/project-docs/setup.md.template#L1). Registro de origem, ações, testes e pendências. | Snapshot de ferramentas/projeto. evidência dos comandos | Suportado / Suportado | **Incorporar**. Usar ledger de evidências sanitizado e origem upstream, com atualização ligada ao estado aplicado. |

## Sequência mínima de incorporação

1. Preservar o snapshot selecionado, seu LICENSE integral e os créditos de
   Matheus Gomes. Registrar caminho original, revisão e quais arquivos foram
   copiados ou adaptados. Atualizar o aviso atual de que nada upstream foi
   redistribuído quando isso mudar.
2. Expor catálogo offline e roteador de workflows adaptados, carregando
   apenas o conteúdo relacionado à tarefa. Testar integridade e
   licenciamento do pacote distribuído.
3. Implementar plano e aplicação segura dos templates documentais. Reusar
   padrões de snapshot, verificação de drift e rollback existentes,
   mantendo o estado de projeto separado do estado global das cinco skills.
4. Acrescentar inventário/plano de máquina sem alterar o ambiente real
   durante seus testes. Operações de sistema ou gerenciadores diferentes
   precisam dos adapters e das validações apropriados.
5. Entregar preset Next em projeto descartável, após as correções técnicas
   identificadas pela frente de engenharia. Expor a receita e a validação
   separadamente, com descoberta de cliente e serviços ainda pendentes quando
   não executados.
6. Ampliar fluxos de adoção, qualidade, contexto e auditoria em lotes
   verificáveis. Migrar documentação para os três idiomas quando o
   comportamento estiver estabelecido.

## Validação desta frente e limitações

Esta frente executou leitura estática dos arquivos de seu domínio e verificou
o inventário legível por máquina contra a árvore do snapshot. O relatório
descreve arquitetura e destinação futura. Nenhum prompt upstream foi
executado como instrução de setup, nenhum scanner/gerenciador foi instalado
e nenhuma integração global foi ativada nesta auditoria. A execução dos
validadores e a avaliação das implementações técnicas pertencem ao relatório
de engenharia.

Licenças e compatibilidade de componentes externos precisam acompanhar a
versão efetivamente distribuída. O MIT de Matheus cobre o material do
toolkit. Cada plugin, skill, dependência ou serviço referenciado tem suas
próprias condições, verificadas na frente de integrações. O inventário não
atribui código ou resultados de terceiros como contribuição exclusiva de
Rafael Pereira.

O rollback desta entrega documental consiste em retirar somente os dois
arquivos desta frente caso a incorporação seja cancelada. Qualquer etapa
futura de apply terá seu próprio backup, journal, estado e teste de
recuperação antes de tocar em configuração real.
