/**
 * Tipos e constantes compartilhados entre a API e a UI.
 * Mantenha este arquivo livre de dependências de runtime (só tipos + dados puros).
 */

// ---------------------------------------------------------------------------
// Poderes / esferas
// ---------------------------------------------------------------------------

export type PoderId =
  | 'executivo'
  | 'legislativo'
  | 'judiciario'
  | 'ministerio-publico'
  | 'defensoria-publica'
  | 'tribunal-contas'
  | 'consorcios-publicos'
  | 'estatais'
  | 'estatais-independentes';

export interface PoderInfo {
  id: PoderId;
  label: string;
  /** Pastas de docs/pntp-2026 avaliadas para o poder. `comum` vale para todos. */
  folders: string[];
}

/** Pasta de requisitos que vale para qualquer poder. */
export const COMUM_FOLDER = 'comum';

/**
 * Mapeamento poder -> pastas de requisitos. Para suportar um novo poder basta
 * adicionar uma entrada aqui (e a pasta correspondente em docs/pntp-2026).
 */
export const PODERES: PoderInfo[] = [
  { id: 'executivo', label: 'Executivo', folders: [COMUM_FOLDER, 'executivo'] },
  { id: 'legislativo', label: 'Legislativo', folders: [COMUM_FOLDER, 'legislativo'] },
  { id: 'judiciario', label: 'Judiciário', folders: [COMUM_FOLDER, 'judiciario'] },
  { id: 'ministerio-publico', label: 'Ministério Público', folders: [COMUM_FOLDER, 'ministerio-publico'] },
  { id: 'defensoria-publica', label: 'Defensoria Pública', folders: [COMUM_FOLDER, 'defensoria-publica'] },
  { id: 'tribunal-contas', label: 'Tribunal de Contas', folders: [COMUM_FOLDER, 'tribunal-contas'] },
  { id: 'consorcios-publicos', label: 'Consórcios Públicos', folders: [COMUM_FOLDER, 'consorcios-publicos'] },
  { id: 'estatais', label: 'Estatais', folders: [COMUM_FOLDER, 'estatais'] },
  { id: 'estatais-independentes', label: 'Estatais Independentes', folders: [COMUM_FOLDER, 'estatais-independentes'] },
];

/**
 * Compara números de item/seção/página de forma numérica por segmento
 * ("4.1.2" vem antes de "4.1.10"). Use em .sort() para seguir a ordem da matriz.
 */
export function compareIds(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? -1) - (pb[i] ?? -1);
    if (d !== 0) return d;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Catálogo (gerado a partir de docs/pntp-2026/**/*.md)
// ---------------------------------------------------------------------------

/** Trecho de HTML de exemplo extraído da documentação oficial. */
export interface CatalogExample {
  title: string;
  html: string;
}

export interface CatalogItem {
  /** Ex.: "4.1.11" */
  id: string;
  criterios: string[];
  descricao: string;
  /** Valor esperado em `serigyItem`. Ex.: "credorEmpenho" */
  atributo: string;
  /** Tipo(s) de valor aceitos. Ex.: ["Texto", "Numérico"] */
  tipos: string[];
  /** Exemplos de HTML da documentação que usam este serigyItem (até 2). */
  examples?: CatalogExample[];
}

export interface CatalogSection {
  /** Ex.: "4.1" */
  id: string;
  title: string;
  /** Caminho sugerido no portal. Ex.: "[Portal da Transparencia]/Despesas" */
  caminhoUrl?: string;
  /** Observações da documentação (ex.: "não se aplica às Estatais"). */
  notes: string[];
  items: CatalogItem[];
}

export interface CatalogPage {
  /** "<pasta>/<arquivo>", ex.: "comum/despesas" */
  id: string;
  folder: string;
  /** Número da página na matriz (ex.: "14" para Ouvidoria). */
  number: string;
  title: string;
  /** Valor esperado em `serigySchema`. */
  schemaUrl: string;
  /** Link da documentação oficial. */
  docUrl: string;
  sections: CatalogSection[];
}

export interface Catalog {
  generatedAt: string;
  source: string;
  pages: CatalogPage[];
}

// ---------------------------------------------------------------------------
// Avaliação
// ---------------------------------------------------------------------------

export interface EvaluationRequest {
  /** URL da página principal do portal da transparência. */
  url: string;
  poder: PoderId;
  /** Restringe a avaliação a estas páginas do catálogo (ids). Vazio/ausente = todas. */
  pages?: string[];
  /** Restringe a avaliação a estes itens (ids, ex.: "4.1.11"). Vazio/ausente = todos. */
  items?: string[];
  /** Máximo de páginas HTML baixadas na avaliação (padrão 40). */
  maxPages?: number;
  /**
   * Os caminhos da documentação (ex.: `/Despesas`) são testados SEMPRE em minúsculas. Se `true`, quando a
   * minúscula falhar (404 ou outro erro) a grafia da documentação, com maiúsculas, também é testada.
   * Padrão: `false`.
   */
  tryDocumentedCase?: boolean;
}

/**
 * ok       – item encontrado sob o schema correto e com valor coerente
 * warning  – encontrado, mas o valor não parece do tipo esperado
 * empty    – declarado como vazio de forma intencional (`serigyEmpty`)
 * missing  – item (ou o schema da página) não encontrado
 */
export type ItemStatus = 'ok' | 'warning' | 'empty' | 'missing';

export interface ItemResult {
  id: string;
  sectionId: string;
  atributo: string;
  descricao: string;
  criterios: string[];
  tipos: string[];
  status: ItemStatus;
  message: string;
  /** Marcação esperada, em texto (schema, serigyItem e tipo de valor). */
  expected: string;
  /** Exemplos da documentação; só preenchido quando o item não foi atendido. */
  examples?: CatalogExample[];
  /**
   * URL(s) efetivamente analisada(s) para o item: onde foi encontrado; ou, se não foi,
   * o destino do serigyLink / as páginas onde o schema existe / a URL inicial.
   */
  analyzedUrls: string[];
  /** Presente quando o item depende de serigyLink: o tipo do elemento (iframe ou outro) e a URL avaliada. */
  loadedVia?: Array<{ kind: 'iframe' | 'serigyLink'; url: string }>;
  /** Até 3 trechos de HTML que comprovam o achado. */
  evidence: Array<{ pageUrl: string; snippet: string }>;
}

export interface Summary {
  total: number;
  ok: number;
  warning: number;
  empty: number;
  missing: number;
  /** (ok + empty) / total, de 0 a 100. */
  score: number;
}

export interface SectionResult {
  id: string;
  title: string;
  caminhoUrl?: string;
  notes: string[];
  items: ItemResult[];
}

export interface PageResult {
  id: string;
  /** Número da página na matriz. */
  number: string;
  title: string;
  folder: string;
  schemaUrl: string;
  docUrl: string;
  /** Algum elemento com este schema foi encontrado em alguma página rastreada? */
  schemaFound: boolean;
  /** Páginas analisadas onde o schema foi declarado. */
  analyzedUrls: string[];
  /** Iframes com serigyLink usados por esta página: onde estão e a URL do serigyLink avaliada. */
  iframes: Array<{ pageUrl: string; target: string }>;
  summary: Summary;
  sections: SectionResult[];
}

/**
 * Por que a página foi baixada:
 *  inicial     – URL informada (raiz do portal)
 *  documentacao – "Caminho URL" da documentação, resolvido a partir da URL informada
 *  iframe      – destino do serigyLink de um <iframe>
 *  serigyLink  – destino do serigyLink de outro elemento
 */
export type FetchOrigin = 'inicial' | 'documentacao' | 'iframe' | 'serigyLink';

export interface FetchedPage {
  url: string;
  origin: FetchOrigin;
  status: number | null;
  error?: string;
  /** Elementos com atributos serigy* encontrados nesta página. */
  serigyElements: number;
}

export interface InvokerCheck {
  found: boolean;
  /** Hash encontrado em `<meta serigyItem="invoker" serigyValue="...">`. */
  value?: string;
  message: string;
}

export interface EvaluationResult {
  url: string;
  poder: PoderId;
  poderLabel: string;
  startedAt: string;
  finishedAt: string;
  /** Escopo efetivo da avaliação. */
  scope: { mode: 'todos' | 'parcial'; pages: number; items: number };
  invoker: InvokerCheck;
  fetched: FetchedPage[];
  /** Avisos gerais (ex.: conteúdo dinâmico não renderizado). */
  warnings: string[];
  /** Parâmetros de rastreio usados (reaproveitados ao reavaliar um item). */
  crawl: { maxPages: number; tryDocumentedCase: boolean };
  summary: Summary;
  pages: PageResult[];
}

export interface CatalogResponse {
  poder: PoderInfo;
  pages: CatalogPage[];
}

/** Resume uma lista de itens. `score` = (ok + empty) / total, de 0 a 100. */
export function summarize(items: Array<{ status: ItemStatus }>): Summary {
  const count = { ok: 0, warning: 0, empty: 0, missing: 0 };
  for (const i of items) count[i.status] += 1;
  const total = items.length;
  const score = total === 0 ? 0 : Math.round(((count.ok + count.empty) / total) * 1000) / 10;
  return { total, ...count, score };
}

// ---------------------------------------------------------------------------
// Avaliação em streaming (NDJSON em POST /api/evaluate/stream)
// ---------------------------------------------------------------------------

export interface PlanItem {
  id: string;
  atributo: string;
  descricao: string;
  criterios: string[];
  tipos: string[];
}

export interface PlanSection {
  id: string;
  title: string;
  caminhoUrl?: string;
  notes: string[];
  /** URL do caminho da documentação, resolvida a partir da URL do portal. */
  url: string;
  items: PlanItem[];
}

export interface PlanPage {
  id: string;
  number: string;
  title: string;
  folder: string;
  schemaUrl: string;
  docUrl: string;
  sections: PlanSection[];
}

/** Tudo o que será avaliado, enviado antes de qualquer análise (itens "aguardando"). */
export interface EvaluationPlan {
  url: string;
  poder: PoderId;
  poderLabel: string;
  startedAt: string;
  scope: { mode: 'todos' | 'parcial'; pages: number; items: number };
  crawl: { maxPages: number; tryDocumentedCase: boolean };
  pages: PlanPage[];
}

/**
 * Eventos, um JSON por linha:
 *  plan          – plano completo (primeiro evento)
 *  fetched       – uma página foi baixada (ou falhou)
 *  invoker       – resultado da verificação do Invoker
 *  section-start – a análise de uma seção começou (seus itens passam a "analisando")
 *  item          – um item foi concluído
 *  done          – resultado final completo (último evento)
 *  error         – a avaliação falhou
 */
export type StreamEvent =
  | { type: 'plan'; plan: EvaluationPlan }
  | { type: 'fetched'; page: FetchedPage }
  | { type: 'invoker'; invoker: InvokerCheck }
  | { type: 'section-start'; pageId: string; sectionId: string }
  | { type: 'item'; pageId: string; sectionId: string; item: ItemResult }
  | { type: 'done'; result: EvaluationResult }
  | { type: 'error'; message: string; status: number };
