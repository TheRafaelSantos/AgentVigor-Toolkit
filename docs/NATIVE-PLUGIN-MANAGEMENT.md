# Managed Superpowers and Ponytail

| Plugin | Codex managed version | Pinned source |
| --- | --- | --- |
| Superpowers | 7.0.2 | [obra/superpowers](https://github.com/obra/superpowers/tree/22f0b463e7a5e579904dd6211a520321035526f7) |
| Ponytail | 5.3.3 | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail/tree/7801d061243d7b753bad0e0b3c057cd250b11755) |

Both plugins use MIT and retain the upstream notices. AgentVigor runs the native
Codex marketplace and plugin commands in a temporary unauthenticated profile.
It verifies the plugin version, checked-out commit, marketplace manifest and
native enabled state before registering files in the selected profile. Ponytail's
marketplace points to `main` upstream. AgentVigor pins that nested source to the
audited commit as well. A preview of a new install downloads the public sources
in temporary storage. The final copy into the destination requires confirmation.

The operation manages each plugin's cache, marketplace manifest and marked
`config.toml` registration. Other user settings remain byte-identical. The two
plugins can coexist and be removed independently. A shared lock serializes writes.
An edited managed file or a concurrent unrelated configuration change can block
rollback. AgentVigor stores the original content and recovery journal privately
in `~/.agentvigor/integrations/<plugin>-codex`. Keep those files out of version
control. If a transaction was interrupted, run rollback for that plugin first.

### English

Open PowerShell in the checkout. Use a native `codex` on PATH or set
`AGENTVIGOR_CODEX_EXECUTABLE` to its absolute executable path. Git must be on PATH.
Run the preview, confirm the install, then inspect status. Substitute `ponytail`
for the second plugin.

```powershell
node bin/agentvigor.mjs integrations --tool superpowers --agent codex --mode install --dry-run --json
node bin/agentvigor.mjs integrations --tool superpowers --agent codex --mode install
node bin/agentvigor.mjs integrations --tool superpowers --agent codex --mode status --json
node bin/agentvigor.mjs integrations --tool superpowers --agent codex --mode rollback --dry-run
node bin/agentvigor.mjs integrations --tool superpowers --agent codex --mode rollback
```

`CONFIGURED` means that AgentVigor found the audited registration. Restart Codex
and use its plugin selector to verify discovery. Plugin hook trust and execution
remain under Codex control. The install preserves hook files supplied by the
plugin, so review those files before trusting them in the client.

Claude Code returns `BLOCKED` for managed operations until its native registry
can be tested. Use the official in-client commands below if you already have
Claude Code. These marketplaces can serve a different release. Check the version
shown by `/plugin` before using it and use the same screen to uninstall.

```text
/plugin install superpowers@claude-plugins-official
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

### Português brasileiro

Abra o PowerShell na pasta do AgentVigor e execute os comandos da seção anterior.
Troque `--tool superpowers` por `--tool ponytail` para instalar o segundo plugin.
A prévia de uma instalação nova consulta o GitHub em um perfil temporário.
Confira os arquivos, a versão e a origem antes de confirmar a cópia para seu
perfil. Se `codex` for um atalho `.cmd`, aponte `AGENTVIGOR_CODEX_EXECUTABLE`
para o executável nativo. O Git precisa estar no `PATH`.

O inventário deve mostrar `INSTALLED` e `CONFIGURED`. Reinicie o Codex e confira
o seletor de plugins para testar descoberta. Revise os hooks que acompanham o
plugin antes de confiar neles no cliente. Para desfazer, execute a prévia e o
comando `rollback` para o plugin escolhido. O outro plugin permanece instalado.
Em caso de interrupção, reverta primeiro o plugin cuja operação falhou e guarde
o diário privado até concluir. Se o arquivo gerenciado tiver sido editado, o
rollback pode parar para preservar a edição.

Para Claude Code, o executor gerenciado retorna `BLOCKED`. Os comandos nativos
acima podem ser usados em uma sessão Claude Code já instalada. Confira a versão
em `/plugin`, pois o marketplace pode oferecer outra versão, e use a mesma tela
para desinstalar. A execução real no Claude Code continua pendente.

### Español

Abre PowerShell en la carpeta del proyecto y ejecuta los comandos de la primera
sección. Sustituye `--tool superpowers` por `--tool ponytail` para el segundo
plugin. Una instalación nueva descarga fuentes públicas en un perfil temporal
durante la vista previa. Revisa la versión, el origen y los archivos antes de
confirmar la escritura. Si `codex` es un acceso `.cmd`, usa el ejecutable nativo
en `AGENTVIGOR_CODEX_EXECUTABLE`. Git debe estar en `PATH`.

El inventario debe mostrar `INSTALLED` y `CONFIGURED`. Reinicia Codex y comprueba
el selector de plugins para probar el descubrimiento. Revisa los hooks antes de
confiar en ellos. Para revertir, ejecuta la vista previa y el comando `rollback`
del plugin seleccionado. El otro plugin permanece instalado. Tras una operación
interrumpida, revierte primero el plugin afectado y conserva el diario privado.
Si se editó un archivo gestionado, la reversión puede detenerse para conservarlo.

Claude Code devuelve `BLOCKED` para operaciones gestionadas. Los comandos
nativos indicados requieren una sesión Claude Code instalada. Revisa la versión
en `/plugin`, pues el marketplace puede ofrecer otra, y usa la misma pantalla
para desinstalar. La ejecución real en Claude Code sigue pendiente.

### Reproducible verification

```powershell
node --test test/native-plugin-integration.test.mjs
node scripts/smoke-native-plugins.mjs 'C:\path\to\codex.exe' --allow-network
```

The smoke uses the real CLI to install both plugins in one disposable profile,
check both with `codex plugin list --json`, remove Superpowers first, check that
Ponytail remains enabled, and restore the initial configuration bytes. It does
not invoke a model or approve hooks.
