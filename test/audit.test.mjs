import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));

test('upstream audit accounts for each pinned source file once', async () => {
  const prefix = 'docs/upstream-audit/';
  const [snapshot, content, engineering, visual] = await Promise.all(
    ['snapshot-files.json', 'content-files.json', 'engineering-files.json', 'visual-files.json']
      .map(name => json(prefix + name)),
  );
  assert.equal(snapshot.files.length, 121);
  assert.equal(new Set(snapshot.files.map(entry => entry.path)).size, 121);
  const decisions = [...content, ...engineering.files, ...visual.files];
  assert.deepEqual(decisions.map(entry => entry.path).sort(), snapshot.files.map(entry => entry.path).sort());
  const provenance = await json('skills/agentvigor-toolkit/references/provenance.json');
  assert.equal(provenance.revision, snapshot.revision);
  const byPath = new Map(snapshot.files.map(entry => [entry.path, entry.sha256]));
  for (const file of provenance.files) assert.equal(byPath.get(file.source), file.sha256, file.destination);
  for (const entry of decisions) {
    assert.ok(entry.purpose && entry.codex && entry.claude && entry.reason && entry.evidence, entry.path);
    if (entry.sha256) assert.equal(entry.sha256, byPath.get(entry.path), entry.path);
  }
});
