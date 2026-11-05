# Parallel task waves

Delegate independent work with a single writer per file and resource.

1. Give every task an ID, goal, allowed files, mutable resources, dependencies, acceptance checks, and owner.

2. Place tasks in one wave only when their file sets are disjoint, their mutable resources are isolated, and they have no direct or transitive dependency. Serialize uncertainty.

3. Dispatch with tools available in the current host. Preserve authorized model and authentication. The coordinator owns shared files and Git operations. Reviewers work read-only.

4. Check partial diffs and integration before the next wave. Confirm a worker stopped before taking ownership. Reassign only with bounded retries and new evidence.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/05-parallel-wave-dispatch.md).
