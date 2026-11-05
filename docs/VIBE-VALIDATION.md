# Vibe integration validation

The integration audits all 121 files in Vibe Coding Toolkit revision `21b71b68679c11184f49c23168852014bf6dde8b`. The source inventory, decisions, copied-file hashes and localized workflows are checked by the audit and catalog tests. The functionality matrix records executable delivery, adapted guidance and optional external prerequisites.

The Windows Node.js 24.15.0 suite passed 76 tests. The installed tarball smoke passed with 151 files, including both client destinations, the router, local catalog, project creation and rollback. Installer tests cover historical schema 1 reads, confirmed migration and restoration of the original state. The three upstream ESLint rules passed positive and negative cases with ESLint 10.14.0.

A disposable Next.js 16.4.5 project was generated and its pinned dependencies installed. Its lint, TypeScript, test and production build checks passed through the real quality runner after correcting the PostCSS template. The authorization exercise starts at five of seven checks passing, and the corrected implementation passes all seven. These fixture results establish the local evaluator behavior. Model adherence requires separate client evaluation.

Global installation copies the router and resources to native client skill directories. Verification of discovery in fresh Codex and Claude Code sessions remains a manual acceptance check. External tools retain their native setup procedures. PostgreSQL, Sentry, browser integrations and other account-specific capabilities require their documented prerequisites and separate authorization.

The release CI runs Windows Node.js 22/24, Ubuntu 24/26, macOS Intel 24 and macOS ARM64 24. Consult the actual workflow run for the release revision. Local WSL verification is recorded separately when completed.

Project adoption creates absent files and proposals for conflicts. Review proposals before merging. Project rollback removes only files that still match their managed content and identity. Preserve `.agentvigor-project` until recovery or rollback finishes. After a hard stop, confirm all writers stopped before removing an empty stale `write.lock`. Global installer recovery is documented in the recovery guide.
