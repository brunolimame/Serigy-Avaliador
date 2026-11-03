import {
  summarize,
  type EvaluationPlan,
  type EvaluationResult,
  type FetchedPage,
  type HistoricoAno,
  type InvokerCheck,
  type ItemResult,
  type PageResult,
  type StreamEvent,
} from '@serigy/shared';

/** Estado de um item que ainda não tem resultado. */
export type PendingState = 'waiting' | 'running' | 'skipped';

export type LiveStatus = 'running' | 'done' | 'error' | 'cancelled';

/** Estado de uma avaliação em andamento, montado a partir dos eventos do stream. */
export interface Live {
  plan: EvaluationPlan;
  status: LiveStatus;
  items: Record<string, ItemResult>;
  /** Anos do historicoExercicio já analisados (parcial, até o item final chegar com `anos`). */
  anos: Record<string, Array<HistoricoAno | undefined>>;
  /** Itens já concluídos cujas trocas de ano do histórico ainda não terminaram. */
  anosPendentes: string[];
  /** Itens cuja seção está sendo analisada agora. */
  running: string[];
  fetched: FetchedPage[];
  invoker?: InvokerCheck;
}

export function startLive(plan: EvaluationPlan): Live {
  return { plan, status: 'running', items: {}, anos: {}, anosPendentes: [], running: [], fetched: [] };
}

/** Aplica um evento ao estado (função pura). `plan` e `done` são tratados por quem chama. */
export function applyEvent(live: Live, event: StreamEvent): Live {
  switch (event.type) {
    case 'section-start': {
      const section = live.plan.pages.find((p) => p.id === event.pageId)?.sections.find((s) => s.id === event.sectionId);
      const ids = (section?.items ?? []).map((i) => i.id).filter((id) => !live.items[id]);
      return { ...live, running: [...live.running, ...ids] };
    }
    case 'item': {
      // O item final (com `anos`) é o que encerra a análise dos anos; o primeiro envio ainda não os tem.
      const encerraAnos = event.item.anos !== undefined;
      return {
        ...live,
        items: { ...live.items, [event.item.id]: event.item },
        running: live.running.filter((id) => id !== event.item.id),
        anosPendentes: encerraAnos ? live.anosPendentes.filter((id) => id !== event.item.id) : live.anosPendentes,
      };
    }
    case 'anos-iniciados':
      return live.anosPendentes.includes(event.itemId) ? live : { ...live, anosPendentes: [...live.anosPendentes, event.itemId] };
    case 'item-ano': {
      return { ...live, anos: { ...live.anos, [event.itemId]: [...(live.anos[event.itemId] ?? []), event.ano] } };
    }
    case 'fetched':
      return { ...live, fetched: [...live.fetched, event.page] };
    case 'invoker':
      return { ...live, invoker: event.invoker };
    default:
      return live;
  }
}

/** Do ano mais recente para o mais antigo (a ordem de chegada depende da fila). */
const sortAnos = (anos: Array<HistoricoAno | undefined>): HistoricoAno[] =>
  anos.filter((a): a is HistoricoAno => Boolean(a)).sort((a, b) => Number(b.ano) - Number(a.ano));

export interface LiveView {
  /** Resultado parcial: itens pendentes são só marcadores e ficam fora dos resumos. */
  result: EvaluationResult;
  pending: Map<string, PendingState>;
  progress: { done: number; total: number; anosPendentes: string[] };
}

/** Monta um EvaluationResult parcial + o estado de cada item pendente, para o ResultView. */
export function buildView(live: Live): LiveView {
  const { plan } = live;
  const pending = new Map<string, PendingState>();
  const running = new Set(live.running);
  const frozen = live.status !== 'running';

  const pages: PageResult[] = plan.pages.map((p) => {
    const sections = p.sections.map((s) => ({
      id: s.id,
      title: s.title,
      caminhoUrl: s.caminhoUrl,
      notes: s.notes,
      items: s.items.map((i): ItemResult => {
        const done = live.items[i.id];
        if (done) return done.anos || !live.anos[i.id] ? done : { ...done, anos: sortAnos(live.anos[i.id]!) };
        pending.set(i.id, frozen ? 'skipped' : running.has(i.id) ? 'running' : 'waiting');
        // Marcador: não entra em nenhum resumo (ver `finished` abaixo).
        return { ...i, sectionId: s.id, status: 'missing', message: '', expected: '', schema: { esperado: p.schemaUrl, confere: false }, analyzedUrls: [], evidence: [] };
      }),
    }));
    const finished = sections.flatMap((s) => s.items).filter((i) => !pending.has(i.id));
    return {
      id: p.id,
      number: p.number,
      title: p.title,
      folder: p.folder,
      schemaUrl: p.schemaUrl,
      docUrl: p.docUrl,
      schemaFound: true, // só é conhecido no resultado final
      analyzedUrls: [],
      iframes: [],
      summary: summarize(finished),
      sections,
    };
  });

  const finishedAll = Object.values(live.items);
  return {
    result: {
      url: plan.url,
      portalNome: plan.portalNome,
      portalAmbiente: plan.portalAmbiente,
      poder: plan.poder,
      poderLabel: plan.poderLabel,
      startedAt: plan.startedAt,
      finishedAt: plan.startedAt,
      scope: plan.scope,
      invoker: live.invoker ?? { found: false, message: 'Verificando…' },
      crawl: plan.crawl,
      fetched: live.fetched,
      warnings: [],
      summary: summarize(finishedAll),
      pages,
    },
    pending,
    progress: { done: finishedAll.length, total: plan.scope.items, anosPendentes: live.anosPendentes },
  };
}
