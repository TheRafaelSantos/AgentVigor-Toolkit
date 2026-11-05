# Comparación de una mejora del harness

Prueba un cambio con el mismo escenario y evaluador independiente.

1. Identifica un fallo observado de instrucciones, contexto, memoria o herramientas. Define aceptación, destino, límites, entradas y escrituras permitidas. Si no hay fallo observado, registra la evaluación reutilizable.

2. Ejecuta `harness-evaluation` en una copia desechable como línea base. Conserva evaluador, cliente, modelo, entrada, acceso y autorización. Inspecciona resultados reales.

3. Cambia una instrucción o convención pertinente del proyecto en otra copia. Repite las mismas verificaciones desde el mismo estado inicial. Compara observaciones, regresiones y límites.

4. Adopta el candidato solo con evidencia y dentro del alcance. Registra fuente, resultado y condición de invalidez. El método nativo prescinde de servicios o benchmarks de Harness2 por defecto.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/15-harness-improvement.md).
