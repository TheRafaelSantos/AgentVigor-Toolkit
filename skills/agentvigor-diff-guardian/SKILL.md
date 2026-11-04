---
name: agentvigor-diff-guardian
description: Use when reviewing a patch, commit, or pull request for concrete regressions, unsafe behavior, or gaps in verification.
---

# Diff Guardian

Use the proposed change and the behavior its callers depend on to identify actionable defects. Write the review in the user's language.

1. Establish the review base, changed files, and scope. Distinguish staged, unstaged, untracked, and committed changes when they affect the request. For a small patch, follow only the immediate contracts.
2. Read the connected callers and tests. Trace how changed inputs, outputs, defaults, or errors affect existing clients and old data.
3. Review the risks the change touches. Check authentication, authorization, and trust boundaries where access changes. For writes and retries, check partial failure, concurrency, idempotency, and rollback. Inspect hot paths only when the change can affect them.
4. Verify the most consequential scenario with a focused check when safe. If the review is read-only, avoid mutating commands. Mark a finding as inferred when you can trace the failure but cannot reproduce it.
5. Report findings in severity order. Include the file and line, triggering condition, user impact, and a focused fix or regression test. Put verification limits after the findings. Use a short review when the patch is trivial.

Example

- **High** — `src/import.js:42`. A retry after the second write fails can create a duplicate record. The caller retries on any error and the first write has already committed. Add an idempotency key and test the partial failure.
