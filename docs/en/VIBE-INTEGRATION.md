# Vibe Coding Toolkit integration

AgentVigor bundles 16 adapted workflows in English, Brazilian Portuguese, and Spanish. The catalog reads local files. The AgentVigor Toolkit skill routes a request to one workflow, then suggests the relevant specialist skill when available.

## Choose and read a workflow

Open a terminal inside the AgentVigor checkout. List the catalog, then load a workflow by its ID. The second command prints the revision, translated metadata, and full instructions in JSON.

```text
node bin/agentvigor.mjs catalog --lang en
node bin/agentvigor.mjs catalog --id existing-project-setup --lang en --json
```

## Install the skills

Use PowerShell on Windows or Terminal on macOS, Linux, or WSL. Run the commands below in the checkout. Choose `claude` or `both` instead of `codex` if needed. `rigorous` includes the router and all five specialist skills. The preview lists the managed changes. Review the changes before applying them with `--yes`. Restart the selected client and check its skill selector for `agentvigor-toolkit`.

```text
node bin/agentvigor.mjs install --agent codex --profile rigorous --lang en --dry-run
node bin/agentvigor.mjs install --agent codex --profile rigorous --lang en --yes
node bin/agentvigor.mjs status --json
```

To update an existing installation after selecting a reviewed toolkit revision, preview `node bin/agentvigor.mjs update --dry-run` and apply with `node bin/agentvigor.mjs update --yes`. To remove the managed skills, preview `node bin/agentvigor.mjs rollback --all --dry-run` and apply with `node bin/agentvigor.mjs rollback --all --yes`. A rollback without `--all` restores the last managed state when available. See the recovery guide if a previous operation stopped mid-write.

## Apply project files

Substitute an existing target directory. The example uses a path with spaces. The planner creates missing files and places proposals for conflicting files in `.agentvigor-project/`. Inspect each proposal before merging it manually. To start a new project, choose `--mode init` and use an empty existing directory. `docs`, `eslint`, `harness`, and `next` are the available presets. Use `next` for a new project. The `docs` and `eslint` presets support both modes. The `next` and `harness` presets require `init` and an empty directory that already exists.

```text
node bin/agentvigor.mjs project --mode adopt --template docs --path "./My Project" --lang en --dry-run
node bin/agentvigor.mjs project --mode adopt --template docs --path "./My Project" --lang en --yes
node bin/agentvigor.mjs project --mode status --path "./My Project" --lang en --json
```

Project rollback affects AgentVigor-managed files. Preview it and check which files have changed before confirming. Keep user edits and existing project files in their original location.

```text
node bin/agentvigor.mjs project --mode rollback --path "./My Project" --lang en --dry-run
node bin/agentvigor.mjs project --mode rollback --path "./My Project" --lang en --yes
```

## Run checks

Preview the configured quality checks and execute only the reviewed commands. The `eslint` preset uses supplemental rules and requires compatible ESLint in the target. The `next` preset generates a basic web foundation. To install its dependencies, open a terminal inside the generated project and run `npm install --ignore-scripts --no-audit --no-fund` when network access is authorized. Then run the quality check from the AgentVigor checkout. The target's `npm run dev` starts the local site.

```text
node bin/agentvigor.mjs quality --path "./My Project" --lang en --dry-run
node bin/agentvigor.mjs quality --path "./My Project" --lang en --yes
```

Create an empty disposable directory for the `harness` preset. Use the path to that directory in the example. The fixture deliberately fails authorization. An initial failure is the expected checkpoint. To evaluate a repair, use a separate disposable copy and rerun the evaluator after the change.

```text
node bin/agentvigor.mjs project --mode init --template harness --path "./Harness Fixture" --lang en --dry-run
node bin/agentvigor.mjs project --mode init --template harness --path "./Harness Fixture" --lang en --yes
node bin/agentvigor.mjs harness --path "./Harness Fixture" --lang en --dry-run
node bin/agentvigor.mjs harness --path "./Harness Fixture" --lang en --yes
```

## Sources and limits

Machine preparation, security review, memory, and delegation are agent workflows. The catalog serves their instructions. It records no global package-manager action or live service test. Vibe Coding Toolkit copyright remains with Matheus Gomes under MIT. Selected original configs and modules are reference resources. The integration and audit guides distinguish what is included and what remains pending.

[Upstream audit](../upstream-audit/CONTENT-AUDIT.md) · [Included upstream references](../../skills/agentvigor-toolkit/references/upstream/README.md) · [Recovery guide](../RECOVERY.md) · [Third-party notices](../../THIRD_PARTY_NOTICES.md).
