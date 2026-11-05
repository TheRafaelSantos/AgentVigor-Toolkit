# ESLint setup by project

Plan a compatible lint configuration and preserve working gates.

1. Identify languages, framework, Node, installed ESLint, package manager, lockfile, formatter, and CI. Verify engine and peer compatibility against the installed major.

2. Preview the isolated preset with `agentvigor project --mode adopt --path "<project>" --template eslint --dry-run`. With consent, apply the same command using `--yes` in place of `--dry-run`. Existing linter configuration is preserved.

3. Use the project's actual parser, paths, log adapter, and data boundaries. Add typed checks only when relevant. Introduce legacy warnings with a measured baseline and preserve existing errors.

4. Preview and run `agentvigor quality --path "<project>" --dry-run` then `--yes` for the reviewed check plan. Record what ran, failures, and explicit dependency prerequisites.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/07-eslint-complete-setup.md).
