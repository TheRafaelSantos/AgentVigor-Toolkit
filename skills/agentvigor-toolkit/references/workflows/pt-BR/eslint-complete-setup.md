# Configuração de ESLint por projeto

Planeje configuração lint compatível e preserve verificações existentes.

1. Identifique linguagens, framework, Node, ESLint instalado, gerenciador, lockfile, formatador e CI. Verifique engines e peers da versão adotada.

2. Simule o preset isolado com `agentvigor project --mode adopt --path "<projeto>" --template eslint --dry-run`. Com consentimento, aplique trocando `--dry-run` por `--yes`. A configuração atual do linter é preservada.

3. Use parser, caminhos, adaptador de logs e fronteiras de dados reais. Adicione checagem tipada quando pertinente. Introduza warnings legados com baseline medido e preserve erros existentes.

4. Simule `agentvigor quality --path "<projeto>" --dry-run` e execute o plano conferido com `--yes`. Registre o que rodou, falhas e dependências que ainda são pré-requisito.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/07-eslint-complete-setup.md).
