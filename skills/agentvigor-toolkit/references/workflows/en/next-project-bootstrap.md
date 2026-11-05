# Bootstrap a new Next.js project

Create a scoped starting point for an explicitly chosen new project.

1. Confirm the empty target directory exists and agree on product, audience, MVP, acceptance, and whether persistence is required. Verify compatible Node and npm. Use the existing-project workflow if the destination already contains an application.

2. Preview `agentvigor project --mode init --path "<project>" --template next --dry-run`. Check the files, dependencies, and target. If authorized, repeat with `--yes` instead of `--dry-run`. Fill proposed project documents with observed decisions.

3. Inside the target, review the generated package and run `npm install` only when network dependency installation is authorized. Run `agentvigor quality --path "<project>" --dry-run` and the reviewed checks with `--yes`. Use the project's own start command and verify local HTTP where appropriate.

4. Record commands, results, dependencies, and optional checks. Keep migrations, services, client permissions, and publishing outside bootstrap. Preview rollback with `agentvigor project --mode rollback --path "<project>" --dry-run`.

Adapted from the Vibe Coding Toolkit by Matheus Gomes (MIT). [Source at the audited revision](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/21b71b68679c11184f49c23168852014bf6dde8b/docs/prompts/11-next-project-bootstrap.md).
