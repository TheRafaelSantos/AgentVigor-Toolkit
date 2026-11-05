# Native-client validation

This record distinguishes a real client observation from file-manifest checks,
simulated installers and automated harness evaluation. It is partial validation;
the seven requested behavior categories are not yet all accepted.

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

| Category | Existing executable evidence | Native behavior still required |
| --- | --- | --- |
| Development | Real bounded Grounded Code change and independent assertions passed | Extend to the complete original project workflow as applicable. |
| Review | Diff Guardian found the seeded invoice defect in both source review and a real Git diff fixture | Automatic RTK hook rewriting and the full multi-agent procedure remain unverified. |
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
leitura FULL nesse caso. Ainda faltam os sete cenários comportamentais completos,
testes das cinco especialistas e medições de economia de tokens. Claude Code
não foi encontrado no PATH verificado; seus testes reais continuam pendentes.

Duas sessões posteriores leram as skills e os arquivos de teste. O Diff Guardian
identificou o cálculo da fatura sem quantidade. O Grounded Code identificou a
leitura entre tenants. O caminho de revisão via Git/RTK ainda precisa de teste,
assim como o procedimento completo de auditoria de segurança. O comando de
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
FULL; aún faltan los siete escenarios completos, eficacia de las especialistas
y mediciones de ahorro. Claude Code no se encontró en el PATH inspeccionado;
no se creó ninguna cuenta ni se presumió funcionamiento.

En dos sesiones posteriores, Diff Guardian detectó el cálculo de factura sin
cantidad y Grounded Code detectó la lectura entre tenants. Siguen pendientes la
revisión del diff por Git/RTK y la auditoría de seguridad completa. El comando
para repetir ambas pruebas está en la sección de fixtures.

También pasaron casos reales de desarrollo, depuración, búsqueda selectiva en un
log y recuperación. El verificador comprobó los archivos y la conservación del
trabajo previo. El bootstrap pasó tras corregir la fixture y delimitar los tres
comandos del caso. Estos casos no miden ahorro de tokens ni validan todos los
procedimientos completos.

Primary references:
[local skill discovery](https://learn.chatgpt.com/docs/build-skills),
[native ephemeral execution](https://learn.chatgpt.com/docs/non-interactive-mode).
