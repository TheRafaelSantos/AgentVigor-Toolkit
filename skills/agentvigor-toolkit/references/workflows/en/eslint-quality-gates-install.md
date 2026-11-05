# Install local quality rules

Apply a reviewed rule bundle and measure the first run.

1. Check the project has compatible Node and ESLint. Read the current config, scripts, source layout, and existing controls.

2. Run `agentvigor project --mode adopt --path "<project>" --template eslint --dry-run`. Review planned auxiliary files. If authorized, run again with `--yes` instead of `--dry-run`. Use `agentvigor project --mode status --path "<project>"` to verify recorded ownership.

3. Preview the check with `agentvigor quality --path "<project>" --dry-run` and use `--yes` to run the reviewed plan. Record rule failures, skipped checks, and dependency prerequisites. Keep the existing linter active.

4. Measure violations before tuning optional rules. Keep all existing protections. Separate applying and measuring the rules from refactoring the project.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/08-eslint-quality-gates-install.md).
