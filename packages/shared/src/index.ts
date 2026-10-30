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
  /** Máximo de páginas seguidas por serigyLink na avaliação (padrão: configuração, 40). */
  maxPages?: number;
  /**
   * Os caminhos da documentação (ex.: `/Despesas`) são testados SEMPRE em minúsculas. Se `true`, quando a
   * minúscula falhar (404 ou outro erro) a grafia da documentação, com maiúsculas, também é testada.
   * Padrão: `false`.
   */
  tryDocumentedCase?: boolean;
  /**
   * Como as páginas são obtidas: `browser` (padrão) abre um navegador real e executa o JavaScript;
   * `http` baixa só o HTML (mais rápido, não vê conteúdo montado por script).
   */
  renderer?: Renderer;
  /** Nome do portal cadastrado (só para identificar a avaliação no resultado e no relatório). */
  portalNome?: string;
  portalAmbiente?: Ambiente;
  /**
   * Reproduz no veredito Serigy (`ItemResult.serigy`) comportamentos conhecidos do validador oficial que divergem da
   * documentação (ver `SERIGY_SCHEMA_QUIRKS`). Padrão: configuração `comportamento.compatibilidadeSerigy`.
   */
  compatibilidadeSerigy?: boolean;
}

export type Renderer = 'browser' | 'http';

// ---------------------------------------------------------------------------
// Portais cadastrados (SQLite)
// ---------------------------------------------------------------------------

/** Ambiente do endereço cadastrado. */
export type Ambiente = 'producao' | 'desenvolvimento';

export const AMBIENTES: Array<{ id: Ambiente; label: string }> = [
  { id: 'producao', label: 'Produção' },
  { id: 'desenvolvimento', label: 'Desenvolvimento' },
];

export interface PortalInput {
  /** Nome para identificar o portal na lista (ex.: "Prefeitura de Aracaju"). */
  nome: string;
  /** URL raiz do portal da transparência (`[Portal da Transparencia]` da documentação). */
  url: string;
  poder: PoderId;
  /** O endereço é de produção ou de desenvolvimento/homologação? */
  ambiente: Ambiente;
}

export interface Portal extends PortalInput {
  id: number;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * ok       – item encontrado sob o schema correto e com valor coerente
 * warning  – encontrado, mas o valor não parece do tipo esperado
 * empty    – declarado como vazio de forma intencional (`serigyEmpty`)
 * missing  – item (ou o schema da página) não encontrado
 */
export type ItemStatus = 'ok' | 'warning' | 'empty' | 'missing';

/** Resultado da avaliação de um `serigyEmpty` declarado. */
export interface SerigyEmptyCheck {
  /** Motivo informado, já sanitizado (vazio = em branco). */
  motivo: string;
  /** Motivo preenchido, com conteúdo válido e único na página. */
  valido: boolean;
  /** Por que não vale (motivo não informado, texto genérico, repetido…). */
  problema?: string;
  pageUrl: string;
}

/** Códigos de erro do validador oficial do Serigy. */
export type SerigyCodigo =
  | 'URL_NOT_ACCESSIBLE'
  | 'SCHEMA_NOT_FOUND'
  | 'SERIGYITEM_NOT_FOUND'
  | 'SERIGYITEM_NOT_VALID'
  | 'WAITSECTION_NOT_FOUND';

export const SERIGY_CODIGOS: SerigyCodigo[] = [
  'URL_NOT_ACCESSIBLE',
  'SCHEMA_NOT_FOUND',
  'SERIGYITEM_NOT_FOUND',
  'SERIGYITEM_NOT_VALID',
  'WAITSECTION_NOT_FOUND',
];

/**
 * Veredito estimado do item como o validador oficial do Serigy o daria (atende ou não). Fica em campo próprio:
 * o `status` do avaliador (com `warning` e `empty`) e todos os detalhes continuam como estão.
 */
export interface SerigyVeredito {
  ponto: boolean;
  /** Presente quando `ponto` é falso. */
  codigo?: SerigyCodigo;
  /** Por que o veredito é esse (inclusive avisos que não mudam o veredito). */
  detalhe?: string;
}

/**
 * Schemas que o validador oficial do Serigy espera de forma diferente da documentação (a matriz é a fonte da verdade
 * e não é alterada). Com a compatibilidade ligada, o item vira "não atende" no veredito Serigy.
 */
export const SERIGY_SCHEMA_QUIRKS: Array<{ documentado: string; serigyEspera: string }> = [
  {
    documentado: 'https://serigy.tce.se.gov.br/consorcios/atividades-finalisticas.html',
    serigyEspera: 'https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html',
  },
];

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
  /** URL esperada pela documentação (caminho da seção); ausente em avaliações antigas do histórico. */
  expectedUrl?: string;
  /**
   * URL(s) efetivamente analisada(s) para o item: onde foi encontrado; ou, se não foi,
   * o destino do serigyLink / as páginas onde o schema existe / a URL inicial.
   */
  analyzedUrls: string[];
  /** Presente quando o item depende de serigyLink: o tipo do elemento (iframe ou outro) e a URL avaliada. */
  loadedVia?: Array<{ kind: 'iframe' | 'serigyLink'; url: string; /** tag do elemento que declarou o serigyLink */ tag?: string }>;
  /**
   * Validação do schema do item: `esperado` (da documentação), `encontrado` (valor de serigySchema no HTML,
   * quando o item foi achado) e `confere` (o endereço completo corresponde ao esperado).
   */
  schema: { esperado: string; encontrado?: string; confere: boolean };
  /** Avaliação de cada serigyEmpty declarado no item (feita sempre que o atributo aparece). */
  serigyEmpty?: SerigyEmptyCheck[];
  /** Até 3 trechos de HTML que comprovam o achado. */
  evidence: Array<{ pageUrl: string; snippet: string }>;
  /** Veredito estimado do validador oficial do Serigy; ausente em avaliações antigas do histórico. */
  serigy?: SerigyVeredito;
}

/**
 * A URL analisada é a esperada pela documentação? `undefined` quando não há URL esperada registrada
 * ou nada foi analisado. Compara sem diferenciar caixa nem barra final (como o coletor).
 */
export function analyzedMatchesExpected(item: Pick<ItemResult, 'expectedUrl' | 'analyzedUrls'>): boolean | undefined {
  if (!item.expectedUrl || item.analyzedUrls.length === 0) return undefined;
  const key = (u: string) => u.replace(/\/+$/, '').toLowerCase();
  const expected = key(item.expectedUrl);
  return item.analyzedUrls.every((u) => key(u) === expected);
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

/** Resumo do veredito Serigy de uma lista de itens (só os que têm veredito). `score` = atendidos / total, de 0 a 100. */
export interface SerigySummary {
  total: number;
  atendidos: number;
  score: number;
}

export function serigySummarize(items: Array<{ serigy?: { ponto: boolean } }>): SerigySummary {
  const rated = items.filter((i) => i.serigy);
  const atendidos = rated.filter((i) => i.serigy!.ponto).length;
  const total = rated.length;
  return { total, atendidos, score: total === 0 ? 0 : Math.round((atendidos / total) * 1000) / 10 };
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
  portalNome?: string;
  portalAmbiente?: Ambiente;
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
  crawl: { maxPages: number; tryDocumentedCase: boolean; renderer: Renderer };
  summary: Summary;
  pages: PageResult[];
}

export interface CatalogResponse {
  poder: PoderInfo;
  pages: CatalogPage[];
}

/** Duração legível: "45 s", "1 min 8 s", "1 h 02 min 03 s" (arredonda ao segundo; negativo vira 0). */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h} h ${two(m)} min ${two(s)} s`;
  if (m > 0) return `${m} min ${s} s`;
  return `${s} s`;
}

/** Quanto tempo a avaliação levou (do início ao fim), em texto; vazio se as datas forem inválidas. */
export function evaluationDuration(r: { startedAt: string; finishedAt: string }): string {
  const ms = Date.parse(r.finishedAt) - Date.parse(r.startedAt);
  return Number.isNaN(ms) ? '' : formatDuration(ms);
}

/** Mensagem acrescentada ao item atendido que o Serigy não pontua. */
const serigyAtencao = (origem: 'oficial' | 'estimado', codigo?: string): string =>
  `Atenção: o Serigy ${origem} não pontua este item${codigo ? ` (${codigo})` : ''}`;

/** Item atendido que o veredito Serigy (estimado) reprova vira "Atenção". Os demais ficam como estão. */
export function withSerigyEstimadoAtencao(item: ItemResult): ItemResult {
  if (item.status !== 'ok' || !item.serigy || item.serigy.ponto) return item;
  const nota = serigyAtencao('estimado', item.serigy.codigo);
  return { ...item, status: 'warning', message: item.message ? `${item.message}; ${nota}` : nota };
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
  portalNome?: string;
  portalAmbiente?: Ambiente;
  poder: PoderId;
  poderLabel: string;
  startedAt: string;
  scope: { mode: 'todos' | 'parcial'; pages: number; items: number };
  crawl: { maxPages: number; tryDocumentedCase: boolean; renderer: Renderer };
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

// ---------------------------------------------------------------------------
// Agrupamento de páginas pelo número da matriz
// ---------------------------------------------------------------------------

/**
 * O mesmo número da matriz pode existir em mais de uma pasta da documentação (ex.: "11. Planejamento e
 * Prestação de Contas" em comum + consorcios-publicos). Para o usuário é UM item só: este grupo reúne as
 * páginas de mesmo número e as suas seções, em ordem numérica, cada uma com a página de origem.
 */
export interface PageGroup<P, S> {
  number: string;
  title: string;
  pages: P[];
  sections: Array<S & { page: P }>;
}

export function groupPagesByNumber<P extends { number: string; title: string; sections: Array<{ id: string }> }>(
  pages: P[],
): Array<PageGroup<P, P['sections'][number]>> {
  type S = P['sections'][number];
  const groups = new Map<string, PageGroup<P, S>>();
  for (const page of pages) {
    let group = groups.get(page.number);
    if (!group) {
      group = { number: page.number, title: page.title, pages: [], sections: [] };
      groups.set(page.number, group);
    }
    group.pages.push(page);
    for (const section of page.sections) group.sections.push({ ...section, page });
  }
  const list = [...groups.values()];
  for (const g of list) g.sections.sort((a, b) => compareIds(a.id, b.id));
  return list.sort((a, b) => compareIds(a.number, b.number));
}

// ---------------------------------------------------------------------------
// Configurações da aplicação (SQLite) — gerais, valem para todas as avaliações
// ---------------------------------------------------------------------------

/** Padrão do máximo de páginas seguidas por serigyLink (total por avaliação, somando todas as cadeias). */
export const DEFAULT_MAX_PAGES = 40;

export type SettingValue = boolean | number;

/**
 * Categorias do painel de configurações (estilo VS Code). `portais` e `historico` têm telas próprias;
 * as demais são geradas a partir de SETTINGS.
 */
export type SettingCategory = 'portais' | 'comportamento' | 'historico';

export const SETTING_CATEGORIES: Array<{ id: SettingCategory; label: string; descricao: string }> = [
  { id: 'portais', label: 'Portais', descricao: 'Cadastro dos portais da transparência (URL, poder e ambiente).' },
  { id: 'comportamento', label: 'Comportamento', descricao: 'Como as avaliações coletam e analisam as páginas.' },
  { id: 'historico', label: 'Histórico', descricao: 'Avaliações salvas e importadas.' },
];

export interface SettingDef {
  /** Chave única: "<categoria>.<nome>". */
  chave: string;
  categoria: SettingCategory;
  tipo: 'boolean' | 'number';
  padrao: SettingValue;
  rotulo: string;
  descricao: string;
  min?: number;
  max?: number;
}

/**
 * Catálogo das configurações. Para criar uma nova, acrescente uma entrada aqui: a API valida pelo tipo/faixa e o
 * painel desenha o controle sozinho.
 */
export const SETTINGS: SettingDef[] = [
  {
    chave: 'comportamento.navegador',
    categoria: 'comportamento',
    tipo: 'boolean',
    padrao: true,
    rotulo: 'Abrir as páginas em um navegador (executa JavaScript)',
    descricao:
      'Recomendado: páginas reativas só mostram os resultados depois de carregar scripts, e o navegador se apresenta como um acesso comum. Desmarcado, apenas o HTML é baixado (mais rápido, sem JavaScript).',
  },
  {
    chave: 'comportamento.maxPaginasSerigyLink',
    categoria: 'comportamento',
    tipo: 'number',
    padrao: DEFAULT_MAX_PAGES,
    min: 1,
    max: 200,
    rotulo: 'Máx. de páginas seguidas por serigyLink',
    descricao:
      'Total de páginas baixadas por serigyLink em uma avaliação, somando todas as cadeias (A → B → C gasta 3). Não é a profundidade da cadeia. As páginas dos caminhos da documentação não entram nesse limite.',
  },
  {
    chave: 'comportamento.testarGrafiaDocumentacao',
    categoria: 'comportamento',
    tipo: 'boolean',
    padrao: false,
    rotulo: 'Testar também a grafia da documentação (com maiúsculas)',
    descricao:
      'Os caminhos (ex.: /Despesas) são testados sempre em minúsculas (/despesas). Com esta opção, se a minúscula falhar (404 ou outro erro), a grafia da documentação também é testada.',
  },
  {
    chave: 'comportamento.compatibilidadeSerigy',
    categoria: 'comportamento',
    tipo: 'boolean',
    padrao: true,
    rotulo: 'Reproduzir no veredito Serigy os desvios conhecidos do validador oficial',
    descricao:
      'Ligada, o veredito Serigy estimado também reproduz o que o validador oficial faz de diferente da documentação: hoje, ele procura o schema da seção 25 (Atividades Finalísticas dos consórcios) como “consorcio/…” e a matriz publica “consorcios/…”. Só afeta o veredito Serigy; o status do avaliador segue a documentação.',
  },
];

export interface SettingsResponse {
  definicoes: SettingDef[];
  /** Valor efetivo de cada chave (o salvo ou, na falta, o padrão). */
  valores: Record<string, SettingValue>;
  /** Chaves com valor salvo diferente do padrão. */
  modificadas: string[];
}

// ---------------------------------------------------------------------------
// Histórico de avaliações (SQLite) e arquivo de exportação/importação
// ---------------------------------------------------------------------------

export type AvaliacaoOrigem = 'local' | 'importada';

/** Linha da lista do histórico (sem o resultado completo). */
export interface AvaliacaoResumo {
  id: number;
  /** Quando foi salva (ou importada) neste computador. */
  criadoEm: string;
  origem: AvaliacaoOrigem;
  /** Quando a avaliação terminou (`finishedAt` do resultado). */
  avaliadaEm: string;
  portalNome?: string;
  portalUrl: string;
  portalAmbiente?: Ambiente;
  poder: PoderId;
  poderLabel: string;
  summary: Summary;
  /** Resumo do Serigy oficial, quando o arquivo dele foi anexado. */
  serigy?: SerigySummary;
}

export interface AvaliacaoDetalhe {
  resumo: AvaliacaoResumo;
  resultado: EvaluationResult;
  /** `generatedAt` do catálogo (matriz PNTP) vigente quando a avaliação foi salva. */
  catalogoGeradoEm?: string;
  /** Avaliação do validador oficial do Serigy anexada a esta avaliação (arquivo exportado pelo Serigy). */
  serigyOficial?: SerigyOficial;
  /** Item do avaliador (id) -> item correspondente do Serigy oficial (pareado por id + atributo, ou caminho + atributo). */
  serigyPorItem?: Record<string, SerigyOficialItem>;
}

/** Um item do arquivo de avaliação exportado pelo Serigy oficial. */
export interface SerigyOficialItem {
  dimensao: string;
  itemId: string;
  serigyItem: string;
  serigySchema: string;
  ponto: boolean;
  /** `CODIGO|mensagem` quando o item não pontuou. */
  detalhe: string | null;
}

export interface SerigyOficial {
  /** Quando o arquivo foi anexado neste computador. */
  importadoEm: string;
  itens: SerigyOficialItem[];
}

/** Separa o código do erro oficial (`CODIGO|mensagem`) da mensagem. */
export function parseSerigyDetalhe(detalhe: string | null): { codigo?: string; mensagem?: string } {
  if (!detalhe) return {};
  const i = detalhe.indexOf('|');
  return i < 0 ? { mensagem: detalhe } : { codigo: detalhe.slice(0, i), mensagem: detalhe.slice(i + 1) };
}

/** Identificação do arquivo de exportação. */
export const EXPORT_FORMAT = 'serigy-avaliacao';
/** Versão do formato. Aumente ao mudar a estrutura de `resultado` (importadores antigos recusam versões maiores). */
export const EXPORT_VERSION = 2;

/**
 * Arquivo JSON de uma avaliação, para guardar ou enviar a outra pessoa. O `hash` (SHA-256 do `resultado`
 * canônico) detecta arquivo corrompido ou editado, mas NÃO prova autoria (assinatura digital: opção futura).
 */
export interface AvaliacaoEnvelope {
  formato: typeof EXPORT_FORMAT;
  versao: number;
  exportadoEm: string;
  app: { nome: string; versao: string };
  catalogo: { geradoEm: string };
  hash: string;
  resultado: EvaluationResult;
  /** Avaliação do Serigy oficial anexada (versão 2 em diante); fica fora do hash do `resultado`. */
  serigyOficial?: SerigyOficial;
}

/**
 * Divide a mensagem de um item nas suas partes. A avaliação junta os motivos com "; ", mas um ";" dentro de aspas
 * (ex.: o motivo de um serigyEmpty) não separa nada.
 */
export function splitMessage(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === '"') inQuotes = !inQuotes;
    if (!inQuotes && ch === ';' && text[i + 1] === ' ') {
      parts.push(current.trim());
      current = '';
      i++; // o espaço depois do ";"
      continue;
    }
    current += ch;
  }
  parts.push(current.trim());
  return parts.filter(Boolean);
}

/** Máximo de ocorrências (trecho + página) guardadas como evidência de cada item. */
export const MAX_EVIDENCE = 200;
