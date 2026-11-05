# Agent discovery and optional integrations

For v1.0.0, OpenAI Codex is the stable primary client. Claude Code is an
experimental integration: the installer and compatible resources are retained,
but native Claude discovery and invocation are `UNVERIFIED`. Steps mentioning
Claude are optional procedures for future validation, not evidence they were
run or a gate for Codex support. See the [support matrix](DELIVERY-STATUS.md).

The AgentVigor installer manages its specialist skills and the Vibe workflow router.
The monitor can run
an RTK executable already installed by the user. The other integrations on this
page are optional and are managed by their upstream installers. AgentVigor
doesn't register their plugins, hooks, global instructions, proxies, or MCP
servers.

## What each mechanism changes

| Mechanism | Effect |
| --- | --- |
| Skill | Exposes a named workflow and a brief description. The client can load the instructions when the skill is selected. |
| Plugin | Packages capabilities such as skills, hooks, or MCP servers under a client-managed identity. |
| Hook | Runs a command at a client event, such as before a tool call. It may alter inputs or gate execution. |
| Executable | Runs as a separate local process, for example `rtk gain`. |
| MCP server | Provides client-accessible tools or data. Its transport and permissions determine what leaves the machine. |
| Global instructions | Apply to every eligible session. Examples include the user's `AGENTS.md` and `CLAUDE.md`. |

## Verify discovery in each client

1. Run `agentvigor doctor` in the same OS and shell where the client runs. A
   file check establishes that a skill is on disk. Client policies and scope
   determine whether it is available in a session.
2. Start a fresh local Codex session from a directory outside this checkout.
   Open the skill picker with `/skills` or type `$` in Codex CLI. In the desktop
   app, check **Skills** in the sidebar. Look for an installed identifier such
   as `agentvigor-grounded-code`. Codex uses `~/.agents/skills` for user skills.
3. Start a fresh local Claude Code session from a directory outside this
   checkout. Type `/agentvigor-` and look for completions. Claude Code uses
   `~/.claude/skills` by default. For a custom configuration directory, launch
   Claude Code from the same environment used to install the skills.
4. To check explicit invocation, select **Grounded Code** in the active
   client and ask it to classify a test result that has only been reported by
   another person. The result should mark the current test outcome unverified.
   Record the client, version, environment, and result separately from
   file-level checks. Automatic activation can vary by task and client.

Windows and WSL each have their own home directory and installed executables.
Perform this check inside the environment where the client actually runs.
Cloud sessions have separate discovery rules. [Codex skill
discovery](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills) ·
[Claude Code skill discovery](https://code.claude.com/docs/en/skills#choose-where-skills-load) ·
[Claude Code configuration directory](https://code.claude.com/docs/en/env-vars).

## Upstream snapshot

The following published versions and installation interfaces were inspected
on 2026-11-04. These are references for repeatable investigation. Marketplace
installs can resolve different versions. Inspect the source, target agent, and
scope before consenting to a global change, and check for an existing
installation first. For a binary release, verify the published checksum when
available.

| Integration | Observed release | Mechanism | Scope to check |
| --- | --- | --- | --- |
| RTK | [1.1.0](https://github.com/rtk-ai/rtk/releases/tag/v1.1.0) | CLI executable with optional client hooks and awareness instructions | PATH, hook owner, shell, history database |
| Superpowers | [7.0.2](https://github.com/obra/superpowers/releases/tag/v7.0.2) | Client plugin with skills and lifecycle hooks | Installed marketplace and plugin, duplicate manual skills |
| Ponytail | [5.3.3](https://github.com/DietrichGebert/ponytail/releases/tag/v5.3.3) | Client plugin with skills and lifecycle hooks, or standalone skills | Active mode, existing rules, overlapping hooks |
| Find Skills | [Skills CLI 1.7.6](https://github.com/vercel-labs/skills/releases/tag/v1.7.6) | One skill from Vercel's repository, installed by a separate CLI | Target agent, scope, source revision, upstream telemetry |
| Graphify | [0.9.102](https://github.com/Graphify-Labs/graphify/releases/tag/v0.9.102) | Python CLI, agent skill, optional hooks or MCP integration | Python environment, project data, backend selection |

### RTK

Check an existing installation with `rtk --version` and `rtk gain` in the
same shell. On Windows, use `Get-Command rtk -All` in PowerShell or
`where.exe rtk` in CMD to find competing executables. On macOS, Linux, or WSL,
use `command -v rtk`. The name is also used by an unrelated project, so check
its origin and that `gain` is available.

Install from the official release or package-manager instructions. The
`rtk-oss` assets contain the Apache-2.0 CLI, hooks, and command filters.
The full CLI also links a BUSL-1.1 engine. The separately distributed
`rtk-proxy` daemon is outside AgentVigor's integration.
[RTK installation guide](https://github.com/rtk-ai/rtk/blob/v1.1.0/INSTALL.md) ·
[RTK release contents](https://github.com/rtk-ai/rtk/blob/v1.1.0/README.md).

`agentvigor monitor --once` calls the upstream `rtk gain` command. RTK
reports estimates based on the activity it recorded. Any separately
configured proxy metrics shown in RTK's own output are upstream metrics.
Neither establishes total model usage, billing, or subscription savings.
RTK itself may create or migrate its local SQLite database when opening it.
[RTK gain reference](https://github.com/rtk-ai/rtk/blob/v1.1.0/docs/guide/analytics/gain.md) ·
[RTK tracker source](https://github.com/rtk-ai/rtk/blob/v1.1.0/src/core/tracking.rs).

If you choose automatic rewriting, the upstream global setup is
`rtk init -g --codex` for Codex and `rtk init -g` for Claude Code. Back
up the relevant settings and global instructions first. Check existing hooks
to avoid a second registration. Verify the registered hook and a supported
read-only command in a new client session. Codex's version of the hook can
affect how the client classifies the wrapped command. To reverse the
upstream registration, add `--uninstall` to the same initialization
command and verify the hook state afterward.
[RTK Codex hook behavior](https://github.com/rtk-ai/rtk/blob/v1.1.0/hooks/codex/README.md) ·
[RTK Claude setup and removal](https://github.com/rtk-ai/rtk/blob/v1.1.0/INSTALL.md).

### Superpowers and Ponytail

- For **Superpowers**, use **Plugins** in the Codex app or `/plugins` in the
  Codex CLI and select the listing in the official marketplace. In Claude
  Code, enter `/plugin install superpowers@claude-plugins-official` at the
  agent prompt. Start a fresh session and check the plugin and one of its
  skills in the client. Use the client plugin manager to remove the
  installation. [Superpowers install guide](https://github.com/obra/superpowers/blob/v7.0.2/README.md#installation).
- For **Ponytail** in a terminal with Codex on PATH, run
  `codex plugin marketplace add DietrichGebert/ponytail`, then
  `codex plugin add ponytail@ponytail`. The upstream workflow asks you to
  inspect its two lifecycle hooks via `/hooks` and trust them explicitly if
  you accept what they do. In Claude Code, send
  `/plugin marketplace add DietrichGebert/ponytail` and
  `/plugin install ponytail@ponytail` as separate agent prompts. Restart
  the client and verify the installed plugin. Follow the upstream uninstall
  guide for both plugin files and state it can store outside its directory.
  [Ponytail install and uninstall guide](https://github.com/DietrichGebert/ponytail/blob/v5.3.3/INSTALL.md).

Superpowers provides a development workflow. Ponytail provides proportional
implementation guidance. AgentVigor skills specialize in evidence, patch
review, output economy, handoff, and troubleshooting. Use one workflow for a
given task and select a specialized skill when its trigger applies. AgentVigor
uses its own skill names and relies on each host's discovery rules.

### Find Skills

The Vercel CLI can search with `npx skills@1.7.6 find`. The
`find-skills` skill is also available separately. In a terminal with Node.js
22.20 or later and npm, the following selects a single Codex user skill from
the audited tag. For Claude Code use `--agent claude-code`. In PowerShell
use `npx.cmd` if the execution policy blocks the npm PowerShell shim.

```text
npx skills@1.7.6 add https://github.com/vercel-labs/skills/tree/v1.7.6/skills/find-skills --skill find-skills --agent codex --global
```

The Skills CLI sends its own usage telemetry by default. To opt out of it and
its separate security-audit requests, set `DISABLE_TELEMETRY=1` in the shell
before running the CLI. Review any skill's sources and scripts before making
it available. Verify discovery in the intended agent, or list installed
entries with `npx skills@1.7.6 list --global`. To undo the Codex install,
use `npx skills@1.7.6 remove find-skills --agent codex --global`.
[Skills CLI options](https://github.com/vercel-labs/skills/blob/v1.7.6/docs/commands.md) ·
[Skills CLI telemetry](https://github.com/vercel-labs/skills/blob/v1.7.6/docs/troubleshooting.md#telemetry) ·
[Find Skills source](https://github.com/vercel-labs/skills/blob/v1.7.6/skills/find-skills/SKILL.md).

### Graphify

With Python 3.10 or newer and uv, run `uv tool install graphifyy==0.9.102`
in your terminal. The Python package is named `graphifyy` and the executable
is `graphify`. For user-level Codex registration, use
`graphify install --platform codex`. For Claude Code, use
`graphify install` from the shell for that environment. The upstream
`--project` option scopes supported installations to the current repository.

Graphify can index code locally. Its semantic extraction of documents and
media may use the client model or a configured API, depending on mode. For
local code-only analysis, use the upstream `--code-only` workflow. Check
skill discovery in a fresh session and verify graph scope and revision
before relying on it. Follow the per-platform removal instructions to
reverse registration. Preserve any graph artifacts you want to keep.
[Graphify CLI installation](https://docs.graphify.com/open-source/installation) ·
[Graphify platform setup and removal](https://github.com/Graphify-Labs/graphify/blob/v0.9.102/README.md#install).

## Vibe Coding Toolkit incorporation

The selected MIT resources, adapted workflows and executable presets are
described in the [functionality matrix](upstream-audit/MATRIX.md). The
following initial reference review records the state before this incorporation.

The [Vibe Coding Toolkit at revision 21b71b6](https://github.com/soumatheusgomes/vibe-coding-toolkit/tree/21b71b68679c11184f49c23168852014bf6dde8b)
is by Matheus Gomes under MIT. The reviewed tree contains documentation,
prompts, templates, and validation scripts. Its global setup guide asks an
agent to inspect and configure the environment, then save a manifest,
backups, and verification results. The reviewed scripts check documentation
and sample harnesses, or exercise a temporary Next.js foundation. The
repository has no AgentVigor-compatible install, update, rollback, or
monitor executable to reuse. The reference informs the scope review.
AgentVigor implements its own installer, CLI, skills, and checks.
[Reference setup guide](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/03-environment-setup.md) ·
[Reference validation scripts](https://github.com/soumatheusgomes/vibe-coding-toolkit/tree/21b71b68679c11184f49c23168852014bf6dde8b/scripts) ·
[Third-party notices](../THIRD_PARTY_NOTICES.md).
