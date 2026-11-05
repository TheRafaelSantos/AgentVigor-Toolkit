# Revisión de seguridad en lectura

Rastrea límites de confianza en un snapshot o diff definido.

1. Registra destino, commit o base/head y modo de comparación, capas Git, autorización, exclusiones y destino privado del informe. Conserva el árbol de trabajo y el índice.

2. Identifica entradas, capacidades del atacante, activos, roles y operaciones sensibles. Sigue entradas externas por validación, autorización y almacenamiento. Lee llamadores y busca contraevidencia.

3. Usa herramientas existentes cuando sean adecuadas. Inspecciona scripts antes de cualquier prueba aislada. Usa datos sintéticos y ninguna credencial de producción. Mantén artefactos privados en el destino autorizado.

4. Informa hallazgos confirmados o hipótesis con gravedad, confianza, ubicación, requisitos, impacto, evidencia redactada y verificación concreta. Separa alcance sin revisar, evidencia estática y ejecución.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/13-security-review.md).
