# Avaliação do agente em fixture descartável

Execute um baseline controlado de autorização e registre ações observadas do cliente.

1. Crie uma pasta vazia descartável fora do projeto original. Simule `agentvigor project --mode init --path "<fixture>" --template harness --dry-run` e aplique com `--yes` no lugar de `--dry-run` se autorizado.

2. Simule `agentvigor harness --path "<fixture>" --dry-run`. Rode com `--yes` e confirme a rejeição do baseline de autorização intencionalmente quebrado. Mantenha avaliador e fixture inicial fora do escopo de escrita do agente.

3. Em cópias independentes, teste correção de fronteira, handoff obsoleto ou revisão de segurança em leitura com cliente e autorização selecionados. Observe ações e compare diffs. Repita o mesmo avaliador quando o caso pede correção.

4. Registre cliente, modelo se observável, caso, revisão, checagens, comandos, resultado e limites. Classifique comportamento indisponível como não executado. Checagens determinísticas e nova sessão do cliente são evidências diferentes.

Adaptado do Vibe Coding Toolkit de Matheus Gomes (MIT). [Fonte na revisão auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/14-harness-evaluation.md).
