#!/usr/bin/env bash
set -euo pipefail

# Requires existing Linux Node/npm and a complete PostgreSQL binary/share prefix.
# Only the new temporary cluster is started; no Docker or system service is used.
toolkit=$(cd -- "$(dirname -- "$0")/.." && pwd -P)
node_executable=${1:?Pass the absolute Linux Node executable}
postgres_prefix=${2:?Pass the absolute extracted PostgreSQL prefix}
case "$node_executable:$postgres_prefix" in /*:/*) ;; *) exit 2 ;; esac
node_bin=$(dirname -- "$node_executable")
pg_bin="$postgres_prefix/usr/lib/postgresql/16/bin"
pg_lib="$postgres_prefix/usr/lib/x86_64-linux-gnu"
npm_cli="$node_bin/../lib/node_modules/npm/bin/npm-cli.js"
temporary=$(mktemp -d /tmp/agentvigor-pg-integration.XXXXXXXX)
started=false
stage=initialization
trap 'printf "PostgreSQL smoke failed during %s (line %s)\n" "$stage" "$LINENO" >&2' ERR
cleanup() {
  if $started; then LD_LIBRARY_PATH="$pg_lib" "$pg_bin/pg_ctl" -D "$temporary/data" -m fast -w stop >/dev/null; fi
  case "$temporary" in /tmp/agentvigor-pg-integration.*) rm -rf -- "$temporary" ;; *) return 2 ;; esac
}
trap cleanup EXIT
mkdir -m 700 "$temporary/socket" "$temporary/project" "$temporary/home"
touch "$temporary/npmrc" "$temporary/global-npmrc"
export PATH="$node_bin:/usr/bin:/bin"
export HOME="$temporary/home"
export NPM_CONFIG_USERCONFIG="$temporary/npmrc"
export NPM_CONFIG_GLOBALCONFIG="$temporary/global-npmrc"
export NPM_CONFIG_CACHE="$temporary/npm-cache"
export NEXT_TELEMETRY_DISABLED=1 DISABLE_TELEMETRY=1 DO_NOT_TRACK=1
LD_LIBRARY_PATH="$pg_lib" "$pg_bin/initdb" -D "$temporary/data" -L "$postgres_prefix/usr/share/postgresql/16" \
  --locale=C --encoding=UTF8 --auth-local=trust --auth-host=reject >"$temporary/initdb.log"
LD_LIBRARY_PATH="$pg_lib" "$pg_bin/pg_ctl" -D "$temporary/data" -l "$temporary/postgres.log" \
  -o "-h '' -k $temporary/socket -p 55479" -w start >"$temporary/start.log"
started=true
LD_LIBRARY_PATH="$pg_lib" "$pg_bin/createdb" -h "$temporary/socket" -p 55479 agentvigor_test
stage=project-initialization
"$node_executable" "$toolkit/bin/agentvigor.mjs" project --mode init --template next-postgres \
  --path "$temporary/project" --yes --json >"$temporary/project-plan.json"
cd -- "$temporary/project"
stage=dependency-installation
"$node_executable" "$npm_cli" install --ignore-scripts --no-audit --no-fund >"$temporary/install.log" 2>&1
cat >src/db/schema/index.ts <<'SCHEMA'
import { integer, pgTable, text } from 'drizzle-orm/pg-core';
export const integrationProbe = pgTable('agentvigor_probe', {
  id: integer('id').primaryKey(),
  value: text('value').notNull(),
});
SCHEMA
DATABASE_URL=$("$node_executable" --input-type=module -e \
  'console.log(`postgresql://${process.argv[2]}@localhost:55479/agentvigor_test?host=${encodeURIComponent(process.argv[1])}`)' \
  "$temporary/socket" "$(id -un)")
export DATABASE_URL
stage=migration-generation
"$node_executable" "$npm_cli" run db:generate >"$temporary/generate.log" 2>&1
stage=first-migration
"$node_executable" "$npm_cli" run db:migrate >"$temporary/migrate-first.log" 2>&1
stage=repeated-migration
"$node_executable" "$npm_cli" run db:migrate >"$temporary/migrate-repeat.log" 2>&1
stage=database-assertions
"$node_executable" --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import pg from 'pg';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  assert.equal((await client.query('SHOW listen_addresses')).rows[0].listen_addresses, '');
  assert.equal(Number((await client.query('SELECT count(*) AS count FROM drizzle.__drizzle_migrations')).rows[0].count), 1);
  await client.query('BEGIN');
  await client.query('INSERT INTO agentvigor_probe (id, value) VALUES ($1, $2)', [1, 'synthetic-ok']);
  assert.equal((await client.query('SELECT value FROM agentvigor_probe WHERE id = $1', [1])).rows[0].value, 'synthetic-ok');
  await client.query('ROLLBACK');
  assert.equal(Number((await client.query('SELECT count(*) AS count FROM agentvigor_probe')).rows[0].count), 0);
  const version = (await client.query('SHOW server_version')).rows[0].server_version;
  console.log(JSON.stringify({ platform: process.platform, node: process.version, postgres: version,
    generatedPreset: true, realMigration: true, repeatedMigration: true, transactionRollback: true, tcpDisabled: true, passed: true }));
} finally { await client.end(); }
NODE
