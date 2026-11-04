---
name: agentvigor-agent-doctor
description: Use when Codex, Claude Code, or RTK fails to start, has PATH or permission errors, misses installed skills, or runs duplicated hooks.
---

# Agent Doctor

Begin with read-only probes in the same shell and runtime that show the symptom. Report **evidence → likely cause → confirmation → suggested fix** in the user's language.

| Symptom | What to verify |
| --- | --- |
| Executable missing or wrong version | In PowerShell, use `Get-Command <name> -All`. In CMD, use `where.exe <name>`. On POSIX, use `command -v <name>`. Compare the resolved executable and its version against the client's supported setup. |
| Startup fails with paths containing spaces | Confirm the directory and shell, then launch with an absolute path and arguments passed separately. In PowerShell, use the call operator with the quoted executable path. |
| Windows and WSL disagree | Run the same probes in both environments. Compare the client binary, user home, and install scope. Resolve missing dependencies in the environment where the agent runs. |
| Missing or incomplete skills | Inspect the intended skill root and `SKILL.md` metadata. Confirm the active home, client restrictions, and worktree using `git worktree list` when applicable. Restart the client and check its skill picker or slash-command completion. |
| Hooks run twice | Compare user, project, and plugin registrations for the same event. Match actual commands or observed invocations. Identify which installer owns each registration before suggesting removal. |
| Access denied | Identify the failing path and operation. Check ownership and permissions for the active user without elevating or relaxing them as a diagnostic shortcut. |
| RTK resolves but fails | Check `rtk --version` and `rtk gain`. A version banner alone can belong to a different executable. Distinguish a missing executable, unsupported subcommand, and tracking or runtime errors. |

For AgentVigor, start with `agentvigor doctor` when available. Redact credentials and private paths in shared output. Obtain specific authorization before applying destructive or global fixes.
