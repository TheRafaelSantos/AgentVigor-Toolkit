# Reducción de avisos de ESLint

Mide los avisos por regla y redúcelos sin ocultar regresiones.

1. Localiza el comando y el alcance de ESLint. Ejecútalo de forma segura con salida completa y cuenta los avisos por regla y archivo.

2. Identifica casos costosos o sensibles al comportamiento. Presenta evidencias y decide entre corregir, registrar una excepción acotada o cambiar la regla dentro de la autorización vigente. Continúa el trabajo independiente mientras haya decisiones pendientes.

3. Conserva severidades, exclusiones, pruebas y comportamiento. Agrupa por causa y aísla archivos y recursos si delegas. Repite lint y regresiones pertinentes después de cada grupo.

4. Registra los conteos finales observados, las supresiones justificadas, las excepciones y los cambios de configuración.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/02-eslint-warning-burndown.md).
