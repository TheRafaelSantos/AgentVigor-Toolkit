# Saneamiento del proyecto

Mide y limpia una base de código conservando su comportamiento.

1. Confirma el destino, el estado de Git, las instrucciones, los manifiestos y los comandos de lint, tipos, pruebas y build. Inspecciona los scripts antes de ejecutar una línea base segura.

2. Enumera importaciones sin uso, código inalcanzable, notas antiguas y dependencias candidatas. Comprueba entradas públicas, imports dinámicos, plugins, peers y reflexión antes de declarar algo sin uso.

3. Separa correcciones mecánicas de decisiones de alcance. Aplica únicamente elementos autorizados en cambios pequeños y ejecuta la comprobación pertinente después de cada uno. Conserva cambios ajenos.

4. Repite comprobaciones comparables. Registra cantidades, comandos, fallos y decisiones pendientes.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/01-project-sanitation.md).
