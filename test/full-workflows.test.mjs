import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';
import { catalog } from '../skills/agentvigor-toolkit/scripts/catalog.mjs';

const base = new URL('../skills/agentvigor-toolkit/references/full/source/', import.meta.url);

test('FULL preserves every byte of the pinned upstream snapshot offline', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../docs/upstream-audit/snapshot-files.json', import.meta.url)));
  for (const file of snapshot.files) {
    const bytes = await readFile(new URL(file.path === '.gitignore' ? 'gitignore.txt' : file.path, base));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
  }
});

test('each workflow exposes QUICK and complete FULL procedures', async () => {
  for (const entry of (await catalog()).entries) {
    const quick = await catalog({ id: entry.id, mode: 'quick' });
    const full = await catalog({ id: entry.id, mode: 'full', lang: 'pt-BR' });
    assert.equal(full.mode, 'full');
    assert.equal(quick.mode, 'quick');
    const original = await readFile(new URL(full.sourcePath, base), 'utf8');
    assert.ok(full.content.endsWith(original), entry.id);
    assert.ok(full.content.length > quick.content.length, entry.id);
    assert.match(full.content, /autorização/);
  }
  await assert.rejects(catalog({ mode: 'invalid' }), { code: 'CATALOG_MODE' });
});

test('relative links in full prompts and guides resolve within the offline snapshot', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../docs/upstream-audit/snapshot-files.json', import.meta.url)));
  for (const { path } of snapshot.files.filter(file => /^docs\/.*\.md$/.test(file.path))) {
    const location = new URL(path, base);
    const text = (await readFile(location, 'utf8')).replace(/^```[^\n]*\n[\s\S]*?^```/gm, '').replace(/`[^`\n]+`/g, '');
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const href = match[1];
      if (/^(?:[a-z]+:|#)/i.test(href)) continue;
      const target = new URL(href, location);
      target.hash = '';
      assert.ok(target.href.startsWith(base.href), path + ' ' + href);
      await stat(target);
    }
  }
});
