import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { DEFAULT_ANOS_HISTORICO, SETTINGS, withHistoricoAnos, type HistoricoAno, type ItemResult, type StreamEvent } from '@serigy/shared';
import { BrowserLoader, shutdownBrowser } from '../src/evaluator/browser-loader';
import { prepareEvaluation } from '../src/evaluator/evaluate';
import type { AnoRequest } from '../src/evaluator/loader';
import { renderMarkdown } from '../src/report/markdown';
import { FakeLoader, find, SCHEMAS } from './helpers';

const P = 'https://p.gov.br/';
const D = 'https://p.gov.br/despesas';
const SCHEMA = SCHEMAS.despesas;
const HTML =
  `<div serigySchema="${SCHEMA}" serigyItem="filtroPesquisa">` +
  '<select serigyItem="historicoExercicio"><option serigyValue="2026">2026</option><option serigyValue="2025">2025</option></select>' +
  '<button serigyExecuteWaitSection="tabela">Pesquisar</button></div><div serigyLoadSection="tabela"></div>';

/** Loader que também analisa anos: devolve o resultado combinado por ano e registra os pedidos e a concorrência. */
class AnosLoader extends FakeLoader {
  readonly pedidos: AnoRequest[] = [];
  ativos = 0;
  maxAtivos = 0;
  constructor(
    pages: Record<string, string>,
    private readonly porAno: Record<string, HistoricoAno> = {},
  ) {
    super(pages);
  }
  async analisarAno(req: AnoRequest): Promise<HistoricoAno> {
    this.pedidos.push(req);
    this.ativos += 1;
    this.maxAtivos = Math.max(this.maxAtivos, this.ativos);
    await new Promise((r) => setTimeout(r, 15));
    this.ativos -= 1;
    return this.porAno[req.ano] ?? { ano: req.ano, passou: true, comDados: true };
  }
}

const rodar = async (loader: FakeLoader, extra: Partial<Parameters<typeof prepareEvaluation>[0]> = {}) => {
  const events: StreamEvent[] = [];
  const prepared = prepareEvaluation(
    { url: P, poder: 'executivo', items: ['4.1.18'], ...extra },
    { loader, now: () => new Date('2026-10-30T12:00:00Z') },
  );
  const result = await prepared.run((e) => events.push(e));
  return { result, events };
};

describe('configuração', () => {
  it('anos analisados no histórico: de 1 a 10, padrão 3', () => {
    const def = SETTINGS.find((s) => s.chave === 'comportamento.anosHistorico')!;
    expect(def).toMatchObject({ tipo: 'number', min: 1, max: 10, padrao: DEFAULT_ANOS_HISTORICO });
    expect(DEFAULT_ANOS_HISTORICO).toBe(3);
  });
});

describe('análise dos anos do historicoExercicio', () => {
  it('analisa o ano atual e os N anteriores (padrão 3: 2026 a 2023) e anexa os anos ao item', async () => {
    const loader = new AnosLoader({ [P]: '<html/>', [D]: HTML });
    const { result } = await rodar(loader);
    expect(loader.pedidos.map((p) => p.ano).sort()).toEqual(['2023', '2024', '2025', '2026']);
    expect(loader.pedidos[0]).toMatchObject({ url: D, waitSection: 'tabela' });
    const i = find(result, '4.1.18');
    expect(i.anos?.map((a) => a.ano)).toEqual(['2026', '2025', '2024', '2023']);
    expect(i.status).toBe('ok');
    expect(result.crawl.anosHistorico).toBe(3);
  });

  it('respeita a quantidade pedida (1 = ano atual e o anterior) e o limite de 10', async () => {
    const um = new AnosLoader({ [P]: '<html/>', [D]: HTML });
    await rodar(um, { anosHistorico: 1 });
    expect(um.pedidos.map((p) => p.ano).sort()).toEqual(['2025', '2026']);

    const dez = new AnosLoader({ [P]: '<html/>', [D]: HTML });
    const { result } = await rodar(dez, { anosHistorico: 99 });
    expect(dez.pedidos).toHaveLength(11);
    expect(result.crawl.anosHistorico).toBe(10);
  });

  it('ano que falha deixa o item em Atenção', async () => {
    const loader = new AnosLoader({ [P]: '<html/>', [D]: HTML }, { '2024': { ano: '2024', passou: false, codigo: 'TABLE_NOT_CHANGED', detalhe: 'x' } });
    const i = find((await rodar(loader)).result, '4.1.18');
    expect(i.status).toBe('warning');
    expect(i.message).toContain('Atenção: 2024 falhou (TABLE_NOT_CHANGED)');
    expect(i.serigy?.ponto).toBe(true); // o veredito estimado não muda
  });

  it('ano sem dados deixa o item em Atenção, mas conta como "passou"', async () => {
    const loader = new AnosLoader({ [P]: '<html/>', [D]: HTML }, { '2023': { ano: '2023', passou: true, comDados: false } });
    const i = find((await rodar(loader)).result, '4.1.18');
    expect(i.status).toBe('warning');
    expect(i.message).toContain('Atenção: 2023 sem dados');
    expect(i.anos?.find((a) => a.ano === '2023')).toMatchObject({ passou: true, comDados: false });
  });

  it('todos os anos com dados: o item continua atendido', async () => {
    const i = find((await rodar(new AnosLoader({ [P]: '<html/>', [D]: HTML }))).result, '4.1.18');
    expect(i.status).toBe('ok');
    expect(i.message).not.toContain('Atenção');
  });

  it('emite o item na hora, um evento por ano e o item final com os anos', async () => {
    const { events } = await rodar(new AnosLoader({ [P]: '<html/>', [D]: HTML }));
    const itens = events.filter((e) => e.type === 'item');
    const anos = events.filter((e) => e.type === 'item-ano');
    expect(itens).toHaveLength(2);
    expect((itens[0] as { item: ItemResult }).item.anos).toBeUndefined();
    expect((itens[1] as { item: ItemResult }).item.anos).toHaveLength(4);
    expect(anos).toHaveLength(4);
    expect(events.at(-1)?.type).toBe('done');
    expect(events.findIndex((e) => e.type === 'item-ano')).toBeGreaterThan(events.findIndex((e) => e.type === 'item'));
  });

  it('no máximo 3 anos ao mesmo tempo', async () => {
    const loader = new AnosLoader({ [P]: '<html/>', [D]: HTML });
    await rodar(loader, { anosHistorico: 10 });
    expect(loader.pedidos).toHaveLength(11);
    expect(loader.maxAtivos).toBeLessThanOrEqual(3);
    expect(loader.maxAtivos).toBeGreaterThan(1);
  });

  it('sem análise de anos no carregador (http): ignora e avisa', async () => {
    const { result } = await rodar(new FakeLoader({ [P]: '<html/>', [D]: HTML }));
    expect(find(result, '4.1.18').anos).toBeUndefined();
    expect(result.warnings.some((w) => w.includes('histórico') && w.includes('navegador'))).toBe(true);
  });

  it('item sem serigyExecuteWaitSection (nada a executar) não analisa anos', async () => {
    const html = `<div serigySchema="${SCHEMA}" serigyItem="filtroPesquisa"><select serigyItem="historicoExercicio"><option serigyValue="2026">2026</option></select></div>`;
    const loader = new AnosLoader({ [P]: '<html/>', [D]: html });
    await rodar(loader);
    expect(loader.pedidos).toHaveLength(0);
  });

  it('o relatório Markdown lista cada ano', async () => {
    const loader = new AnosLoader({ [P]: '<html/>', [D]: HTML }, { '2024': { ano: '2024', passou: true, comDados: false } });
    const md = renderMarkdown((await rodar(loader)).result);
    expect(md).toContain('**Anos do histórico:**');
    expect(md).toContain('2024: ✅ passou — ⚠️ sem dados');
    expect(md).toContain('2026: ✅ passou — com dados');
  });

  it('withHistoricoAnos não rebaixa item que não estava atendido', () => {
    const base = { status: 'missing', message: 'x' } as ItemResult;
    expect(withHistoricoAnos(base, [{ ano: '2025', passou: false, codigo: 'INVALID_OPTION' }]).status).toBe('missing');
  });
});

describe('troca de ano no navegador real', () => {
  let server: Server;
  let base = '';
  let hasBrowser = false;
  const clicks: string[] = [];

  const page = `<!doctype html><html><body>
    <div serigySchema="${SCHEMA}" serigyItem="filtroPesquisa">
      <select serigyItem="historicoExercicio">
        <option serigyValue="2026" selected>2026</option><option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option><option serigyValue="2022">2022</option>
      </select>
      <button serigyExecuteWaitSection="tab">Pesquisar</button>
    </div>
    <div serigyLoadSection="tab"><table><tbody><tr><td>linha 2026</td></tr></tbody></table></div>
    <span serigyItem="salvarRelatorio"><button serigyExecuteWaitSection="exp" onclick="fetch('/clicked/exp')">Exportar</button></span>
    <script>
      document.querySelector('[serigyExecuteWaitSection="tab"]').addEventListener('click', () => {
        const y = document.querySelector('select').value;
        const box = document.querySelector('[serigyLoadSection="tab"]');
        setTimeout(() => {
          if (y === '2025') box.innerHTML = '<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>linha 2025</td></tr></tbody></table>';
          if (y === '2024') box.innerHTML = '<table><thead><tr><th>h</th></tr></thead><tbody></tbody></table>';
          // 2022: o portal não reage (a seção não muda)
        }, 150);
      });
    </script></body></html>`;

  beforeAll(async () => {
    server = createServer((req, res) => {
      const path = new URL(req.url ?? '/', 'http://x').pathname;
      if (path.startsWith('/clicked/')) clicks.push(path);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(page);
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}/historico`;
    try {
      const probe = await BrowserLoader.create();
      await probe.close();
      hasBrowser = true;
    } catch {
      hasBrowser = false;
    }
  }, 60_000);

  afterAll(async () => {
    server?.close();
    await shutdownBrowser();
  });

  it(
    'classifica cada ano: com dados, sem dados, opção inválida e seção que não muda',
    async (ctx) => {
      if (!hasBrowser) return ctx.skip();
      const loader = await BrowserLoader.create({ anoTimeoutMs: 1500 });
      try {
        const analisar = (ano: string) => loader.analisarAno({ url: base, ano, waitSection: 'tab' });
        const [a2026, a2025, a2024, a2023, a2022] = await Promise.all(['2026', '2025', '2024', '2023', '2022'].map(analisar));
        expect(a2026).toMatchObject({ passou: true, comDados: true }); // já selecionado
        expect(a2025).toMatchObject({ passou: true, comDados: true });
        expect(a2024).toMatchObject({ passou: true, comDados: false }); // mudou, mas sem linha de dados
        expect(a2023).toMatchObject({ passou: false, codigo: 'INVALID_OPTION' });
        expect(a2022).toMatchObject({ passou: false, codigo: 'TABLE_NOT_CHANGED' });
        expect(a2022!.detalhe).toContain('1500ms');
        expect(clicks).not.toContain('/clicked/exp'); // nunca clica em item de exportação
      } finally {
        await loader.close();
      }
    },
    60_000,
  );
});
