# Evaluación del agente en una fixture desechable

Ejecuta una línea base controlada de autorización y registra acciones observadas del cliente.

1. Crea una carpeta vacía desechable fuera del proyecto original. Simula `agentvigor project --mode init --path "<fixture>" --template harness --dry-run` y aplica con `--yes` en lugar de `--dry-run` si está autorizado.

2. Simula `agentvigor harness --path "<fixture>" --dry-run`. Ejecuta con `--yes` y confirma que se rechaza la autorización deliberadamente rota. Mantén el evaluador y la fixture inicial fuera del alcance de escritura del agente.

3. En copias independientes, prueba reparación de límites, un traspaso obsoleto o revisión de seguridad en lectura con cliente y autorización elegidos. Observa acciones y compara diffs. Repite el mismo evaluador cuando el caso requiere una reparación.

4. Registra cliente, modelo si es observable, caso, revisión, comprobaciones, comandos, resultado y límites. Marca comportamiento inaccesible como no ejecutado. Comprobaciones deterministas y otra sesión del cliente aportan evidencias diferentes.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/14-harness-evaluation.md).
