import { describe, expect, it } from 'vitest';
import { compareIds, groupPagesByNumber, PODERES } from '@serigy/shared';
import { pagesForPoder } from '../src/catalog/load';
import { evaluate } from '../src/evaluator/evaluate';
import { renderMarkdown } from '../src/report/markdown';
import { FakeLoader } from './helpers';

const itemIds = (pages: ReturnType<typeof pagesForPoder>) => pages.flatMap((p) => p.sections.flatMap((s) => s.items.map((i) => i.id)));

describe('um item da matriz = um número (grupos)', () => {
  it('consórcios: o item 11 junta comum + consorcios-publicos, com as seções em ordem numérica', () => {
    const groups = groupPagesByNumber(pagesForPoder('consorcios-publicos'));
    const g11 = groups.filter((g) => g.number === '11');
    expect(g11).toHaveLength(1); // antes aparecia em dois blocos
    expect(g11[0]!.title).toBe('Planejamento e Prestação de Contas');
    expect(g11[0]!.pages.map((p) => p.folder)).toEqual(['comum', 'consorcios-publicos']);
    expect(g11[0]!.sections.map((s) => s.id)).toEqual(['11.1', '11.2', '11.3', '11.5', '11.6', '11.7', '11.11']);
    // cada seção sabe de qual página (pasta) veio
    expect(g11[0]!.sections.find((s) => s.id === '11.6')!.page.folder).toBe('consorcios-publicos');
    expect(g11[0]!.sections.find((s) => s.id === '11.5')!.page.folder).toBe('comum');
  });

  it('para todos os poderes: números únicos, em ordem, sem perder nem duplicar itens', () => {
    for (const poder of PODERES) {
      const pages = pagesForPoder(poder.id);
      const groups = groupPagesByNumber(pages);
      const numbers = groups.map((g) => g.number);
      expect(new Set(numbers).size, poder.id).toBe(numbers.length);
      expect([...numbers].sort(compareIds), poder.id).toEqual(numbers);
      const grouped = groups.flatMap((g) => g.sections.flatMap((s) => s.items.map((i) => i.id)));
      expect(grouped.length, poder.id).toBe(itemIds(pages).length);
      expect([...grouped].sort(), poder.id).toEqual([...itemIds(pages)].sort());
      for (const g of groups) {
        const ids = g.sections.map((s) => s.id);
        expect([...ids].sort(compareIds), `${poder.id} ${g.number}`).toEqual(ids);
      }
    }
  });

  it('os números repetidos entre pastas são 3, 4, 8 e 11 (e só viram um grupo para o poder que os tem)', () => {
    const repetidos = (poder: Parameters<typeof pagesForPoder>[0]) =>
      groupPagesByNumber(pagesForPoder(poder))
        .filter((g) => g.pages.length > 1)
        .map((g) => g.number);
    expect(repetidos('executivo')).toEqual(['3', '11']);
    expect(repetidos('estatais')).toEqual(['4', '8', '11']);
    expect(repetidos('legislativo')).toEqual([]);
  });

  it('o relatório mostra o item 11 uma única vez (resumo e detalhamento)', async () => {
    const r = await evaluate(
      { url: 'https://p.gov.br/', poder: 'consorcios-publicos' },
      { loader: new FakeLoader({ 'https://p.gov.br/': '<html/>' }) },
    );
    expect(r.pages.filter((p) => p.number === '11')).toHaveLength(2); // o resultado guarda uma página por pasta...
    const md = renderMarkdown(r); // ...mas o relatório junta por número
    expect(md.match(/^### 11\. Planejamento e Prestação de Contas$/gm)).toHaveLength(1);
    const resumo = md.split('## Resumo por página')[1]!.split('## Pendências')[0]!;
    expect(resumo.match(/\| 11\. Planejamento/g)).toHaveLength(1);
    // as duas pastas aparecem identificadas dentro do grupo, e as seções saem em ordem numérica
    expect(md).toContain('`comum/planejamento-prestacao-contas` — Schema esperado');
    expect(md).toContain('`consorcios-publicos/planejamento-prestacao-contas` — Schema esperado');
    const detalhamento = md.split('## Detalhamento')[1]!.split('## Páginas analisadas')[0]!;
    const secoes = [...detalhamento.matchAll(/^#### (11\.\d+)\. /gm)].map((m) => m[1]!);
    expect(secoes).toEqual(['11.1', '11.2', '11.3', '11.5', '11.6', '11.7', '11.11']);
  });
});
