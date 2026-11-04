# Recover an interrupted installation

Use this guide after a terminal crash, force-closed process, or failed global
change. Open a terminal inside the AgentVigor Toolkit checkout. Use the same
local account, OS, and Claude Code configuration as the original installation.
Close the terminals running AgentVigor changes and pause any automation that
can run install, update, or rollback for that account.

## 1. Confirm the active environment

| Environment | What to check |
| --- | --- |
| Windows | Open PowerShell in the checkout. Run `Get-Command node` to find Node.js. Use a native Windows agent when recovering Windows skills. |
| macOS | Open Terminal in the checkout. Run `command -v node` and `node -p process.arch`. The expected architecture is `arm64` on Apple Silicon or `x64` on Intel. |
| Linux | Open a shell in the checkout. Run `command -v node`. Use the same Linux user and client configuration as the original install. |
| WSL | Open the same Linux distribution used for installation. Run `command -v node` and `node -p process.platform`. Use Linux Node.js and confirm the platform is `linux`. Recover a Windows installation from native Windows. |

Run these commands from the checkout in any of those shells.

```text
node -p "require('node:os').homedir()"
node bin/agentvigor.mjs status --json
node bin/agentvigor.mjs rollback --dry-run --json
```

AgentVigor uses the displayed home directory. Keep that path private in
shared reports. Its `.agentvigor` directory holds these entries.

| Entry | Role |
| --- | --- |
| `state.json` | The committed snapshot of managed skill files and the prior managed state, when available. It can be absent before the first commit. |
| `pending.json` | The before and after snapshots for a transaction in progress or interrupted. |
| `write.lock` | The empty directory that gives a writer exclusive access. A hard stop can leave it behind. |

If `status` shows `recovery-required`, follow the journal procedure below.
A stale lock can exist without a journal. A preview can succeed while the
lock exists because it performs no write. An active writer or a leftover
lock can cause the mutating operation to report `LOCKED`.

Stop if the command reports `UNSAFE_PATH`, `INVALID_STATE`, or
`ROOT_CHANGED`. For a changed Claude Code root, restore the original absolute
`CLAUDE_CONFIG_DIR` in this shell and rerun `status`. If you used the default
originally, clear the shell override. For a linked path or invalid snapshot,
retain the files and report the error code before attempting recovery.

## 2. Save a local copy of the snapshots

Keep the original state and journal together. These commands save the JSON
files present at the time of recovery to a separate local backup directory.
If you manually edited an AgentVigor skill, save a separate copy of that
`SKILL.md` before restoring its original content. Keep the copies private.

Windows PowerShell, from the checkout.

```powershell
$agentvigorHome = node -p "require('node:os').homedir()"
$agentvigorState = Join-Path $agentvigorHome '.agentvigor'
$agentvigorBackup = Join-Path $agentvigorHome ('.agentvigor-recovery-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $agentvigorBackup -ErrorAction Stop | Out-Null
foreach ($name in @('state.json', 'pending.json')) {
    $snapshot = Join-Path $agentvigorState $name
    if (Test-Path -LiteralPath $snapshot -PathType Leaf) {
        Copy-Item -LiteralPath $snapshot -Destination $agentvigorBackup -ErrorAction Stop
    }
}
Get-ChildItem -LiteralPath $agentvigorBackup -Name
$agentvigorBackup
```

macOS, Linux, or WSL, from the checkout.

```sh
(
  set -eu
  umask 077
  agentvigor_home="$(node -p "require('node:os').homedir()")"
  agentvigor_state="$agentvigor_home/.agentvigor"
  agentvigor_backup="$(mktemp -d "$agentvigor_home/.agentvigor-recovery.XXXXXXXX")"
  for name in state.json pending.json; do
    if [ -f "$agentvigor_state/$name" ]; then
      cp "$agentvigor_state/$name" "$agentvigor_backup/$name"
    fi
  done
  ls -a "$agentvigor_backup"
  printf '%s\n' "$agentvigor_backup"
)
```

Check that the backup lists the JSON files you saw in `.agentvigor`. A
first installation interrupted before the initial commit may have only
`pending.json`. Keep the backup until the skills and status agree.

## 3. Clear a confirmed stale lock

Skip this step when `write.lock` is absent. If it exists, confirm that the
original writer stopped and that all other terminals and automation using the
same state directory are idle. The lock stores no process ID. Its age or the
absence of matches in a process listing alone cannot establish that it is
stale.

For an additional process check, use PowerShell on Windows.

```powershell
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -match 'agentvigor' } |
    Select-Object ProcessId, Name
```

On macOS, Linux, or WSL, list matching process IDs.

```sh
ps -ax -o pid= -o command= | awk '/[n]ode/ && /agentvigor[.]mjs/ { print $1 }'
```

Once you have confirmed the lock is stale, remove only the empty lock directory
with the matching command below. Its removal permits AgentVigor to acquire a
new lock. Preserve `state.json`, `pending.json`, and all skill directories.

Windows PowerShell.

```powershell
$agentvigorState = Join-Path (node -p "require('node:os').homedir()") '.agentvigor'
$agentvigorLock = Join-Path $agentvigorState 'write.lock'
foreach ($path in @($agentvigorState, $agentvigorLock)) {
    $entry = Get-Item -LiteralPath $path -Force -ErrorAction Stop
    if (-not $entry.PSIsContainer -or ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        throw "Expected a regular directory. Stop and inspect the installation."
    }
}
[System.IO.Directory]::Delete($agentvigorLock, $false)
Test-Path -LiteralPath $agentvigorLock
```

The final command should print `False`. The deletion fails safely if the
lock contains files.

macOS, Linux, or WSL.

```sh
(
  set -eu
  agentvigor_home="$(node -p "require('node:os').homedir()")"
  agentvigor_state="$agentvigor_home/.agentvigor"
  agentvigor_lock="$agentvigor_state/write.lock"
  if [ ! -d "$agentvigor_state" ] || [ -L "$agentvigor_state" ] ||
     [ ! -d "$agentvigor_lock" ] || [ -L "$agentvigor_lock" ]; then
    printf '%s\n' 'Expected regular directories. Stop and inspect the installation.' >&2
    exit 1
  fi
  rmdir "$agentvigor_lock"
  test ! -e "$agentvigor_lock"
  printf '%s\n' 'The stale lock is gone.'
)
```

The final message confirms the lock was removed. If either command reports a
linked path, a nonempty lock, or a permissions error, leave the contents in
place and inspect the error.

## 4. Recover the journal or preview a rollback

If `status` reported `recovery-required`, preview and read the proposed
skill changes. Run these commands from the checkout on any platform.

```text
node bin/agentvigor.mjs rollback --dry-run --json
node bin/agentvigor.mjs rollback
node bin/agentvigor.mjs status --json
```

Confirm only after reviewing the preview. In JSON previews, `recovered: true`
identifies a journal recovery. If the new state was committed before the
interruption, recovery finishes that state. Otherwise it restores the prior
snapshot. A successful recovery removes the journal, and `status` should
show `installed` or `not-installed`. If files report `modified` or
`missing`, investigate the drift before repeating a write.

If the lock was the only leftover entry, rerun `status` after clearing it.
Retry the original operation only after a new dry run. With no pending
journal, plain `rollback` restores the previous managed change, when one is
available. To remove all AgentVigor-managed skills from the installed agents,
preview and confirm separately.

```text
node bin/agentvigor.mjs rollback --all --dry-run
node bin/agentvigor.mjs rollback --all
node bin/agentvigor.mjs status --json
```

The second command asks for confirmation in an interactive terminal.
`not-installed` is the expected state after removing all managed skills.
Rollback touches only managed `SKILL.md` files and removes skill directories
only when empty. Other files in those directories, neighboring skills,
plugins, and agent settings are preserved. A rollback command issued while
a journal exists resolves the journal first. Review the resulting status
before requesting a separate uninstall.

For `SKILL_DRIFT`, use `status --json` to identify missing or modified skills
when there is no pending journal. Preserve any edits before restoring the
expected content. For `UNMANAGED_SKILL`, compare the selected profile's names
with the directories in the intended client root. Leave unrelated files in
place. During journal recovery, a drift error can require inspecting the
saved snapshots and the on-disk files together. A manual restore of only the
JSON files can put the recorded state out of sync with the skill files.

See [Integrations](INTEGRATIONS.md) to verify skill discovery once the
filesystem state is healthy.
