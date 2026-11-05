# Project sanitation

Measure and clean a codebase while preserving behavior.

1. Inspect the target, its Git state, applicable instructions, manifests, and canonical lint, type, test, and build commands. Review scripts for external effects before running a safe baseline.

2. Inventory unused imports, unreachable code, stale notes, and candidate dependencies. Follow public entry points, dynamic imports, plugins, peer requirements, and reflection before calling anything unused.

3. Separate mechanical corrections from scope decisions. Apply only authorized items in small changes and run the relevant check after each. Keep unrelated changes intact.

4. Rerun comparable checks. Record before and after counts, commands, failures, and items awaiting a decision.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/01-project-sanitation.md).
