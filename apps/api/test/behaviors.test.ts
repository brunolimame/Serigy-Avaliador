import { describe, expect, it } from 'vitest';
import { compareIds } from '@serigy/shared';
import { mergeReevaluated } from '../../web/src/merge';
import { pagesForPoder } from '../src/catalog/load';
import { evaluate } from '../src/evaluator/evaluate';
import { renderMarkdown } from '../src/report/markdown';
import { FakeLoader, find, SCHEMAS } from './helpers';

const P = 'https://p.gov.br/';
const D = 'https://p.gov.br/despesas'; // [Portal da Transparencia]/Despesas
const { informacoes: INFO, despesas: SCHEMA } = SCHEMAS;

const run = (loader: FakeLoader, extra: Partial<Parameters<typeof evaluate>[0]> = {}) =>
  evaluate({ url: P, poder: 'executivo', ...extra }, { loader });

describe('ordem numérica', () => {
  it('compareIds compara por segmento', () => {
    expect(['4.1.10', '4.1.2', '4.1.1', '10.1.1', '2.1.1'].sort(compareIds)).toEqual(['2.1.1', '4.1.1', '4.1.2', '4.1.10', '10.1.1']);
  });

  it('páginas, seções e itens do catálogo e do resultado seguem a numeração', async () => {
    const pages = pagesForPoder('executivo');
    const ids = pages.flatMap((p) => p.sections.flatMap((s) => s.items.map((i) => i.id)));
    const numbers = pages.map((p) => p.number);
    expect([...numbers].sort(compareIds)).toEqual(numbers);
    for (const p of pages) {
      const itemIds = p.sections.flatMap((s) => s.items.map((i) => i.id));
      expect([...itemIds].sort(compareIds), p.id).toEqual(itemIds);
    }

    const r = await run(new FakeLoader({ [P]: '<html></html>' }));
    expect(r.pages.flatMap((p) => p.sections.flatMap((s) => s.items.map((i) => i.id)))).toEqual(ids);
    const rows = renderMarkdown(r).split('## Pendências')[1]!.split('### Detalhes das pendências')[0]!.match(/^\| (\d+(?:\.\d+)+) \|/gm)!;
    const pend = rows.map((m) => m.replace(/[| ]/g, ''));
    expect([...pend].sort(compareIds)).toEqual(pend);
  });

  it('Ouvidoria é a página 14, entre Acessibilidade (13) e LGPD (15)', () => {
    const comum = pagesForPoder('executivo').filter((p) => p.folder === 'comum');
    const numbers = comum.map((p) => p.number);
    expect(comum.find((p) => p.id === 'comum/ouvidoria')).toMatchObject({ number: '14', title: 'Ouvidoria' });
    expect(numbers.indexOf('14')).toBe(numbers.indexOf('13') + 1);
    expect(numbers.indexOf('15')).toBe(numbers.indexOf('14') + 1);
    expect(numbers[0]).toBe('1');
  });
});

describe('filtro por ano => histórico atendido', () => {
  const html = `<div serigySchema="${SCHEMA}" serigyItem="filtroPesquisa">
      <select><option serigyValue="2026">2026</option><option serigyValue="2025">2025</option><option>2024</option></select>
    </div>`;
  it('marca historicoExercicio como ok mesmo sem serigyItem próprio', async () => {
    const i = find(await run(new FakeLoader({ [P]: '<html/>', [D]: html }), { items: ['4.1.18'] }), '4.1.18');
    expect(i.status).toBe('ok');
    expect(i.message).toContain('2026, 2025, 2024');
    expect(i.analyzedUrls).toEqual([D]);
  });

  it('sem filtro por ano continua não encontrado', async () => {
    const loader = new FakeLoader({ [P]: '<html/>', [D]: `<div serigySchema="${SCHEMA}" serigyItem="filtroPesquisa"></div>` });
    expect(find(await run(loader, { items: ['4.1.18'] }), '4.1.18').status).toBe('missing');
  });
});

describe('serigyLink', () => {
  it('iframe: o schema inteiro é buscado no destino e o iframe é identificado', async () => {
    const loader = new FakeLoader({
      [P]: '<html/>',
      [D]: `<iframe serigySchema="${SCHEMA}" serigyLink="https://externo.com/despesas" src="https://externo.com/despesas"></iframe>`,
      'https://externo.com/despesas': `<table serigySchema="${SCHEMA}"><tr><td serigyItem="valorEmpenhado">1,00</td></tr></table>`,
    });
    const r = await run(loader, { items: ['4.1.1', '4.1.2'] });
    const ok = find(r, '4.1.1');
    expect(ok).toMatchObject({ status: 'ok', analyzedUrls: ['https://externo.com/despesas'] });
    expect(ok.loadedVia).toEqual([{ kind: 'iframe', url: 'https://externo.com/despesas', tag: 'iframe' }]);
    const miss = find(r, '4.1.2');
    expect(miss).toMatchObject({ status: 'missing', analyzedUrls: ['https://externo.com/despesas'] });
    expect(miss.message).toMatch(/^O iframe aponta para https:\/\/externo\.com\/despesas/);
    expect(r.pages[0]!.iframes).toEqual([{ pageUrl: D, target: 'https://externo.com/despesas' }]);
    expect(r.fetched.find((f) => f.url === 'https://externo.com/despesas')?.origin).toBe('iframe');
    const md = renderMarkdown(r);
    expect(md).toContain('iframe com serigyLink');
    expect(md).toContain('_via iframe (serigyLink)_');
  });

  it('só segue serigyLink de schemas/itens que estão sendo avaliados', async () => {
    const loader = new FakeLoader({
      [P]: '<html/>',
      [D]: `<iframe serigySchema="${SCHEMA}" serigyLink="https://externo.com/a"></iframe>
            <iframe serigySchema="${SCHEMAS.ouvidoria}" serigyLink="https://externo.com/outro-schema"></iframe>
            <div serigySchema="${SCHEMA}" serigyItem="valorPago" serigyLink="https://externo.com/outro-item"></div>`,
      'https://externo.com/a': '<p/>',
    });
    await run(loader, { items: ['4.1.1'] });
    expect(loader.calls).toContain('https://externo.com/a');
    expect(loader.calls).not.toContain('https://externo.com/outro-schema');
    expect(loader.calls).not.toContain('https://externo.com/outro-item');
  });

  it('item com serigyLink: só é buscado no destino; sem achar, não encontrado', async () => {
    const loader = new FakeLoader({
      [P]: `<div serigySchema="${INFO}" serigyItem="pesquisaConteudo" serigyLink="https://oficial.gov.br/">busca</div>
        <div serigySchema="${INFO}" serigyItem="acessoPortal" serigyLink="https://oficial.gov.br/outra"></div>`,
      'https://oficial.gov.br/': '<html>sem marcação</html>',
      'https://oficial.gov.br/outra': `<div serigySchema="${INFO}" serigyItem="acessoPortal"><a href="/t">Portal</a></div>`,
    });
    const r = await run(loader, { items: ['1.2', '1.3'] });
    const busca = find(r, '1.3');
    expect(busca).toMatchObject({ status: 'missing', analyzedUrls: ['https://oficial.gov.br/'] });
    expect(busca.loadedVia).toEqual([{ kind: 'serigyLink', url: 'https://oficial.gov.br/', tag: 'div' }]);
    expect(busca.message).toContain('aponta para https://oficial.gov.br/');
    expect(find(r, '1.2')).toMatchObject({ status: 'ok', analyzedUrls: ['https://oficial.gov.br/outra'] });
  });

  it('meta com serigyLink segue a mesma regra documentada (sem exceção)', async () => {
    const home = `<meta serigySchema="${INFO}" serigyItem="sitioOficial" serigyLink="https://oficial.gov.br/">`;
    const go = (pages: Record<string, string>) => run(new FakeLoader({ [P]: home, ...pages }), { items: ['1.1'] });
    expect(find(await go({ 'https://oficial.gov.br/': '<html>sem marcação</html>' }), '1.1').status).toBe('missing');
    expect(find(await go({}), '1.1').message).toContain('não pôde ser acessado');
    const ok = find(await go({ 'https://oficial.gov.br/': `<p serigySchema="${INFO}" serigyItem="sitioOficial">x</p>` }), '1.1');
    expect(ok).toMatchObject({ status: 'ok', analyzedUrls: ['https://oficial.gov.br/'] });
  });

  it('URLs são comparadas sem diferenciar maiúsculas/minúsculas', async () => {
    const loader = new FakeLoader({
      [P]: '<html/>',
      [D]: `<iframe serigySchema="${SCHEMA}" serigyLink="https://ext.com/Despesas"></iframe>`,
      'https://ext.com/Despesas': `<div serigySchema="HTTPS://SERIGY.TCE.SE.GOV.BR/Comum/Despesas.html"><b serigyItem="valorEmpenhado">1,00</b></div>`,
    });
    expect(find(await run(loader, { items: ['4.1.1'] }), '4.1.1').status).toBe('ok');
  });

  it('iframe com serigySchema mas sem serigyLink gera aviso', async () => {
    const loader = new FakeLoader({ [P]: '<html/>', [D]: `<iframe serigySchema="${SCHEMA}" src="https://x.com/f"></iframe>` });
    const r = await run(loader, { items: ['4.1.1'] });
    expect(r.warnings.some((w) => w.includes('sem serigyLink') && w.includes('https://x.com/f'))).toBe(true);
  });
});

describe('detalhes de itens não atendidos', () => {
  it('traz o esperado e os exemplos da documentação, inclusive nos itens atendidos', async () => {
    const loader = new FakeLoader({ [P]: '<html/>', [D]: `<div serigySchema="${SCHEMA}"><b serigyItem="valorEmpenhado">1,00</b></div>` });
    const r = await run(loader, { items: ['4.1.1', '4.1.2'] });
    expect(find(r, '4.1.1').status).toBe('ok');
    expect(find(r, '4.1.1').examples?.length).toBeGreaterThan(0);
    const miss = find(r, '4.1.2');
    expect(miss.expected).toContain('serigyItem="valorLiquidado"');
    expect(miss.expected).toContain('monetário');
    expect(miss.examples?.length).toBeGreaterThan(0);
    expect(miss.examples![0]!.html).toContain('valorLiquidado');
    const md = renderMarkdown(r);
    expect(md).toContain('### Detalhes das pendências');
    expect(md).toContain('**Esperado:**');
    expect(md).toContain('Exemplo da documentação');
  });

  it('tipos do catálogo em formas diferentes são entendidos (Telefone)', async () => {
    const loader = new FakeLoader({
      [P]: '<html/>',
      'https://p.gov.br/ouvidoria': `<div serigySchema="${SCHEMAS.ouvidoria}"><p serigyItem="telefoneSetor">sem número</p></div>`,
    });
    const tel = find(await run(loader, { items: ['14.2'] }), '14.2');
    expect(tel.status).toBe('warning');
    expect(tel.message).toContain('telefone');
  });
});

describe('reavaliar item (mesclagem do resultado)', () => {
  it('substitui só o item e recalcula resumos', async () => {
    const before = new FakeLoader({ [P]: '<html/>', [D]: `<div serigySchema="${SCHEMA}"><b serigyItem="valorEmpenhado">1,00</b></div>` });
    const after = new FakeLoader({
      [P]: '<html/>',
      [D]: `<div serigySchema="${SCHEMA}"><b serigyItem="valorEmpenhado">1,00</b><b serigyItem="valorLiquidado">2,00</b></div>`,
    });
    const current = await run(before, { items: ['4.1.1', '4.1.2'] });
    expect(current.summary).toMatchObject({ ok: 1, missing: 1 });
    const fresh = await run(after, { items: ['4.1.2'] });
    const merged = mergeReevaluated(current, fresh, '4.1.2');
    expect(find(merged, '4.1.2').status).toBe('ok');
    expect(find(merged, '4.1.1').status).toBe('ok');
    expect(merged.summary).toMatchObject({ total: 2, ok: 2, missing: 0, score: 100 });
    expect(merged.pages[0]!.summary.score).toBe(100);
    expect(current.summary.missing).toBe(1); // o original não é alterado
  });
});
