import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareIds, PODERES, type Catalog, type CatalogPage, type PoderId, type PoderInfo } from '@serigy/shared';

let cached: Catalog | undefined;

/** Lê catalog.json (gerado por `pnpm catalog`). */
export function loadCatalog(): Catalog {
  if (!cached) {
    const file = resolve(dirname(fileURLToPath(import.meta.url)), 'catalog.json');
    cached = JSON.parse(readFileSync(file, 'utf8')) as Catalog;
  }
  return cached;
}

export function getPoder(id: string): PoderInfo | undefined {
  return PODERES.find((p) => p.id === id);
}

const pageNumber = (p: CatalogPage): string => p.number || p.sections[0]?.id || '0';

/**
 * Páginas aplicáveis a um poder (`comum` + pastas do poder), ordenadas pelo número
 * da matriz: páginas pelo primeiro número, seções e itens numericamente.
 * Empates mantêm a ordem das pastas (comum primeiro).
 */
export function pagesForPoder(poder: PoderId, catalog: Catalog = loadCatalog()): CatalogPage[] {
  const info = getPoder(poder);
  if (!info) return [];
  return info.folders
    .flatMap((folder) => catalog.pages.filter((p) => p.folder === folder))
    .map((p) => ({
      ...p,
      sections: [...p.sections]
        .sort((a, b) => compareIds(a.id, b.id))
        .map((s) => ({ ...s, items: [...s.items].sort((a, b) => compareIds(a.id, b.id)) })),
    }))
    .sort((a, b) => compareIds(pageNumber(a), pageNumber(b)));
}
