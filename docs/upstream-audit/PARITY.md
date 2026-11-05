# Functional parity audit

The baseline is Vibe Coding Toolkit revision `21b71b68679c11184f49c23168852014bf6dde8b`. The upstream HEAD query on 2026-11-04 returned the same revision. No later upstream change was observed in that query.

FULL identifies complete offline source procedures. ADAPTED identifies executable behavior with documented differences. CONDENSED identifies QUICK instructions alone. REFERENCE identifies examples. EXTERNAL requires separate tooling. MISSING identifies absent implementation. UNVERIFIED identifies present implementation without sufficient observed evidence. A FULL document does not establish execution parity.

| Resource | Instruction delivery | Executable parity | Evidence and differences |
| --- | --- | --- | --- |
| project-sanitation | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/01-project-sanitation.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| eslint-warning-burndown | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/02-eslint-warning-burndown.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| multi-agent-code-review | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/03-multi-agent-code-review.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| brainstorm-to-plan | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/04-brainstorm-to-plan.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| parallel-wave-dispatch | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/05-parallel-wave-dispatch.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| memory-bootstrap | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/06-memory-bootstrap.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| eslint-complete-setup | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/07-eslint-complete-setup.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| eslint-quality-gates-install | FULL plus localized QUICK | ADAPTED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/08-eslint-quality-gates-install.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| file-size-refactor | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/09-file-size-refactor.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| development-environment-setup | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/10-development-environment-setup.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| next-project-bootstrap | FULL plus localized QUICK | ADAPTED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/11-next-project-bootstrap.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| existing-project-setup | FULL plus localized QUICK | ADAPTED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/12-existing-project-setup.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| security-review | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/13-security-review.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| harness-evaluation | FULL plus localized QUICK | ADAPTED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/14-harness-evaluation.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| harness-improvement | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/15-harness-improvement.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |
| security-audit | FULL plus localized QUICK | UNVERIFIED | Complete [original procedure](../../skills/agentvigor-toolkit/references/full/source/docs/prompts/16-security-audit.md), pinned source hash and FULL tests. See the [delivery matrix](MATRIX.md) for executor coverage and differences. |

| Related resource | State | Evidence or remaining work |
| --- | --- | --- |
| Guides, onboarding, templates, rules and validators | FULL | All 121 source files and their bytes are covered by the offline snapshot test. Original validators remain reference code until separately selected and validated. |
| Project adoption, Next foundation, quality runner and harness | ADAPTED | Existing 0.2.0 tests and validation record cover specific executable cases. The Next preset is a selected foundation and upstream optional data/runtime modules remain reference templates. |
| Five original skills and router | ADAPTED | Existing manifest, installer and rollback tests. Fresh-client invocation and behavioral evaluation remain UNVERIFIED. |
| RTK | EXTERNAL | Executable probe and monitor exist. Managed installation/configuration/rollback remains MISSING. |
| Superpowers, Ponytail, Find Skills, Graphify | EXTERNAL | Native setup guides exist. Optional AgentVigor-managed lifecycle remains MISSING. |
| Context7, browsers, account-specific integrations | EXTERNAL | Complete upstream guides and examples are offline. Availability and access depend on the selected client. |
| Real Codex sessions across seven categories | UNVERIFIED | Executable available. Global discovery, invocation and FULL selection require observed fresh-session tests. |
| Real Claude Code sessions | MISSING | No Claude launcher found on the current Windows PATH. Authentication was not changed. |

## Integration state contract

INSTALLED requires a resolved executable or installed native package and observed version. CONFIGURED requires a validated registration for the selected client. DISCOVERED requires that client to enumerate the capability in a fresh session. VERIFIED requires a successful scoped invocation. MISSING means an installation or registration prerequisite is absent. INCOMPATIBLE requires an observed unsupported version/platform/client interface. BLOCKED requires a concrete permission, authentication or environment obstacle. These states may coexist as separate checks. A file or executable alone cannot establish DISCOVERED or VERIFIED.

## Open priorities

1. Implement the optional official installer lifecycle per tool with scoped consent, ownership, backups and rollback.
2. Observe fresh native-client discovery and explicit invocation in disposable projects for development, review, debugging, security, context economy, recovery and bootstrap.
3. Extend disposable proofs for detailed upstream project and data-layer practices, retaining prerequisites and recording manual checks.
4. Run the expanded package and platform matrix before publishing a new candidate.
