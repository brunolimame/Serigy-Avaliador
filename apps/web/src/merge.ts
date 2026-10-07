import { summarize, type EvaluationResult, type ItemResult, type PageResult } from '@serigy/shared';

/**
 * Aplica no resultado atual os itens reavaliados (`fresh` = resposta de /api/evaluate com `items: [...]`),
 * recalculando os resumos das páginas afetadas e o geral. `only` limita quais itens do `fresh` são aplicados.
 */
function mergeItems(current: EvaluationResult, fresh: EvaluationResult, only?: Set<string>): EvaluationResult {
  const freshItems = new Map<string, ItemResult>();
  const freshPages = new Map<string, PageResult>(); // página (pasta) -> versão reavaliada
  for (const page of fresh.pages) {
    for (const section of page.sections) {
      for (const item of section.items) {
        if (only && !only.has(item.id)) continue;
        freshItems.set(item.id, item);
        freshPages.set(page.id, page);
      }
    }
  }
  if (freshItems.size === 0) return current;

  const pages = current.pages.map((page) => {
    if (!page.sections.some((s) => s.items.some((i) => freshItems.has(i.id)))) return page;
    const freshPage = freshPages.get(page.id);
    const sections = page.sections.map((s) => ({ ...s, items: s.items.map((i) => freshItems.get(i.id) ?? i) }));
    return {
      ...page,
      sections,
      schemaFound: freshPage?.schemaFound ?? page.schemaFound,
      analyzedUrls: freshPage?.analyzedUrls ?? page.analyzedUrls,
      iframes: freshPage?.iframes ?? page.iframes,
      summary: summarize(sections.flatMap((s) => s.items)),
    };
  });

  return {
    ...current,
    pages,
    invoker: fresh.invoker,
    summary: summarize(pages.flatMap((p) => p.sections.flatMap((s) => s.items))),
  };
}

/** Um item reavaliado. */
export function mergeReevaluated(current: EvaluationResult, fresh: EvaluationResult, itemId: string): EvaluationResult {
  return mergeItems(current, fresh, new Set([itemId]));
}

/** Vários itens reavaliados de uma vez (ex.: todos os itens de um grupo). */
export function mergeReevaluatedMany(current: EvaluationResult, fresh: EvaluationResult): EvaluationResult {
  return mergeItems(current, fresh);
}
