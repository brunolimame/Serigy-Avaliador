/**
 * Camada de obtenção de HTML. O avaliador só conhece a interface PageLoader,
 * então um renderizador com JavaScript (Playwright/Puppeteer) pode ser plugado
 * sem tocar no restante (ver docs/avaliador.md, "Estendendo").
 */

import type { HistoricoAno } from '@serigy/shared';

export interface LoadedPage {
  /** URL final (após redirecionamentos). */
  url: string;
  status: number | null;
  html: string | null;
  error?: string;
}

/** Pedido de análise de UM ano do `historicoExercicio` numa página. */
export interface AnoRequest {
  /** Página onde o filtro está (a URL em que o `historicoExercicio` foi encontrado). */
  url: string;
  ano: string;
  /** Valor do `serigyExecuteWaitSection` do filtro; o `serigyLoadSection` de mesmo valor é a seção que deve mudar. */
  waitSection: string;
}

export interface PageLoader {
  load(url: string): Promise<LoadedPage>;
  /**
   * Seleciona o ano no filtro, executa o `serigyExecuteWaitSection` e espera o `serigyLoadSection` mudar. Só existe
   * em carregadores que executam JavaScript (navegador); sem ele a análise dos anos é ignorada.
   */
  analisarAno?(req: AnoRequest): Promise<HistoricoAno>;
  /** Libera recursos (ex.: contexto do navegador). Chamado ao fim de cada avaliação. */
  close?(): Promise<void>;
}

export interface HttpLoaderOptions {
  timeoutMs?: number;
  maxBytes?: number;
  userAgent?: string;
}

function charsetOf(contentType: string | null): string {
  const m = /charset=([\w-]+)/i.exec(contentType ?? '');
  return m?.[1]?.toLowerCase() ?? 'utf-8';
}

export class HttpLoader implements PageLoader {
  private readonly timeoutMs: number;
  private readonly maxBytes: number;
  private readonly userAgent: string;

  constructor(opts: HttpLoaderOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 15_000;
    this.maxBytes = opts.maxBytes ?? 5 * 1024 * 1024;
    this.userAgent = opts.userAgent ?? 'SerigyAvaliador/1.0 (+avaliacao PNTP 2026)';
  }

  async load(url: string): Promise<LoadedPage> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: { 'user-agent': this.userAgent, accept: 'text/html,application/xhtml+xml' },
      });
      const type = res.headers.get('content-type');
      if (type && !/html|xml/i.test(type)) {
        return { url: res.url, status: res.status, html: null, error: `conteúdo não é HTML (${type})` };
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > this.maxBytes) {
        return { url: res.url, status: res.status, html: null, error: 'resposta maior que o limite' };
      }
      const html = new TextDecoder(charsetOf(type), { fatal: false }).decode(buf);
      if (!res.ok) return { url: res.url, status: res.status, html, error: `HTTP ${res.status}` };
      return { url: res.url, status: res.status, html };
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError';
      return {
        url,
        status: null,
        html: null,
        error: aborted ? `timeout após ${this.timeoutMs} ms` : err instanceof Error ? (err.cause as Error | undefined)?.message ?? err.message : String(err),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
