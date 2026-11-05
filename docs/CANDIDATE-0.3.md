# Candidate 0.3.0-rc.1

This pre-release packages the offline upstream snapshot and optional managed
integrations. Full upstream functional equivalence remains under evaluation.

Published from `e7203e958d25fcca14e88ea3dfee6872e8dddc39`. All six matrix jobs
passed. The 314-file Windows package smoke installed the tarball successfully.
GitHub reports the same SHA-256 as the local artifact,
`7da97be2d3bb1378333efb0e65bb996bf75d7ff7946a639b216e2704d354d67d`.
[GitHub pre-release](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/releases/tag/v0.3.0-rc.1) ·
[CI run](https://github.com/TheRafaelSantos/AgentVigor-Toolkit/actions/runs/41968999821).

Post-release WSL testing reproduced short asynchronous reads on a Windows-mounted
volume. This can reject a valid Graphify or uv executable during verification in
`0.3.0-rc.1`. The correction on `main` reads through EOF and still rejects file
size changes. The published candidate tarball is the original tested artifact.

| Area | Evidence | Remaining acceptance |
| --- | --- | --- |
| Upstream workflows | [Parity matrix](upstream-audit/PARITY.md), 16 QUICK/FULL workflows, 121 archived upstream files, byte integrity and link checks | Run the original behavioral scenarios end to end |
| Project operations | [Project and harness validation](VIBE-VALIDATION.md) | Optional upstream data stack still uses reference templates |
| Optional integrations | [Management guides](INTEGRATION-MANAGEMENT.md), official Windows disposable smokes for RTK, Find Skills, Graphify and native Codex plugin registration | Validate model-driven use and hook execution in fresh sessions. Claude plugin management is blocked pending a client test |
| Native sessions | [Real Codex discovery and FULL loading record](NATIVE-CLIENT-VALIDATION.md) | Seven complete behavioral scenarios and Claude native acceptance |
| Windows, macOS and Linux | GitHub Actions covers Windows, Ubuntu, macOS Intel and Apple Silicon. The pack smoke installs the actual tarball in an isolated prefix | Official tool smokes on macOS and native Linux remain pending |

Run from the repository root in PowerShell using Node.js 22, 24 or 26:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
npm.cmd test
npm.cmd run smoke:package
```

Use `npm` instead of `npm.cmd` on macOS, Linux or WSL. The release assets include
the `.tgz` and its SHA-256. The candidate is distributed through GitHub Releases.

## Português brasileiro

Este pré-release inclui os 16 procedimentos QUICK/FULL, os 121 arquivos do
snapshot offline e as integrações gerenciadas descritas na tabela. Os testes reais
do Windows cobrem instalação, configuração e reversão em perfis descartáveis.
O Codex listou as seis skills AgentVigor e leu um procedimento FULL em uma sessão
nova. Também listou Superpowers e Ponytail juntos e preservou o Ponytail ao
reverter o Superpowers. O teste restaurou a configuração original ao final.

Ainda faltam os sete cenários comportamentais completos, a execução real de
hooks e a homologação do Claude Code. As integrações gerenciadas de Superpowers
e Ponytail para Claude retornam `BLOCKED` e oferecem instruções nativas. A matriz
de CI valida o pacote em Windows, Linux e macOS Intel e Apple Silicon. Os smokes
dos instaladores oficiais descritos aqui foram executados no Windows.

Para reproduzir a suíte, execute os três comandos acima no PowerShell aberto na
pasta do repositório. Compare o SHA-256 do `.tgz` com `SHA256SUMS.txt` antes de
instalar. As instruções de reversão constam dos guias de cada integração.

## Español

Esta versión preliminar incluye 16 procedimientos QUICK/FULL, los 121 archivos
del snapshot sin conexión y las integraciones de la tabla. Las pruebas reales
de Windows cubren instalación, configuración y reversión en perfiles desechables.
Codex enumeró las seis skills AgentVigor y leyó un procedimiento FULL en una
sesión nueva. También enumeró ambos plugins y conservó Ponytail al revertir
Superpowers. Al terminar se restauró la configuración original.

Siguen pendientes los siete escenarios de comportamiento, la ejecución real de
hooks y la validación de Claude Code. Superpowers y Ponytail devuelven `BLOCKED`
para operaciones gestionadas en Claude y ofrecen pasos nativos. CI valida el
paquete en Windows, Linux y macOS Intel y Apple Silicon. Los instaladores
oficiales se probaron en Windows para este candidato.

Para reproducir la suite, ejecuta los tres comandos en PowerShell desde la carpeta
del repositorio. Compara el SHA-256 del `.tgz` con `SHA256SUMS.txt` antes de
instalar. Cada guía de integración incluye instrucciones de reversión.
