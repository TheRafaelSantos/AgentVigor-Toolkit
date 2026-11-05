# Revisión independiente de código

Revisa un cambio definido desde las perspectivas que exige su riesgo.

1. Resuelve base y head o fija el estado staged, unstaged y untracked pertinente. Registra las exclusiones.

2. Escoge perspectivas de comportamiento, seguridad, datos, tipos e interfaz. Usa revisores independientes de solo lectura cuando el cliente lo admita. En otro caso, revisa en la sesión y registra el límite.

3. Inspecciona llamadores, contratos y pruebas. Aísla o serializa verificaciones que escriban resultados de build, usen puertos o accedan a servicios.

4. Verifica afirmaciones, agrupa duplicados por causa y ordena escenarios concretos con ubicación, impacto y evidencia. Informa antes de aplicar correcciones autorizadas por separado.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/03-multi-agent-code-review.md).
