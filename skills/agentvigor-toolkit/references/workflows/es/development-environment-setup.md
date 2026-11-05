# Preparación del entorno de desarrollo

Haz inventario del entorno real y planifica solo los cambios globales seleccionados.

1. Identifica SO, arquitectura, shell, Windows o WSL, runtime, gestor y ejecutables de agentes. Ejecuta `agentvigor doctor` como evidencia local. Comprueba origen y versión de cada componente seleccionado.

2. Enumera solo clientes y herramientas elegidos. Registra alcance, versiones, acción, evidencia, instalador y reversión. Conserva autenticación, aprobaciones y sandbox vigentes. Docker, plugins, RTK, MCP y Caveman son elecciones separadas.

3. Para las skills de AgentVigor simula `agentvigor install --agent codex --dry-run`, usando `claude` o `both` solo si se eligieron. Revisa la salida y confirma la instalación correspondiente cuando esté autorizada. Para otras herramientas elegidas, usa el método oficial verificado tras autorización específica y copia de seguridad.

4. En otra terminal y sesión del cliente, verifica versiones, descubrimiento de skills y pruebas autorizadas. Registra instalado, configurado, validado, pendiente u omitido por separado. Omite rutas privadas y credenciales de informes compartibles.

Adaptado del Vibe Coding Toolkit de Matheus Gomes (MIT). [Fuente en la revisión auditada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/10-development-environment-setup.md).
