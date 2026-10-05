import type { EvaluationResult } from '@serigy/shared';
import type { LoadedPage, PageLoader } from '../src/evaluator/loader';

/** Loader em memória: registra as URLs pedidas em `calls`. */
export class FakeLoader implements PageLoader {
  readonly calls: string[] = [];
  constructor(private readonly pages: Record<string, string>) {}
  async load(url: string): Promise<LoadedPage> {
    this.calls.push(url);
    const html = this.pages[url];
    return html === undefined ? { url, status: 404, html: null, error: 'HTTP 404' } : { url, status: 200, html };
  }
}

export const SCHEMAS = {
  informacoes: 'https://serigy.tce.se.gov.br/comum/informacoes.html',
  despesas: 'https://serigy.tce.se.gov.br/comum/despesas.html',
  ouvidoria: 'https://serigy.tce.se.gov.br/comum/ouvidoria.html',
  lgpd: 'https://serigy.tce.se.gov.br/comum/lgpd-governo-digital.html',
};

export const find = (r: EvaluationResult, id: string) =>
  r.pages.flatMap((p) => p.sections.flatMap((s) => s.items)).find((i) => i.id === id)!;
