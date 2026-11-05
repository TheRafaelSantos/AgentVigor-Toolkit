# Adopción de AgentVigor en un proyecto existente

Reconcilia archivos y capacidades con un plan que conserva equivalentes funcionales.

1. Inspecciona Git, stack, lockfile, scripts, docs canónicas, instrucciones, origen de skills y clientes seleccionados. Ejecuta verificaciones seguras conocidas antes de editar. Registra fallos anteriores.

2. Enumera cada capacidad aplicable con acción, alcance, riesgo y evidencia. Reutiliza equivalentes y decide qué docs propuestas o reglas auxiliares aportan valor. Conserva stack, lockfile y autenticación.

3. Simula `agentvigor project --mode adopt --path "<proyecto>" --template docs --dry-run`. Si hace falta, selecciona `eslint` o `harness` como operación autorizada aparte. Aplica con `--yes` en lugar de `--dry-run` tras revisar el plan. Compara propuestas en `.agentvigor-project/` antes de fusionar manualmente.

4. Comprueba los archivos gestionados con `agentvigor project --mode status --path "<proyecto>"`. Repite la línea base, separa descubrimiento del cliente de presencia de archivos y registra evidencias y pendientes.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/12-existing-project-setup.md).
