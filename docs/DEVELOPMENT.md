# AgentVigor development and release

AgentVigor is an independent Node.js CLI and a set of portable, on-demand skills. Each release is auditable from the Git tag and can be installed from a local checkout or a GitHub Release tarball. The CLI uses Node.js built-ins and has no runtime dependencies.

## Design decisions

- Node.js 24 LTS is the reference runtime. The CI matrix also covers the supported Node.js 22 and 26 lines. One codebase handles PowerShell, CMD, POSIX shells and WSL.
- The package contains five original instruction-only skills. Their manifests drive discovery. The installer writes only AgentVigor-owned skill files and its private transaction state. Codex and Claude Code have separate destinations. Upstream tools retain their official installation and update paths.
- Third-party hook installation and agent settings edits need their own review and recovery model. The release candidate leaves those to documented, opt-in upstream procedures.
- Update applies the skills shipped with the local CLI. The user chooses a reviewed GitHub package before updating the global skill files. Package version changes and skill rollback are distinct operations.
- The benchmark is an offline comparison of paired, independently observed runs. It uses no credentials or agent API calls. Optional telemetry requires one-time consent and an operator-configured endpoint. The project hosts no endpoint in this candidate.

## Checkpoints

| Milestone | Implementation | Acceptance evidence |
| --- | --- | --- |
| M1 Foundation | Checkout, MIT, design, attribution | Existing root commit and `LICENSE` remain in history |
| M2 Core CLI | Help, version, locales, system and tool checks | CLI tests cover validation and isolated execution |
| M3 Global integration | Profiles, agent selection, dry-run, state, install, update and rollback | Isolated tests for both clients, idempotency, conflicts and restoration |
| M4 Reliability | Original skills and diagnosis | Manifest tests and manual skill discovery steps |
| M5 RTK | Official RTK monitor | Mocked lifecycle tests and local one-shot RTK run |
| M6 Documentation | Three README languages and four supplied PNG visuals | Local link and command checks, lossless compression and conceptual-metric captions |
| M7 Quality | Platform CI, test matrix, offline benchmark and consent design | CI plus an explicit record of manual coverage |
| M8 Public candidate | Reviewed commit and versioned GitHub artifact | Clean checkout, passing jobs and install smoke test from package |

## Local development

Open a shell in the checkout root. Run `node --version`, `npm test`, and `npm pack --dry-run --json`. In Windows PowerShell, `npm.cmd` is also available when script execution policy blocks `npm.ps1`.

Read the README for the exact installation, update and removal commands. For a release, review all staged files and the package manifest, run the suite, inspect CI, then create a pre-release with the packed tarball and SHA-256 checksum. Use regular fast-forward pushes and preserve the existing license and upstream notices.
