# 0.1.0-rc.1 validation record

This candidate implements the first usable AgentVigor CLI. Its author and maintainer is Rafael Pereira. The repository is [TheRafaelSantos/AgentVigor-Toolkit](https://github.com/TheRafaelSantos/AgentVigor-Toolkit). The existing MIT license and initial commit remain in history. The release tag identifies the published revision.

## Delivered milestones

| Milestone | Delivered behavior and owning files | Evidence and limits |
| --- | --- | --- |
| M1 Foundation | `package.json`, `LICENSE`, `.gitignore`, `docs/DEVELOPMENT.md`, `THIRD_PARTY_NOTICES.md` | Existing root commit preserved. Independent implementation and upstream license audit |
| M2 Core CLI | `bin/agentvigor.mjs`, `lib/i18n.mjs`, `lib/platform.mjs`, `lib/process.mjs`, `lib/doctor.mjs` | All seven subcommands, help/version, three message locales, bounded subprocesses and isolated CLI tests |
| M3 Global integration | `lib/install.mjs` and `test/install.test.mjs` | Codex-only, Claude-only and both, three profiles, dry-run, explicit consent, idempotency, transaction snapshots, lock, journal recovery, drift protection, local update and rollback |
| M4 Reliability | Five `skills/agentvigor-*/SKILL.md` files | Structural manifest checks pass. Agent discovery and model adherence require the independent client checks in the integration guide |
| M5 RTK | `lib/monitor.mjs` and `test/runtime.test.mjs` | Local official RTK 1.1.0 smoke used synthetic SQLite data. Timeout, cancellation, plain output and non-overlap tests pass |
| M6 Documentation | Three README languages, four supplied PNG images and guides | Local links and documented CLI commands checked. The images use lossless PNG compression, preserving their pixels. Adjacent captions identify conceptual commands and unverified metrics |
| M7 Quality | `.github/workflows/ci.yml`, `scripts/smoke-package.mjs`, `lib/benchmark.mjs`, benchmark fixture and tests | Offline package installation and removal in isolated homes, paired observation comparison, optional telemetry tested with a fake transport |
| M8 Public candidate | GitHub pre-release tarball and checksum | Candidate release workflow requires passing CI and a reviewed package inventory. A stable release and npm registry publication require their own acceptance decision |

The complete source file inventory is available from `git ls-tree -r --name-only HEAD`. Changes in this candidate are new files alongside the preserved license. AgentVigor has zero runtime npm dependencies. GitHub Actions are pinned to commits from the official action repositories.

## Verified locally

- Windows x64, Node.js 24.15.0. CLI, installer, concurrency, recovery, metadata, privacy, subprocess and RTK tests.
- Ubuntu under WSL2 x64, Linux Node.js 24.15.0. The same suite and package smoke ran on the mounted Windows checkout. The volume grants execute access even after chmod 0600. The test reports that filesystem behavior explicitly.
- The package smoke installs a tarball with npm into a temporary prefix containing spaces, runs its CLI, installs both agents' skills into a synthetic home and removes them. It invokes the real Windows CMD launcher or the POSIX executable.
- The benchmark's deliberately incomplete fixture starts with one passing test and two failures. This is the expected baseline for the lab and is separate from the product test suite.
- RTK testing used a synthetic database. Its fabricated fixture values validate display fidelity and are excluded from public benchmark results.
- All telemetry tests inject a fake transport and send no events. The CLI requires an explicit flag and an operator-configured endpoint.

## Remaining acceptance work

The CI workflow covers Windows, Ubuntu, macOS Intel and macOS Apple Silicon across selected Node.js 22, 24 and 26 combinations. Its actual run history is the evidence for those runners. A platform matrix does not establish agent-client compatibility by itself.

Claude Code is absent on the development Windows PATH, so discovery in a real Claude Code session remains a manual acceptance step. Codex app-server's isolated Windows home probe returned bundled skills only, so global discovery was not counted as verified in that probe. Run the documented fresh-session selectors to check each installed client on your own account. Neither discovery nor structural tests establish how reliably a model will invoke or follow a skill.

No comparative model runs or measured total token savings ship in this release. No collector backend has been deployed. Upstream tools remain opt-in separate installs documented in the integration guide. Their models, services and licenses have separate terms.

## Installation, operation and rollback

The READMEs provide complete commands for each OS, both clients, optional global CLI installation, updates and removal. The CLI can be run directly with `node bin/agentvigor.mjs` from a checkout, including a checkout with spaces in its path.

Use `npm test` and `npm run smoke:package` for development verification. In Windows PowerShell, use `npm.cmd` if the script policy blocks `npm.ps1`. There is no build step or production service to deploy. The source is executable Node.js ESM.

Before changing global skills, run `agentvigor install --agent codex --dry-run`. An interactive run asks for confirmation, and an unattended run requires `--yes`. Backups and pending state stay in `~/.agentvigor`. The plan is checked again under lock before applying a confirmed preview. An interrupted operation can leave a stale lock. Follow [Recovery](RECOVERY.md), retaining snapshots, before removing only a confirmed empty stale lock.

The installer requires hardlink support for safe creation. Unsupported filesystems fail closed. User directories must remain under the account owner's control during a transaction. Manual edits or external symlinks stop managed changes. Some directories and untracked staging files may remain after a hard stop. Remove only items you can attribute to that interrupted operation.

Run `agentvigor rollback --dry-run` before restoring the prior change, or `agentvigor rollback --all --dry-run` before removing managed skill files. Confirm the plan to apply it. Skill rollback preserves unrelated files. Restoring an older CLI binary requires reinstalling that reviewed version separately.
