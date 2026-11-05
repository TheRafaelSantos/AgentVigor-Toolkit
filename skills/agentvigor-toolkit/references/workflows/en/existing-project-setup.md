# Adopt AgentVigor in an existing project

Reconcile project files and capabilities with a plan that preserves working equivalents.

1. Inspect Git status, stack, lockfile, working scripts, canonical docs, instructions, skill origins, and selected clients. Run understood safe checks before editing. Record pre-existing failures.

2. List each applicable capability with action, scope, risk, and evidence. Reuse working equivalents and decide which proposed docs or auxiliary rules add value. Keep stack, lockfile, and authentication intact.

3. Preview `agentvigor project --mode adopt --path "<project>" --template docs --dry-run`. Select `eslint` or `harness` for a distinct authorized operation if needed. Apply with `--yes` in place of `--dry-run` after reviewing the plan. Compare any proposed files in `.agentvigor-project/` before merging manually.

4. Verify recorded ownership with `agentvigor project --mode status --path "<project>"`. Rerun baseline checks, distinguish client discovery from file presence, and record before/after evidence and pending actions.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/12-existing-project-setup.md).
