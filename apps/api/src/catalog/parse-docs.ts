import type { CatalogExample, CatalogItem, CatalogPage, CatalogSection } from '@serigy/shared';

/** Apenas para montar o link de referência (docUrl) de cada página; o gerador NÃO acessa a rede. */
const DOC_BASE = 'https://serigy.tce.se.gov.br/2026';
const ITEM_ID = /^\d+(?:\.\d+)+$/;
const LF = String.fromCharCode(10);
const PIPE = String.fromCharCode(0);
const ESCAPED_PIPE = String.fromCharCode(92) + '|'; // `\|` na tabela markdown

export interface ParseResult {
  page: CatalogPage;
  warnings: string[];
}

/** Divide uma linha de tabela markdown respeitando `\|` escapado. */
export function splitRow(line: string): string[] {
  const cells = line
    .split(ESCAPED_PIPE)
    .join(PIPE)
    .split('|')
    .map((c) => c.replaceAll(PIPE, '|').trim());
  // "| a | b |" gera células vazias nas pontas
  if (cells[0] === '') cells.shift();
  if (cells[cells.length - 1] === '') cells.pop();
  return cells;
}

/**
 * Converte uma página de docs/pntp-2026 em CatalogPage.
 * Convenções do markdown (ver docs/avaliador.md):
 *  - `# N. Título`                       -> título da página
 *  - linha de tabela `| x | serigySchema | URL |` -> schema da página
 *  - `## N.M. Título`                    -> seção
 *  - `**Caminho URL:** ...`              -> caminho sugerido da seção
 *  - `**ℹ️ ...`                          -> observação da seção
 *  - linha `| N.M.K | critérios | descrição | atributo | tipo |` -> item
 *  - `## Exemplo(s)` encerra as seções (o restante são exemplos de HTML)
 */
export function parsePage(pageId: string, markdown: string): ParseResult {
  const warnings: string[] = [];
  const folder = pageId.split('/')[0] ?? pageId;
  const page: CatalogPage = {
    id: pageId,
    folder,
    number: '',
    title: pageId,
    schemaUrl: '',
    docUrl: `${DOC_BASE}/${pageId}.html`,
    sections: [],
  };

  let pageNumber = '';
  let current: CatalogSection | null = null;
  let pendingCaminho: string | undefined;
  let inFence = false;
  let closed = false; // após "## Exemplos"
  let lastHeading = '';
  let fence: string[] = [];
  const blocks: CatalogExample[] = [];

  const ensureSection = (): CatalogSection => {
    if (!current) {
      current = { id: pageNumber || '0', title: page.title, caminhoUrl: pendingCaminho, notes: [], items: [] };
      page.sections.push(current);
    }
    return current;
  };

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('```')) {
      if (inFence) blocks.push({ title: lastHeading, html: fence.join(LF).trim() });
      else fence = [];
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      fence.push(raw.trimEnd());
      continue;
    }
    if (!line) continue;

    if (line.startsWith('###')) {
      lastHeading = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/:\s*$/, '').trim();
      continue;
    }

    const h1 = /^#\s+(?:(\d+)\.?\s+)?(.+)$/.exec(line);
    if (h1 && !line.startsWith('##')) {
      pageNumber = h1[1] ?? '';
      page.title = h1[2]!.trim();
      continue;
    }

    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2 && !line.startsWith('###')) {
      const m = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/.exec(h2[1]!);
      if (m) {
        closed = false;
        current = { id: m[1]!, title: m[2]!.trim(), notes: [], items: [] };
        page.sections.push(current);
        pendingCaminho = undefined;
      } else {
        closed = true; // "Exemplos"
        current = null;
      }
      continue;
    }
    if (closed) continue;

    const caminho = /^\*\*Caminho URL:\*\*\s*(.*)$/.exec(line);
    if (caminho) {
      const value = caminho[1]!.trim();
      if (current) (current as CatalogSection).caminhoUrl = value;
      else pendingCaminho = value;
      continue;
    }

    if (line.startsWith('**ℹ️')) {
      ensureSection().notes.push(line.replace(/\*\*/g, '').replace(/^ℹ️\s*/, '').trim());
      continue;
    }

    if (!line.startsWith('|')) continue;
    const cells = splitRow(line);

    if (cells[1] === 'serigySchema') {
      page.schemaUrl = cells[2] ?? '';
      continue;
    }

    if (cells[0] && ITEM_ID.test(cells[0])) {
      if (cells.length < 5) {
        warnings.push(`${pageId}: linha de item incompleta: ${line}`);
        continue;
      }
      const [id, criterios, descricao, atributo, tipo] = cells as [string, string, string, string, string];
      const item: CatalogItem = {
        id,
        criterios: criterios.split(',').map((c) => c.trim()).filter(Boolean),
        descricao,
        atributo,
        tipos: tipo.split('|').map((t) => t.trim()).filter(Boolean),
      };
      ensureSection().items.push(item);
      continue;
    }

    // Linha de tabela com id de item "perdido" (tabela quebrada na documentação)
    if (/\d+\.\d+\.\d+/.test(line) && cells[0] !== 'Item') {
      warnings.push(`${pageId}: linha ignorada que parece conter item: ${line}`);
    }
  }

  // Exemplos da documentação que mencionam o serigyItem de cada item.
  for (const section of page.sections) {
    for (const item of section.items) {
      const needle = [`serigyItem="${item.atributo}"`, `serigyItem='${item.atributo}'`];
      const found = blocks.filter((b) => needle.some((n) => b.html.includes(n))).slice(0, 2);
      if (found.length) item.examples = found;
    }
  }
  page.number = pageNumber || page.sections[0]?.id.split('.')[0] || '';
  if (!page.schemaUrl) warnings.push(`${pageId}: serigySchema não encontrado`);
  const seen = new Set<string>();
  for (const s of page.sections) {
    for (const i of s.items) {
      if (seen.has(i.id)) warnings.push(`${pageId}: item duplicado ${i.id}`);
      seen.add(i.id);
    }
  }
  page.sections = page.sections.filter((s) => s.items.length > 0);
  return { page, warnings };
}
