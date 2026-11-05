# Claude Code acceptance / Homologação / Homologación

Support tier: **EXPERIMENTAL**. Native execution status: **UNVERIFIED; no Claude
session was run or claimed**. On 2026-11-05 the `claude` launcher and common
per-user install paths were absent. Authentication was not checked. This
optional future acceptance does not block the Codex stable v1.0.0 release.
Use an already installed, authenticated client. Do not create an account, change
provider/model/authentication, enable API billing or bypass permissions for these
tests. Native model calls use the current account's allowance.

Official documentation checked on 2026-11-05:
[CLI reference](https://code.claude.com/docs/en/cli-reference),
[personal skill discovery and invocation](https://code.claude.com/docs/en/skills).
The documented personal root is `~/.claude/skills`; invoke a skill with its slash
name. A custom `CLAUDE_CONFIG_DIR` must match the root selected by AgentVigor.

| Requirement | State | Evidence / remaining check |
| --- | --- | --- |
| Client launcher | UNVERIFIED | Not found on PATH or in the common per-user paths checked on 2026-11-05 |
| Authentication | UNVERIFIED | Not queried because the client launcher was absent |
| Global skill discovery and invocation | UNVERIFIED | No real Claude session was available |
| QUICK/FULL workflow acceptance | UNVERIFIED | No real Claude session was available; the cases below are instructions only |
| Managed integration execution inside Claude | UNVERIFIED | CLI/package tests do not prove execution by the native client |
| Claude skill install/update/idempotency/rollback in the client | UNVERIFIED | Isolated package smokes exercise filesystem roots, not a live Claude session |

## Português brasileiro

1. Abra o PowerShell na pasta do checkout. Confira os comandos abaixo. Se o
   cliente ou a autenticação estiver ausente, registre `BLOCKED` e pare a parte
   nativa; não tente forçar login ou instalar outro cliente para obter aprovação.

```powershell
claude --version
claude auth status --text
node bin/agentvigor.mjs status --json
node bin/agentvigor.mjs install --agent claude --profile rigorous --dry-run --lang pt-BR
```

2. Anote o estado inicial e revise a prévia. Se precisar instalar as seis skills,
   execute o comando abaixo e confirme somente esse plano. Instalações pessoais
   conflitantes são bloqueadas. Se as skills já estiverem instaladas, use-as.

```powershell
node bin/agentvigor.mjs install --agent claude --profile rigorous --lang pt-BR
```

3. Prepare projetos sintéticos fora do repositório. O bloco cria somente uma
   pasta nova no TEMP. Os cinco primeiros cenários terão defeitos intencionais;
   o teste inicial deve falhar. O bootstrap começa vazio.

```powershell
$acceptanceRoot = Join-Path $env:TEMP ('agentvigor-claude-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $acceptanceRoot | Out-Null
$source = @'
export function total(rows) { return rows.reduce((sum, row) => sum + row.unitCents, 0); }
export function documentFor(user, document) { return user ? document : null; }
'@
$tests = @'
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { total, documentFor } from './service.mjs';
test('quantity', () => {
  assert.equal(total([{unitCents:100,quantity:3}]),300);
  assert.equal(total([{unitCents:100,quantity:0}]),0);
});
test('tenant', () => assert.equal(documentFor({tenantId:'A'},{tenantId:'B'}),null));
'@
foreach ($caseName in 'development','review','debugging','security','recovery') {
  $casePath = Join-Path $acceptanceRoot $caseName
  New-Item -ItemType Directory -Path $casePath | Out-Null
  [IO.File]::WriteAllText((Join-Path $casePath 'service.mjs'), $source)
  [IO.File]::WriteAllText((Join-Path $casePath 'service.test.mjs'), $tests)
  [IO.File]::WriteAllText((Join-Path $casePath 'USER-NOTE.txt'), "Preserve this note.`n")
  [IO.File]::WriteAllText((Join-Path $casePath 'README.md'), "Invoice total is unitCents times quantity. Users may read only documents from their own tenantId. No external authorization exists.`n")
}
[IO.File]::WriteAllText((Join-Path $acceptanceRoot 'recovery/HANDOFF.md'), "Stale claim: quantity calculation is already fixed. Confirm against source and tests before resuming.`n")
New-Item -ItemType Directory -Path (Join-Path $acceptanceRoot 'context') | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
1..10000 | ForEach-Object { $lines.Add('INFO synthetic event') }
$lines[473] = 'ERROR AV_CLAUDE_FIXTURE_473'
[IO.File]::WriteAllLines((Join-Path $acceptanceRoot 'context/events.log'), $lines)
New-Item -ItemType Directory -Path (Join-Path $acceptanceRoot 'bootstrap') | Out-Null
node --test --test-name-pattern=quantity (Join-Path $acceptanceRoot 'development/service.test.mjs')
```

4. Em cada pasta, abra uma sessão nova com `claude`. Pergunte quais skills estão
   disponíveis: as cinco especialistas e `agentvigor-toolkit` devem aparecer.
   Uma resposta declarando disponibilidade sozinha não comprova invocação.
   Use os prompts abaixo, acrescentando: “Somente esta fixture e os recursos das
   skills. Sem credenciais, conectores, rede, instalações, mudanças de cliente,
   modelo/provedor ou publicação. Preserve USER-NOTE.txt e os testes.”

| Pasta / case / caso | Prompt para colar no Claude | Checkpoint independente |
| --- | --- | --- |
| development | `/agentvigor-grounded-code Corrija somente total conforme o contrato e os testes de quantity. Leia a fonte antes de alterar.` | Execute o comando Node de quantity abaixo: deve passar; tenant permanece fora desta correção |
| review | `/agentvigor-diff-guardian Revise o código, contrato e testes. Identifique os defeitos e as lacunas de cobertura. Somente leitura.` | Deve apontar quantidade e acesso entre tenants; nenhum arquivo alterado |
| debugging | `/agentvigor-grounded-code Observe o teste quantity falhar, corrija a causa e repita o mesmo teste sem editá-lo.` | Eventos devem mostrar falha antes, sucesso depois; teste preservado |
| security | `/agentvigor-toolkit Selecione security-audit no modo FULL; leia o original inteiro e o guia local. Faça AUDIT desta fixture. Fonte somente leitura; quatro relatórios em uma pasta privada separada da fixture, sem mudar ACLs. Registre N/A e lacunas.` | Quatro relatórios, JSON válido, IDs consistentes; achado de tenant; fonte/teste preservados |
| context | `/agentvigor-token-budget Localize o evento ERROR sem despejar o log inteiro. Registre o comando e o identificador encontrado.` | Deve encontrar AV_CLAUDE_FIXTURE_473 com saída curta; não inferir economia de tokens |
| recovery | `/agentvigor-safe-resume Retome pelo HANDOFF, valide a afirmação contra o estado real e corrija total. Preserve teste e nota.` | Deve rejeitar o handoff desatualizado; teste quantity passa |
| bootstrap | `/agentvigor-toolkit Use next-project-bootstrap no modo QUICK. Mostre a prévia do CLI AgentVigor e inicialize nesta pasta vazia após minha confirmação. Sem instalar dependências.` | package.json, next.config.mjs e src/app/page.tsx criados; configuração real do usuário preservada |

No PowerShell, por exemplo:

```powershell
Set-Location -LiteralPath (Join-Path $acceptanceRoot 'development')
claude
# Depois de encerrar a sessão:
node --test --test-name-pattern=quantity service.test.mjs
```

Para registrar uma prova inicial somente de leitura em JSON, em outra sessão:

```powershell
claude -p --no-session-persistence --permission-mode plan --output-format stream-json --verbose '/agentvigor-toolkit Selecione harness-evaluation FULL e leia o original completo e as referências locais. Informe a revisão e um check concreto. Somente leitura; não execute o exercício, instale ferramentas, acesse credenciais/conectores ou altere configurações.' > (Join-Path $acceptanceRoot 'full-read.jsonl')
```

O JSON pode conter caminhos e metadados privados: não o publique. Registre por
caso versão, data, código de saída, skill e arquivos realmente lidos, comandos,
resultado independente e limites. Recusa de permissão é `BLOCKED`, não sucesso.
Para RTK opcional, confira o evento e o comando executado; binário instalado ou
registro de hook não comprovam reescrita. Use o procedimento nativo de revisão
de confiança; não habilite bypass. Sem RTK escolhido, marque esse check N/A.

5. Se instalou temporariamente pelo AgentVigor, volte ao checkout e faça prévia
   do rollback. Não reverta uma instalação preexistente apenas usada pelo teste.
   Não execute outros instaladores durante essa sequência.

```powershell
node bin/agentvigor.mjs rollback --dry-run --lang pt-BR
node bin/agentvigor.mjs rollback --lang pt-BR
node bin/agentvigor.mjs status --json
```

O estado deve corresponder ao anotado inicialmente. Revise e arquive as provas
na pasta `$acceptanceRoot`; depois remova manualmente somente essa pasta nova.
Nenhum comando de remoção automática de dados do usuário faz parte do roteiro.

## English

Use the PowerShell blocks above from the checkout and an existing authenticated
Claude client. Stop with BLOCKED when unavailable. Review the managed install
preview and retain the initial state. The fixture block creates seven disposable
cases outside the repository; its first quantity test intentionally fails.
Start a fresh interactive session in each case. Invoke the named slash skill,
preserve tests/user notes, observe actual reads and commands, and independently
verify the table's outcome. The security case writes only separate private reports;
the context marker is AV_CLAUDE_FIXTURE_473. A short output is not a token benchmark.
The print-mode command records FULL loading without running the exercise; keep
that trace private. Test RTK only if selected, without bypassing native trust.
Rollback only a temporary managed installation and compare against the saved
initial state. Archive the fixture evidence; remove only that newly created
directory after review. These are instructions, not executed Claude acceptance.

## Español

Usa los bloques PowerShell desde el checkout con un Claude ya autenticado.
Si falta, registra BLOCKED. Revisa la instalación y guarda el estado inicial.
El bloque crea siete fixtures fuera del repositorio; la prueba quantity inicial
debe fallar. Abre una sesión nueva por carpeta, invoca la skill indicada, conserva
pruebas/notas y verifica lecturas, comandos y resultados reales. Seguridad solo
escribe informes privados separados; el marcador de contexto es
AV_CLAUDE_FIXTURE_473. Una salida corta no mide ahorro de tokens. El comando
print registra carga FULL sin ejecutar el ejercicio: no publiques ese trace.
Prueba RTK únicamente si se seleccionó y respeta su revisión nativa de confianza.
Revierte solo la instalación temporal y compara el estado inicial. Archiva las
evidencias y elimina únicamente la carpeta nueva después de revisarla. Este
procedimiento no constituye una prueba ejecutada de Claude.
