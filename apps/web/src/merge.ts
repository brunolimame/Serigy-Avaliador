import { summarize, type EvaluationResult } from '@serigy/shared';

/**
 * Aplica no resultado atual o item reavaliado (`fresh` = resposta de /api/evaluate
 * com `items: [itemId]`), recalculando os resumos da página e o geral.
 */
export function mergeReevaluated(current: EvaluationResult, fresh: EvaluationResult, itemId: string): EvaluationResult {
  const freshPage = fresh.pages.find((p) => p.sections.some((s) => s.items.some((i) => i.id === itemId)));
  const freshItem = freshPage?.sections.flatMap((s) => s.items).find((i) => i.id === itemId);
  if (!freshPage || !freshItem) return current;

  const pages = current.pages.map((page) => {
    if (!page.sections.some((s) => s.items.some((i) => i.id === itemId))) return page;
    const sections = page.sections.map((s) => ({
      ...s,
      items: s.items.map((i) => (i.id === itemId ? freshItem : i)),
    }));
    return {
      ...page,
      sections,
      schemaFound: freshPage.schemaFound,
      analyzedUrls: freshPage.analyzedUrls,
      iframes: freshPage.iframes,
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
