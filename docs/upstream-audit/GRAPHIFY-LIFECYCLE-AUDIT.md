# Graphify lifecycle audit

Scope: source inspection of Graphify `v0.9.102`, commit
`59b5ab1151e031fb42e39cfc9a50bf96f2d57ae0`, on 2026-11-04 (Brazil time).
This is an implementation prerequisite; it does not claim an AgentVigor-managed
Graphify installer or observed native-client behavior.

## English

The [official installer](https://github.com/Graphify-Labs/graphify/blob/59b5ab1151e031fb42e39cfc9a50bf96f2d57ae0/graphify/install.py)
separates global skill installation, project registration and hook activation.

| Operation or resource | Source behavior | AgentVigor integration requirement |
| --- | --- | --- |
| `uv tool install graphifyy==0.9.102` | Official package name is `graphifyy`; Python 3.10+ and base AST/numeric dependencies. Optional extras include model APIs, document/media processing and databases. | Preview network, executable ownership and Python dependencies. Select the base package; extras and provider setup require separate selection. Preserve an existing user-managed installation. |
| `graphify install --platform codex` | Global skill at `~/.codex/skills/graphify`, using `skill-codex.md`, eight reference sidecars and `.graphify_version`. This path resolver does not honor `CODEX_HOME`. | Inspect both native and legacy skill locations for duplicates. Preview any adaptation for a custom root; do not silently move an existing installation. |
| `graphify install --platform claude` | Global skill plus short `CLAUDE.md` registration. Honors `CLAUDE_CONFIG_DIR`, and embeds its selected path in that registration. | Back up and merge the instruction file, replace only the staging-root reference, and preview exact resulting bytes. Preserve unrelated user instructions. |
| Global `install` | Does not call the Codex/Claude project-hook installers. | Do not claim hooks were activated by this command. Global skill discovery is a separate client observation. |
| Project scope / `graphify claude install` | Project instructions and hooks are separate paths. Claude hooks use search/read guards; `--strict` changes blocking behavior. | A project or strict-hook change needs its own scoped plan. Global integration must not modify the current project implicitly. |
| Codex project hook | Source describes `hook-check` as an intentional no-op for Codex Desktop; graph guidance is through project instructions. | Report this limitation, without asserting effective context injection or token savings from hook registration. |
| Sidecar installation | Replaces the references directory; the upstream source can remove an orphan directory. | Run the official generator in isolation. Check the complete owned-file set before applying; preserve user files and reject unmanaged directories. |
| Version and backups | Writes `.graphify_version`; backs up changed `SKILL.md` once as `.bak`, with backup errors tolerated upstream. | Use AgentVigor's durable transaction and drift checks. Preserve all managed previous bytes; never depend on the upstream best-effort backup alone. |
| License | Apache-2.0 plus preserved MIT contributions and NOTICE. | Retain all applicable license and attribution files. |

The current machine inventory resolved Graphify `0.9.10`; the audited source is
`0.9.102`. The inventory does not equate these versions or declare them behaviorally
incompatible without a scoped test. No upgrade was performed. Managed Graphify
installation remains MISSING; configuration, discovery and invocation remain
UNVERIFIED. Existing read-only inventory and setup plans remain available.

Next implementation should reuse the shared transaction already exercised by
RTK and Find Skills, add a per-client owned-file allowlist, stage the official
generator, and prove rollback in disposable roots. Binary installation must be
handled explicitly; a copied skill does not establish a usable Graphify runtime.

Other primary sources:
[package and dependencies](https://github.com/Graphify-Labs/graphify/blob/59b5ab1151e031fb42e39cfc9a50bf96f2d57ae0/pyproject.toml),
[Apache license](https://github.com/Graphify-Labs/graphify/blob/59b5ab1151e031fb42e39cfc9a50bf96f2d57ae0/LICENSE),
[preserved MIT license](https://github.com/Graphify-Labs/graphify/blob/59b5ab1151e031fb42e39cfc9a50bf96f2d57ae0/LICENSE-MIT),
[NOTICE](https://github.com/Graphify-Labs/graphify/blob/59b5ab1151e031fb42e39cfc9a50bf96f2d57ae0/NOTICE).

## Português brasileiro

A auditoria do código original separou três operações: instalar o executável,
registrar a skill global e ativar instruções/hooks em um projeto. O comando
global não comprova que os hooks do projeto foram ativados. O hook de Codex é
descrito pelo próprio código como uma operação sem efeito de injeção de contexto
no Desktop; as orientações vêm do arquivo de instruções.

O destino Codex desta versão é `~/.codex/skills/graphify`, sem respeitar
`CODEX_HOME`; Claude respeita `CLAUDE_CONFIG_DIR`. É necessário conferir destinos
duplicados, oito referências locais, marca de versão, instruções preexistentes
e as licenças Apache/MIT/NOTICE. O gerador original deve rodar isolado, pois pode
substituir diretórios de referências e seu backup é de melhor esforço.

O executável observado nesta máquina é 0.9.10, diferente da versão auditada
0.9.102. Nenhum upgrade foi aplicado. O executor gerenciado continua MISSING;
configuração, descoberta e invocação continuam UNVERIFIED. A implementação deve
reutilizar a transação de RTK/Find Skills, apresentar mudanças exatas e comprovar
rollback. Instalar apenas arquivos de skill não comprova o runtime. Extras de
API, processamento de mídia e bancos exigem seleção separada.

## Español

La revisión distingue instalar el ejecutable, registrar la skill global y
activar instrucciones/hooks de proyecto. El comando global no prueba activación
de hooks. El propio código describe el hook de Codex como una operación sin
inyección de contexto en Desktop; las instrucciones del proyecto dan la guía.

Esta versión usa `~/.codex/skills/graphify` sin respetar `CODEX_HOME`; Claude sí
respeta `CLAUDE_CONFIG_DIR`. Se deben revisar duplicados, ocho referencias, marca
de versión, instrucciones previas y licencias Apache/MIT/NOTICE. El generador
original debe ejecutarse aislado porque puede reemplazar directorios de
referencias y su copia de seguridad es de mejor esfuerzo.

El ejecutable observado es 0.9.10; la fuente auditada es 0.9.102. No se actualizó
la instalación. El executor gestionado sigue MISSING; configuración,
descubrimiento e invocación siguen UNVERIFIED. La implementación debe reutilizar
la transacción de RTK/Find Skills, mostrar cambios exactos y probar reversión.
Copiar una skill no prueba que exista un runtime utilizable. Extras de API,
medios y bases de datos requieren selección independiente.
