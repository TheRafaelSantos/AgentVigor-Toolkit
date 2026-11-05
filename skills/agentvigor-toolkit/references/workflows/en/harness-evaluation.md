# Evaluate agent behavior in a disposable fixture

Run a controlled authorization baseline and record what the host actually does.

1. Create an empty disposable directory outside the original project. Preview `agentvigor project --mode init --path "<fixture>" --template harness --dry-run` and apply with `--yes` instead of `--dry-run` if authorized.

2. Preview `agentvigor harness --path "<fixture>" --dry-run`. Run with `--yes` and confirm the deliberately broken authorization baseline is rejected. Keep the evaluator and initial fixture outside the worker's writable scope.

3. In independent copies, test boundary repair, a stale handoff, or read-only security review using the selected client and authorization. Observe actions and compare file diffs. Run the same evaluator again where the case requires a repair.

4. Record client, model if observable, case, revision, checks, commands, outcome and limitations. Count unavailable host behavior as not run. Deterministic checks and a fresh client session provide different evidence.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/14-harness-evaluation.md).
