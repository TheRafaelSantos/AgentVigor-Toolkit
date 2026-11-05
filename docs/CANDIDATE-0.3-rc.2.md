# Candidate 0.3.0-rc.2

This candidate incorporates the WSL bounded-reader correction, the optional
Next.js/PostgreSQL preset and the additional native Codex observations since
rc.1. The original rc.1 release and assets remain intact. This is a pre-release;
complete upstream functional equivalence is not claimed.

See the [A–J delivery report](DELIVERY-STATUS.md), [parity matrix](upstream-audit/PARITY.md),
[native observations](NATIVE-CLIENT-VALIDATION.md) and
[PostgreSQL preset validation](NEXT-POSTGRES-PRESET.md).

Before publication, the selected commit must pass the six-job CI matrix:
Windows Node 22/24, Ubuntu Node 24/26, macOS Intel Node 24 and macOS ARM Node 24.
Each job runs the suite, installs the packed tarball in an isolated prefix and
verifies both official RTK editions with offline rollback. The GitHub release
records the exact commit and CI URL; `SHA256SUMS.txt` identifies its tarball.

## Português brasileiro

O rc.2 acrescenta o preset opcional `next-postgres`, a correção de leituras
parciais em WSL e as evidências adicionais do Codex. Os 16 procedimentos FULL e
os 121 arquivos de origem continuam disponíveis offline, com crédito MIT a
Matheus Gomes. Rafael Pereira mantém os componentes autorais do AgentVigor.

Há casos reais delimitados nas sete categorias solicitadas do Codex. Isso não
homologa automaticamente todas as etapas dos procedimentos originais. A
instalação temporária das skills é revertida ao fim de cada runner. Não houve
alteração persistente de conta, modelo ou provedor.

Limites: Claude Code não foi encontrado no PATH; seus testes reais e o lifecycle
gerenciado dos plugins continuam pendentes. O hook RTK executou um comando na
fixture isolada; o caminho WinGet falhou no sandbox e runtimes gerenciados ainda
precisam de teste dentro do cliente. Graphify, Find Skills e plugins têm smokes oficiais Windows;
a homologação equivalente fora do Windows continua pendente. A migração em
PostgreSQL real e a economia de tokens não foram medidas.

No PowerShell, abra a pasta do checkout e execute:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
npm.cmd test
npm.cmd run smoke:package
node bin/agentvigor.mjs catalog --id security-audit --mode full --lang pt-BR
```

Os testes devem terminar sem falhas. O último comando exibe o procedimento
original completo com orientação localizada. Para instalar o pacote, compare
primeiro `Get-FileHash .\agentvigor-0.3.0-rc.2.tgz -Algorithm SHA256` com o
arquivo `SHA256SUMS.txt` da release. Confira a prévia antes da instalação de
skills; os guias de integração explicam o rollback de cada recurso gerenciado.
Nenhuma atualização automática de instalações pessoais é aplicada pela release.

## English

The candidate keeps all sixteen complete original procedures offline and adds
verified executable improvements. Native Codex cases are bounded acceptance
evidence, not a claim that every original procedure is fully validated. Claude
acceptance, managed RTK runtime execution inside the client, non-Windows official smokes for the other
optional integrations, live PostgreSQL migrations and controlled token metrics
remain separate gates. Use `npm` instead of `npm.cmd` on Linux and macOS.

## Español

El candidato conserva los dieciséis procedimientos originales completos sin
conexión y añade el preset opcional PostgreSQL y la corrección WSL. Hay casos
reales acotados en las siete categorías de Codex. No prueban todas las etapas
de cada procedimiento original. El hook RTK ejecutó un comando en una fixture
aislada; la ruta WinGet falló en el sandbox. Siguen pendientes Claude Code,
ejecución del runtime RTK gestionado dentro del cliente,
smokes oficiales fuera de Windows para las otras integraciones, migraciones
PostgreSQL reales y una medición controlada de tokens. Usa `npm` en Linux/macOS.
Revisa SHA-256, la vista previa y las instrucciones de reversión antes de instalar.
