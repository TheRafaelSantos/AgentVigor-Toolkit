import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const bin = fileURLToPath(new URL('bin/agentvigor.mjs', root));
const readmes = ['README.md', 'README.pt-BR.md', 'README.es.md'];
const images = ['hero', 'platforms', 'reliability', 'token-efficiency'].map((name) => `docs/assets/readme/${name}.png`);
const results = new Map();

function argumentsIn(line) {
  const tokens = [...line.matchAll(/"([^"\r\n]*)"|'([^'\r\n]*)'|([^\s"']+)/gu)];
  assert.equal(line.replace(/"[^"\r\n]*"|'[^'\r\n]*'|[^\s"']+/gu, '').trim(), '', `unbalanced quoting in ${line}`);
  return tokens.map((token) => token[1] ?? token[2] ?? token[3]);
}

for (const readme of readmes) {
  test(`${readme} local links and artwork resolve`, async () => {
    const location = new URL(readme, root);
    const text = await readFile(location, 'utf8');
    const present = new Set();
    for (const [, image, label, raw] of text.matchAll(/(!?)\[([^\]\r\n]*)\]\(<?([^)>\r\n]+)>?\)/gu)) {
      const href = raw.trim();
      if (image) {
        assert.ok(label.trim(), `${readme}: missing alt text for ${href}`);
        present.add(href);
      }
      if (/^https?:\/\/|^mailto:/iu.test(href)) continue;
      const target = new URL(href, location);
      assert.ok(target.href.startsWith(root.href), `${readme}: link leaves checkout: ${href}`);
      const info = await lstat(target).catch(() => null);
      assert.ok(info?.isFile() || info?.isDirectory(), `${readme}: broken local link: ${href}`);
    }
    for (const image of images) assert.ok(present.has(image), `${readme}: missing image ${image}`);
  });

  test(`${readme} CLI snippets use real commands and flags`, async () => {
    const text = await readFile(new URL(readme, root), 'utf8');
    const lines = [
      ...text.matchAll(/^(?:node[ \t]+(?:\.\/)?bin\/agentvigor\.mjs|agentvigor)[ \t]+([^\r\n]+)$/gmu),
      ...text.matchAll(/`(?:node[ \t]+(?:\.\/)?bin\/agentvigor\.mjs|agentvigor)[ \t]+([^`\r\n]+)`/gu),
    ];
    assert.ok(lines.length > 0, `${readme}: missing runnable CLI examples`);
    for (const [, line] of lines) {
      const args = argumentsIn(line);
      const isVersion = args.length === 1 && args[0] === '--version';
      const probe = isVersion || args.includes('--help') ? args : ['--help', ...args];
      const key = JSON.stringify(probe);
      if (!results.has(key)) {
        results.set(key, spawnSync(process.execPath, [bin, ...probe], {
          cwd: fileURLToPath(root),
          encoding: 'utf8',
          timeout: 10_000,
          shell: false,
        }));
      }
      const { status, stdout, stderr, error } = results.get(key);
      assert.equal(status, 0, `${readme}: invalid CLI example "${line}"\n${stderr || error}`);
      if (!isVersion) assert.match(stdout, /AgentVigor Toolkit/u, `${readme}: expected a help-only probe`);
    }
  });
}
