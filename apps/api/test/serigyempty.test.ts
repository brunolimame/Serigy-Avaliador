import { describe, expect, it } from 'vitest';
import { evaluate } from '../src/evaluator/evaluate';
import { reasonProblem, sanitizeReason } from '../src/evaluator/serigy-empty';
import { renderMarkdown } from '../src/report/markdown';
import { FakeLoader, find, SCHEMAS } from './helpers';

const P = 'https://p.gov.br/';
const SCHEMA = SCHEMAS.despesas;

/** Portal cuja página /despesas traz o HTML informado, dentro do schema esperado. */
const run = (body: string, items = ['4.1.1']) =>
  evaluate(
    { url: P, poder: 'executivo', items },
    { loader: new FakeLoader({ [P]: '<html/>', 'https://p.gov.br/despesas': `<div serigySchema="${SCHEMA}">${body}</div>` }) },
  );

const empty = (item: string, reason: string) => `<b serigyItem="${item}" serigyEmpty="${reason}">-</b>`;

describe('sanitização e validação do motivo', () => {
  it('sanitizeReason remove tags e caracteres de controle e junta espaços', () => {
    expect(sanitizeReason('<b>ainda   não\tdefinido</b>')).toBe('ainda não definido');
    expect(sanitizeReason('  linha 1\nlinha 2  ')).toBe('linha 1 linha 2');
    expect(sanitizeReason(`${'a'.repeat(300)}`)).toHaveLength(200);
    expect(sanitizeReason('<i></i>   ')).toBe('');
  });

  it('reasonProblem aceita motivos reais e recusa placeholders/textos sem conteúdo', () => {
    for (const ok of ['ainda não foi definido', 'Em apuração', 'dados serão publicados em novembro']) {
      expect(reasonProblem(ok), ok).toBeNull();
    }
    for (const bad of ['-', '...', 'n/a', 'N/A', 'xx', 'teste', 'nada', 'vazio', 'null', 'aaaaaa', '123']) {
      expect(reasonProblem(bad), bad).not.toBeNull();
    }
  });
});

describe('serigyEmpty declarado com motivo', () => {
  it('motivo válido e sem conteúdo: "serigyEmpty declarado" com o motivo; atende parcialmente e conta no percentual', async () => {
    const r = await run(empty('valorEmpenhado', 'ainda não definido'));
    const i = find(r, '4.1.1');
    expect(i.status).toBe('empty');
    expect(i.message).toBe('serigyEmpty declarado — motivo: "ainda não definido" (atende parcialmente)');
    expect(i.serigyEmpty).toEqual([{ motivo: 'ainda não definido', valido: true, pageUrl: 'https://p.gov.br/despesas' }]);
    expect(r.summary).toMatchObject({ empty: 1, score: 100 }); // o percentual é mantido: empty conta como atendido
  });

  it('o motivo é sanitizado antes de ser exibido', async () => {
    const i = find(await run(empty('valorEmpenhado', '<b>ainda   não   definido</b>')), '4.1.1');
    expect(i.status).toBe('empty');
    expect(i.serigyEmpty![0]!.motivo).toBe('ainda não definido');
    expect(i.message).not.toContain('<b>');
  });
});

describe('serigyEmpty declarado sem motivo ou com motivo inválido', () => {
  it('motivo em branco: "serigyEmpty declarado mas motivo não informado"; o item não é atendido', async () => {
    for (const blank of ['', '   ', '<br>']) {
      const r = await run(empty('valorEmpenhado', blank));
      const i = find(r, '4.1.1');
      expect(i.status, JSON.stringify(blank)).toBe('warning');
      expect(i.message).toBe('serigyEmpty declarado mas motivo não informado');
      expect(r.summary.score).toBe(0); // não conta como atendido
    }
  });

  it('motivo sem conteúdo válido (placeholder, poucas letras): não atende e explica o porquê', async () => {
    for (const bad of ['-', 'n/a', 'xx', 'teste', 'nada']) {
      const i = find(await run(empty('valorEmpenhado', bad)), '4.1.1');
      expect(i.status, bad).toBe('warning');
      expect(i.message, bad).toContain(`serigyEmpty declarado, mas motivo inválido ("${bad}")`);
      expect(i.serigyEmpty![0]).toMatchObject({ valido: false });
    }
  });

  it('motivo repetido em outro serigyEmpty da mesma página: não atende nenhum dos dois; distintos atendem', async () => {
    const dup = await run(empty('valorEmpenhado', 'Dados em apuração.') + empty('valorLiquidado', 'dados em apuracao'), ['4.1.1', '4.1.2']);
    for (const id of ['4.1.1', '4.1.2']) {
      expect(find(dup, id).status, id).toBe('warning');
      expect(find(dup, id).message, id).toContain('se repete em 2 serigyEmpty desta página');
    }
    const distinct = await run(empty('valorEmpenhado', 'dados em apuração') + empty('valorLiquidado', 'aguardando fechamento do mês'), ['4.1.1', '4.1.2']);
    expect(find(distinct, '4.1.1').status).toBe('empty');
    expect(find(distinct, '4.1.2').status).toBe('empty');
  });
});

describe('serigyEmpty é avaliado sempre que declarado', () => {
  const filled = '<b serigyItem="valorEmpenhado">1,00</b>';

  it('com conteúdo preenchido e serigyEmpty válido em outra ocorrência: segue ok e informa o motivo', async () => {
    const i = find(await run(filled + empty('valorEmpenhado', 'ainda não definido')), '4.1.1');
    expect(i.status).toBe('ok');
    expect(i.message).toContain('Encontrado (1 ocorrência(s))');
    expect(i.message).toContain('serigyEmpty declarado — motivo: "ainda não definido"');
  });

  it('com conteúdo preenchido e serigyEmpty em branco em outra ocorrência: não atende', async () => {
    const i = find(await run(filled + empty('valorEmpenhado', '')), '4.1.1');
    expect(i.status).toBe('warning');
    expect(i.message).toContain('Encontrado (1 ocorrência(s))');
    expect(i.message).toContain('serigyEmpty declarado mas motivo não informado');
  });

  it('também em itens de exportação (salvarRelatorio)', async () => {
    const i = find(
      await run('<a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>' + empty('salvarRelatorio', ''), ['4.1.16']),
      '4.1.16',
    );
    expect(i.status).toBe('warning');
    expect(i.message).toContain('motivo não informado');
  });
});

describe('schema incorreto + serigyEmpty', () => {
  const WRONG = 'https://outro.exemplo.gov.br/comum/despesas.html';
  const runWrong = (body: string) =>
    evaluate(
      { url: P, poder: 'executivo', items: ['4.1.1'] },
      { loader: new FakeLoader({ [P]: '<html/>', 'https://p.gov.br/despesas': `<div serigySchema="${WRONG}">${body}</div>` }) },
    );

  it('com motivo válido: primeiro a informação do schema, depois o serigyEmpty declarado; não é atendido', async () => {
    const i = find(await runWrong(empty('valorEmpenhado', 'ainda não definido')), '4.1.1');
    expect(i.status).toBe('warning');
    expect(i.message.startsWith('Item encontrado, mas o schema não confere')).toBe(true);
    expect(i.message.indexOf('o schema não confere')).toBeLessThan(i.message.indexOf('serigyEmpty declarado — motivo: "ainda não definido"'));
    expect(i.schema.confere).toBe(false);
    expect(i.serigyEmpty![0]!.valido).toBe(true);
  });

  it('com motivo em branco: schema primeiro, depois "motivo não informado"', async () => {
    const i = find(await runWrong(empty('valorEmpenhado', '')), '4.1.1');
    expect(i.status).toBe('warning');
    expect(i.message.indexOf('o schema não confere')).toBeLessThan(i.message.indexOf('serigyEmpty declarado mas motivo não informado'));
  });
});

describe('apresentação', () => {
  it('relatório: rótulo "serigyEmpty declarado" e o detalhe do motivo nas pendências', async () => {
    const ok = renderMarkdown(await run(empty('valorEmpenhado', 'ainda não definido')));
    expect(ok).toContain('serigyEmpty declarado');
    expect(ok).not.toContain('Vazio declarado');

    const bad = renderMarkdown(await run(empty('valorEmpenhado', '')));
    expect(bad).toContain('**serigyEmpty:** declarado mas motivo não informado');
  });
});
