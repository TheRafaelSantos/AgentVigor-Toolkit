# Refatoração de arquivos grandes por responsabilidade

Use alertas de tamanho medidos para encontrar extrações coesas.

1. Execute a regra de tamanho pertinente e registre os arquivos, tamanhos e limite reais. Escolha um lote pequeno dentro do escopo autorizado.

2. Para cada candidato, rastreie imports, exports públicos, chamadores e testes. Extraia uma responsabilidade real ou mantenha o arquivo e explique por que não há divisão útil.

3. Preserve nomes públicos, contratos, validação e comportamento de erro. Trabalhe em uma unidade coesa por vez. Rode tipos, testes e lint após cada mudança.

4. Reporte violações restantes e regressões observadas. Crie commits somente no escopo Git autorizado.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/09-file-size-refactor.md).
