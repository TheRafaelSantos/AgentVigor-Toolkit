---
name: agentvigor-safe-resume
description: Use when resuming an interrupted coding task, handing work to another session, or recovering from a stale checkpoint or an unfinished command.
---

# Safe Resume

Use a handoff as a map. Confirm the current state before continuing. Write the handoff in the user's language.

1. Confirm the project directory, worktree, branch, and revision. Inspect tracked and untracked changes. Identify pre-existing work and preserve it.
2. Verify any claimed artifacts, jobs, and processes through the owning resource. Confirm process identity before treating a PID as current. Use the provider's current status for external jobs when authorized.
3. Compare the observed state with the handoff. Treat missing artifacts, stale test results, and unverifiable runtime state as open work. Before retrying a write or deployment, check which effects already occurred and whether the retry is safe.
4. Continue with the smallest authorized action that advances the goal. Use bounded retries for transient failures and stop retrying when the failure repeats unchanged. Claim continued execution only for a process or job you can observe.

## Handoff

- **Objective** — Intended outcome and scope.
- **Observed state** — Worktree, revision, and verified process or job status.
- **Files changed** — Paths and reasons, with pre-existing work marked.
- **Tests run** — Exact commands and results for the checked revision.
- **Evidence** — Safe artifact references or redacted excerpts.
- **Pending** — Unfinished work or checks.
- **Blockers** — Missing input, authorization, or an external dependency.
- **Next safe action** — A concrete first step and its expected checkpoint.
