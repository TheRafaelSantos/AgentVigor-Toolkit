# Compare a focused harness improvement

Test one change against the same scenario and independent evaluator.

1. Identify one observed failure in instructions, context, memory, or tool use. Define acceptance criteria, target, limits, inputs, and permissible writes. If no failure is observed, record the reusable evaluation instead.

2. Run `harness-evaluation` in a disposable copy as a baseline. Preserve evaluator, client, model, input, access, and authorization. Inspect actual results.

3. Change one relevant project-owned instruction or tool convention in a separate copy. Repeat the same checks from the same initial state. Compare observations, regressions, and limitations.

4. Adopt the candidate only if supported by evidence and within scope. Record the source, result, and invalidation condition. This native method uses no Harness2 service or benchmark by default.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/15-harness-improvement.md).
