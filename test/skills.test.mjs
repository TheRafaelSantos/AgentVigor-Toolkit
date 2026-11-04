import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

const names = [
  'agentvigor-agent-doctor',
  'agentvigor-diff-guardian',
  'agentvigor-grounded-code',
  'agentvigor-safe-resume',
  'agentvigor-token-budget',
];
const skills = new URL('../skills/', import.meta.url);

test('the toolkit ships exactly the five original skills', async () => {
  const entries = await readdir(skills, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  assert.deepEqual(directories.sort(), names);
});

for (const name of names) {
  test(`${name} has a discoverable Agent Skills manifest`, async () => {
    const contents = await readFile(new URL(`${name}/SKILL.md`, skills), 'utf8');
    const manifest = contents.match(/^---\r?\nname: ([a-z0-9-]+)\r?\ndescription: (Use when [^\r\n]+)\r?\n---\r?\n([\s\S]+)$/u);
    assert.ok(manifest, 'expected name, trigger description, and Markdown body');
    assert.equal(manifest[1], name, 'skill name must match its directory');
    assert.ok(manifest[2].length <= 500, 'keep discovery metadata concise');
    assert.ok(manifest[3].trim().startsWith('# '), 'expected a skill heading');
  });
}
