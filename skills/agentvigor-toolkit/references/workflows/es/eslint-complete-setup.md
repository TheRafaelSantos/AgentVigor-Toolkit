# Configuración de ESLint por proyecto

Planifica una configuración de lint compatible y conserva controles existentes.

1. Identifica lenguajes, framework, Node, ESLint instalado, gestor, lockfile, formateador y CI. Comprueba engines y peers de la versión adoptada.

2. Simula el preset aislado con `agentvigor project --mode adopt --path "<proyecto>" --template eslint --dry-run`. Con consentimiento, aplica sustituyendo `--dry-run` por `--yes`. Se conserva la configuración del linter.

3. Usa el parser, las rutas, el adaptador de logs y los límites de datos reales. Añade comprobación tipada cuando corresponda. Introduce avisos heredados con línea base medida y conserva errores existentes.

4. Simula `agentvigor quality --path "<proyecto>" --dry-run` y ejecuta el plan revisado con `--yes`. Registra qué se ejecutó, los fallos y las dependencias pendientes.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/07-eslint-complete-setup.md).
