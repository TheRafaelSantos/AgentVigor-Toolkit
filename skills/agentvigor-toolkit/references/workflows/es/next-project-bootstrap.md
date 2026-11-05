# Inicio de un proyecto Next.js nuevo

Crea una base acotada para un proyecto nuevo elegido expresamente.

1. Confirma que existe el directorio vacío y define producto, público, MVP, aceptación y necesidad de persistencia. Comprueba Node y npm compatibles. Usa el flujo de proyecto existente si el destino ya contiene una aplicación.

2. Simula `agentvigor project --mode init --path "<proyecto>" --template next --dry-run`. Revisa archivos, dependencias y destino. Si está autorizado, repite con `--yes` en lugar de `--dry-run`. Completa los documentos propuestos con decisiones observadas.

3. Dentro del destino, revisa el paquete generado y ejecuta `npm install` solo si la instalación de dependencias por red está autorizada. Simula `agentvigor quality --path "<proyecto>" --dry-run` y ejecuta las verificaciones revisadas con `--yes`. Usa el inicio del proyecto y comprueba HTTP local cuando corresponda.

4. Registra comandos, resultados, dependencias y comprobaciones opcionales. Migraciones, servicios, permisos del cliente y publicación tienen su propio alcance. Simula la reversión con `agentvigor project --mode rollback --path "<proyecto>" --dry-run`.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/11-next-project-bootstrap.md).
