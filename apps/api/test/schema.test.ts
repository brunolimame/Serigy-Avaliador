import { describe, expect, it } from 'vitest';
import { scoreTone } from '../../web/src/score';
import { evaluate } from '../src/evaluator/evaluate';
import { canonicalSchema } from '../src/evaluator/markup';
import { renderMarkdown } from '../src/report/markdown';
import { FakeLoader, find, SCHEMAS } from './helpers';

const P = 'https://p.gov.br/';
const EXPECTED = SCHEMAS.despesas; // https://serigy.tce.se.gov.br/comum/despesas.html

/** Portal cuja página /despesas declara o schema informado e o item valorEmpenhado (4.1.1). */
const run = (schemaAttr: string, extra = '') =>
  evaluate(
    { url: P, poder: 'executivo', items: ['4.1.1'] },
    { loader: new FakeLoader({ [P]: '<html/>', 'https://p.gov.br/despesas': `<div serigySchema="${schemaAttr}"><b serigyItem="valorEmpenhado">1,00</b></div>${extra}` }) },
  );

describe('canonicalSchema', () => {
  it('ignora caixa, barra final, espaços e o prefixo /2026, mas mantém protocolo e host', () => {
    const base = canonicalSchema(EXPECTED);
    expect(canonicalSchema(`  ${EXPECTED.toUpperCase()}/ `)).toBe(base);
    expect(canonicalSchema('https://serigy.tce.se.gov.br/2026/comum/despesas.html')).toBe(base);
    expect(canonicalSchema('http://serigy.tce.se.gov.br/comum/despesas.html')).not.toBe(base);
    expect(canonicalSchema('https://outro.gov.br/comum/despesas.html')).not.toBe(base);
  });
});

describe('validação do schema encontrado x esperado', () => {
  it('endereço igual ao esperado: item ok e schema confere', async () => {
    const i = find(await run(EXPECTED), '4.1.1');
    expect(i.status).toBe('ok');
    expect(i.schema).toEqual({ esperado: EXPECTED, encontrado: EXPECTED, confere: true });
  });

  it('variações aceitas: caixa, barra final e prefixo /2026', async () => {
    for (const variant of [EXPECTED.toUpperCase(), `${EXPECTED}/`, 'https://serigy.tce.se.gov.br/2026/comum/despesas.html']) {
      const i = find(await run(variant), '4.1.1');
      expect(i.status, variant).toBe('ok');
      expect(i.schema.confere, variant).toBe(true);
    }
  });

  it('mesmo caminho em outro host ou protocolo: atenção, com encontrado x esperado', async () => {
    for (const wrong of ['https://outro.exemplo.gov.br/comum/despesas.html', 'http://serigy.tce.se.gov.br/comum/despesas.html']) {
      const i = find(await run(wrong), '4.1.1');
      expect(i.status, wrong).toBe('warning');
      expect(i.schema).toEqual({ esperado: EXPECTED, encontrado: wrong, confere: false });
      expect(i.message).toContain('o schema não confere');
      expect(i.message).toContain(wrong);
      expect(i.message).toContain(EXPECTED);
    }
  });

  it('item sob um schema de outro caminho: não encontrado, mostrando o schema encontrado', async () => {
    const other = 'https://serigy.tce.se.gov.br/comum/receitas.html';
    const i = find(await run(other), '4.1.1');
    expect(i.status).toBe('missing');
    expect(i.schema).toMatchObject({ esperado: EXPECTED, encontrado: other, confere: false });
    expect(i.message).toContain(other);
    expect(i.message).toContain(`esperado: ${EXPECTED}`);
  });

  it('havendo ocorrência com o schema exato e outra com schema errado, vale a exata', async () => {
    const wrong = 'https://outro.gov.br/comum/despesas.html';
    const i = find(await run(EXPECTED, `<div serigySchema="${wrong}"><b serigyItem="valorEmpenhado">2,00</b></div>`), '4.1.1');
    expect(i.status).toBe('ok');
    expect(i.schema).toEqual({ esperado: EXPECTED, encontrado: EXPECTED, confere: true });
  });

  it('item não encontrado: sem schema encontrado', async () => {
    const i = find(
      await evaluate({ url: P, poder: 'executivo', items: ['4.1.1'] }, { loader: new FakeLoader({ [P]: '<html/>', 'https://p.gov.br/despesas': '<p/>' }) }),
      '4.1.1',
    );
    expect(i.status).toBe('missing');
    expect(i.schema).toEqual({ esperado: EXPECTED, confere: false });
  });

  it('o relatório mostra schema esperado x encontrado nas pendências', async () => {
    const wrong = 'https://outro.gov.br/comum/despesas.html';
    const md = renderMarkdown(await run(wrong));
    expect(md).toContain('**Schema:** ❌ não confere');
    expect(md).toContain(wrong);
  });
});

describe('cor do percentual de atendimento', () => {
  it('< 40% vermelho; de 40% a < 100% amarelo; 100% verde', () => {
    expect(scoreTone(0)).toBe('red');
    expect(scoreTone(39.9)).toBe('red');
    expect(scoreTone(40)).toBe('amber');
    expect(scoreTone(66.7)).toBe('amber');
    expect(scoreTone(99.9)).toBe('amber');
    expect(scoreTone(100)).toBe('green');
  });
});
