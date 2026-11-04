# Optional installation counts

The CLI sends no telemetry by default. This release does not provide a hosted collection endpoint. If you operate an approved service, an installation that changes managed state can send a single event when you pass `--telemetry` to `agentvigor install` and set `AGENTVIGOR_TELEMETRY_URL` to the service's HTTPS endpoint. Omit the flag to opt out. Consent applies only to that invocation. The request has a two-second limit and a failure never undoes the installation. Updates, rollback, dry runs and no-op installs do not send events.

The v1 body has `event` (fixed `installation_completed`), `schemaVersion` (1), `version`, `system` and a list of selected `agents`. The CLI omits credentials, paths, user names, project details and device identifiers. The HTTPS service and its provider still see network information required to receive a request. Operators should disable request logs and avoid retaining IPs or request headers. AgentVigor's consent does not manage telemetry settings in other products.

## Proposed backend

A Cloudflare Worker can accept one small JSON POST at `/v1/installations`, validate a strict schema and increment a D1 aggregate keyed by UTC day, version, OS and agent selection. Apply a body-size limit, rate limits at the edge, and monitor daily writes. Reject other methods and avoid storing raw bodies. A bounded aggregate table limits retention and query cost. A Worker without D1 is cheaper to maintain only if no durable count is required. D1's free tier is sufficient for prototyping under its published quotas. A public collection endpoint can be abused and sustained writes or traffic can require a paid plan. Review [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) before deployment.

Report GitHub download counts, consented install events, and unique users separately. Reinstallation, reconfiguration, opt-outs, offline runs and spam affect event counts. This design cannot measure unique users. No infrastructure, service credentials or billing are provisioned by the CLI.
