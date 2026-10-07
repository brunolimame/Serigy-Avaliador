import { describe, expect, it } from 'vitest';
import { groupPagesByNumber, summarize } from '@serigy/shared';
import { mergeReevaluated, mergeReevaluatedMany } from '../../web/src/merge';
import { pagesForPoder } from '../src/catalog/load';
import { evaluate } from '../src/evaluator/evaluate';
import { FakeLoader, find } from './helpers';

const P = 'https://p.gov.br/';

// Item 11 dos consórcios = comum + consorcios-publicos (duas pastas, um grupo só).
const group11 = groupPagesByNumber(pagesForPoder('consorcios-publicos')).find((g) => g.number === '11')!;
const group11Ids = group11.sections.flatMap((s) => s.items.map((i) => i.id));

const COMUM = 'https://serigy.tce.se.gov.br/comum/planejamento-prestacao-contas.html';
const CONSORCIOS = 'https://serigy.tce.se.gov.br/consorcios/planejamento-prestacao-contas.html';

const blank = () => new FakeLoader({ [P]: '<html/>' });
const filled = () =>
  new FakeLoader({
    [P]: '<html/>',
    // [Portal da Transparencia]/PlanejamentoPrestacaoContas/BalancoGeral (comum, 11.1.1)
    'https://p.gov.br/planejamentoprestacaocontas/balancogeral': `<div serigySchema="${COMUM}"><a serigyItem="balancoGeralAnoAnterior" href="/balanco.pdf">Balanço</a></div>`,
    // [Portal da Transparencia]/PlanejamentoPrestacaoContas/RREO (consórcios, 11.6.1)
    'https://p.gov.br/planejamentoprestacaocontas/rreo': `<div serigySchema="${CONSORCIOS}"><a serigyItem="RREO" href="/rreo.pdf">RREO</a></div>`,
  });

const run = (loader: FakeLoader, items: string[]) => evaluate({ url: P, poder: 'consorcios-publicos', items }, { loader });

describe('reavaliar todos os itens de um grupo', () => {
  it('o grupo 11 dos consórcios reúne itens de duas pastas', () => {
    expect(group11.pages.map((p) => p.folder)).toEqual(['comum', 'consorcios-publicos']);
    expect(group11Ids.length).toBeGreaterThan(20);
  });

  it('uma única chamada com os itens do grupo atualiza os itens das duas pastas e os resumos', async () => {
    const before = await run(blank(), group11Ids);
    expect(before.summary).toMatchObject({ total: group11Ids.length, ok: 0 });

    const loader = filled();
    const fresh = await run(loader, group11Ids);
    // cada página é baixada uma única vez, mesmo reavaliando o grupo inteiro
    expect(new Set(loader.calls).size).toBe(loader.calls.length);

    const merged = mergeReevaluatedMany(before, fresh);
    expect(find(merged, '11.1.1').status).toBe('ok'); // pasta comum
    expect(find(merged, '11.6.1').status).toBe('ok'); // pasta consorcios-publicos
    expect(merged.summary.ok).toBe(2);
    expect(merged.summary.total).toBe(before.summary.total);

    // as duas páginas (pastas) do grupo foram atualizadas, com resumo recalculado e schema encontrado
    for (const folder of ['comum', 'consorcios-publicos']) {
      const page = merged.pages.find((p) => p.id === `${folder}/planejamento-prestacao-contas`)!;
      expect(page.schemaFound, folder).toBe(true);
      expect(page.summary, folder).toEqual(summarize(page.sections.flatMap((s) => s.items)));
      expect(page.summary.ok, folder).toBe(1);
    }
    // o resultado original não é alterado
    expect(before.summary.ok).toBe(0);
  });

  it('só substitui os itens reavaliados; os demais resultados ficam como estavam', async () => {
    const before = await run(filled(), group11Ids);
    const ok = before.summary.ok;
    // reavalia só dois itens, agora com o portal fora do ar para eles
    const fresh = await run(blank(), ['11.1.1', '11.6.1']);
    const merged = mergeReevaluatedMany(before, fresh);
    expect(find(merged, '11.1.1').status).toBe('missing');
    expect(find(merged, '11.6.1').status).toBe('missing');
    expect(merged.summary.ok).toBe(ok - 2);
    expect(merged.summary.total).toBe(before.summary.total);
    // um item que não foi reavaliado permanece igual
    expect(find(merged, '11.2.1')).toEqual(find(before, '11.2.1'));
  });

  it('mergeReevaluated (um item) continua trocando só aquele item', async () => {
    const before = await run(blank(), group11Ids);
    const fresh = await run(filled(), ['11.1.1', '11.6.1']);
    const merged = mergeReevaluated(before, fresh, '11.1.1');
    expect(find(merged, '11.1.1').status).toBe('ok');
    expect(find(merged, '11.6.1').status).toBe('missing'); // veio no fresh, mas não foi pedido
  });

  it('sem itens no resultado reavaliado, devolve o resultado atual', async () => {
    const before = await run(blank(), ['11.1.1']);
    const fresh = await run(blank(), ['11.1.1']);
    expect(mergeReevaluatedMany(before, { ...fresh, pages: [] })).toBe(before);
  });
});
