# Vibe integration design

AgentVigor will incorporate the applicable capabilities of the audited Vibe Coding Toolkit revision `21b71b68679c11184f49c23168852014bf6dde8b`. Rafael Pereira maintains AgentVigor. Reused and adapted upstream material retains Matheus Gomes's MIT notice and a per-file source manifest.

## Architecture

A single `agentvigor-toolkit` skill provides discovery and loads one localized workflow at a time. Sixteen adapted workflows cover the original prompt catalog. Selected templates and executable quality/harness components are bundled locally. The original five specialist skills remain available and workflows reference them where pertinent.

The CLI adds `catalog`, `project`, `quality` and `harness`. Project operations stage documentation, project instructions, quality configuration and selected application templates, with preview, consent, conflict protection, backups and rollback. Existing projects retain their stack and custom files. An explicit Next.js preset produces a runnable foundation and records required package installations separately.

Quality checks execute actual configured Node entry points or npm project scripts, with argv arrays, output/time limits, process-tree cancellation and explicit authorization. The authorization harness evaluates a disposable fixture and reports individual assertions. It does not invoke a model or measure model reliability.

Scripts reside inside the router skill so a global installation is self-contained. The CLI imports the same implementations. Original resources are packaged with their license and origin. Incompatible defaults in upstream prompts are replaced by local adaptations. External plugins/MCP servers and services stay under the user's selected scope and their official setup procedures.

## Decisions

The selected approach combines a native CLI, an on-demand router and selected upstream components. Copying the full repository would include unrelated branding and context-heavy unsafe defaults. Links alone would leave the installed capabilities dependent on network access and would omit executable components.

Every profile includes the router. The specialist subsets continue to define minimal, balanced and rigorous. Global installer schema 2 supports files within named skill directories, historical schema 1 remains readable, and reads/dry-runs do not migrate state. Immediate migration rollback restores the old schema and files for use with rc.1.

The CLI remains based on Node.js built-ins. ESLint is a pinned development/test dependency and a separately required project tool. No hook, proxy, service or permission policy is enabled automatically.

## Acceptance

- The source inventory covers every file in the pinned snapshot, with an exclusion or integration decision and evidence.
- The functionality matrix records origin, purpose, dependencies, both clients, delivery state, checks and limits.
- Global install, update, rollback and historical migration are tested with nested assets, drift, conflicts and interruption.
- Each new workflow is available locally in English, Brazilian Portuguese and Spanish.
- Project operations and the actual quality/harness executors run in isolated paths containing spaces.
- Reused ESLint rules have positive and negative tests against a supported pinned ESLint release.
- A generated Next.js fixture is installed and checked without modifying global clients or using credentials.
- Existing CLI/RTK behavior and the five original skills retain their tests.
- Package installation and the platform CI matrix pass before the next candidate is published.

## Scope boundaries

Machine setup uses actual platform/tool diagnostics, the AgentVigor installer and current native-client setup workflows. Third-party installers, paid services, deployment, database migrations and model calls require their own explicit authorization and prerequisites. Native subagents are used when the host provides them. The workflow records a sequential fallback when unavailable.

## Ownership

The global installer worker owns `lib/install.mjs` and installer tests. The engineering worker owns router process/quality/harness scripts and tests. The content worker owns router workflow/catalog/resources and its provenance tests. The coordinator owns project scripts, CLI integration, package metadata, public matrices, documentation and release.
