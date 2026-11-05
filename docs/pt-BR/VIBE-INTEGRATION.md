# Integração com o Vibe Coding Toolkit

O AgentVigor inclui 16 fluxos adaptados em inglês, português do Brasil e espanhol. O catálogo lê arquivos locais. A skill AgentVigor Toolkit direciona cada pedido a um fluxo e indica a skill especializada pertinente, quando disponível.

## Escolher e ler um fluxo

Abra um terminal na pasta do AgentVigor. Liste o catálogo e depois carregue o fluxo pelo ID. O segundo comando mostra a revisão, os metadados traduzidos e as instruções completas em JSON.

```text
node bin/agentvigor.mjs catalog --lang pt-BR
node bin/agentvigor.mjs catalog --id existing-project-setup --lang pt-BR --json
```

## Instalar as skills

Use PowerShell no Windows ou Terminal no macOS, Linux ou WSL. Rode os comandos abaixo na pasta do AgentVigor. Troque `codex` por `claude` ou `both` se necessário. `rigorous` inclui a roteadora e as cinco skills especializadas. Confira as mudanças na simulação antes de aplicar com `--yes`. Reinicie o cliente selecionado e procure `agentvigor-toolkit` no seletor de skills.

```text
node bin/agentvigor.mjs install --agent codex --profile rigorous --lang pt-BR --dry-run
node bin/agentvigor.mjs install --agent codex --profile rigorous --lang pt-BR --yes
node bin/agentvigor.mjs status --json
```

Para atualizar uma instalação após selecionar uma revisão verificada do toolkit, simule `node bin/agentvigor.mjs update --dry-run` e aplique com `node bin/agentvigor.mjs update --yes`. Para retirar as skills gerenciadas, simule `node bin/agentvigor.mjs rollback --all --dry-run` e aplique com `node bin/agentvigor.mjs rollback --all --yes`. Sem `--all`, o rollback restaura o estado anterior quando disponível. Consulte o guia de recuperação se uma operação parou durante a gravação.

## Aplicar arquivos no projeto

Substitua o caminho por uma pasta de projeto existente. O exemplo usa um caminho com espaços. O plano cria arquivos ausentes e coloca propostas de conflito em `.agentvigor-project/`. Confira cada proposta antes de mesclar manualmente. Para projeto novo, escolha `--mode init` e use uma pasta vazia que já exista. Os presets disponíveis são `docs`, `eslint`, `harness` e `next`. Use `next` em projeto novo. Os presets `docs` e `eslint` aceitam ambos os modos. Os presets `next` e `harness` exigem `init` e uma pasta vazia que já exista.

```text
node bin/agentvigor.mjs project --mode adopt --template docs --path "./Meu Projeto" --lang pt-BR --dry-run
node bin/agentvigor.mjs project --mode adopt --template docs --path "./Meu Projeto" --lang pt-BR --yes
node bin/agentvigor.mjs project --mode status --path "./Meu Projeto" --lang pt-BR --json
```

A reversão do projeto afeta os arquivos gerenciados pelo AgentVigor. Simule a operação e confira os arquivos alterados antes de confirmar. Preserve edições do usuário e arquivos existentes em seu local de origem.

```text
node bin/agentvigor.mjs project --mode rollback --path "./Meu Projeto" --lang pt-BR --dry-run
node bin/agentvigor.mjs project --mode rollback --path "./Meu Projeto" --lang pt-BR --yes
```

## Executar verificações

Simule as checagens de qualidade configuradas e execute somente os comandos conferidos. O preset `eslint` usa regras complementares e requer ESLint compatível no alvo. O preset `next` gera uma base web inicial. Para instalar suas dependências, abra um terminal no projeto gerado e rode `npm install --ignore-scripts --no-audit --no-fund` quando o acesso à rede estiver autorizado. Depois, rode as checagens de qualidade a partir da pasta do AgentVigor. No projeto, `npm run dev` inicia o site local.

```text
node bin/agentvigor.mjs quality --path "./Meu Projeto" --lang pt-BR --dry-run
node bin/agentvigor.mjs quality --path "./Meu Projeto" --lang pt-BR --yes
```

Crie uma pasta vazia descartável para o preset `harness`. Use o caminho dessa pasta no exemplo. A fixture contém uma falha de autorização proposital. A falha inicial é o resultado esperado. Para avaliar uma correção, use outra cópia descartável e repita o avaliador após a mudança.

```text
node bin/agentvigor.mjs project --mode init --template harness --path "./Fixture de Harness" --lang pt-BR --dry-run
node bin/agentvigor.mjs project --mode init --template harness --path "./Fixture de Harness" --lang pt-BR --yes
node bin/agentvigor.mjs harness --path "./Fixture de Harness" --lang pt-BR --dry-run
node bin/agentvigor.mjs harness --path "./Fixture de Harness" --lang pt-BR --yes
```

## Fontes e limites

A [instalação gerenciada do Find Skills](../FIND-SKILLS-MANAGEMENT.md#português-brasileiro)
usa o instalador oficial com versão fixa, confirmação específica e rollback
offline. Descoberta e invocação no cliente ainda exigem sessões observadas.

Preparação de máquina, revisão de segurança, memória e delegação são fluxos orientados ao agente. O catálogo entrega suas instruções. Nenhum gerenciador global ou serviço externo é acionado pelo catálogo. Matheus Gomes mantém o copyright do Vibe Coding Toolkit sob MIT. Configurações e módulos originais selecionados são referências. A auditoria e o guia de integração registram o que está incluído e as lacunas.

[Auditoria upstream](../upstream-audit/CONTENT-AUDIT.md) · [Referências upstream incluídas](../../skills/agentvigor-toolkit/references/upstream/README.md) · [Guia de recuperação](../RECOVERY.md) · [Avisos de terceiros](../../THIRD_PARTY_NOTICES.md).
