# Advanced security audit and remediation

Audit explicitly selected systems and prepare verifiable remediation batches.

1. Choose AUDIT, PLAN, FIX, or VERIFY. Default to read-only AUDIT. Record scope, immutable revision, exclusion, trust boundaries, permissions, and private output destination. Fixes and active testing require their own selected scope.

2. Trace applicable entry points and inventory dependencies, runtime, CI, infrastructure, privileges and secrets handling. Check current authoritative standards and advisories against resolved versions and reachable code. Record unreviewed areas.

3. Separate confirmed findings, hypotheses, hardening, and support status. For each give stable ID, severity, confidence, trigger, reachability, impact, redacted evidence, counterevidence, minimal remediation, and verification.

4. Produce private SECURITY-AUDIT.md, SECURITY-FINDINGS.json, REMEDIATION-PROMPTS.md, and AUDIT-HANDOFF.md. Use a schema version and scope, track next batch, verify revision on resumption, and rerun negative and legitimate-use checks for selected fixes.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/16-security-audit.md).
