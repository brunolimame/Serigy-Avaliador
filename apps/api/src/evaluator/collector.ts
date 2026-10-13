import type { FetchedPage, FetchOrigin } from '@serigy/shared';
import type { LoadedPage, PageLoader } from './loader';
import { extractMarkup, type Delegation, type MarkupElement, type PageMarkup, type YearFilter } from './markup';

/**
 * Chave de comparação de URLs (usada para casar serigyLink/caminhos com a página baixada).
 * Ignora maiúsculas/minúsculas e a barra final: a documentação grafa caminhos como `/Despesas`,
 * mas o site pode usar `/despesas`.
 */
export const urlKey = (url: string): string => url.replace(/\/+$/, '').toLowerCase();

const isOk = (p: LoadedPage): boolean => p.html !== null && !p.error;

export function lowerPath(url: string): string {
  try {
    const u = new URL(url);
    u.pathname = u.pathname.toLowerCase();
    return u.href;
  } catch {
    return url;
  }
}

/**
 * Páginas baixadas e a marcação extraída delas. Baixa SOMENTE o que a avaliação pede (não há
 * navegação por links <a href>) e nunca baixa a mesma URL duas vezes, mesmo quando várias seções
 * a pedem ao mesmo tempo.
 *
 * Os campos públicos crescem à medida que as páginas chegam; as avaliações consultam-nos filtrando
 * pela URL da página (ver evaluate.ts).
 */
export class PageStore {
  readonly fetched: FetchedPage[] = [];
  readonly markups: PageMarkup[] = [];
  readonly elements: MarkupElement[] = [];
  readonly delegations: Delegation[] = [];
  readonly yearFilters: YearFilter[] = [];
  readonly markupByKey = new Map<string, PageMarkup>();
  /** Páginas que falharam: chave da URL usada -> erro. */
  readonly failed = new Map<string, string>();
  /** Chave da URL solicitada -> URL efetivamente usada (pode ser a variante em minúsculas). */
  readonly resolved = new Map<string, string>();

  private readonly inflight = new Map<string, Promise<void>>();
  private started = 0;

  constructor(
    private readonly loader: PageLoader,
    private readonly maxPages: number,
    /** Se a minúscula falhar, testa também a grafia da documentação (com maiúsculas). */
    private readonly tryDocumentedCase: boolean = false,
    private readonly onFetched: (page: FetchedPage) => void = () => {},
  ) {}

  /**
   * Garante que a URL foi baixada. `allowLower` (caminhos da documentação, não os serigyLink escritos pelo
   * portal): o caminho é pedido em minúsculas; a grafia da documentação, com maiúsculas, só é testada se
   * a opção `tryDocumentedCase` estiver ligada e a minúscula falhar (404 ou qualquer outro erro).
   */
  get(url: string, origin: FetchOrigin, allowLower: boolean): Promise<void> {
    const key = urlKey(url);
    let job = this.inflight.get(key);
    if (!job) {
      job = this.fetchOne(url, origin, allowLower);
      this.inflight.set(key, job);
    }
    return job;
  }

  /** Marcação da página já baixada para a URL solicitada (considera a variante em minúsculas). */
  markupFor(requested: string): PageMarkup | undefined {
    return this.markupByKey.get(urlKey(this.resolved.get(urlKey(requested)) ?? requested));
  }

  private record(page: FetchedPage): void {
    this.fetched.push(page);
    this.onFetched(page);
  }

  private async fetchOne(url: string, origin: FetchOrigin, allowLower: boolean): Promise<void> {
    const requestedKey = urlKey(url);
    // O limite vale só para páginas seguidas por serigyLink (evita rastreio sem fim). A URL inicial e as
    // páginas dos caminhos da documentação são necessárias à avaliação e nunca são limitadas.
    const limited = origin === 'iframe' || origin === 'serigyLink';
    if (limited && this.started >= this.maxPages) {
      const error = `limite de ${this.maxPages} páginas seguidas por serigyLink atingido`;
      this.resolved.set(requestedKey, url);
      this.failed.set(requestedKey, error);
      this.record({ url, origin, status: null, error, serigyElements: 0 });
      return;
    }
    if (limited) this.started += 1;

    // Caminhos da documentação: sempre em minúsculas. A grafia da documentação (com maiúsculas) só é
    // testada com `tryDocumentedCase`, e apenas se a minúscula falhar. Falhando as duas, o erro
    // reportado é o da grafia da documentação.
    let used = url;
    let page: LoadedPage;
    const lower = allowLower ? lowerPath(url) : url;
    if (lower === url) {
      page = await this.loader.load(url);
    } else {
      used = lower;
      page = await this.loader.load(lower);
      if (!isOk(page) && this.tryDocumentedCase) {
        const lowerError = page.error ?? 'sem resposta';
        const second = await this.loader.load(url);
        if (isOk(second)) {
          used = url;
          page = second;
        } else {
          used = url;
          page = { ...second, error: `${second.error ?? 'sem resposta'} (em minúsculas: ${lowerError})` };
        }
      }
    }

    this.resolved.set(requestedKey, used);
    this.inflight.set(urlKey(used), this.inflight.get(requestedKey)!);

    if (!isOk(page)) {
      const error = page.error ?? 'sem resposta';
      this.failed.set(urlKey(used), error);
      this.record({ url: used, origin, status: page.status, error, serigyElements: 0 });
      return;
    }

    const markup = extractMarkup(page.html!, page.url || used, used);
    this.markups.push(markup);
    this.markupByKey.set(urlKey(used), markup);
    this.elements.push(...markup.elements);
    this.delegations.push(...markup.delegations);
    this.yearFilters.push(...markup.yearFilters);
    this.record({ url: used, origin, status: page.status, serigyElements: markup.elements.length });
  }

  /**
   * Segue os serigyLink (a partir de `rootUrl`) que `shouldFollow` aceitar, inclusive os que
   * aparecem nas páginas de destino.
   */
  async followDelegations(rootUrl: string, shouldFollow: (d: Delegation) => boolean): Promise<void> {
    const visited = new Set<string>();
    let level = [rootUrl];
    while (level.length > 0) {
      const next: string[] = [];
      for (const url of level) {
        if (visited.has(urlKey(url))) continue;
        visited.add(urlKey(url));
        const targets = (this.markupFor(url)?.delegations ?? []).filter(shouldFollow);
        await Promise.all(targets.map((d) => this.get(d.url, d.tag === 'iframe' ? 'iframe' : 'serigyLink', false)));
        next.push(...targets.map((d) => d.url));
      }
      level = next;
    }
  }
}
