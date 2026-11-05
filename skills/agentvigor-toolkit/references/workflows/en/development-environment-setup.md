# Prepare a development environment

Inventory the actual machine and plan only selected global changes.

1. Identify OS, architecture, shell, Windows versus WSL, runtime, package manager, and existing agent executables. Run `agentvigor doctor` for local evidence. Check installation origin and version when a component is selected.

2. List only the chosen clients and tools. Record scope, existing versions, proposed action, evidence, installer, and rollback. Keep current authentication, approvals, and sandbox settings. Docker, plugins, RTK, MCP, and Caveman are separate choices.

3. For AgentVigor skills preview `agentvigor install --agent codex --dry-run`, substituting `claude` or `both` only when selected. Review the output and confirm the corresponding install if authorized. For other chosen tools, use their verified official method after a component-specific authorization and backup.

4. In a fresh shell and client session, verify executable version, skill discovery, and any authorized integration probe. Document installed, configured, validated, pending, or skipped separately. Sanitize paths and credentials from any shareable report.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/10-development-environment-setup.md).
