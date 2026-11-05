# Optional integration management

The current implementation provides executable inventory, scoped setup plans,
managed configuration for an existing official RTK 1.1.0 executable, and
[managed Find Skills installation and offline rollback](FIND-SKILLS-MANAGEMENT.md).
Run from the AgentVigor checkout or use the installed CLI.

```text
node bin/agentvigor.mjs integrations --mode status --agent codex --json
node bin/agentvigor.mjs integrations --mode plan --tool rtk --agent codex --json
node bin/agentvigor.mjs integrations --mode plan --tool graphify --agent claude --json
```

`INSTALLED` records an executable lookup and version probe or a native Find
Skills manifest. `CONFIGURED` requires a validated client registration.
`DISCOVERED` requires fresh-session enumeration. `VERIFIED` requires an
observed scoped invocation. Find Skills reports `CONFIGURED` when the native
manifest matches the pinned official bytes; discovery and invocation remain
`UNVERIFIED` until observed in the native client.
Plugin installation also remains `UNVERIFIED` pending native registry probing.
`MISSING` records an absent inspected prerequisite. `BLOCKED` records a failed
probe. Unsupported versions or client interfaces require evidence before being
classified `INCOMPATIBLE`.

Plans identify native client commands separately from shell commands. They
include the audited version, license and official setup source. All steps carry
`executed: false`. RTK has a separate configure/rollback executor below. Find
Skills has a separate install/rollback executor. The other tools' managed
lifecycle remains under development. The plan token
identifies this preview and does not authorize a future installer with broader
effects. Existing tools and credentials are left to their current owners.

## Managed RTK configuration

Select one client per operation. Review the affected filenames before confirming.
Use `--agent claude` for Claude Code. Noninteractive execution requires `--yes`.

```text
node bin/agentvigor.mjs integrations --tool rtk --agent codex --mode configure --dry-run
node bin/agentvigor.mjs integrations --tool rtk --agent codex --mode configure
node bin/agentvigor.mjs integrations --tool rtk --agent codex --mode rollback --dry-run
node bin/agentvigor.mjs integrations --tool rtk --agent codex --mode rollback
```

The official initializer generates files in a temporary configuration root.
AgentVigor checks the hook and binds consent to the executable SHA-256,
previous files and proposed content. It manages the client instruction file,
RTK.md and hook JSON. Optional filter trust stays disabled. The official Codex
mode and Claude noninteractive settings-patch mode have separate arguments.

Private backups and the recovery journal live in
`~/.agentvigor/integrations/rtk-codex` or `rtk-claude`. Keep these files until
rollback finishes. They can contain private configuration and must remain out
of source control and shared reports. Linked or edited files block replacement.
Rollback restores previous bytes and removes newly created managed files,
including after the RTK executable is removed. An interrupted change needs
rollback using the same client root. If a lock remains, confirm all writers
have stopped before removing only its empty `write.lock` directory.
Configuration directories must stay under the account owner's control.

The official RTK 1.1.0 configure/rollback smoke passed in synthetic Windows
Codex and Claude roots. Tests cover stale plans, edits, links, initializer
failure and interrupted rollback. Client discovery and rewriting still require
observed client sessions. Binary installation remains a separate step.

With official RTK 1.1.0 on PATH, run `node scripts/smoke-rtk.mjs` from the
checkout to reproduce the disposable two-client test. No client login is needed.

## Português brasileiro

O comando `integrations` inspeciona executáveis e o manifesto do Find Skills,
com saída JSON. Use `--mode plan`, selecione `--tool` e escolha `--agent codex`
ou `--agent claude` para consultar o procedimento oficial aplicável. Os passos
de Superpowers, Ponytail e Graphify aguardam executor, backup e rollback.
O Find Skills já oferece [instalação oficial gerenciada](FIND-SKILLS-MANAGEMENT.md#português-brasileiro)
com `--mode install` e reversão com `--mode rollback`. Para RTK 1.1.0
já instalado, use `--mode configure` ou `--mode rollback`, primeiro com
`--dry-run` e depois confirme. Guarde os backups privados em
`~/.agentvigor/integrations/rtk-codex` ou `rtk-claude`. Um
executável encontrado comprova instalação, e a descoberta pelo cliente exige
uma sessão nova. Os estados não observados aparecem como `UNVERIFIED`.

## Español

El comando `integrations` inspecciona ejecutables y el manifiesto de Find
Skills mediante JSON. Usa `--mode plan`, elige `--tool` y selecciona
`--agent codex` o `--agent claude` para consultar el procedimiento oficial.
Los pasos de Superpowers, Ponytail y Graphify esperan ejecutor, copias y reversión.
Find Skills ya ofrece [instalación oficial gestionada](FIND-SKILLS-MANAGEMENT.md#español)
con `--mode install` y reversión con `--mode rollback`.
Para RTK 1.1.0 ya instalado, usa `--mode configure` o `--mode rollback`,
primero con `--dry-run` y después confirma. Conserva las copias privadas en
`~/.agentvigor/integrations/rtk-codex` o `rtk-claude`.
Encontrar un ejecutable acredita su instalación. El descubrimiento requiere
una sesión nueva. Los estados sin evidencia aparecen como `UNVERIFIED`.
