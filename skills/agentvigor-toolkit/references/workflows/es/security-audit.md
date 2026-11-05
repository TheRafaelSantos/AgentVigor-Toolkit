# Auditoría de seguridad y remediación

Audita sistemas seleccionados explícitamente y prepara lotes de corrección verificables.

1. Escoge AUDIT, PLAN, FIX o VERIFY. Usa AUDIT en lectura por defecto. Registra alcance, revisión inmutable, exclusiones, límites, permisos y destino privado. Las correcciones y pruebas activas requieren su propio alcance.

2. Rastrea entradas aplicables e inventaría dependencias, runtime, CI, infraestructura, privilegios y tratamiento de secretos. Contrasta estándares y avisos actuales con versiones resueltas y código alcanzable. Registra áreas sin revisar.

3. Separa hallazgos confirmados, hipótesis, endurecimiento y estado de soporte. Para cada elemento indica ID estable, gravedad, confianza, desencadenante, alcance, impacto, evidencia redactada, contraevidencia, corrección mínima y verificación.

4. Genera en privado SECURITY-AUDIT.md, SECURITY-FINDINGS.json, REMEDIATION-PROMPTS.md y AUDIT-HANDOFF.md. Usa versión de esquema y alcance, registra el próximo lote, verifica la revisión al retomar y repite pruebas negativas y de uso legítimo de correcciones seleccionadas.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/16-security-audit.md).
