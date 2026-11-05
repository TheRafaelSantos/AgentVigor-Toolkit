# División de archivos grandes por responsabilidad

Usa avisos de tamaño medidos para encontrar extracciones cohesionadas.

1. Ejecuta la regla de tamaño pertinente y registra archivos, tamaños y límite reales. Escoge un lote pequeño dentro del alcance autorizado.

2. Para cada candidato, rastrea imports, exports públicos, llamadores y pruebas. Extrae una responsabilidad real o conserva el archivo y explica por qué no hay una división útil.

3. Conserva nombres públicos, contratos, validación y comportamiento de errores. Trabaja en una unidad cohesionada cada vez. Ejecuta tipos, pruebas y lint tras cada cambio.

4. Informa de las infracciones restantes y regresiones observadas. Crea commits solo dentro del alcance de Git autorizado.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/09-file-size-refactor.md).
