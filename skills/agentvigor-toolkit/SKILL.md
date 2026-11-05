---
name: agentvigor-toolkit
description: Use when selecting an AgentVigor workflow for machine setup, project bootstrap, adoption, quality gates, harness evaluation, or a scoped engineering audit.
---

# AgentVigor Toolkit

Choose one workflow and load its instructions on demand in the user's language.

1. Identify the target, request, and authorization. Locate the workflow ID using `agentvigor catalog --lang en`, `--lang pt-BR`, or `--lang es`. If the CLI is unavailable, read [the local index](references/catalog.json).
2. Read the selected workflow with `agentvigor catalog --id <id> --mode quick --lang <language>`. For detailed setup, review, security, recovery or acceptance procedures, use `--mode full`. FULL includes the QUICK adaptation and the complete pinned source in its original language. Without the CLI, read the localized QUICK file in `references/workflows/<language>/<id>.md`, then the corresponding complete prompt and linked guides in `references/full/source/`. Preview executable operations before changing files.
3. Apply the specialist skill only when relevant. Use `agentvigor-grounded-code` for versioned evidence, `agentvigor-diff-guardian` for review, `agentvigor-token-budget` for noisy outputs, `agentvigor-safe-resume` for handoffs, and `agentvigor-agent-doctor` for client diagnostics.
4. Verify observable results and report checks that remain pending. Keep the host's current permissions and authentication. Select and authorize global changes by component. Respect the target project, preserve existing files, and keep private data local.

The local [provenance record](references/provenance.json) identifies the fixed upstream revision. Original resources in `references/upstream/` are references. Follow the adapted workflow for supported operations and read the [upstream license](licenses/VIBE-CODING-TOOLKIT-MIT.txt) when reusing its material.
