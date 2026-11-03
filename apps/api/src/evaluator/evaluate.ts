import type {
  Catalog,
  CatalogItem,
  CatalogPage,
  CatalogSection,
  EvaluationPlan,
  EvaluationRequest,
  EvaluationResult,
  HistoricoAno,
  InvokerCheck,
  ItemResult,
  PageResult,
  SectionResult,
  SerigyVeredito,
  StreamEvent,
} from '@serigy/shared';
import { DEFAULT_ANOS_HISTORICO, DEFAULT_ESPERA_ANO_SEGUNDOS, DEFAULT_MAX_PAGES, MAX_EVIDENCE, SERIGY_SCHEMA_QUIRKS, summarize, withHistoricoAnos, withSerigyEstimadoAtencao } from '@serigy/shared';
import { getPoder, loadCatalog, pagesForPoder } from '../catalog/load';
import { describeExpected, validateType } from './checks';
import { lowerPath, PageStore, urlKey } from './collector';
import type { PageLoader } from './loader';
import { createLoader, type CreatedLoader } from './loader-factory';
import { canonicalSchema, normalizeSchema, type Delegation, type MarkupElement, type PageMarkup, type YearFilter } from './markup';
import { documentedUrl } from './paths';
import { checkSerigyEmpty, describeSerigyEmpty } from './serigy-empty';

/** Item "Histórico (últimos 3 anos)": atendido quando existe filtro por ano no schema. */
const HISTORICO_ATTR = 'historicoExercicio';

/**
 * Itens de exportação de dados: só se verifica se estão mapeados (serigyItem presente).
 * Nenhuma exportação é executada e nenhum link desses elementos é seguido.
 */
const MAPPING_ONLY = new Set(['salvarRelatorio']);

/** Erro com mensagem apropriada para o usuário (a API responde com `status`). */
export class EvaluationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export interface EvaluateDeps {
  loader?: PageLoader;
  catalog?: Catalog;
  now?: () => Date;
}

export { summarize };

/** Dados coletados, consultados na avaliação de cada item. */
interface Context {
  elements: MarkupElement[];
  delegations: Delegation[];
  yearFilters: YearFilter[];
  markupByKey: Map<string, PageMarkup>;
  /** Páginas que falharam ao baixar: chave da URL -> erro. */
  failed: Map<string, string>;
}

const unique = <T>(list: T[]): T[] => [...new Set(list)];

/** Página da documentação onde a seção deve estar + a seção avaliada. */
interface SectionScope {
  /** URL (efetivamente usada) da página do "Caminho URL" da seção. */
  url: string;
  /** URL esperada pela documentação (caminho da seção sobre a URL informada). */
  expectedUrl: string;
  caminho?: string;
}

/**
 * serigyLink aplicáveis a um item: o atributo vale em QUALQUER tag (iframe, a, div, meta…), esteja o
 * elemento dentro de um serigySchema ou não, e vale também nos destinos encadeados (a página de destino
 * pode ter outros serigyLink).
 *  - elemento com serigyItem  -> só esse item é buscado no destino;
 *  - elemento sem serigyItem  -> o schema inteiro é buscado no destino;
 *  - elemento fora de qualquer serigySchema (`schema` indefinido) -> vale para o schema do item avaliado.
 */
function delegationsFor(ctx: Context, scope: SectionScope, schemaKey: string, atributo: string): Delegation[] {
  // Itens de exportação: o serigyLink do próprio item (link de download) nunca é seguido, mas o do schema
  // inteiro (sem serigyItem) é a página onde o mapeamento deve ser procurado.
  const exportItem = MAPPING_ONLY.has(atributo);
  const applies = (d: Delegation) =>
    (d.schema === undefined || d.schema === schemaKey) && (d.item ? !exportItem && d.item === atributo : true);

  const found: Delegation[] = [];
  const visited = new Set<string>([urlKey(scope.url)]);
  let level = [scope.url];
  while (level.length > 0) {
    const next: string[] = [];
    for (const url of level) {
      for (const d of ctx.delegations) {
        if (urlKey(d.pageUrl) !== urlKey(url) || !applies(d)) continue;
        found.push(d);
        if (!visited.has(urlKey(d.url))) {
          visited.add(urlKey(d.url));
          next.push(d.url);
        }
      }
    }
    level = next;
  }
  return found;
}

/** Avalia um item e anexa os exemplos da documentação (em qualquer situação, inclusive atendido). */
function evaluateItem(
  item: CatalogItem,
  sectionId: string,
  page: CatalogPage,
  scope: SectionScope,
  ctx: Context,
  compat = false,
): ItemResult {
  // Atendido, mas o Serigy não pontuaria: vira "Atenção" (o veredito detalhado fica em `serigy`).
  const result = withSerigyEstimadoAtencao(evaluateCore(item, sectionId, page, scope, ctx, compat));
  if (item.examples?.length) {
    result.examples = item.examples;
  }
  return result;
}

/** Por que o item não atende (ou atende com ressalva) para o veredito Serigy. */
type Cause = 'url' | 'schema' | 'item' | 'tipo' | 'cabecalho' | 'historico-sem-marcacao';

function evaluateCore(
  item: CatalogItem,
  sectionId: string,
  page: CatalogPage,
  scope: SectionScope,
  ctx: Context,
  compat: boolean,
): ItemResult {
  const schemaKey = normalizeSchema(page.schemaUrl);
  const sectionKey = urlKey(scope.url);
  const base = {
    id: item.id,
    sectionId,
    atributo: item.atributo,
    descricao: item.descricao,
    criterios: item.criterios,
    tipos: item.tipos,
    expectedUrl: scope.expectedUrl,
    expected: describeExpected(item, page.schemaUrl),
  };
  const evidence = (list: MarkupElement[]) => list.slice(0, MAX_EVIDENCE).map((e) => ({ pageUrl: e.pageUrl, snippet: e.snippet }));

  // serigyLink: <iframe> ou elemento sem serigyItem -> o schema inteiro é buscado no destino;
  // elemento com serigyItem -> só aquele item é buscado no destino (docs/pntp-2026/definicoes.md).
  const delegs = delegationsFor(ctx, scope, schemaKey, item.atributo);
  const itemLevel = delegs.some((d) => d.item === item.atributo);
  const targets = unique(delegs.map((d) => d.url));
  const targetKeys = new Set(targets.map(urlKey));
  const atTarget = (e: { pageUrl: string }) => targetKeys.has(urlKey(e.pageUrl));
  const loadedVia: NonNullable<ItemResult['loadedVia']> = [];
  for (const d of delegs) {
    if (!loadedVia.some((v) => urlKey(v.url) === urlKey(d.url))) {
      loadedVia.push({ kind: d.tag === 'iframe' ? 'iframe' : 'serigyLink', url: d.url, tag: d.tag });
    }
  }
  // Validação do schema: o endereço completo encontrado no HTML deve corresponder ao esperado pela documentação.
  const expectedSchema = canonicalSchema(page.schemaUrl);
  const schema: ItemResult['schema'] = { esperado: page.schemaUrl, confere: false };
  let schemaMismatch = false;
  // Veredito Serigy: o que levou ao resultado (preenchido nos ramos abaixo) e os achados já finais do item.
  let cause: Cause | undefined;
  let emptyBad = false;
  let finalHits: MarkupElement[] = [];
  const veredito = (out: ItemResult): SerigyVeredito => {
    const fail = (codigo: NonNullable<SerigyVeredito['codigo']>, detalhe?: string): SerigyVeredito => ({ ponto: false, codigo, detalhe });
    let v: SerigyVeredito;
    if (out.status === 'missing') {
      v = fail(cause === 'url' ? 'URL_NOT_ACCESSIBLE' : cause === 'schema' ? 'SCHEMA_NOT_FOUND' : 'SERIGYITEM_NOT_FOUND', out.message);
    } else if (schemaMismatch) {
      v = fail('SCHEMA_NOT_FOUND', `O schema encontrado não confere com o esperado (${schema.encontrado}).`);
    } else if (out.status === 'warning') {
      if (emptyBad || (cause !== 'tipo' && cause !== 'cabecalho')) v = fail('SERIGYITEM_NOT_VALID', out.message);
      else {
        v = {
          ponto: true,
          detalhe:
            cause === 'cabecalho'
              ? 'Só o cabeçalho (<th>) foi encontrado; o validador oficial pontua o item pela presença do serigyItem.'
              : 'O valor não parece do tipo esperado; o validador oficial não reprova por isso.',
        };
      }
    } else {
      v = { ponto: true };
    }
    // historicoExercicio: o validador oficial exige o serigyItem no select e um serigyExecuteWaitSection no filtro.
    if (v.ponto && item.atributo === HISTORICO_ATTR) {
      const withWait = finalHits.some((e) => e.item === HISTORICO_ATTR && e.waitSection);
      if (cause === 'historico-sem-marcacao') {
        v = fail('WAITSECTION_NOT_FOUND', 'Só há um select de anos, sem serigyItem="historicoExercicio" nem serigyExecuteWaitSection no filtro.');
      } else if (!withWait) {
        v = fail('WAITSECTION_NOT_FOUND', 'Nenhum serigyExecuteWaitSection (botão de pesquisa do filtro) ligado ao historicoExercicio.');
      } else if (!finalHits.some((e) => e.waitLoadPresent)) {
        v = { ponto: true, detalhe: 'O serigyExecuteWaitSection não tem serigyLoadSection correspondente no HTML carregado (pode surgir após o clique).' };
      }
    }
    // Desvios conhecidos do validador oficial em relação à documentação.
    const quirk = SERIGY_SCHEMA_QUIRKS.find((q) => canonicalSchema(q.documentado) === expectedSchema);
    if (quirk) {
      const nota = `O validador oficial procura o schema "${quirk.serigyEspera}", diferente do publicado na documentação ("${quirk.documentado}").`;
      if (compat && v.ponto) v = fail('SCHEMA_NOT_FOUND', nota);
      else v = { ...v, detalhe: v.detalhe ? `${v.detalhe} ${nota}` : nota };
    }
    return v;
  };
  const done = (r: Omit<ItemResult, 'loadedVia' | 'schema'>): ItemResult => {
    let out: ItemResult = { ...r, schema, ...(loadedVia.length ? { loadedVia } : {}) };
    // Schema incorreto: a informação do schema vem primeiro; a avaliação do item (inclusive serigyEmpty) segue depois.
    if (schemaMismatch && out.status !== 'missing') {
      out = {
        ...out,
        status: out.status === 'ok' || out.status === 'empty' ? 'warning' : out.status,
        message: `Item encontrado, mas o schema não confere: encontrado "${schema.encontrado}"; esperado "${page.schemaUrl}". ${out.message}`,
      };
    }
    return { ...out, serigy: veredito(out) };
  };

  // A página do caminho da documentação não pôde ser baixada.
  const failure = ctx.failed.get(sectionKey);
  if (failure) {
    cause = 'url';
    return done({
      ...base,
      status: 'missing',
      message: `A página ${scope.url}${scope.caminho ? ` (caminho "${scope.caminho}" da documentação)` : ''} não pôde ser acessada: ${failure}`,
      analyzedUrls: [scope.url],
      evidence: [],
    });
  }

  const inSection = (e: { pageUrl: string }) => urlKey(e.pageUrl) === sectionKey;
  const sameAttr = ctx.elements.filter((e) => e.item === item.atributo && (inSection(e) || atTarget(e)));
  const inSchema = sameAttr.filter((e) => e.schema === schemaKey);
  const targetHits = inSchema.filter(atTarget);
  // O próprio elemento que delega (item + serigyLink) não é a evidência do item.
  const direct = inSchema.filter((e) => !atTarget(e) && !(itemLevel && e.link));
  let hits = targetHits.length > 0 ? targetHits : direct;

  // Mesmo caminho de schema não basta: o endereço completo (protocolo e host) também precisa conferir.
  if (hits.length > 0) {
    const exact = hits.filter((e) => canonicalSchema(e.schemaRaw ?? '') === expectedSchema);
    schemaMismatch = exact.length === 0;
    schema.encontrado = unique((schemaMismatch ? hits : exact).map((e) => e.schemaRaw ?? '')).join(', ');
    schema.confere = !schemaMismatch;
    if (!schemaMismatch) hits = exact;
  }

  if (hits.length === 0) {
    // Filtro por ano presente => histórico atendido.
    if (item.atributo === HISTORICO_ATTR) {
      const filters = ctx.yearFilters.filter(
        (f) => f.schema === schemaKey && (inSection(f) || atTarget(f)) && (targets.length === 0 || atTarget(f)),
      );
      if (filters.length > 0) {
        schema.confere = true; // o filtro está dentro do schema esperado
        cause = 'historico-sem-marcacao';
        return done({
          ...base,
          status: 'ok',
          message: `Filtro por ano encontrado (${unique(filters.flatMap((f) => f.years)).join(', ')}); histórico considerado atendido`,
          analyzedUrls: unique(filters.map((f) => f.pageUrl)),
          evidence: [],
        });
      }
    }

    if (targets.length > 0) {
      const failedTargets = targets.map((t) => ctx.failed.get(urlKey(t))).filter(Boolean);
      cause = failedTargets.length ? 'url' : itemLevel ? 'item' : 'schema';
      const via = delegs.some((d) => d.tag === 'iframe') ? 'O iframe' : 'O serigyLink';
      const reason = failedTargets.length
        ? `o endereço não pôde ser acessado (${failedTargets[0]})`
        : `${itemLevel ? `serigyItem="${item.atributo}"` : `o schema ${page.schemaUrl}`} não foi encontrado nesse endereço`;
      return done({
        ...base,
        status: 'missing',
        message: `${via} aponta para ${targets.join(', ')}, mas ${reason}`,
        analyzedUrls: targets,
        evidence: evidence(sameAttr),
      });
    }

    const sectionMarkup = ctx.markupByKey.get(sectionKey);
    let message: string;
    // O item existe, mas sob outro schema (ou fora de qualquer schema): informa o encontrado x esperado.
    const elsewhere = sameAttr.filter((e) => e.schema !== schemaKey);
    cause = elsewhere.length > 0 || !sectionMarkup?.schemas.has(schemaKey) ? 'schema' : 'item';
    if (elsewhere.length > 0) {
      const others = unique(elsewhere.map((e) => e.schemaRaw ?? '(fora de um serigySchema)')).join(', ');
      schema.encontrado = others;
      message = `serigyItem="${item.atributo}" encontrado, mas sob outro schema: ${others} (esperado: ${page.schemaUrl})`;
    } else if (!sectionMarkup?.schemas.has(schemaKey)) {
      message = `serigySchema="${page.schemaUrl}" não encontrado em ${scope.url}`;
    } else {
      const caseMismatch = ctx.elements.find((e) => inSection(e) && e.item?.toLowerCase() === item.atributo.toLowerCase());
      message = caseMismatch
        ? `serigyItem="${caseMismatch.item}" difere em maiúsculas/minúsculas do esperado "${item.atributo}"`
        : `serigyItem="${item.atributo}" não encontrado sob o schema em ${scope.url}`;
      if (sectionMarkup.pendingWaits.length > 0) {
        message += ' (há conteúdo via serigyExecuteWaitSection que o avaliador estático não renderiza)';
      }
    }
    return done({ ...base, status: 'missing', message, analyzedUrls: [scope.url], evidence: evidence(sameAttr) });
  }

  // <th> com serigyItem é o CABEÇALHO do item (o primeiro da lista); os valores a validar são os <td>.
  // Só há cabeçalho (sem <td>): não há valor a validar e o item não atende.
  const values = hits.filter((e) => e.tag !== 'th');
  const headerOnly = values.length === 0;
  if (!headerOnly) hits = values;
  finalHits = hits;

  const analyzedUrls = unique(hits.map((e) => e.pageUrl));
  const filled = hits.filter((e) => e.empty === undefined);

  // serigyEmpty é avaliado SEMPRE que declarado, mesmo havendo outras ocorrências com conteúdo.
  const checks = hits.filter((e) => e.empty !== undefined).map((e) => checkSerigyEmpty(e, ctx.elements));
  const emptyText = describeSerigyEmpty(checks);
  const emptyProblem = checks.some((c) => !c.valido);

  /**
   * Junta o resultado do conteúdo com o do serigyEmpty:
   *  - motivo em branco/inválido/repetido -> NÃO atende (Atenção), qualquer que seja o conteúdo;
   *  - motivo válido e sem conteúdo       -> "serigyEmpty declarado" (atende parcialmente);
   *  - motivo válido e com conteúdo       -> segue o resultado do conteúdo, com a informação do motivo.
   */
  const finish = (r: Omit<ItemResult, 'loadedVia' | 'schema'>): ItemResult => {
    if (checks.length === 0) return done(r);
    const content = r.message;
    let { status } = r;
    let message = content ? `${content}; ${emptyText}` : emptyText;
    emptyBad = emptyProblem;
    if (emptyProblem) status = 'warning';
    else if (filled.length === 0) {
      status = 'empty';
      message = `${emptyText} (atende parcialmente)`;
    }
    return done({ ...r, status, message, serigyEmpty: checks });
  };

  if (filled.length === 0) {
    return finish({ ...base, status: 'empty', message: '', analyzedUrls, evidence: evidence(hits) });
  }

  // Exportação de dados: basta estar mapeado; nada é baixado ou executado.
  if (MAPPING_ONLY.has(item.atributo)) {
    const formats = unique(filled.map((e) => e.value?.trim()).filter((v): v is string => Boolean(v)));
    return finish({
      ...base,
      status: 'ok',
      message: `Mapeado (${filled.length} ocorrência(s)); a exportação não é executada${formats.length ? ` — formatos: ${formats.join(', ')}` : ''}`,
      analyzedUrls,
      evidence: evidence(filled),
    });
  }

  if (headerOnly) {
    cause = 'cabecalho';
    return finish({
      ...base,
      status: 'warning',
      message: `Encontrado apenas o cabeçalho (<th>, ${filled.length} ocorrência(s)); nenhum valor (<td>) para validar`,
      analyzedUrls,
      evidence: evidence(filled),
    });
  }

  const problems = filled.map((e) => validateType(item.tipos, e));
  if (problems.some((p) => p === null)) {
    return finish({ ...base, status: 'ok', message: `Encontrado (${filled.length} ocorrência(s))`, analyzedUrls, evidence: evidence(filled) });
  }
  cause = 'tipo';
  return finish({ ...base, status: 'warning', message: problems[0] ?? 'valor inválido', analyzedUrls, evidence: evidence(filled) });
}

function checkInvoker(start: PageMarkup | undefined): InvokerCheck {
  const el = start?.elements.find((e) => e.item === 'invoker');
  const value = el?.value?.trim();
  if (el && value) return { found: true, value, message: 'Hash do Invoker presente na página principal' };
  if (el) return { found: false, message: 'serigyItem="invoker" encontrado, mas sem serigyValue (hash)' };
  return { found: false, message: 'Meta tag do Invoker (serigyItem="invoker") não encontrada na página principal' };
}

/** Quantas seções são analisadas ao mesmo tempo. */
const SECTION_CONCURRENCY = 3;

/** Quantos anos do historicoExercicio são analisados ao mesmo tempo (cada um abre uma página no navegador). */
const ANO_CONCURRENCY = 3;

/** Limita quantas tarefas assíncronas rodam juntas; as demais esperam na fila, na ordem em que chegaram. */
class Limiter {
  private active = 0;
  private readonly waiting: Array<() => void> = [];
  constructor(private readonly size: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.size) await new Promise<void>((resolve) => this.waiting.push(resolve));
    else this.active += 1;
    try {
      return await task();
    } finally {
      const next = this.waiting.shift();
      if (next) next(); // a vaga passa direto para a próxima tarefa
      else this.active -= 1;
    }
  }
}

async function pool<T>(tasks: T[], size: number, worker: (task: T) => Promise<void>): Promise<void> {
  let next = 0;
  const lanes = Array.from({ length: Math.min(size, tasks.length) }, async () => {
    while (next < tasks.length) await worker(tasks[next++]!);
  });
  await Promise.all(lanes);
}

export interface PreparedEvaluation {
  /** Tudo o que será avaliado (todos os itens ainda "aguardando"). */
  plan: EvaluationPlan;
  /**
   * Executa a avaliação seção a seção, emitindo eventos conforme avança, e devolve o resultado final.
   * Se `signal` for abortado, para de iniciar novas seções e rejeita com status 499.
   */
  run(emit?: (event: StreamEvent) => void, signal?: AbortSignal): Promise<EvaluationResult>;
}

/**
 * Valida a requisição e monta o plano. Lança EvaluationError (400) de forma SÍNCRONA, antes de
 * qualquer acesso à rede — por isso a rota de streaming ainda pode responder com erro HTTP normal.
 */
export function prepareEvaluation(req: EvaluationRequest, deps: EvaluateDeps = {}): PreparedEvaluation {
  const catalog = deps.catalog ?? loadCatalog();
  const renderer = req.renderer ?? 'browser';
  const now = deps.now ?? (() => new Date());
  const startedAt = now().toISOString();

  const poder = getPoder(req.poder);
  if (!poder) throw new EvaluationError(`Poder desconhecido: ${req.poder}`);

  let url: URL;
  try {
    url = new URL(req.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocolo');
  } catch {
    throw new EvaluationError('URL inválida: informe um endereço http(s):// completo');
  }
  url.hash = '';

  // --- escopo (pagesForPoder já devolve páginas, seções e itens em ordem numérica) ---
  const available = pagesForPoder(req.poder, catalog);
  const pageFilter = new Set(req.pages ?? []);
  const itemFilter = new Set(req.items ?? []);
  for (const id of pageFilter) {
    if (!available.some((p) => p.id === id)) throw new EvaluationError(`Página "${id}" não se aplica ao poder ${poder.label}`);
  }
  const allItemIds = new Set(available.flatMap((p) => p.sections.flatMap((s) => s.items.map((i) => i.id))));
  for (const id of itemFilter) {
    if (!allItemIds.has(id)) throw new EvaluationError(`Item "${id}" não se aplica ao poder ${poder.label}`);
  }

  const selected = available
    .filter((p) => pageFilter.size === 0 || pageFilter.has(p.id))
    .map((p) => ({
      page: p,
      sections: p.sections
        .map((s) => ({ section: s, items: s.items.filter((i) => itemFilter.size === 0 || itemFilter.has(i.id)) }))
        .filter((s) => s.items.length > 0),
    }))
    .filter((p) => p.sections.length > 0);
  if (selected.length === 0) throw new EvaluationError('Nenhum item selecionado para avaliação');

  const portal = url.href;
  const maxPages = Math.min(req.maxPages ?? DEFAULT_MAX_PAGES, 200);
  const tryDocumentedCase = req.tryDocumentedCase ?? false;
  const compat = req.compatibilidadeSerigy ?? true;
  const anosHistorico = Math.min(10, Math.max(1, Math.trunc(req.anosHistorico ?? DEFAULT_ANOS_HISTORICO)));
  // O ano atual e os `anosHistorico` anteriores (3 em 2026: 2026, 2025, 2024 e 2023).
  const esperaAnoMs = Math.min(120, Math.max(5, Math.trunc(req.esperaAnoSegundos ?? DEFAULT_ESPERA_ANO_SEGUNDOS))) * 1000;
  const anoAtual = now().getFullYear();
  const anosAnalisados = Array.from({ length: anosHistorico + 1 }, (_, i) => String(anoAtual - i));
  const docUrl = (s: CatalogSection) => documentedUrl(portal, s.caminhoUrl);
  const itemCount = selected.reduce((n, p) => n + p.sections.reduce((m, s) => m + s.items.length, 0), 0);
  const totalCatalogItems = available.reduce((n, p) => n + p.sections.reduce((m, s) => m + s.items.length, 0), 0);

  const plan: EvaluationPlan = {
    url: portal,
    portalNome: req.portalNome,
    portalAmbiente: req.portalAmbiente,
    poder: req.poder,
    poderLabel: poder.label,
    startedAt,
    scope: { mode: itemCount === totalCatalogItems ? 'todos' : 'parcial', pages: selected.length, items: itemCount },
    crawl: { maxPages, tryDocumentedCase, renderer, anosHistorico },
    pages: selected.map(({ page, sections }) => ({
      id: page.id,
      number: page.number,
      title: page.title,
      folder: page.folder,
      schemaUrl: page.schemaUrl,
      docUrl: page.docUrl,
      sections: sections.map(({ section, items }) => ({
        id: section.id,
        title: section.title,
        caminhoUrl: section.caminhoUrl,
        notes: section.notes,
        url: docUrl(section),
        items: items.map((i) => ({ id: i.id, atributo: i.atributo, descricao: i.descricao, criterios: i.criterios, tipos: i.tipos })),
      })),
    })),
  };

  // schema -> atributos avaliados: só os serigyLink desses schemas/itens são seguidos
  const wanted = new Map<string, Set<string>>();
  for (const { page, sections } of selected) {
    const key = normalizeSchema(page.schemaUrl);
    const set = wanted.get(key) ?? new Set<string>();
    for (const s of sections) for (const i of s.items) set.add(i.atributo);
    wanted.set(key, set);
  }
  // Segue o serigyLink de QUALQUER tag. Fora de um serigySchema (schema indefinido) vale para os schemas avaliados.
  const shouldFollow = (d: Delegation): boolean => {
    if (d.item && MAPPING_ONLY.has(d.item)) return false;
    if (d.schema === undefined) return !d.item || [...wanted.values()].some((attrs) => attrs.has(d.item!));
    return wanted.has(d.schema) && (!d.item || wanted.get(d.schema)!.has(d.item));
  };

  async function run(emit: (event: StreamEvent) => void = () => {}, signal?: AbortSignal): Promise<EvaluationResult> {
    // Carregador injetado (testes) ou criado aqui: navegador real por padrão, com queda para HTTP simples.
    const created: CreatedLoader = deps.loader ? { loader: deps.loader, renderer } : await createLoader(renderer);
    try {
      return await runWith(created, emit, signal);
    } finally {
      await created.loader.close?.();
    }
  }

  async function runWith(created: CreatedLoader, emit: (event: StreamEvent) => void, signal?: AbortSignal): Promise<EvaluationResult> {
    const store = new PageStore(created.loader, maxPages, tryDocumentedCase, (page) => emit({ type: 'fetched', page }));

    // 1. Página inicial (Invoker). Se falhar não há o que avaliar.
    await store.get(portal, 'inicial', false);
    const portalUsed = store.resolved.get(urlKey(portal)) ?? portal;
    const portalError = store.failed.get(urlKey(portalUsed));
    if (portalError) throw new EvaluationError(`Não foi possível acessar ${portal}: ${portalError}`, 502);
    const invoker = checkInvoker(store.markupByKey.get(urlKey(portalUsed)));
    emit({ type: 'invoker', invoker });

    // 2. Seção a seção: baixa a página do caminho, segue serigyLink necessários e avalia os itens.
    const done = new Map<string, ItemResult>();
    const anoLimiter = new Limiter(ANO_CONCURRENCY);
    // Anos já pedidos nesta avaliação, por página + filtro + ano: os itens que caem na mesma página compartilham o resultado.
    const anoCache = new Map<string, Promise<HistoricoAno | undefined>>();
    const anoJobs: Array<Promise<void>> = [];
    let anosIgnorados = false;

    // historicoExercicio: cada ano vira uma subanálise em fila; o item já foi enviado e é reenviado, com `anos`, ao fim.
    const analisarAnos = (item: CatalogItem, result: ItemResult, pageId: string, sectionId: string) => {
      if (item.atributo !== HISTORICO_ATTR || result.status === 'missing') return;
      const el = store.elements.find(
        (e) => e.item === HISTORICO_ATTR && e.waitSection && result.analyzedUrls.some((u) => urlKey(u) === urlKey(e.pageUrl)),
      );
      if (!el?.waitSection) return;
      const { loader } = created;
      if (!loader.analisarAno) {
        anosIgnorados = true;
        return;
      }
      const analisar = loader.analisarAno.bind(loader);
      const waitSection = el.waitSection;
      const resultados: HistoricoAno[] = [];
      const tarefas = anosAnalisados.map(async (ano, i) => {
        // Mesma página, mesmo filtro e mesmo ano já analisados por outro item: reaproveita a troca em vez de repeti-la.
        const chave = `${urlKey(el.pageUrl)}|${waitSection}|${ano}`;
        let trabalho = anoCache.get(chave);
        if (!trabalho) {
          trabalho = anoLimiter.run(async (): Promise<HistoricoAno | undefined> => {
            if (signal?.aborted) return undefined;
            try {
              return await analisar({ url: el.pageUrl, ano, waitSection, timeoutMs: esperaAnoMs });
            } catch (err) {
              return { ano, passou: false, codigo: 'ERROR_ON_SET_OPTION', detalhe: `Erro ao selecionar ${ano} em ${el.pageUrl}: ${err instanceof Error ? err.message : String(err)}` };
            }
          });
          anoCache.set(chave, trabalho);
        }
        const r = await trabalho;
        if (!r) return;
        resultados[i] = r;
        emit({ type: 'item-ano', itemId: item.id, ano: r, total: anosAnalisados.length });
      });
      anoJobs.push(
        Promise.all(tarefas).then(() => {
          if (signal?.aborted) return;
          const final = withHistoricoAnos(result, resultados);
          done.set(item.id, final);
          emit({ type: 'item', pageId, sectionId, item: final });
        }),
      );
    };
    const tasks = selected.flatMap(({ page, sections }) => sections.map(({ section, items }) => ({ page, section, items })));
    await pool(tasks, SECTION_CONCURRENCY, async ({ page, section, items }) => {
      if (signal?.aborted) return;
      emit({ type: 'section-start', pageId: page.id, sectionId: section.id });

      const requested = docUrl(section);
      await store.get(requested, 'documentacao', true);
      const used = store.resolved.get(urlKey(requested)) ?? requested;
      await store.followDelegations(used, shouldFollow);

      // URL esperada em minúsculas por padrão; a grafia da documentação só com `tryDocumentedCase`
      const expectedUrl = tryDocumentedCase ? requested : lowerPath(requested);
      const scope: SectionScope = { url: used, expectedUrl, caminho: section.caminhoUrl };
      for (const item of items) {
        const result = evaluateItem(item, section.id, page, scope, store, compat);
        done.set(item.id, result);
        emit({ type: 'item', pageId: page.id, sectionId: section.id, item: result });
        analisarAnos(item, result, page.id, section.id);
      }
    });
    await Promise.all(anoJobs);
    if (signal?.aborted) throw new EvaluationError('Avaliação cancelada', 499);

    // 3. Avisos e resultado final, na ordem do plano.
    const warnings: string[] = [];
    if (created.warning) warnings.push(created.warning);
    for (const f of store.fetched) if (f.error) warnings.push(`Falha ao baixar ${f.url}: ${f.error}`);
    for (const m of store.markups) {
      for (const f of m.iframesWithoutLink) {
        warnings.push(`<iframe serigySchema> sem serigyLink em ${f.pageUrl}${f.src ? ` (src=${f.src})` : ''}: o conteúdo do iframe não é avaliado.`);
      }
    }
    if (store.markups.some((m) => m.pendingWaits.length > 0)) {
      warnings.push(
        created.renderer === 'browser'
          ? 'Algumas seções de serigyExecuteWaitSection não apareceram após o clique (tempo esgotado ou clique sem efeito); os itens dependentes podem aparecer como "missing".'
          : 'Algumas páginas usam serigyExecuteWaitSection (conteúdo carregado após clique). O download simples do HTML não executa JavaScript; ' +
              'itens exibidos só após a interação podem aparecer como "missing". Use o navegador (renderer "browser").',
      );
    }
    if (anosIgnorados) {
      warnings.push('A análise dos anos do histórico (historicoExercicio) exige o navegador (renderer "browser"); foi ignorada.');
    }
    if (store.elements.length === 0) warnings.push('Nenhum elemento com serigyItem foi encontrado nas páginas analisadas.');

    const pages: PageResult[] = plan.pages.map((planPage) => {
      const schemaKey = normalizeSchema(planPage.schemaUrl);
      const analyzed: string[] = [];
      const iframes: PageResult['iframes'] = [];

      const sections: SectionResult[] = planPage.sections.map((planSection) => {
        const sectionUrl = store.resolved.get(urlKey(planSection.url)) ?? planSection.url;
        if (store.markupByKey.get(urlKey(sectionUrl))?.schemas.has(schemaKey)) analyzed.push(sectionUrl);
        for (const d of store.delegations.filter((x) => urlKey(x.pageUrl) === urlKey(sectionUrl) && (x.schema === undefined || x.schema === schemaKey))) {
          if (store.markupByKey.get(urlKey(d.url))?.schemas.has(schemaKey)) analyzed.push(d.url);
          if (d.tag === 'iframe') iframes.push({ pageUrl: d.pageUrl, target: d.url });
        }
        return {
          id: planSection.id,
          title: planSection.title,
          caminhoUrl: planSection.caminhoUrl,
          notes: planSection.notes,
          items: planSection.items.map((i) => done.get(i.id)!),
        };
      });

      return {
        id: planPage.id,
        number: planPage.number,
        title: planPage.title,
        folder: planPage.folder,
        schemaUrl: planPage.schemaUrl,
        docUrl: planPage.docUrl,
        schemaFound: analyzed.length > 0,
        analyzedUrls: unique(analyzed),
        iframes: [...new Map(iframes.map((f) => [`${f.pageUrl}|${f.target}`, f])).values()],
        summary: summarize(sections.flatMap((s) => s.items)),
        sections,
      };
    });

    const result: EvaluationResult = {
      url: plan.url,
      portalNome: plan.portalNome,
      portalAmbiente: plan.portalAmbiente,
      poder: plan.poder,
      poderLabel: plan.poderLabel,
      startedAt,
      finishedAt: now().toISOString(),
      scope: plan.scope,
      invoker,
      crawl: { ...plan.crawl, renderer: created.renderer },
      fetched: store.fetched,
      warnings,
      summary: summarize(pages.flatMap((p) => p.sections.flatMap((s) => s.items))),
      pages,
    };
    emit({ type: 'done', result });
    return result;
  }

  return { plan, run };
}

/** Avaliação completa sem eventos (usada por POST /api/evaluate e pelos testes). */
export async function evaluate(req: EvaluationRequest, deps: EvaluateDeps = {}): Promise<EvaluationResult> {
  return prepareEvaluation(req, deps).run();
}
