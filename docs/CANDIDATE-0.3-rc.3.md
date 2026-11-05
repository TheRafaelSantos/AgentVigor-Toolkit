# Candidate 0.3.0-rc.3

This pre-release candidate corrects acceptance records, adds a security
reporting policy and strengthens the isolated distribution smoke with repeated
install and managed-skill update checks. It does not add product features or
claim complete upstream parity. Claude Code native acceptance remains BLOCKED
because the client was unavailable during the latest check; therefore this is
not eligible for stable `1.0.0`.

The previous pre-release, [v0.3.0-rc.2](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/releases/tag/v0.3.0-rc.2),
and its assets remain intact. The local suite and isolated package smoke passed.
All six CI jobs passed on code candidate `3a8aae434abf2d8f9e2e7844102e6dd13bd282d5`
in [run 41997881118](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/actions/runs/41997881118).
The release documentation follow-up contains no code changes and records this
result. GitHub release metadata and the asset checksum identify the exact
published commit and package.
The package includes `SECURITY.md` and the acceptance guide, and excludes the
local pause handoff. It remains a GitHub Release artifact; no npm publication is
performed.

Local validation on the candidate revision: `npm.cmd test` passed 116/116 with
no failures, skips or cancellations. `npm.cmd run smoke:package` passed on
Windows x64 with 320 packed files. In its isolated home and npm prefix, the
smoke verified CLI execution, both native skill roots, all sixteen catalog
entries, QUICK/FULL loading, repeated install and update idempotency, and full
managed-skill rollback. Package inventory confirmed `SECURITY.md` is included
and `docs/PAUSE-HANDOFF.md` is excluded.

See [delivery status](DELIVERY-STATUS.md), [Claude acceptance](CLAUDE-ACCEPTANCE.md),
[security policy](../SECURITY.md), [native evidence](NATIVE-CLIENT-VALIDATION.md),
and [PostgreSQL validation](NEXT-POSTGRES-PRESET.md). Read the README for
installation and removal instructions. This package is distributed through
GitHub Releases; it is not published to npm.

## Português brasileiro

Este pré-release corrige registros de aceitação, acrescenta uma política para
reporte de vulnerabilidades e amplia o smoke isolado de distribuição com
reinstalação e atualização idempotentes das skills gerenciadas. Não adiciona
funcionalidades nem reivindica paridade completa com o Vibe. A homologação
nativa do Claude Code continua BLOCKED porque o cliente não estava disponível;
por isso, o candidato não pode ser tratado como versão estável `1.0.0`.

A versão anterior, [v0.3.0-rc.2](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/releases/tag/v0.3.0-rc.2),
e seus arquivos permanecem preservados. A suíte local, o smoke de pacote e os
seis jobs de CI passaram no commit de código `3a8aae4`; a documentação foi
atualizada em seguida para registrar o resultado. O GitHub identifica o commit
exato e o checksum do arquivo publicado. A distribuição é por GitHub Releases;
não há publicação no npm.

Consulte [estado da entrega](DELIVERY-STATUS.md), [homologação Claude](CLAUDE-ACCEPTANCE.md),
[política de segurança](../SECURITY.md), [evidências nativas](NATIVE-CLIENT-VALIDATION.md)
e [validação PostgreSQL](NEXT-POSTGRES-PRESET.md).

## Español

Este pre-release corrige registros de aceptación, añade una política para
reportar vulnerabilidades y amplía el smoke aislado de distribución con
reinstalación y actualización idempotentes de las skills gestionadas. No añade
funciones ni afirma paridad completa con Vibe. La aceptación nativa de Claude
Code sigue BLOCKED porque el cliente no estaba disponible; por eso, el candidato
no puede considerarse una versión estable `1.0.0`.

La versión anterior, [v0.3.0-rc.2](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/releases/tag/v0.3.0-rc.2),
y sus archivos siguen intactos. La suite local, el smoke del paquete y los seis
trabajos CI pasaron en el commit de código `3a8aae4`; la documentación se
actualizó después para registrar el resultado. GitHub identifica el commit y
el checksum exactos del archivo publicado. Se distribuye mediante GitHub
Releases; no se publica en npm.

Consulta el [estado de entrega](DELIVERY-STATUS.md), la [aceptación de Claude](CLAUDE-ACCEPTANCE.md),
la [política de seguridad](../SECURITY.md), las [evidencias nativas](NATIVE-CLIENT-VALIDATION.md)
y la [validación PostgreSQL](NEXT-POSTGRES-PRESET.md).
