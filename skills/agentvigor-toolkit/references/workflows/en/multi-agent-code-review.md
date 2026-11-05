# Independent code review

Review a fixed change with the lenses warranted by its risks.

1. Resolve base and head or freeze the staged, unstaged, and relevant untracked layers. Record what is excluded.

2. Choose lenses for affected behavior, security, data, types, and UI. Use independent read-only reviewers if the host supports them. Otherwise review inline and record the coverage limit.

3. Inspect connected callers, contracts, and tests. Isolate or serialize checks that write build output, use ports, or touch services.

4. Verify claims, merge duplicates by cause, rank concrete failure scenarios, and give location, impact, and evidence. Report findings and limits before making any separately authorized fixes.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/03-multi-agent-code-review.md).
