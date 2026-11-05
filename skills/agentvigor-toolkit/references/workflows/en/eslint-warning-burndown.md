# ESLint warning reduction

Measure warnings by rule and reduce them without hiding regressions.

1. Find the existing ESLint command and scope. Run it safely with unfiltered output and count warnings by rule and file.

2. Identify the costly or behavior-sensitive cases. Present evidence and choose among fixing, recording a scoped exception, or changing the rule only within existing authorization. Pending decisions leave independent work available.

3. Preserve existing severities, ignores, tests, and behavior. Group by root cause and isolate files and resources if delegating. Rerun lint and focused regression checks after each group.

4. Report actual final counts, suppression reasons, exceptions, and any separate configuration change.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/02-eslint-warning-burndown.md).
