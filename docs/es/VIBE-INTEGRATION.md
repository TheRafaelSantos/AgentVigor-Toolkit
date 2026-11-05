# Integración con Vibe Coding Toolkit

AgentVigor incluye 16 flujos adaptados en inglés, portugués de Brasil y español. El catálogo lee archivos locales. La skill AgentVigor Toolkit dirige cada solicitud a un flujo e indica la skill especializada pertinente cuando está disponible.

## Elegir y leer un flujo

Abre una terminal en la carpeta de AgentVigor. Enumera el catálogo y después carga un flujo por ID. El segundo comando muestra la revisión, los metadatos traducidos y las instrucciones completas en JSON.

```text
node bin/agentvigor.mjs catalog --lang es
node bin/agentvigor.mjs catalog --id existing-project-setup --lang es --json
```

## Instalar las skills

Usa PowerShell en Windows o Terminal en macOS, Linux o WSL. Ejecuta los comandos en la carpeta de AgentVigor. Cambia `codex` por `claude` o `both` si lo necesitas. `rigorous` incluye el enrutador y las cinco skills especializadas. Revisa los cambios en la simulación antes de aplicar con `--yes`. Reinicia el cliente elegido y busca `agentvigor-toolkit` en el selector de skills.

```text
node bin/agentvigor.mjs install --agent codex --profile rigorous --lang es --dry-run
node bin/agentvigor.mjs install --agent codex --profile rigorous --lang es --yes
node bin/agentvigor.mjs status --json
```

Para actualizar una instalación después de elegir una revisión verificada del toolkit, simula `node bin/agentvigor.mjs update --dry-run` y aplica con `node bin/agentvigor.mjs update --yes`. Para retirar las skills gestionadas, simula `node bin/agentvigor.mjs rollback --all --dry-run` y aplica con `node bin/agentvigor.mjs rollback --all --yes`. Sin `--all`, rollback restaura el estado anterior cuando está disponible. Consulta la guía de recuperación si una operación se detuvo durante la escritura.

## Aplicar archivos al proyecto

Sustituye la ruta por una carpeta de proyecto existente. El ejemplo usa una ruta con espacios. El plan crea archivos ausentes y guarda propuestas para conflictos en `.agentvigor-project/`. Revisa cada propuesta antes de fusionarla manualmente. Para un proyecto nuevo, elige `--mode init` y usa una carpeta vacía que ya exista. Los presets disponibles son `docs`, `eslint`, `harness` y `next`. Usa `next` en un proyecto nuevo. Los presets `docs` y `eslint` admiten ambos modos. Los presets `next` y `harness` requieren `init` y una carpeta vacía que ya exista.

```text
node bin/agentvigor.mjs project --mode adopt --template docs --path "./Mi Proyecto" --lang es --dry-run
node bin/agentvigor.mjs project --mode adopt --template docs --path "./Mi Proyecto" --lang es --yes
node bin/agentvigor.mjs project --mode status --path "./Mi Proyecto" --lang es --json
```

La reversión del proyecto afecta los archivos gestionados por AgentVigor. Simula la operación y revisa qué archivos cambiaron antes de confirmar. Conserva las ediciones del usuario y los archivos existentes en su ubicación original.

```text
node bin/agentvigor.mjs project --mode rollback --path "./Mi Proyecto" --lang es --dry-run
node bin/agentvigor.mjs project --mode rollback --path "./Mi Proyecto" --lang es --yes
```

## Ejecutar verificaciones

Simula las verificaciones de calidad configuradas y ejecuta solo los comandos revisados. El preset `eslint` usa reglas complementarias y requiere ESLint compatible en el destino. El preset `next` genera una base web inicial. Para instalar sus dependencias, abre una terminal en el proyecto generado y ejecuta `npm install --ignore-scripts --no-audit --no-fund` cuando el acceso a la red esté autorizado. Después, ejecuta las verificaciones de calidad desde la carpeta de AgentVigor. En el proyecto, `npm run dev` inicia el sitio local.

```text
node bin/agentvigor.mjs quality --path "./Mi Proyecto" --lang es --dry-run
node bin/agentvigor.mjs quality --path "./Mi Proyecto" --lang es --yes
```

Crea una carpeta desechable vacía para el preset `harness`. Usa la ruta de esa carpeta en el ejemplo. La fixture contiene un fallo de autorización deliberado. El fallo inicial es el resultado esperado. Para evaluar una corrección, usa otra copia desechable y repite el evaluador después del cambio.

```text
node bin/agentvigor.mjs project --mode init --template harness --path "./Fixture de Harness" --lang es --dry-run
node bin/agentvigor.mjs project --mode init --template harness --path "./Fixture de Harness" --lang es --yes
node bin/agentvigor.mjs harness --path "./Fixture de Harness" --lang es --dry-run
node bin/agentvigor.mjs harness --path "./Fixture de Harness" --lang es --yes
```

## Fuentes y límites

La [instalación gestionada de Find Skills](../FIND-SKILLS-MANAGEMENT.md#español)
usa el instalador oficial con versión fija, consentimiento específico y
reversión offline. Descubrimiento e invocación aún requieren sesiones observadas.

La preparación del equipo, la revisión de seguridad, la memoria y la delegación son flujos guiados por el agente. El catálogo entrega sus instrucciones. El catálogo no invoca gestores globales ni servicios externos. Matheus Gomes conserva el copyright de Vibe Coding Toolkit bajo MIT. Las configuraciones y módulos originales seleccionados son referencias. La auditoría y la guía de integración registran el alcance y los pendientes.

[Auditoría upstream](../upstream-audit/CONTENT-AUDIT.md) · [Referencias upstream incluidas](../../skills/agentvigor-toolkit/references/upstream/README.md) · [Guía de recuperación](../RECOVERY.md) · [Avisos de terceros](../../THIRD_PARTY_NOTICES.md).
