# Vibe Toolkit Integration Implementation Plan

> For agentic workers, use subagent-driven implementation for the independent domains below. Every mutable file has one owner.

**Goal**. Incorporate the applicable Vibe workflows, project templates and executable checks into AgentVigor and publish a tested candidate.

**Architecture**. One globally installed router supplies local workflows and resources. The CLI imports the router's own scripts for catalog, project operations, real quality gates and harness evaluation. Installer migration preserves prior installations.

**Tech stack**. Node.js 22/24/26 built-ins and a supported exact ESLint development version.

**Spec**. [Vibe integration design](../specs/2026-11-04-vibe-integration.md).

## Global constraints

- Development stays in the authorized AgentVigor workspace.
- Preserve the existing Git history, MIT license and first candidate. Use regular pushes and a new candidate version.
- Preserve Matheus Gomes's license and record the pinned origin of every reused/adapted artifact.
- No automatic global third-party setup, API spending, service provisioning or permission changes.
- One writer per implementation domain. Reviewers remain read-only.

## Review focus

Historical schema 1 data, manually modified resources, interrupted project adoption, stale confirmed plans and checks that start subprocesses must each have a regression test in their owning domain.

## Tasks

### 1. Audit and provenance

- [ ] Read and classify every snapshot file. Unite the two audit inventories and the image inventory.
- [ ] Produce the functionality matrix and exclusion reasons.
- [ ] Select/adapt resources and preserve license text and source hashes.

### 2. Global resource installation

- [ ] Write failing tests for nested resources and rc.1 migration.
- [ ] Implement schema 2 reads, transactional writes and restoration of schema 1 on migration rollback.
- [ ] Verify profiles, conflicts, resource drift, cancellation recovery, parent links and stale plans.

### 3. Router and local catalog

- [ ] Test catalog IDs, localized workflow access and source integrity.
- [ ] Bundle sixteen adapted workflows and relevant local resources under one router.
- [ ] Keep the skill manifest short and route specialist requests to the existing five skills.

### 4. Projects

- [ ] Test empty and existing destinations, proposals for existing files, idempotency and rollback.
- [ ] Implement a project plan/apply/status/rollback interface and selected docs, ESLint, harness and Next.js presets.
- [ ] Validate generated project files and a disposable installed Next.js foundation.

### 5. Quality and harness

- [ ] Test real commands, unavailable tools, nonzero exits, output limits, timeout and process-tree cancellation.
- [ ] Adapt supported ESLint rules and the authorization fixture/evaluator with credit.
- [ ] Verify both a failing baseline and a repaired fixture.

### 6. CLI, documentation and publication

- [ ] Integrate new commands and localized messages without breaking old entry points.
- [ ] Update all three READMEs, guides, third-party notices, changelog and package inventory.
- [ ] Run the full suite, installed-package smoke, Windows/WSL checks and platform CI.
- [ ] Review the complete diff and release inventory, then publish a new documented candidate.
