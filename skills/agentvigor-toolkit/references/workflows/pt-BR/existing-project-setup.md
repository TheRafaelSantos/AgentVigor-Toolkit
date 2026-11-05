# Adoção do AgentVigor em projeto existente

Concilie arquivos e capacidades com um plano que preserve equivalentes funcionais.

1. Inspecione Git, stack, lockfile, scripts, docs canônicas, instruções, origem das skills e clientes selecionados. Rode checagens seguras conhecidas antes de editar. Registre falhas anteriores.

2. Liste cada capacidade aplicável com ação, escopo, risco e evidência. Reuse equivalentes e decida quais docs propostas ou regras auxiliares agregam valor. Preserve stack, lockfile e autenticação.

3. Simule `agentvigor project --mode adopt --path "<projeto>" --template docs --dry-run`. Se necessário, selecione `eslint` ou `harness` em operação autorizada separada. Aplique com `--yes` no lugar de `--dry-run` após conferir o plano. Compare propostas em `.agentvigor-project/` antes de mesclar manualmente.

4. Confira arquivos gerenciados com `agentvigor project --mode status --path "<projeto>"`. Repita o baseline, separe descoberta do cliente de presença de arquivo e registre evidências e pendências.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/12-existing-project-setup.md).
