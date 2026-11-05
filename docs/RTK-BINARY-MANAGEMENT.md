# Optional official RTK binary management

`lib/rtk-binary.mjs` exports `manageRtkBinary(options)`. This is an opt-in
installer for **rtk-ai/rtk 1.1.0**, not the unrelated crates.io RustTypeKit
package named `rtk`. It returns an absolute executable path for the separate
configuration/monitoring operation. No PATH, registry, existing RTK executable,
client configuration, credentials, provider or model is changed.

## Consent and edition

From the checkout in PowerShell or a Linux shell, preview and then confirm:

```powershell
node bin/agentvigor.mjs integrations --tool rtk --scope binary --mode install --variant oss --dry-run --json
node bin/agentvigor.mjs integrations --tool rtk --scope binary --mode install --variant oss
node bin/agentvigor.mjs integrations --tool rtk --scope binary --mode verify --variant oss --json
node bin/agentvigor.mjs integrations --tool rtk --agent codex --mode configure --variant oss --dry-run
node bin/agentvigor.mjs integrations --tool rtk --agent codex --mode configure --variant oss
```

To reverse the operation, roll back each configured client first, then the binary:

```powershell
node bin/agentvigor.mjs integrations --tool rtk --agent codex --mode rollback
node bin/agentvigor.mjs integrations --tool rtk --scope binary --mode rollback --variant oss
```

The official initializer registers `rtk` by command name. To use the isolated
edition for hooks or `agentvigor monitor`, put the parent directory of the
reported `executable` first on PATH for the terminal that starts the client.
An already running desktop client needs its own PATH refreshed before this can
take effect. Run `rtk --version` and `Get-Command rtk` in PowerShell to confirm
which executable the terminal will use.

Em português: execute a prévia no PowerShell na pasta do AgentVigor. Confira a
edição, a licença, o checksum e o caminho do executável. A instalação confirmada
mostra `installed`; a verificação deve mostrar `verified`. Se configurar Claude
Code, use `--agent claude`. Para reverter, desfaça primeiro a configuração de
cada cliente. Depois reverta o binário, escolhendo a mesma variante.

En español: ejecuta la vista previa en PowerShell desde la carpeta del proyecto.
Comprueba edición, licencia, checksum y destino. La instalación confirmada
devuelve `installed`; la verificación, `verified`. Para Claude Code, selecciona
`--agent claude`. Revierte primero cada cliente y luego el binario de la misma
variante.

`variant: 'oss'` is the default: Apache-2.0 CLI, hook rewriting and command
filters, without the BUSL compression engine. `variant: 'full'` explicitly
selects the Apache-2.0 CLI plus BUSL-1.1 engine. The engine's additional grant
permits production use, including in the official binary, and excludes offering
it to others as a paid or hosted product/service. Review the actual
[CLI license](https://github.com/rtk-ai/rtk/blob/v1.1.0/LICENSE) and
[engine license](https://github.com/rtk-ai/rtk/blob/v1.1.0/engine/LICENSE).
The official [build workflow](https://github.com/rtk-ai/rtk/blob/v1.1.0/.github/workflows/release.yml)
packages these editions separately. The selected license texts are installed
alongside the executable and removed by rollback.

Installation previews are offline and return `asset`, `sha256`, `license`,
`licenseNotice`, absolute `changes`, `executable` and `planToken`. Executing a
mutation requires the exact reviewed token through `expectedPlan`. Switching
edition, home, platform, mode or managed file content invalidates that consent.
The SHA-256 pins were audited against the official v1.1.0 release assets and
GitHub asset digests. Installation independently checks the pinned official
`checksums.txt` and the archive before reading any archive member. This protects
against changed assets; it is not a publisher signature or independent build
reproducibility proof.

```javascript
import { manageRtkBinary } from './lib/rtk-binary.mjs';

const options = { home: '/absolute/disposable/home', variant: 'oss' };
const preview = await manageRtkBinary({ ...options, dryRun: true });
console.log(preview); // Show this to the user before asking for scoped consent.
// After scoped confirmation of this exact plan:
const installed = await manageRtkBinary({ ...options, expectedPlan: preview.planToken });
console.log(installed.executable);
const verified = await manageRtkBinary({ ...options, mode: 'verify' });
console.log(verified.status);
const rollback = await manageRtkBinary({ ...options, mode: 'rollback', dryRun: true });
// After scoped confirmation of rollback:
await manageRtkBinary({ ...options, mode: 'rollback', expectedPlan: rollback.planToken });
```

`verify` checks managed bytes and invokes only `--version`. It proves neither
client discovery nor rewriting/invocation of a real user command. Calling
`install` on an intact existing managed installation returns `unchanged`.
Existing unmanaged or edited files block mutation; they are never adopted.

## Platforms, recovery and checks

Pinned assets cover Windows x64, macOS x64/arm64 and Linux x64 (musl).
Other targets, including Linux arm64/glibc and Windows arm64, return
`INCOMPATIBLE` rather than guessing compatibility. Archive member reading uses
the native `/usr/bin/tar` or `%SystemRoot%\System32\tar.exe`; missing tar fails
without installing. Native executable headers are checked; shell/.cmd shims
are not installed. Only named binary/license members are read to stdout, never
archive-provided filesystem paths. Runtime compatibility is confirmed by the
separate `verify` operation.

Files live below `~/.agentvigor/tools/rtk/<platform>-<arch>/1.1.0-<variant>`.
Private journal `state.json` records hashes; a `pending` transaction requires
offline rollback. Rollback removes only hash-matching owned files and staged
files, preserving user edits and refusing symbolic links or unexpected files.
It needs no archive, executable execution or network. The completed journal
remains for audit; this initial isolated installer has no overwritten tool to
restore. In-place upgrades and automatic adoption of an external RTK are outside
its scope. Directory ownership must remain with the account user.

An interrupted writer can leave `write.lock`. Confirm the installer process has
stopped before removing **only the empty lock directory**. Re-preview rollback
afterward. A partially written or manually edited stage fails closed with
`SKILL_DRIFT`; preserve it for review rather than forcing deletion. This is not
a multi-user adversarial filesystem transaction or an automatic lock breaker.

PowerShell, from the AgentVigor checkout:

```powershell
node --test test/rtk-binary.test.mjs
node scripts/smoke-rtk-binary.mjs
```

The smoke downloads both official editions into a disposable home, verifies
archive checksums and the installed version, rolls back with networking
disabled, asserts executable removal and deletes only the temporary home.
Windows x64 passed both editions. macOS/Linux pins are audited; native smoke
tests on those operating systems have not been run here.
