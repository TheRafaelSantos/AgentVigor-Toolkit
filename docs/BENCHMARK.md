# Reproduce a paired agent benchmark

`agentvigor benchmark` compares observations you supply. It reads a local JSON file, does not launch an agent and makes no network requests. No comparison results ship with AgentVigor.

1. Choose one agent CLI version and model. Use two disposable repositories or isolated OS accounts with the same base settings. Use a fresh session for each run. Leave AgentVigor out of one environment. Install the same AgentVigor version and profile in the other environment. If you want to isolate the skills' effect, keep RTK in the same state for both. Keep the provider and token accounting mode constant.
2. Copy the two files from [the idempotency scenario](../benchmarks/scenarios/idempotency/) into each disposable repository. From that directory, `node --test checks.mjs` starts with one passing test and two deliberate failures. Record the AgentVigor revision used for the fixture. Keep the checker unchanged.
3. Give both fresh sessions the same prompt. “Fix `ledger.mjs`. Accept distinct events, ignore retries by ID even when the amount changes, and reject invalid new events (nonempty string ID and finite numeric amount) with TypeError before mutating the ledger. Preserve the public API. Run the given checks and report the result with evidence.”
4. Time each run externally. Independently rerun `node --test checks.mjs` and review the diff and agent report. Count defects the agent correctly identified, independently verified regressions and claims without evidence using the same rubric for both runs. Keep private prompts and raw logs out of the report file. Repeat with fresh copies and alternate run order.
5. Record native agent usage if available. Record RTK saved output tokens only when you can attribute the difference to this run using isolated RTK statistics. Use zero only for a measured or verified zero. Use `null` or omit unavailable metrics. If you time toolkit commands separately, record the measured overhead in `toolkitMs`.
6. Run `agentvigor benchmark --input observations.json` from the folder with your JSON file. The output is JSON. Use `node bin/agentvigor.mjs benchmark --input observations.json` from a source checkout when the CLI is not on PATH.

The version 1 input has three keys:

| Key | Value |
| --- | --- |
| `schemaVersion` | Integer `1` |
| `metadata` | Strings `environment`, `agent`, `agentVersion`, `revision`, `scenario`, and optional `model` (string or null). Use sanitized labels of up to 100 characters |
| `pairs` | Array of 1–1,000 objects with `baseline` and `agentvigor` observations |

Both observations require non-negative `durationMs`, `testsPassed` and `testsFailed`. Optional fields are `observedTokens`, `rtkSavedOutputTokens`, `errorsFound`, `regressionsFound`, `unsupportedClaims` and `toolkitMs`. Counts are integers. Millisecond measurements can have fractional precision. The file limit is 1 MiB.

Each metric uses pairs with measurements in both conditions. The report gives the median for each condition and the median of within-pair differences (AgentVigor minus baseline). `reportMs` measures local report generation overhead. RTK estimates saved command-output tokens and agent clients may report different token categories, including cache usage. Keep these measurements separate from provider billing and subscription limits. Model variation, warm caches and prior knowledge can affect results even with pairing.
