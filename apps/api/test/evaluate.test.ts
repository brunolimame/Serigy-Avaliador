import { describe, expect, it } from 'vitest';
import type { EvaluationResult } from '@serigy/shared';
import { createApp } from '../src/app';
import { evaluate, EvaluationError } from '../src/evaluator/evaluate';
import { renderMarkdown } from '../src/report/markdown';
import { FakeLoader, find, SCHEMAS } from './helpers';

const HOME = 'https://portal.exemplo.gov.br/';

const homeHtml = `<html><head>
  <meta serigyItem="invoker" serigyValue="abc123">
</head><body>
  <meta serigySchema="${SCHEMAS.informacoes}" serigyItem="sitioOficial" serigyLink="https://www.exemplo.gov.br">
  <div serigySchema="${SCHEMAS.informacoes}" serigyItem="acessoPortal"><a href="/transparencia">Portal</a></div>
</body></html>`;

// caminho da documentação: [Portal da Transparencia]/Despesas
const despesasHtml = `<html><body>
  <table serigyLoadSection="t" serigySchema="${SCHEMAS.despesas}"><tr>
    <td serigyItem="valorEmpenhado">38.000.000,00</td>
    <td serigyItem="valorLiquidado">sem valor</td>
    <td serigyItem="valorPago" serigyEmpty="ainda não definido">-</td>
    <td serigyItem="dataUltimaAtualizacao" serigyEmpty="">-</td>
  </tr></table>
  <div serigyItem="credorEmpenho">fora de schema</div>
</body></html>`;

const pages = () => ({
  [HOME]: homeHtml,
  'https://portal.exemplo.gov.br/despesas': despesasHtml,
  // serigyLink com serigyItem: o item é buscado no destino (docs/definicoes.md)
  'https://www.exemplo.gov.br/': `<div serigySchema="${SCHEMAS.informacoes}" serigyItem="sitioOficial">oficial</div>`,
});

async function run(extra: Partial<Parameters<typeof evaluate>[0]> = {}): Promise<EvaluationResult> {
  return evaluate({ url: HOME, poder: 'executivo', ...extra }, { loader: new FakeLoader(pages()) });
}

describe('evaluate', () => {
  it('classifica itens: ok, warning, empty e missing', async () => {
    const r = await run({ pages: ['comum/informacoes', 'comum/despesas'] });
    expect(find(r, '1.1').status).toBe('ok'); // sitioOficial (meta + serigyLink)
    expect(find(r, '1.2').status).toBe('ok'); // acessoPortal
    expect(find(r, '1.3').status).toBe('missing'); // pesquisaConteudo
    expect(find(r, '4.1.1').status).toBe('ok'); // valorEmpenhado
    expect(find(r, '4.1.2').status).toBe('warning'); // valorLiquidado sem número (Monetário)
    expect(find(r, '4.1.3').status).toBe('empty'); // valorPago com serigyEmpty+motivo
    expect(find(r, '4.1.17').status).toBe('warning'); // serigyEmpty sem motivo
    const credor = find(r, '4.1.11');
    expect(credor.status).toBe('missing');
    expect(credor.message).toContain('outro schema');
  });

  it('detecta o Invoker na página principal', async () => {
    const r = await run({ pages: ['comum/despesas'] });
    expect(r.invoker).toMatchObject({ found: true, value: 'abc123' });
  });

  it('avalia item isolado', async () => {
    const r = await run({ items: ['4.1.1'] });
    expect(r.scope).toMatchObject({ mode: 'parcial', pages: 1, items: 1 });
    expect(r.summary).toMatchObject({ total: 1, ok: 1, score: 100 });
  });

  it('sem filtros avalia todos os itens do poder (comuns + específicos)', async () => {
    const r = await run();
    expect(r.scope.mode).toBe('todos');
    expect(r.pages.some((p) => p.folder === 'comum')).toBe(true);
    expect(r.pages.some((p) => p.folder === 'executivo')).toBe(true);
    expect(r.pages.every((p) => p.folder === 'comum' || p.folder === 'executivo')).toBe(true);
  });

  it('rejeita escopo que não se aplica ao poder e URL inválida', async () => {
    await expect(run({ poder: 'legislativo', pages: ['executivo/saude'] })).rejects.toThrow(EvaluationError);
    await expect(evaluate({ url: 'ftp://x', poder: 'executivo' }, { loader: new FakeLoader({}) })).rejects.toThrow('URL inválida');
  });

  it('falha com 502 quando o portal não responde', async () => {
    await expect(evaluate({ url: 'https://fora.do.ar/', poder: 'executivo' }, { loader: new FakeLoader({}) })).rejects.toMatchObject({ status: 502 });
  });
});

describe('relatório markdown', () => {
  it('contém resumo, pendências e detalhamento', async () => {
    const md = renderMarkdown(await run({ pages: ['comum/informacoes'] }));
    expect(md).toContain('# Relatório de avaliação Serigy');
    expect(md).toContain('## Pendências');
    expect(md).toContain('pesquisaConteudo');
    expect(md).toContain('## Detalhamento');
    expect(md).toContain('## Páginas analisadas');
  });
});

describe('API', () => {
  it('POST /api/evaluate e /api/report', async () => {
    const app = createApp({ loader: new FakeLoader(pages()) });
    const server = app.listen(0);
    try {
      const { port } = server.address() as { port: number };
      const base = `http://127.0.0.1:${port}`;
      const post = (path: string, body: unknown) =>
        fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

      const bad = await post('/api/evaluate', { url: HOME, poder: 'inexistente' });
      expect(bad.status).toBe(400);

      const ok = await post('/api/evaluate', { url: HOME, poder: 'executivo', items: ['1.1'] });
      expect(ok.status).toBe(200);
      const result = (await ok.json()) as EvaluationResult;
      expect(result.summary.total).toBe(1);

      const report = await post('/api/report', result);
      expect(report.headers.get('content-type')).toContain('text/markdown');
      expect(await report.text()).toContain('Relatório de avaliação');

      const cat = await fetch(`${base}/api/catalog?poder=legislativo`);
      expect(((await cat.json()) as { pages: unknown[] }).pages.length).toBeGreaterThan(0);
    } finally {
      server.close();
    }
  });
});
