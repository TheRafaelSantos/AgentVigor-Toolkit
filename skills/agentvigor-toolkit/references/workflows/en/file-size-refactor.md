# Split large files by responsibility

Use measured size warnings to find cohesive extraction seams.

1. Run the project's relevant size rule and record the actual offenders, sizes, and rule threshold. Select a small batch within the authorized scope.

2. For each candidate, trace imports, public exports, callers, and tests. Extract a real responsibility or leave the file intact and explain why no useful seam exists.

3. Preserve public names, contracts, validation, and error behavior. Work on one file or cohesive unit at a time. Run type, test, and lint checks after each change.

4. Report actual remaining violations and regressions. Create commits only within the user's authorized Git scope.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/09-file-size-refactor.md).
