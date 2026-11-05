# Oleadas de tareas en paralelo

Delega trabajo independiente con un escritor por archivo y recurso.

1. Asigna a cada tarea un ID, objetivo, archivos permitidos, recursos mutables, dependencias, verificaciones de aceptación y responsable.

2. Agrupa tareas en una oleada solo si sus archivos son distintos, sus recursos mutables están aislados y carecen de dependencias directas o transitivas. Serializa lo incierto.

3. Usa herramientas disponibles en el cliente. Conserva modelo y autenticación autorizados. El coordinador controla los archivos compartidos y Git. Los revisores trabajan en modo de lectura.

4. Revisa diffs parciales y la integración antes de otra oleada. Confirma que un agente se detuvo antes de tomar sus archivos. Reasigna solo con reintentos acotados y evidencia nueva.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/05-parallel-wave-dispatch.md).
