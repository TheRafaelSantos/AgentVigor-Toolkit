---
name: agentvigor-grounded-code
description: Use when implementation or a completion report depends on an unfamiliar API, a version-sensitive command, an effective configuration, or an unconfirmed test result.
---

# Grounded Code

Match each consequential claim to evidence from the current environment. Write the result in the user's language.

1. Find the owning code and the normal entry point. Read the relevant callers, manifest or lockfile, and configuration that can override defaults.
2. For version-sensitive behavior, establish the resolved version. Check its local types, help, or source and the matching official documentation. When only newer documentation is available, label the gap and verify with a narrow local probe if safe.
3. Before reporting a command as supported, find its entry in the CLI help, package scripts, or executable. Before reporting a test as passed, run the exact relevant command and check its exit status and summary. Keep failures and skipped checks visible.
4. Report **Observed** with the file, source, or executed command. Mark a conclusion drawn from evidence as **Inferred**. Put missing evidence under **Unverified** and give the smallest check that would resolve it.

Example of a partial result

- **Observed** — The lockfile pins the library. Its installed types include the method and the focused unit test passes.
- **Inferred** — The method is available to this checkout.
- **Unverified** — Production configuration and network behavior. A smoke test in the intended environment would check both.

Keep private paths and secrets out of shared evidence. A static inspection, a mock, and a live integration test support different claims.
