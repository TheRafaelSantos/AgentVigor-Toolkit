import { readFile } from 'node:fs/promises';

const languages = ['en', 'pt-BR', 'es'];
const references = new URL('../references/', import.meta.url);

export async function catalog({ id, lang = 'en', mode = 'quick' } = {}) {
  if (!['quick', 'full'].includes(mode)) {
    throw Object.assign(new Error('Choose quick or full.'), { code: 'CATALOG_MODE' });
  }
  if (!languages.includes(lang)) {
    throw Object.assign(new Error('Unsupported catalog language.'), { code: 'INVALID_LANGUAGE' });
  }
  const { upstream, revision, workflows } = JSON.parse(await readFile(new URL('catalog.json', references), 'utf8'));
  const entries = workflows.map((workflow) => ({
    id: workflow.id,
    ...workflow.labels[lang],
    source: `${upstream}/blob/${revision}/${workflow.source}`,
  }));
  if (id === undefined) return { revision, mode, entries };

  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry) {
    throw Object.assign(new Error('Unknown AgentVigor workflow.'), { code: 'CATALOG_ID' });
  }
  const path = new URL(`workflows/${lang}/${entry.id}.md`, references);
  const quick = await readFile(path, 'utf8');
  if (mode === 'quick') return { revision, ...entry, mode, language: lang, content: quick };
  const workflow = workflows.find(candidate => candidate.id === id);
  const sourcePath = workflow.source;
  const original = await readFile(new URL(`full/source/${sourcePath}`, references), 'utf8');
  const notices = {
    en: 'FULL preserves the original source language and procedures. Apply the selected scope and permissions. Global changes, destructive commands, services and costs require specific authorization. Use the local source tree for relative links. Read the QUICK adaptation before applying the original procedure.',
    'pt-BR': 'FULL preserva o idioma e os procedimentos da fonte original. Aplique o escopo e as permissões selecionados. Mudanças globais, comandos destrutivos, serviços e custos exigem autorização específica. Resolva links relativos na árvore local da fonte. Leia a adaptação QUICK antes de aplicar o procedimento original.',
    es: 'FULL conserva el idioma y los procedimientos originales. Aplica el alcance y los permisos seleccionados. Los cambios globales, comandos destructivos, servicios y costes requieren autorización específica. Resuelve enlaces relativos en el árbol local. Lee QUICK antes de aplicar el procedimiento original.',
  };
  return { revision, ...entry, mode, language: lang, sourcePath,
    content: quick + '\n\n' + notices[lang] + '\n\nOffline source: references/full/source/' + sourcePath + '\n\n---\n\n' + original };
}
