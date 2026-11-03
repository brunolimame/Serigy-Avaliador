import { describe, expect, it } from 'vitest';
import type { Catalog, StreamEvent } from '@serigy/shared';
import { prepareEvaluation } from '../src/evaluator/evaluate';
import { FakeLoader, find } from './helpers';

/**
 * Caso: uma página (seção A) tem um serigyLink para outra página (B), e B também é uma seção da documentação.
 * A página B não deve ser baixada nem analisada de novo só porque já foi analisada como destino do serigyLink.
 */

const P = 'https://p.gov.br/';
const B = 'https://p.gov.br/institucional';
const SCHEMA = 'https://serigy.tce.se.gov.br/comum/teste.html';

const catalogo: Catalog = {
  generatedAt: '2026-11-03T00:00:00Z',
  source: 'teste',
  pages: [
    {
      id: 'comum/teste',
      folder: 'comum',
      number: '1',
      title: 'Teste',
      schemaUrl: SCHEMA,
      docUrl: 'https://serigy.tce.se.gov.br/2026/comum/teste.html',
      sections: [
        {
          id: '1.1',
          title: 'Associados',
          caminhoUrl: '[Portal da Transparencia]/Associados',
          notes: [],
          items: [{ id: '1.1.1', criterios: ['1.1'], descricao: 'Item com link', atributo: 'linkItem', tipos: ['Texto'] }],
        },
        {
          id: '1.2',
          title: 'Institucional',
          caminhoUrl: '[Portal da Transparencia]/Institucional',
          notes: [],
          items: [{ id: '1.2.1', criterios: ['1.2'], descricao: 'Item da seção', atributo: 'outroItem', tipos: ['Texto'] }],
        },
      ],
    },
  ],
};

// A: /associados, com o item linkItem apontando para B (serigyLink no próprio item). B: /institucional, com os dois itens.
const A_HTML = `<html><body><div serigySchema="${SCHEMA}"><span serigyItem="linkItem" serigyLink="${B}">link</span></div></body></html>`;
const B_HTML = `<html><body><div serigySchema="${SCHEMA}"><b serigyItem="linkItem">valor do link</b><b serigyItem="outroItem">valor da seção</b></div></body></html>`;
const A = `${P}associados`;

const rodar = (loader: FakeLoader) => {
  const events: StreamEvent[] = [];
  const prepared = prepareEvaluation(
    { url: P, poder: 'executivo', items: ['1.1.1', '1.2.1'] },
    { loader, catalog: catalogo, now: () => new Date('2026-11-03T12:00:00Z') },
  );
  return prepared.run((e) => events.push(e)).then((result) => ({ result, events }));
};

describe('página que é destino de serigyLink e também seção não é baixada nem analisada de novo', () => {
  it('B é baixada uma única vez, mesmo sendo destino de serigyLink e seção da documentação', async () => {
    const loader = new FakeLoader({ [P]: '<html/>', [A]: A_HTML, [B]: B_HTML });
    await rodar(loader);
    expect(loader.calls.filter((u) => u === B)).toHaveLength(1);
  });

  it('o evento fetched de B aparece uma única vez na avaliação', async () => {
    const loader = new FakeLoader({ [P]: '<html/>', [A]: A_HTML, [B]: B_HTML });
    const { events } = await rodar(loader);
    const baixadas = events.filter((e) => e.type === 'fetched' && e.page.url === B);
    expect(baixadas).toHaveLength(1);
  });

  it('os dois itens são avaliados sobre B (pelo serigyLink e pela seção), e cada um atende', async () => {
    const loader = new FakeLoader({ [P]: '<html/>', [A]: A_HTML, [B]: B_HTML });
    const { result } = await rodar(loader);
    expect(find(result, '1.1.1').status).toBe('ok');
    expect(find(result, '1.2.1').status).toBe('ok');
  });
});
