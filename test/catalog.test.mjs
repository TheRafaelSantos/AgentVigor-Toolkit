import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { catalog } from '../skills/agentvigor-toolkit/scripts/catalog.mjs';

const bundle = new URL('../skills/agentvigor-toolkit/', import.meta.url);
const locales = ['en', 'pt-BR', 'es'];
const revision = '21b71b68679c11184f49c23168852014bf6dde8b';

test('catalog lists sixteen workflows and loads one localized body per request', async () => {
  const english = await catalog();
  assert.equal(english.revision, revision);
  assert.equal(english.entries.length, 16);
  assert.equal(new Set(english.entries.map(({ id }) => id)).size, 16);
  assert.ok(english.entries.every((entry) => !Object.hasOwn(entry, 'content')));
  for (const lang of locales) {
    const { entries } = await catalog({ lang });
    assert.deepEqual(entries.map(({ id }) => id), english.entries.map(({ id }) => id));
    for (const { id, source, title, description } of entries) {
      const workflow = await catalog({ id, lang });
      assert.equal(workflow.language, lang);
      assert.equal(workflow.revision, revision);
      assert.equal(workflow.title, title);
      assert.ok(description.trim().length > 0);
      assert.ok(workflow.content.startsWith(`# ${title}\n`));
      assert.ok(workflow.content.includes(source));
      assert.ok(workflow.content.length > 250);
    }
  }
  const titles = await Promise.all(locales.map(async (lang) => (await catalog({ lang })).entries[0].title));
  assert.equal(new Set(titles).size, 3);
});

test('catalog rejects an unsupported language and path-like or unknown IDs', async () => {
  await assert.rejects(catalog({ lang: 'fr' }), { code: 'INVALID_LANGUAGE' });
  for (const id of ['', '../../LICENSE', 'unknown', 'constructor']) {
    await assert.rejects(catalog({ id }), { code: 'CATALOG_ID' });
  }
});

test('license and provenance account for copied resources and all adapted workflows', async () => {
  const { files, license } = JSON.parse(await readFile(new URL('references/provenance.json', bundle), 'utf8'));
  assert.equal(license, 'MIT');
  assert.equal(new Set(files.map(({ destination }) => destination)).size, files.length);
  assert.equal(files.filter(({ kind, destination }) => kind === 'adapted' && destination.startsWith('references/workflows/')).length, 16 * locales.length);
  assert.ok(files.some(({ source, destination, kind }) => source === 'scripts/validate-harness.mjs' && destination === 'scripts/harness.mjs' && kind === 'adapted'));
  assert.ok(files.some(({ source, destination, kind }) => source === 'templates/project-docs/manifest.json' && destination === 'scripts/project-presets.mjs' && kind === 'adapted'));
  for (const entry of files) {
    assert.match(entry.sha256, /^[0-9a-f]{64}$/);
    assert.match(entry.destination, /^(?:references|licenses|scripts)\//);
    const target = new URL(entry.destination, bundle);
    assert.ok(target.href.startsWith(bundle.href));
    const contents = await readFile(target);
    const digest = createHash('sha256').update(contents).digest('hex');
    if (entry.kind === 'copied') assert.equal(digest, entry.sha256, entry.destination);
    else assert.equal(digest, entry.destinationSha256, entry.destination);
  }
  const text = await readFile(new URL('licenses/VIBE-CODING-TOOLKIT-MIT.txt', bundle), 'utf8');
  assert.match(text, /Copyright \(c\) 2026 Matheus Gomes/);
  assert.match(text, /THE SOFTWARE IS PROVIDED "AS IS"/);
});
