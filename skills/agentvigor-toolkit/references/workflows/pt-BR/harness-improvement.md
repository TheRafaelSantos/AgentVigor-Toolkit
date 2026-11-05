# Comparação de uma melhoria do harness

Teste uma mudança com o mesmo cenário e avaliador independente.

1. Identifique falha observada de instrução, contexto, memória ou uso de ferramenta. Defina aceite, alvo, limites, entradas e escritas permitidas. Quando não houver falha observada, registre a avaliação reutilizável.

2. Execute `harness-evaluation` em cópia descartável como baseline. Preserve avaliador, cliente, modelo, entrada, acesso e autorização. Inspecione resultados reais.

3. Altere uma instrução ou convenção pertinente do projeto em outra cópia. Repita as mesmas checagens a partir do mesmo estado inicial. Compare observações, regressões e limites.

4. Adote a candidata somente com evidência e dentro do escopo. Registre fonte, resultado e condição de invalidação. O método nativo dispensa serviço ou benchmark do Harness2 por padrão.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/15-harness-improvement.md).
