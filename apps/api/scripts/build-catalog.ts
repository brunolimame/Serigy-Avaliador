/**
 * Gera src/catalog/catalog.json a partir de docs/pntp-2026/**.md
 * Uso: pnpm catalog   (a partir da raiz)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Catalog } from '@serigy/shared';
import { parsePage } from '../src/catalog/parse-docs';

const here = dirname(fileURLToPath(import.meta.url));
const docsDir = resolve(here, '../../../docs/pntp-2026');
const outFile = resolve(here, '../src/catalog/catalog.json');

/** Arquivos da raiz de docs/pntp-2026 que não descrevem itens avaliáveis. */
const IGNORED = new Set(['README.md', 'introducao.md', 'definicoes.md', 'invoker.md']);

function listMarkdown(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listMarkdown(full);
    return name.endsWith('.md') ? [full] : [];
  });
}

const catalog: Catalog = { generatedAt: new Date().toISOString(), source: 'docs/pntp-2026', pages: [] };
const allWarnings: string[] = [];

for (const file of listMarkdown(docsDir).sort()) {
  const rel = relative(docsDir, file).split(sep).join('/');
  if (IGNORED.has(rel)) continue;
  const id = rel.replace(/\.md$/, '');
  const { page, warnings } = parsePage(id, readFileSync(file, 'utf8'));
  allWarnings.push(...warnings);
  if (page.sections.length) catalog.pages.push(page);
}

writeFileSync(outFile, JSON.stringify(catalog, null, 2) + '\n');
const items = catalog.pages.reduce((n, p) => n + p.sections.reduce((m, s) => m + s.items.length, 0), 0);
console.log(`catalog.json: ${catalog.pages.length} páginas, ${items} itens`);
if (allWarnings.length) {
  console.warn(`\n${allWarnings.length} aviso(s):`);
  for (const w of allWarnings) console.warn(' - ' + w);
  process.exitCode = 1;
}
