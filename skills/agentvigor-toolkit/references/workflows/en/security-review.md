# Read-only security review

Trace trust boundaries in a fixed repository snapshot or diff.

1. Record the target, commit or base/head and comparison mode, Git layers, authorization, exclusions, and private report destination. Keep the current worktree and index intact.

2. Identify entry points, attacker capabilities, assets, roles, and sensitive operations. Follow untrusted input through validation, authorization, and storage. Read connected callers and seek counterevidence.

3. Use existing tools only when suitable. Inspect project scripts before any isolated test. Use synthetic data and no production credentials. Keep any private artifact local to the authorized destination.

4. Report each confirmed finding or hypothesis with severity, confidence, location, prerequisites, concrete impact, redacted evidence, and focused verification. Record unreviewed scope and static or runtime evidence separately.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/13-security-review.md).
