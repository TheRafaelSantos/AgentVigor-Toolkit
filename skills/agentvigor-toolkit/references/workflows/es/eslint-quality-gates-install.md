# Instalación de reglas locales de calidad

Aplica el conjunto revisado de reglas y mide la primera ejecución.

1. Comprueba la compatibilidad de Node y ESLint. Lee la configuración, scripts, estructura y protecciones actuales.

2. Ejecuta `agentvigor project --mode adopt --path "<proyecto>" --template eslint --dry-run`. Revisa los archivos auxiliares previstos. Con autorización, ejecuta de nuevo con `--yes` en lugar de `--dry-run`. Comprueba los archivos gestionados con `agentvigor project --mode status --path "<proyecto>"`.

3. Simula la verificación con `agentvigor quality --path "<proyecto>" --dry-run` y usa `--yes` para ejecutar el plan revisado. Registra infracciones, verificaciones omitidas y dependencias pendientes. Mantén activo el linter existente.

4. Mide infracciones antes de ajustar reglas opcionales. Conserva las protecciones existentes. Separa aplicación y medición de la refactorización del proyecto.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/08-eslint-quality-gates-install.md).
