# Instalação de regras locais de qualidade

Aplique o conjunto revisado de regras e meça a primeira execução.

1. Confirme Node e ESLint compatíveis. Leia a configuração, scripts, layout e proteções atuais.

2. Execute `agentvigor project --mode adopt --path "<projeto>" --template eslint --dry-run`. Confira arquivos auxiliares planejados. Com autorização, execute novamente com `--yes` no lugar de `--dry-run`. Confira propriedade registrada com `agentvigor project --mode status --path "<projeto>"`.

3. Simule a checagem com `agentvigor quality --path "<projeto>" --dry-run` e use `--yes` para rodar o plano conferido. Registre violações, checagens puladas e dependências pendentes. Mantenha o linter existente ativo.

4. Meça violações antes de ajustar regras opcionais. Preserve proteções existentes. Separe aplicação e medição da refatoração do projeto.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/08-eslint-quality-gates-install.md).
