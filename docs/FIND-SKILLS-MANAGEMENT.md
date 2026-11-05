# Managed Find Skills integration

This capability is on `main`, after `v0.2.0-rc.1`; the older release does not
include it. No npm registry release is implied. Native-client discovery and
behavioral invocation remain unverified.

## English

Open PowerShell in the AgentVigor checkout. Choose `codex` or `claude` for each
operation. `--agent claude` honors an absolute `CLAUDE_CONFIG_DIR`; Codex uses
the native user directory `~/.agents/skills`.

```powershell
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode install --dry-run --json
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode install
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode status --json
```

The first command is offline and creates no files. It lists the destination,
two managed files, MIT license, pinned source, package integrity and network
requirement. The second command displays the same preview and asks for consent;
noninteractive use requires the explicit `--yes` flag. It requires Git, npm and
Node 22.20+ on a toolkit-supported release line. Canceling preserves the destination.

After consent, AgentVigor runs the official `skills@1.7.6` CLI in a disposable
home. It downloads via npm and GitHub, disables telemetry and npm lifecycle
scripts, verifies the published package integrity and exact source manifest,
then registers the checked bytes in the selected native directory. npm and Git
user configuration and credentials are not inherited. Installation does not
invoke a model or configure an API provider. A private transaction journal and
backups are kept in `~/.agentvigor/integrations/find-skills-codex` or
`find-skills-claude`. Upstream's disposable lockfile and package cache are
removed with the staging directory; AgentVigor owns the destination transaction.

Expected checkpoints: `installed`, then `INSTALLED` and `CONFIGURED` in the
inventory; `DISCOVERED` and `VERIFIED` stay `UNVERIFIED`. Repeat installation
returns `unchanged` without downloading. Existing unmanaged skills are blocked,
including identical ones: their ownership is preserved. Edited or linked managed
files block replacement. Unknown files in the destination are preserved.

To undo the installation, preview and confirm the following commands. Rollback
works offline without npm or Git, restores previous managed bytes, removes
newly managed files and removes only empty owned subdirectories.

```powershell
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode rollback --dry-run --json
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode rollback
```

Interrupted transactions require rollback with the same home/client root.
Preserve the private state directory until recovery finishes. If a lock remains,
confirm no installer process is active before removing only its empty
`write.lock` directory. User directories must remain under the account owner's
control during execution. The original skill and license are preserved byte for
byte under `lib/assets/find-skills`; their SHA-256 values are checked on install.

From the checkout, automated tests are offline. The separate official smoke
requires explicit network opt-in and uses only disposable homes:

```powershell
npm.cmd test
node scripts/smoke-find-skills.mjs --allow-network
```

The official Windows smoke covers both native destinations, version/integrity,
manifest registration, idempotency and offline rollback. It does not open either
client, authenticate a user or prove a skill invocation. Cross-platform CI tests
the transaction with an injected installer; those tests do not prove the official
CLI on platforms where the network smoke has not run.

Validation record for this change (2026-11-04, Brazil time): the complete Windows
suite passed 91/91 tests; the nine RTK/Find Skills transaction tests also passed
under Ubuntu/WSL with Node 24.15.0. The actual official Windows smoke passed for
both Find Skills destinations and both RTK configurations. An independent code
review found no blocking issue. CI still provides the separate macOS and Linux
checks; the previous macOS RTK temporary-path failure was fixed and all six
matrix jobs passed for that fix.

Sources: [official CLI commands](https://github.com/vercel-labs/skills/blob/v1.7.6/docs/commands.md),
[native destinations](https://github.com/vercel-labs/skills/blob/v1.7.6/src/agents.ts),
[telemetry opt-out](https://github.com/vercel-labs/skills/blob/v1.7.6/src/telemetry.ts),
[MIT license](https://github.com/vercel-labs/skills/blob/v1.7.6/LICENSE).

## Português brasileiro

Abra o PowerShell e entre na pasta do projeto:

```powershell
Set-Location 'C:\Users\rafap\Desktop\AgentVigor Toolkit'
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode install --dry-run --lang pt-BR
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode install --lang pt-BR
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode status --json
```

1. A prévia funciona sem rede e não cria arquivos. Confira o destino, os dois
   arquivos gerenciados, a versão 1.7.6, a licença MIT e a indicação de rede.
2. No segundo comando, confirme somente se quiser instalar a ferramenta.
   Execução sem interação exige `--yes`. Use `--agent claude` para Claude Code;
   um `CLAUDE_CONFIG_DIR` absoluto será respeitado. Codex usa `~/.agents/skills`.
3. São necessários Git, npm e Node 22.20 ou superior em uma versão suportada.
   O instalador oficial roda em uma pasta temporária, acessa npm e GitHub e tem
   telemetria e scripts de ciclo de vida do npm desativados. O AgentVigor confere
   a integridade do pacote e o hash do manifesto antes de registrar os arquivos.
   Configurações e credenciais pessoais de Git/npm não são herdadas. Nenhum
   modelo é chamado, e nenhum provedor de API é configurado.
4. O resultado esperado é `installed`; o inventário deverá mostrar `INSTALLED`
   e `CONFIGURED`. Descoberta e invocação continuam `UNVERIFIED` até testes em
   uma sessão nova do cliente. Repetir retorna `unchanged`, sem download.
5. Uma instalação preexistente não gerenciada é bloqueada, mesmo sendo igual.
   Arquivos editados ou vinculados também impedem substituição. Arquivos extras
   do usuário são preservados. A instalação oficial não deixa seu cache ou
   lockfile temporário no perfil real; o AgentVigor registra sua própria transação.

O backup e o diário ficam em `~/.agentvigor/integrations/find-skills-codex` ou
`find-skills-claude`. Guarde-os até concluir a reversão. Para desfazer, use os
comandos abaixo no mesmo PowerShell. A reversão funciona sem rede, npm ou Git;
restaura os bytes anteriores, remove arquivos criados pela operação e apaga
somente subpastas gerenciadas que estiverem vazias.

```powershell
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode rollback --dry-run --lang pt-BR
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode rollback --lang pt-BR
npm.cmd test
node scripts/smoke-find-skills.mjs --allow-network
```

Em caso de interrupção, faça rollback usando o mesmo diretório do cliente.
Se restar um bloqueio, confirme que nenhum instalador está ativo antes de remover
somente a pasta vazia `write.lock`. As pastas devem permanecer sob controle do
dono da conta durante a execução. O teste oficial acima instala e desfaz em
perfis descartáveis e exige autorização de rede explícita. Ele valida os dois
destinos no Windows, mas não abre Codex/Claude nem comprova invocação real.
O CI usa um instalador simulado para testar a transação nos outros sistemas.
A funcionalidade está na branch `main`, posterior à versão `v0.2.0-rc.1`.

## Español

Abre PowerShell en la carpeta del proyecto. Elige un cliente por operación;
`--agent claude` respeta `CLAUDE_CONFIG_DIR` absoluto y Codex usa `~/.agents/skills`.

```powershell
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode install --dry-run --lang es
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode install --lang es
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode status --json
```

1. La vista previa es offline y no crea archivos. Revisa destino, dos archivos,
   versión 1.7.6, licencia MIT y acceso de red. El segundo comando pide permiso;
   la ejecución no interactiva requiere `--yes`.
2. Se necesitan Git, npm y Node 22.20+ en una versión compatible. El CLI oficial
   se ejecuta en un perfil temporal, accede a npm/GitHub y desactiva telemetría
   y scripts de ciclo de vida de npm. Se comprueban integridad y hash antes de
   registrar archivos. No hereda credenciales/configuración personal de Git/npm,
   no invoca modelos ni configura proveedores de API.
3. Espera `installed`, seguido de `INSTALLED` y `CONFIGURED`. Descubrimiento e
   invocación siguen `UNVERIFIED` hasta una sesión nueva del cliente. Repetir
   devuelve `unchanged` sin descargar. Las instalaciones ajenas se bloquean,
   aunque sean idénticas; también se bloquean archivos modificados o enlazados.
   Los archivos adicionales del usuario se conservan. Caché y lockfile del
   instalador oficial quedan en el perfil temporal y se eliminan al terminar.
4. Conserva copias y diario en `~/.agentvigor/integrations/find-skills-codex`
   o `find-skills-claude` hasta terminar la reversión. Los directorios deben
   permanecer bajo control del propietario durante la operación.

Para revertir, usa el mismo cliente. Funciona sin red, npm ni Git; restaura bytes
anteriores, elimina archivos creados y solo borra subdirectorios gestionados vacíos:

```powershell
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode rollback --dry-run --lang es
node bin/agentvigor.mjs integrations --tool find-skills --agent codex --mode rollback --lang es
npm.cmd test
node scripts/smoke-find-skills.mjs --allow-network
```

Una interrupción requiere rollback con la misma raíz. Si queda un bloqueo,
confirma que ningún instalador está activo antes de eliminar únicamente su
directorio vacío `write.lock`. El smoke oficial requiere consentimiento de red
y usa perfiles desechables. Comprueba ambos destinos en Windows; no abre clientes
ni prueba invocaciones. CI usa un instalador simulado para las transacciones de
otros sistemas. Esta capacidad está en `main`, después de `v0.2.0-rc.1`.
