# Bootstrap de projeto Next.js novo

Crie uma base com escopo para um projeto novo escolhido explicitamente.

1. Confirme que a pasta vazia existe e defina produto, público, MVP, aceite e necessidade de persistência. Confira Node e npm compatíveis. Use o fluxo de projeto existente quando o alvo já contém uma aplicação.

2. Simule `agentvigor project --mode init --path "<projeto>" --template next --dry-run`. Confira arquivos, dependências e alvo. Se autorizado, repita com `--yes` no lugar de `--dry-run`. Preencha os documentos propostos com decisões observadas.

3. Dentro do alvo, revise o pacote gerado e rode `npm install` somente com autorização para instalar dependências via rede. Simule `agentvigor quality --path "<projeto>" --dry-run` e rode os checks conferidos com `--yes`. Use o comando de inicialização do projeto e confira HTTP local quando aplicável.

4. Registre comandos, resultados, dependências e verificações opcionais. Migrações, serviços, permissões do cliente e publicação têm escopo próprio. Simule a reversão com `agentvigor project --mode rollback --path "<projeto>" --dry-run`.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/11-next-project-bootstrap.md).
