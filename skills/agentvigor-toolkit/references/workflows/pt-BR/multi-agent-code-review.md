# Revisão independente de código

Revise uma mudança definida pelas perspectivas justificadas pelo risco.

1. Resolva base e head ou fixe o estado staged, unstaged e untracked pertinente. Registre exclusões.

2. Escolha perspectivas de comportamento, segurança, dados, tipos e UI. Use revisores independentes em leitura quando o cliente suportar. Caso contrário, revise na sessão e registre o limite.

3. Inspecione chamadores, contratos e testes. Isole ou serialize checagens que escrevem build, usam portas ou acessam serviços.

4. Verifique alegações, reúna duplicatas por causa e ordene cenários concretos de falha com localização, impacto e evidência. Entregue achados e limites antes de correções autorizadas em separado.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/03-multi-agent-code-review.md).
