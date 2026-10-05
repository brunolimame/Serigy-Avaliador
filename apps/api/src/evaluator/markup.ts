import * as cheerio from 'cheerio';

/**
 * Extração da marcação Serigy de um HTML.
 *
 * Observação: o parser HTML converte nomes de atributo para minúsculas, então
 * `serigyItem` é lido como `serigyitem` (os VALORES preservam a caixa).
 */

export interface MarkupElement {
  pageUrl: string;
  tag: string;
  /** valor de serigyItem */
  item?: string;
  /** schema (normalizado) do próprio elemento ou do ancestral mais próximo */
  schema?: string;
  /** valor original de serigySchema do elemento ou do ancestral (para conferir o endereço completo) */
  schemaRaw?: string;
  /** valor de serigyValue */
  value?: string;
  /** valor de serigyEmpty (string vazia = presente sem motivo) */
  empty?: string;
  /** valor de serigyLink */
  link?: string;
  href?: string;
  src?: string;
  /** texto visível (ou `content` em <meta>) */
  text: string;
  hasInnerLink: boolean;
  hasInnerImage: boolean;
  snippet: string;
}

/** Elemento com serigyLink: indica a URL onde o schema (ou só o item) deve ser analisado. */
export interface Delegation {
  /** Página onde a delegação foi declarada. */
  pageUrl: string;
  /** Schema (normalizado) do elemento ou de seu ancestral. */
  schema?: string;
  /** Se o elemento tem serigyItem, só este item é buscado no destino; senão, o schema inteiro. */
  item?: string;
  /** URL de destino (absoluta). */
  url: string;
  /** Tag do elemento (ex.: "iframe"). */
  tag: string;
}

/** Filtro por ano (<select> com opções 20xx) dentro de um schema. */
export interface YearFilter {
  pageUrl: string;
  schema: string;
  years: string[];
}

export interface PageMarkup {
  /** URL pela qual a página foi solicitada (é a chave usada pelas delegações). */
  url: string;
  /** Todos os elementos com serigyItem. */
  elements: MarkupElement[];
  /** Schemas (normalizados) declarados na página, mesmo sem itens. */
  schemas: Set<string>;
  /** Links <a href> da página (absolutos, sem hash). */
  hrefs: string[];
  /** URLs apontadas por serigyLink (absolutas). */
  serigyLinks: string[];
  delegations: Delegation[];
  yearFilters: YearFilter[];
  /** <iframe serigySchema> sem serigyLink: o conteúdo do iframe não é avaliado. */
  iframesWithoutLink: Array<{ pageUrl: string; src?: string }>;
  /** serigyExecuteWaitSection sem o serigyLoadSection correspondente no HTML estático. */
  pendingWaits: string[];
}

/** "https://x/2026/comum/despesas.html" -> "/comum/despesas.html" */
export function normalizeSchema(raw: string): string {
  const value = raw.trim();
  let path = value;
  try {
    path = new URL(value).pathname;
  } catch {
    /* não é URL absoluta: usa como veio */
  }
  return path.toLowerCase().replace(/^\/2026(?=\/)/, '').replace(/\/+$/, '');
}

/**
 * Forma canônica do ENDEREÇO COMPLETO do schema, para conferir se o encontrado corresponde ao esperado:
 * ignora caixa, espaços, barra final e o prefixo de versão `/2026`, mas mantém protocolo e host.
 * (`normalizeSchema` compara só o caminho; esta confere também o host.)
 */
export function canonicalSchema(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\/+$/, '')
    .replace(/^(https?:\/\/[^/]+)\/2026(?=\/)/, '$1');
}

function resolveUrl(raw: string | undefined, base: string): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw.trim(), base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
    u.hash = '';
    return u.href;
  } catch {
    return undefined;
  }
}

/**
 * @param baseUrl  URL final da página (resolve links relativos)
 * @param pageUrl  URL pela qual foi solicitada (identifica a página nos resultados); padrão = baseUrl
 */
export function extractMarkup(html: string, baseUrl: string, pageUrl: string = baseUrl): PageMarkup {
  const $ = cheerio.load(html);
  const elements: MarkupElement[] = [];
  const schemas = new Set<string>();
  const serigyLinks = new Set<string>();
  const waits = new Set<string>();
  const loads = new Set<string>();

  $('[serigyschema]').each((_, el) => {
    schemas.add(normalizeSchema($(el).attr('serigyschema') ?? ''));
  });
  $('[serigyloadsection]').each((_, el) => {
    loads.add(($(el).attr('serigyloadsection') ?? '').trim());
  });
  $('[serigyexecutewaitsection]').each((_, el) => {
    waits.add(($(el).attr('serigyexecutewaitsection') ?? '').trim());
  });
  const delegations: Delegation[] = [];
  $('[serigylink]').each((_, node) => {
    const el = $(node);
    const url = resolveUrl(el.attr('serigylink'), baseUrl);
    if (!url) return;
    serigyLinks.add(url);
    const owner = el.closest('[serigyschema]');
    delegations.push({
      pageUrl,
      schema: owner.length ? normalizeSchema(owner.attr('serigyschema') ?? '') : undefined,
      item: el.attr('serigyitem')?.trim(),
      url,
      tag: (node as { tagName?: string }).tagName ?? 'unknown',
    });
  });

  const iframesWithoutLink: Array<{ pageUrl: string; src?: string }> = [];
  $('iframe[serigyschema]').each((_, node) => {
    const el = $(node);
    if (!el.attr('serigylink')) iframesWithoutLink.push({ pageUrl, src: el.attr('src') });
  });

  const yearFilters: YearFilter[] = [];
  $('select').each((_, node) => {
    const el = $(node);
    const years = el
      .find('option')
      .map((__, o) => ($(o).attr('serigyvalue') ?? $(o).attr('value') ?? $(o).text()).trim())
      .get()
      .filter((v) => /^(19|20)\d{2}$/.test(v));
    const owner = el.closest('[serigyschema]');
    if (years.length > 0 && owner.length) {
      yearFilters.push({ pageUrl, schema: normalizeSchema(owner.attr('serigyschema') ?? ''), years });
    }
  });

  $('[serigyitem]').each((_, node) => {
    const el = $(node);
    const owner = el.closest('[serigyschema]');
    const tag = (node as { tagName?: string }).tagName ?? 'unknown';
    const attrs = Object.entries(el.attr() ?? {})
      .filter(([k]) => k.startsWith('serigy'))
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    const text = (tag === 'meta' ? el.attr('content') : el.text()) ?? '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    elements.push({
      pageUrl,
      tag,
      item: el.attr('serigyitem')?.trim(),
      schema: owner.length ? normalizeSchema(owner.attr('serigyschema') ?? '') : undefined,
      schemaRaw: owner.length ? (owner.attr('serigyschema') ?? '').trim() : undefined,
      value: el.attr('serigyvalue'),
      empty: el.attr('serigyempty'),
      link: el.attr('serigylink'),
      href: el.attr('href'),
      src: el.attr('src'),
      text: cleanText,
      hasInnerLink: el.find('a[href]').length > 0,
      hasInnerImage: el.find('img[src]').length > 0,
      snippet: `<${tag} ${attrs}>${cleanText.slice(0, 60)}`,
    });
  });

  const hrefs = new Set<string>();
  $('a[href]').each((_, el) => {
    const url = resolveUrl($(el).attr('href'), baseUrl);
    if (url) hrefs.add(url);
  });

  return {
    url: pageUrl,
    elements,
    schemas,
    hrefs: [...hrefs],
    serigyLinks: [...serigyLinks],
    delegations,
    yearFilters,
    iframesWithoutLink,
    pendingWaits: [...waits].filter((w) => w && !loads.has(w)),
  };
}
