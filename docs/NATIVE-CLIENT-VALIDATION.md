# Native-client validation

This record distinguishes a real client observation from file-manifest checks,
simulated installers and automated harness evaluation. It is partial validation;
all seven requested categories have bounded observed cases, with full-procedure
acceptance and external integrations tracked separately below.

## Observed Codex result

Environment: Windows, Codex CLI `0.166.0-alpha.6`, AgentVigor implementation
`b072432`, source snapshot `21b71b68679c11184f49c23168852014bf6dde8b`.
The run used an existing authenticated native client, its current model/provider,
a fresh ephemeral session and a disposable project outside this checkout.
The preparation and execution crossed midnight on 2026-11-04/05, Brazil time.

The real account's user skill root was populated temporarily through the managed
installer, with the rigorous profile. The native app-server `skills/list` RPC
then reported all six names with `scope: user` and zero discovery errors:

- `agentvigor-agent-doctor`
- `agentvigor-diff-guardian`
- `agentvigor-grounded-code`
- `agentvigor-safe-resume`
- `agentvigor-token-budget`
- `agentvigor-toolkit`

A separate native `codex exec --ephemeral --sandbox read-only` session explicitly
invoked `$agentvigor-toolkit`, selected `harness-evaluation` in FULL mode, read
the complete local procedure and returned the pinned source revision. Execution
events showed nine successful read commands, all with exit code zero:

1. Router `SKILL.md`.
2. Local `references/catalog.json`.
3. Local Portuguese QUICK procedure.
4. Provenance file.
5. Complete original `14-harness-evaluation.md` prompt.
6. Harness provenance entries.
7. Linked `07-harness-evaluation.md` guide.
8. Linked `tools/23-harness2.md` guide.
9. Adjacent complete `15-harness-improvement.md` prompt.

The final answer described an authorization check from that procedure and
explicitly said the exercise had not been executed. This proves observed router
invocation and FULL resource loading in that session. It does not prove the
specialist skills' behavioral effectiveness, automatic invocation, an actual
authorization repair or token reduction.

The session exited zero without a turn failure. Its existing environment logged
13 MCP startup failures and one PowerShell snapshot warning. Those unrelated
connectors were not part of this acceptance case; no connector health claim is
made. A session-only `mcp_servers={}` override did not eliminate their startup
attempts, so future fixtures need more precise per-server isolation. No persisted
model, provider, authentication or MCP configuration was edited.

The installer rollback restored the prior managed state: `not-installed`, zero
managed skill files. The disposable project was removed. The private AgentVigor
transaction state was retained; credentials and raw private session logs were
not committed.

An earlier test redirected HOME/USERPROFILE and used a simulated user directory.
That native Windows invocation did not discover the six files installed there.
The result was recorded as a failed discovery attempt, not a pass. It establishes
that this simulated-home fixture is insufficient for that client build; it does
not establish a defect in the real user-root installation. The later real-root
test above is the positive evidence.

## Codex review and security fixtures

Two fresh Windows Codex sessions at `e7203e9` used separate disposable projects
outside the repository. The sessions exited zero. The runner observed successful
commands reading the requested `SKILL.md` and seeded source in each case.

| Case | Observed finding | Scope |
| --- | --- | --- |
| Review, Diff Guardian | `invoices.mjs:2` summed the unit price without quantity. One row priced at 1,000 cents with quantity three yielded 1,000 instead of 3,000. | The agent reported an RTK failure when trying to inspect a Git diff. The source review found the defect. The Git/RTK path remains pending. |
| Security, Grounded Code | `document.mjs:3–4` returned a document by ID without checking its tenant. The agent identified a cross-tenant disclosure and proposed a fail-closed check and regression cases. | The runner checks the finding and file-read events. Claims about executing a proposed fix need separate command evidence. |

The managed skill installation was reverted. Status returned to `not-installed`
with zero managed files. To reproduce both cases from the checkout using the
current authenticated Codex account and two real sessions:

```powershell
node scripts/smoke-codex-review-security.mjs 'C:\path\to\codex.exe' --allow-live
```

The command requires an absolute native Codex executable and an account with no
existing managed AgentVigor installation. Results go to ignored `out/` files.

A later review fixture initialized a real Git repository, committed the correct
calculation and introduced the regression as an unstaged change. The native
session read the skill, read the fixture and successfully executed a `git diff`
command before reporting the seeded finding. The versioned runner now prepares
that baseline. This verifies the diff-based review case. Automatic RTK hook
rewriting still requires its own observed hook evidence.

## Additional bounded Codex workflow cases

The versioned runner `scripts/smoke-codex-workflows.mjs` launches fresh sessions
in disposable directories, observes successful `SKILL.md` read commands, and
checks resulting files with independent Node assertions. Five cases passed on
Windows after the `a5227ed` correction:

| Case | Observed result |
| --- | --- |
| Development | Added a quantity-aware price function. Independent assertions checked default, zero and multiple quantities. The user's note stayed byte-identical. |
| Debugging | Observed a failing end-exclusive interval test, then a passing run of the same test. An independent rerun passed, and the test file stayed byte-identical. |
| Context economy | Searched a 36,001-line synthetic log for `ERROR`, found the planted error, and kept each observed matching command's output below 4 KiB. Token savings were not measured. |
| Recovery | Read Safe Resume and the handoff, inspected the stale implementation, corrected it and preserved the user's note. An independent Node assertion passed. |
| Bootstrap | Read the QUICK workflow, ran the project preview and confirmed initialization in an empty directory. The verifier found `package.json`, `next.config.mjs` and `src/app/page.tsx`. Dependency installation and build were outside that native session's scope. |

The first recovery attempt changed the fixture but lacked observable reads of
the skill and handoff, so that attempt failed acceptance. An explicit-read retry
passed. Bootstrap initially failed because the fixture contained an existing
note while `project init` requires an empty target. A later empty-target attempt
timed out. The empty-target retry with a bounded three-command procedure passed.
The runner observed successful preview and apply commands, then restored the
global skill state to `not-installed` with zero managed files.

Run selected cases using the current authenticated Codex account:

```powershell
node scripts/smoke-codex-workflows.mjs 'C:\path\to\codex.exe' --allow-live development debugging context recovery bootstrap
```

Use the scenario names after `--allow-live` to select a subset. The runner
temporarily installs the six AgentVigor skills and requires no existing managed
installation. A `finally` block rolls the installation back and removes its
disposable fixtures. Failed assertions set a nonzero exit code and preserve the
result summary in ignored `out/codex-acceptance-<scenario>.json` files.

## Remaining acceptance categories

### Existing optional capabilities: read-only native inventory

A fresh native app-server `skills/list` call reported `find-skills`, `graphify`,
`ponytail` and `using-superpowers` enabled with user scope and zero discovery
errors. Their selected skill paths were in user skill directories, not the
native plugin cache. This proves discovery of those personal skills; it does
not establish that the selected files came from AgentVigor-managed installations.

Separately, `codex plugin list --json` reported `ponytail@ponytail` version 5.3.3
and `superpowers@superpowers-dev` version 7.0.2 installed and enabled in the real
profile. A broader skill query also enumerated qualified `ponytail:*` and
`superpowers:*` resources from the native plugin cache. Model-driven invocation
has the bounded proof below. No existing capability was adopted,
reinstalled, overwritten or removed by these read-only observations.

Português: o cliente descobriu as quatro skills pessoais e listou os dois plugins
habilitados. Isso não comprova invocação nem propriedade pelo instalador AgentVigor.

Español: el cliente descubrió las cuatro skills personales y enumeró ambos plugins
habilitados. Esto no prueba invocación ni propiedad por el instalador AgentVigor.

### Native plugin behavior

The real Codex client explicitly loaded `$ponytail:ponytail` and
`$superpowers:test-driven-development` from their native caches. In an isolated
invoice fixture it observed the supplied test fail, corrected quantity handling,
and passed the unchanged test. Independent assertions checked quantities three,
zero and omitted. The test and user note stayed byte-identical. All seven checks
passed and the temporary project was removed. The existing plugin registrations,
account, model/provider and persistent configuration were preserved.

```powershell
node scripts/smoke-codex-plugins.mjs 'C:\path\to\codex.exe' --allow-live
```

The runner requires the existing native plugin registrations. It disables native
subagents for this one sequential session. This verifies explicit invocation and
the bounded red/green behavior, not every plugin skill or automatic hook.

Português: Ponytail e Superpowers foram invocados pelos nomes qualificados do
cache nativo. O mesmo teste falhou antes e passou depois; a checagem independente
confirmou a correção e a preservação dos arquivos do usuário.

Español: Ponytail y Superpowers se invocaron por sus nombres cualificados desde
el caché nativo. La misma prueba falló antes y pasó después; una ejecución
independiente confirmó la corrección y la conservación de los archivos del usuario.

### Complete procedure attempts

Two Windows runs loaded the complete original multi-agent review prompt and its
guide, found both planted defects, and preserved the source. The second also
verified the base revision. However, the JSON stream only exposed `wait` calls
with empty receiver IDs, despite reviewer attribution in the final narrative.
The runner therefore returned `nativeDispatchObserved: false` and did not accept
independent dispatch. A narrative alone does not prove a native panel.

A later native app-server observation exposed two distinct `subAgentActivity`
items with `kind: started`, one quality reviewer and one security reviewer.
The previous detector recognized only legacy collaboration calls. The updated
detector accepts these native starts, deduplicates reviewer IDs and rejects
wait-only events or narrative claims. Its regression test covers both protocol
forms. Two native starts are now observed; the initial app-server transport
stopped on a child turn completion, so that attempt does not establish completion
of the coordinator's validation and consolidated report. A root-thread-aware
transport is being checked separately before being adopted by the runner.

The first complete security-audit attempt timed out after writing two artifacts.
The second wrote all four but timed out before session completion. Both were
recorded as failed; the second's artifacts were inspected before cleanup, not
published as an accepted audit. The runner now preserves artifacts even after
a process error, supplies per-command Git fixture overrides for the sandbox,
and disables native subagents only in its sequential audit session. This
session-only feature setting does not edit the user's configuration.

```powershell
node scripts/smoke-codex-full-procedures.mjs 'C:\path\to\codex.exe' --allow-live panel
node scripts/smoke-codex-full-procedures.mjs 'C:\path\to\codex.exe' --allow-live audit
```

The panel has a ten-minute limit; the sequential audit has fifteen minutes.
The third audit's coordinator could not read the output after the client changed
its ACL. Access was recovered only on that synthetic directory; four reports
with consistent finding IDs were retained privately. Partial cleanup had already
removed source files, so preservation could not be independently rechecked for
that attempt. The runner now provisions the output directory and explicitly
preserves its ACL. The fourth audit read FULL, preserved HEAD and every source
file, and produced all four structured artifacts, but the client exited one
before final validation. It remains a failure, with `passed: false`; artifacts
and the pre-extraction receipt are retained. No full-audit acceptance is claimed.

After rc.2, the audit verifier was tightened to inspect only artifacts collected
from the current fixture. A retained JSON file from an older attempt cannot
satisfy a missing current artifact. It checks four nonempty files, unique finding
IDs, cross-references in all three Markdown reports, required evidence fields
and both seeded defects. Regression tests reject missing/malformed JSON,
duplicate IDs, inconsistent handoff IDs and a missing seeded defect. The native
runner also retains terminal error events privately for diagnosis. An artificial
24-KiB report limit was removed because it caused report rewriting and is not an
upstream acceptance requirement. This does not waive any procedure check.

The runner requires no existing managed AgentVigor installation, temporarily
installs the six skills and restores the prior state in `finally`. Reports and
observations stay in ignored `out/`. A timeout or missing observation remains a
failure even when an artifact exists.

Português: as duas revisões FULL encontraram os defeitos, mas não comprovaram
despacho independente. As duas primeiras auditorias excederam o tempo; escrever
relatórios sem concluir a sessão não foi contado como aprovação.

Español: ambas revisiones FULL encontraron los defectos, pero no probaron el
despacho independiente. Las dos primeras auditorías excedieron el tiempo;
escribir informes sin completar la sesión no se contó como aprobación.

### Native RTK hook observation

On Windows with the same Codex build, the native `hooks/list` RPC reported an
enabled, trusted user `preToolUse` RTK hook. A fresh session received a plain
Git status command; its execution event contained `rtk git ...`. The first
attempt failed to launch the WinGet link; resolving the target still produced
access denied under the sandbox account. These failures were retained privately.

The successful fixture copied the existing RTK binary byte-for-byte into its
temporary project and prepended only the child process's PATH. It submitted
`git -c safe.directory=<that exact fixture> status --short`, without an RTK
prefix. The native event showed the rewritten RTK command, exit zero and the
fixture in its output. The source stayed unchanged. The versioned runner passed
all six observations and removed the temporary project:

```powershell
node scripts/smoke-codex-rtk.mjs 'C:\path\to\codex.exe' --allow-live
```

This requires an existing authenticated client, RTK and a trusted native hook.
It neither registers nor trusts a hook. It proves scoped automatic rewriting;
it does not prove that the current WinGet path works inside the sandbox or that
a managed private runtime has been invoked there. No global PATH, Git trust,
account, sandbox permissions or hook configuration was changed. The client also
warned about hooks represented in both TOML and JSON; that personal configuration
was preserved. Token compression and database recording were not measured.

Português: o hook reescreveu e executou o comando no teste isolado. O caminho do
WinGet falhou no sandbox. A cópia temporária e a confiança Git limitada a um
comando da fixture permitiram a prova; nenhuma configuração pessoal foi alterada.

Español: el hook reescribió y ejecutó el comando en la prueba aislada. La ruta de
WinGet falló dentro del sandbox. Se usaron una copia temporal y confianza Git
limitada al comando de esa fixture, sin cambiar la configuración personal.

| Category | Existing executable evidence | Native behavior still required |
| --- | --- | --- |
| Development | Real bounded Grounded Code change and independent assertions passed | Extend to the complete original project workflow as applicable. |
| Review | Diff Guardian found the seeded invoice defect in source and Git diff fixtures. A separate native RTK rewrite executed successfully in an isolated fixture | Full multi-agent dispatch and RTK execution from the normal installed path remain unverified. |
| Debugging | Real failure, production correction and rerun of an unchanged test observed | Additional project-specific cases remain selectable. |
| Security | Real Grounded Code review found the cross-tenant authorization defect | Validate the full upstream security audit and its multi-part checks. |
| Context economy | Real targeted search in a large synthetic log, plus on-demand FULL loading | Controlled paired token measurement before any savings claim. |
| Recovery | Real Safe Resume session verified stale handoff state, corrected it and preserved user edits | Longer multi-session continuity remains outside the bounded fixture. |
| Bootstrap | Native QUICK selection, preview and Next initialization passed. Separate Next/PostgreSQL fixture passed quality checks | Complete upstream external-capability selection and optional integration use within a project. |

Claude Code was not found on the inspected Windows PATH. No account was created,
login changed or success assumed. Its actual discovery and invocation remain
MISSING/UNVERIFIED until an installed, authenticated client can run the same
bounded cases.

## Português brasileiro

O Codex real descobriu as seis skills no escopo do usuário e invocou o roteador
em uma sessão nova, fora do repositório. O modo FULL de `harness-evaluation` foi
lido junto com referências locais. Nove comandos de leitura terminaram com
código zero; a sessão também terminou com código zero.

O teste usou uma instalação temporária gerenciada no diretório real do usuário.
Depois, o rollback voltou para `not-installed`, com zero arquivos gerenciados.
O diretório temporário do projeto foi removido. Nenhum modelo, provedor ou login
foi reconfigurado. O diário privado do instalador foi mantido. A tentativa
anterior com HOME/USERPROFILE simulados não descobriu as skills e não foi contada
como sucesso. O ambiente também teve falhas de inicialização de MCP; a saúde
desses conectores não foi homologada.

Este resultado comprova descoberta global, invocação explícita do roteador e
leitura FULL nesse caso. Os sete casos delimitados descritos acima foram
executados posteriormente; ainda faltam homologação de todos os procedimentos
originais e medições de economia de tokens. Claude Code
não foi encontrado no PATH verificado; seus testes reais continuam pendentes.

Duas sessões posteriores leram as skills e os arquivos de teste. O Diff Guardian
identificou o cálculo da fatura sem quantidade. O Grounded Code identificou a
leitura entre tenants. Uma execução posterior confirmou a revisão com `git diff`;
hooks RTK e o procedimento completo de auditoria continuam com gates próprios. O comando de
reprodução está na seção de fixtures acima.

Os casos de desenvolvimento, depuração, busca seletiva em log e recuperação
também passaram em sessões novas. O verificador conferiu o comportamento dos
arquivos e a preservação das edições do usuário. O bootstrap passou após corrigir
a fixture e delimitar os três comandos do caso. Esses
resultados não medem economia de tokens nem homologam os procedimentos completos.

Para repetir a parte de leitura, no PowerShell aberto na pasta do AgentVigor:

```powershell
node bin/agentvigor.mjs status --json
codex --version
```

Anote o estado atual. Se as seis skills já estiverem instaladas, use-as sem
alterar a instalação. Caso precise de uma instalação temporária, confira a
prévia e confirme no segundo comando. Instalações preexistentes não gerenciadas
serão bloqueadas para preservar seus arquivos:

```powershell
node bin/agentvigor.mjs install --agent codex --profile rigorous --dry-run --lang pt-BR
node bin/agentvigor.mjs install --agent codex --profile rigorous --lang pt-BR
$testProject = Join-Path $env:TEMP ('agentvigor-native-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testProject | Out-Null
$testPrompt = 'Use $agentvigor-toolkit explicitamente. Selecione harness-evaluation no modo FULL e leia o procedimento original completo e suas referências locais. Informe a revisão de origem e um check concreto. Somente leitura: não execute o exercício, não instale dependências, não acesse credenciais, configurações, conectores ou outros projetos e não altere arquivos. Informe qualquer skill ausente sem presumir descoberta.'
codex exec --ephemeral --skip-git-repo-check --sandbox read-only --cd $testProject --json $testPrompt
```

O comando usa a conta/modelo atuais e uma chamada real do agente. Confira os
eventos de leitura, a revisão de origem e a ausência de exercício executado.
Uma resposta declarando FULL sem eventos de leitura não comprova o carregamento.
Erros do cliente ou de recursos necessários devem ser registrados como limites.

Se você aplicou a instalação temporária, restaure a versão anterior com os
comandos abaixo. Não faça rollback se apenas usou uma instalação preexistente:

```powershell
node bin/agentvigor.mjs rollback --dry-run --lang pt-BR
node bin/agentvigor.mjs rollback --lang pt-BR
node bin/agentvigor.mjs status --json
```

O status deve corresponder ao estado anotado antes. Revise a pasta indicada por
`$testProject` antes de removê-la; ela contém somente o projeto descartável criado
por este procedimento quando nenhuma outra atividade foi realizada nela.

## Español

El cliente Codex real enumeró las seis skills con alcance de usuario e invocó
el router en una sesión efímera fuera del repositorio. Leyó el procedimiento
FULL `harness-evaluation` y sus referencias locales: nueve comandos de lectura
y la sesión terminaron con código cero. Se usaron modelo, proveedor y login
existentes. La instalación global temporal se revirtió a `not-installed`, con
cero archivos gestionados, y se eliminó el proyecto desechable.

La simulación anterior con HOME/USERPROFILE no descubrió las skills y no se contó
como éxito. Hubo fallos de inicio de MCP ajenos al escenario; su salud no quedó
validada. No se cambió configuración persistente. El diario privado se conservó.
Este caso demuestra descubrimiento, invocación explícita del router y lectura
FULL. Posteriormente se ejecutaron los siete casos acotados descritos arriba;
siguen pendientes la validación de todos los procedimientos originales y las
mediciones de ahorro. Claude Code no se encontró en el PATH inspeccionado;
no se creó ninguna cuenta ni se presumió funcionamiento.

En dos sesiones posteriores, Diff Guardian detectó el cálculo de factura sin
cantidad y Grounded Code detectó la lectura entre tenants. Una ejecución posterior
confirmó `git diff`; hooks RTK y auditoría completa tienen gates propios. El comando
para repetir ambas pruebas está en la sección de fixtures.

También pasaron casos reales de desarrollo, depuración, búsqueda selectiva en un
log y recuperación. El verificador comprobó los archivos y la conservación del
trabajo previo. El bootstrap pasó tras corregir la fixture y delimitar los tres
comandos del caso. Estos casos no miden ahorro de tokens ni validan todos los
procedimientos completos.

Primary references:
[local skill discovery](https://learn.chatgpt.com/docs/build-skills),
[native ephemeral execution](https://learn.chatgpt.com/docs/non-interactive-mode).
