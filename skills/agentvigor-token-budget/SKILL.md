---
name: agentvigor-token-budget
description: Use when large logs, broad searches, repeated tool output, or long reference files are consuming coding-agent context.
---

# Token Budget

Reduce repeated and irrelevant output while keeping the evidence needed for the task. Explain results in the user's language.

1. Search for a symbol, error string, or likely path before listing a repository. Read the matching ranges and follow callers as needed. Load specialized skills and reference sections when the task reaches them.
2. Use a summary or a small sample for repeated output. For failed commands, preserve exit status, warnings, the first actionable error, and its surrounding lines. If the available excerpt obscures the cause, retrieve more of the original output.
3. If RTK is already on PATH, confirm the executable and that it supports `rtk gain`. Use RTK only for commands the installed version supports. When a filtered read-only run loses evidence, check the original output. For an operation with side effects, use the log from the original run or obtain authorization before repeating it.
4. Summarize changes since the last checkpoint. Link to existing evidence and include totals only when measured. Label RTK savings as estimates for command output. Report model usage or cost separately only when the agent provides those measurements.

Example — Start a failing suite investigation with the failure summary and the first stack trace. Read the test and its target, then retrieve the full log if the trace omits a necessary dependency error.
