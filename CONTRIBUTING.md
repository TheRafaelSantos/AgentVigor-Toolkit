# Contributing

1. Fork the repository and clone your fork. Use a supported Node.js line listed in the README.
2. Create a branch for a focused change. Keep modifications to skills and installation behavior accompanied by tests in an isolated home.
3. Run `npm test` and `npm run smoke:package`. Run `git diff --check` before committing.
4. Submit a pull request with the behavior change, verification evidence and platform limitations. Update the three README files for user-visible CLI changes.

Keep transcripts, local paths, credentials and agent settings out of issues and pull requests. Use synthetic fixtures to reproduce failures. Review the [development and release guide](docs/DEVELOPMENT.md) and [third-party notices](THIRD_PARTY_NOTICES.md) before adding an integration.
