# Third-party notices

Rafael Pereira created and maintains AgentVigor Toolkit. The original
AgentVigor code and skills use the repository's [MIT license](LICENSE).

AgentVigor incorporates selected Vibe Coding Toolkit material under its MIT
license. The router distributes the original notice and a per-file record
of copied and adapted material. AgentVigor's original code implements the
installer, CLI, catalog, project transactions and quality runner. Other
integrations use their separate upstream distribution. The RTK monitor calls
the separately installed `rtk` executable.

| Project | Credit and relationship | Upstream terms |
| --- | --- | --- |
| [Vibe Coding Toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit/tree/21b71b68679c11184f49c23168852014bf6dde8b) | Matheus Gomes. Source of selected templates, ESLint rules, the harness exercise, and adapted development workflows. See the [per-file provenance](skills/agentvigor-toolkit/references/provenance.json). | [MIT, copyright 2026 Matheus Gomes](skills/agentvigor-toolkit/licenses/VIBE-CODING-TOOLKIT-MIT.txt) |
| [RTK](https://github.com/rtk-ai/rtk/tree/v1.1.0) | RTK contributors. Optional command-output filtering and source of the monitor's displayed data. | [Apache-2.0 CLI](https://github.com/rtk-ai/rtk/blob/v1.1.0/LICENSE), [BUSL-1.1 engine](https://github.com/rtk-ai/rtk/blob/v1.1.0/engine/LICENSE) in the full binary, and [BUSL-1.1 separate proxy](https://github.com/rtk-ai/rtk/blob/v1.1.0/proxy/LICENSE). The `rtk-oss` edition omits the engine. |
| [Superpowers](https://github.com/obra/superpowers/tree/v7.0.2) | Jesse Vincent and contributors. Optional development workflow plugin. | [MIT](https://github.com/obra/superpowers/blob/v7.0.2/LICENSE) |
| [Ponytail](https://github.com/DietrichGebert/ponytail/tree/v5.3.3) | DietrichGebert and contributors. Optional implementation and review guidance. | [MIT](https://github.com/DietrichGebert/ponytail/blob/v5.3.3/LICENSE) |
| [Skills CLI and Find Skills](https://github.com/vercel-labs/skills/tree/v1.7.6) | Vercel, Inc. and contributors. Optional skills catalog and installer. | [MIT](https://github.com/vercel-labs/skills/blob/v1.7.6/LICENSE) and the upstream [third-party notices](https://github.com/vercel-labs/skills/blob/v1.7.6/ThirdPartyNoticeText.txt) |
| [Graphify](https://github.com/Graphify-Labs/graphify/tree/v0.9.102) | Safi Shamsi and Graphify contributors. Optional code graph tool. | [Apache-2.0](https://github.com/Graphify-Labs/graphify/blob/v0.9.102/LICENSE) with [NOTICE](https://github.com/Graphify-Labs/graphify/blob/v0.9.102/NOTICE). Previously MIT-licensed contributions remain available under the [preserved MIT terms](https://github.com/Graphify-Labs/graphify/blob/v0.9.102/LICENSE-MIT). |

The skill manifests follow the [Agent Skills specification](https://agentskills.io/specification).
See [Integrations](docs/INTEGRATIONS.md) for the audited versions, setup
mechanisms, and checks. Review applicable terms and preserve required notices
before including any upstream material in future releases.

## Find Skills

The optional integration preserves Find Skills from `vercel-labs/skills`
tag `v1.7.6`, copyright (c) 2026 Vercel, Inc., under MIT. Exact source and license
bytes are in `lib/assets/find-skills`. Managed installation uses the official
Skills CLI with scoped consent; its downloaded npm dependencies retain their
respective licenses. See [managed installation](docs/FIND-SKILLS-MANAGEMENT.md).
