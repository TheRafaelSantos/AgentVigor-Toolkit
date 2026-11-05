# Optional integration management

The current implementation provides executable inventory and scoped setup plans.
Run from the AgentVigor checkout or use the installed CLI.

```text
node bin/agentvigor.mjs integrations --mode status --agent codex --json
node bin/agentvigor.mjs integrations --mode plan --tool rtk --agent codex --json
node bin/agentvigor.mjs integrations --mode plan --tool graphify --agent claude --json
```

`INSTALLED` records an executable lookup and version probe or a native Find
Skills manifest. `CONFIGURED` requires a validated client registration.
`DISCOVERED` requires fresh-session enumeration. `VERIFIED` requires an
observed scoped invocation. These later checks currently return `UNVERIFIED`.
Plugin installation also remains `UNVERIFIED` pending native registry probing.
`MISSING` records an absent inspected prerequisite. `BLOCKED` records a failed
probe. Unsupported versions or client interfaces require evidence before being
classified `INCOMPATIBLE`.

Plans identify native client commands separately from shell commands. They
include the audited version, license and official setup source. All steps carry
`executed: false`. Applying third-party changes, taking their configuration
backups and reversing owned changes are still under development. The plan token
identifies this preview and does not authorize a future installer with broader
effects. Existing tools and credentials are left to their current owners.

## Português brasileiro

O comando `integrations` inspeciona executáveis e o manifesto do Find Skills,
com saída JSON. Use `--mode plan`, selecione `--tool` e escolha `--agent codex`
ou `--agent claude` para consultar o procedimento oficial aplicável. Os passos
informados ainda aguardam implementação do executor, backup e rollback. Um
executável encontrado comprova instalação, e a descoberta pelo cliente exige
uma sessão nova. Os estados não observados aparecem como `UNVERIFIED`.

## Español

El comando `integrations` inspecciona ejecutables y el manifiesto de Find
Skills mediante JSON. Usa `--mode plan`, elige `--tool` y selecciona
`--agent codex` o `--agent claude` para consultar el procedimiento oficial.
Los pasos esperan la implementación del ejecutor, las copias y la reversión.
Encontrar un ejecutable acredita su instalación. El descubrimiento requiere
una sesión nueva. Los estados sin evidencia aparecen como `UNVERIFIED`.
