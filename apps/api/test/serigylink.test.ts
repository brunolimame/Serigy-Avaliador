import { describe, expect, it } from 'vitest';
import { evaluate } from '../src/evaluator/evaluate';
import { renderMarkdown } from '../src/report/markdown';
import { FakeLoader, find, SCHEMAS } from './helpers';

const P = 'https://p.gov.br/';
const D = 'https://p.gov.br/despesas'; // [Portal da Transparencia]/Despesas
const SCHEMA = SCHEMAS.despesas;
const TARGET = 'https://ext.com/d';
const targetPage = `<div serigySchema="${SCHEMA}"><b serigyItem="valorEmpenhado">1,00</b></div>`;

const run = (pages: Record<string, string>, items = ['4.1.1']) =>
  evaluate({ url: P, poder: 'executivo', items }, { loader: new FakeLoader({ [P]: '<html/>', ...pages }) });

describe('serigyLink vale em qualquer tag', () => {
  // elemento com o schema + serigyLink, sem serigyItem: o schema inteiro é buscado no destino
  const tags: Array<[string, string]> = [
    ['iframe', `<iframe serigySchema="${SCHEMA}" serigyLink="${TARGET}"></iframe>`],
    ['a', `<a serigySchema="${SCHEMA}" serigyLink="${TARGET}" href="${TARGET}">ver</a>`],
    ['div', `<div serigySchema="${SCHEMA}" serigyLink="${TARGET}">conteúdo</div>`],
    ['section', `<section serigySchema="${SCHEMA}" serigyLink="${TARGET}"></section>`],
    ['span', `<span serigySchema="${SCHEMA}" serigyLink="${TARGET}"></span>`],
    ['button', `<button serigySchema="${SCHEMA}" serigyLink="${TARGET}">abrir</button>`],
    ['meta', `<meta serigySchema="${SCHEMA}" serigyLink="${TARGET}">`],
    ['link', `<link serigySchema="${SCHEMA}" serigyLink="${TARGET}">`],
  ];

  it.each(tags)('<%s>: a URL do serigyLink é baixada e avaliada', async (tag, html) => {
    const r = await run({ [D]: html, [TARGET]: targetPage });
    const i = find(r, '4.1.1');
    expect(i, tag).toMatchObject({ status: 'ok', analyzedUrls: [TARGET] });
    expect(i.loadedVia?.[0], tag).toMatchObject({ url: TARGET, tag, kind: tag === 'iframe' ? 'iframe' : 'serigyLink' });
    expect(r.fetched.find((f) => f.url === TARGET)?.origin, tag).toBe(tag === 'iframe' ? 'iframe' : 'serigyLink');
  });
});

describe('serigyLink fora de qualquer serigySchema', () => {
  it('sem serigyItem: o schema avaliado é buscado no destino', async () => {
    const r = await run({ [D]: `<a serigyLink="${TARGET}" href="${TARGET}">dados</a>`, [TARGET]: targetPage });
    expect(find(r, '4.1.1')).toMatchObject({ status: 'ok', analyzedUrls: [TARGET] });
  });

  it('com serigyItem: só esse item é buscado no destino', async () => {
    const r = await run(
      { [D]: `<a serigyItem="valorEmpenhado" serigyLink="${TARGET}" href="${TARGET}">empenhado</a>`, [TARGET]: targetPage },
      ['4.1.1', '4.1.2'],
    );
    expect(find(r, '4.1.1')).toMatchObject({ status: 'ok', analyzedUrls: [TARGET] });
    // valorLiquidado não está no destino e o serigyLink só vale para valorEmpenhado: segue o fluxo normal
    expect(find(r, '4.1.2').status).toBe('missing');
    expect(find(r, '4.1.2').loadedVia).toBeUndefined();
  });

  it('item de exportação nunca é seguido, em nenhuma tag', async () => {
    const loader = new FakeLoader({
      [P]: '<html/>',
      [D]: `<a serigyItem="salvarRelatorio" serigyLink="https://exp.com/x" href="/x">exportar</a>`,
    });
    await evaluate({ url: P, poder: 'executivo', items: ['4.1.16'] }, { loader });
    expect(loader.calls).not.toContain('https://exp.com/x');
  });

  it('item de exportação é procurado no destino do serigyLink do schema inteiro', async () => {
    const r = await run(
      {
        [D]: `<div serigySchema="${SCHEMA}" serigyLink="${TARGET}"></div>`,
        [TARGET]: `<div serigySchema="${SCHEMA}"><a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a></div>`,
      },
      ['4.1.16'],
    );
    expect(find(r, '4.1.16')).toMatchObject({ status: 'ok', analyzedUrls: [TARGET] });
  });

  it('não baixa serigyLink de item que não está sendo avaliado', async () => {
    const loader = new FakeLoader({
      [P]: '<html/>',
      [D]: `<a serigyItem="valorPago" serigyLink="https://ext.com/outro" href="/x">pago</a>`,
    });
    await evaluate({ url: P, poder: 'executivo', items: ['4.1.1'] }, { loader }); // valorPago (4.1.3) não foi pedido
    expect(loader.calls).not.toContain('https://ext.com/outro');
  });
});

describe('serigyLink encadeado', () => {
  it('o destino também pode ter serigyLink: toda a cadeia é baixada e avaliada', async () => {
    const MID = 'https://mid.com/p';
    const r = await run({
      [D]: `<div serigyLink="${MID}">portal externo</div>`,
      [MID]: `<a serigySchema="${SCHEMA}" serigyLink="${TARGET}" href="${TARGET}">dados</a>`,
      [TARGET]: targetPage,
    });
    const i = find(r, '4.1.1');
    expect(i).toMatchObject({ status: 'ok', analyzedUrls: [TARGET] });
    expect(i.loadedVia?.map((v) => v.url)).toEqual([MID, TARGET]); // cadeia na ordem
    expect(r.fetched.filter((f) => f.origin !== 'inicial' && f.origin !== 'documentacao').map((f) => f.url)).toEqual([MID, TARGET]);
  });

  it('ciclo de serigyLink não trava a avaliação', async () => {
    const A = 'https://a.com/1';
    const B = 'https://b.com/2';
    const r = await run({ [D]: `<div serigyLink="${A}"></div>`, [A]: `<div serigyLink="${B}"></div>`, [B]: `<div serigyLink="${A}"></div>` });
    expect(find(r, '4.1.1').status).toBe('missing');
    expect(find(r, '4.1.1').loadedVia?.map((v) => v.url)).toEqual([A, B]);
  });
});

describe('apresentação', () => {
  it('o relatório informa a tag que declarou o serigyLink', async () => {
    const r = await run({ [D]: `<a serigySchema="${SCHEMA}" serigyLink="${TARGET}" href="${TARGET}">ver</a>`, [TARGET]: '<p>sem marcação</p>' });
    expect(find(r, '4.1.1').status).toBe('missing');
    expect(renderMarkdown(r)).toContain('Via serigyLink (`<a>`)');
  });
});
