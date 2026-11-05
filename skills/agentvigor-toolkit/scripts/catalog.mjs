import { readFile } from 'node:fs/promises';

const languages = ['en', 'pt-BR', 'es'];
const references = new URL('../references/', import.meta.url);

export async function catalog({ id, lang = 'en' } = {}) {
  if (!languages.includes(lang)) {
    throw Object.assign(new Error('Unsupported catalog language.'), { code: 'INVALID_LANGUAGE' });
  }
  const { upstream, revision, workflows } = JSON.parse(await readFile(new URL('catalog.json', references), 'utf8'));
  const entries = workflows.map((workflow) => ({
    id: workflow.id,
    ...workflow.labels[lang],
    source: `${upstream}/blob/${revision}/${workflow.source}`,
  }));
  if (id === undefined) return { revision, entries };

  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry) {
    throw Object.assign(new Error('Unknown AgentVigor workflow.'), { code: 'CATALOG_ID' });
  }
  const path = new URL(`workflows/${lang}/${entry.id}.md`, references);
  return { revision, ...entry, language: lang, content: await readFile(path, 'utf8') };
}
