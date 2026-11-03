import type { Server } from 'node:http';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { evaluationDuration, formatDuration, parseSerigyDetalhe, SERIGY_CODIGOS, serigySummarize, type EvaluationResult, type SerigyOficialItem } from '@serigy/shared';
import { createApp } from '../src/app';
import { AvaliacoesRepo, PortaisRepo, SettingsRepo } from '../src/db';
import { openDatabase } from '../src/db/database';
import { evaluate } from '../src/evaluator/evaluate';
import { buildEnvelope, parseEnvelope } from '../src/history/envelope';
import { pairSerigy, parseSerigyArquivo } from '../src/history/serigy';
import { renderMarkdown } from '../src/report/markdown';
import { FakeLoader, find, SCHEMAS } from './helpers';

const P = 'https://p.gov.br/';
const D = 'https://p.gov.br/despesas'; // [Portal da Transparencia]/Despesas
const SCHEMA = SCHEMAS.despesas;

const run = (loader: FakeLoader, extra: Partial<Parameters<typeof evaluate>[0]> = {}) =>
  evaluate({ url: P, poder: 'executivo', ...extra }, { loader });

describe('veredito Serigy — historicoExercicio', () => {
  const filtro = (inner: string) => `<div serigySchema="${SCHEMA}" serigyItem="filtroPesquisa">${inner}</div>`;
  const select = '<select serigyItem="historicoExercicio"><option serigyValue="2026">2026</option></select>';

  it('select com serigyItem e botão com serigyExecuteWaitSection pontua', async () => {
    const html = filtro(`${select}<button serigyExecuteWaitSection="tabela">Pesquisar</button>`) + '<div serigyLoadSection="tabela"></div>';
    const i = find(await run(new FakeLoader({ [P]: '<html/>', [D]: html }), { items: ['4.1.18'] }), '4.1.18');
    expect(i.status).toBe('ok');
    expect(i.serigy).toEqual({ ponto: true });
  });

  it('sem LoadSection no HTML ainda pontua, com aviso', async () => {
    const html = filtro(`${select}<button serigyExecuteWaitSection="tabela">Pesquisar</button>`);
    const i = find(await run(new FakeLoader({ [P]: '<html/>', [D]: html }), { items: ['4.1.18'] }), '4.1.18');
    expect(i.serigy?.ponto).toBe(true);
    expect(i.serigy?.detalhe).toContain('serigyLoadSection');
  });

  it('select com serigyItem mas sem serigyExecuteWaitSection: o Serigy não pontua e o item vira Atenção', async () => {
    const i = find(await run(new FakeLoader({ [P]: '<html/>', [D]: filtro(`${select}<button>Buscar</button>`) }), { items: ['4.1.18'] }), '4.1.18');
    expect(i.status).toBe('warning');
    expect(i.message).toContain('Atenção: o Serigy estimado não pontua este item');
    expect(i.serigy).toMatchObject({ ponto: false, codigo: 'WAITSECTION_NOT_FOUND' });
  });

  it('só um select de anos (atalho do avaliador) não pontua e o item vira Atenção', async () => {
    const html = filtro('<select><option serigyValue="2026">2026</option><option>2025</option></select>');
    const i = find(await run(new FakeLoader({ [P]: '<html/>', [D]: html }), { items: ['4.1.18'] }), '4.1.18');
    expect(i.status).toBe('warning');
    expect(i.serigy).toMatchObject({ ponto: false, codigo: 'WAITSECTION_NOT_FOUND' });
  });
});

describe('veredito Serigy — demais casos', () => {
  it('atendido pontua', async () => {
    const html = `<table serigySchema="${SCHEMA}"><tr><td serigyItem="valorEmpenhado">1,00</td></tr></table>`;
    const i = find(await run(new FakeLoader({ [P]: '<html/>', [D]: html }), { items: ['4.1.1'] }), '4.1.1');
    expect(i.serigy).toEqual({ ponto: true });
  });

  it('só o cabeçalho (<th>) é "Atenção" no avaliador e pontua no Serigy', async () => {
    const html = `<table serigySchema="${SCHEMA}"><tr><th serigyItem="valorEmpenhado">Valor</th></tr></table>`;
    const i = find(await run(new FakeLoader({ [P]: '<html/>', [D]: html }), { items: ['4.1.1'] }), '4.1.1');
    expect(i.status).toBe('warning');
    expect(i.serigy?.ponto).toBe(true);
  });

  it('valor fora do tipo é "Atenção" no avaliador e pontua no Serigy', async () => {
    const html = `<table serigySchema="${SCHEMA}"><tr><td serigyItem="valorEmpenhado">Mais detalhes</td></tr></table>`;
    const i = find(await run(new FakeLoader({ [P]: '<html/>', [D]: html }), { items: ['4.1.1'] }), '4.1.1');
    expect(i.status).toBe('warning');
    expect(i.serigy?.ponto).toBe(true);
  });

  it('schema diferente do esperado não pontua (SCHEMA_NOT_FOUND)', async () => {
    const html = `<table serigySchema="https://outro.gov.br/comum/despesas.html"><tr><td serigyItem="valorEmpenhado">1,00</td></tr></table>`;
    const i = find(await run(new FakeLoader({ [P]: '<html/>', [D]: html }), { items: ['4.1.1'] }), '4.1.1');
    expect(i.status).toBe('warning');
    expect(i.serigy).toMatchObject({ ponto: false, codigo: 'SCHEMA_NOT_FOUND' });
  });

  it('página da seção fora do ar => URL_NOT_ACCESSIBLE', async () => {
    const i = find(await run(new FakeLoader({ [P]: '<html/>' }), { items: ['4.1.1'] }), '4.1.1');
    expect(i.serigy).toMatchObject({ ponto: false, codigo: 'URL_NOT_ACCESSIBLE' });
  });

  it('página sem o item => SERIGYITEM_NOT_FOUND', async () => {
    const html = `<table serigySchema="${SCHEMA}"><tr><td serigyItem="outroItem">1</td></tr></table>`;
    const i = find(await run(new FakeLoader({ [P]: '<html/>', [D]: html }), { items: ['4.1.1'] }), '4.1.1');
    expect(i.serigy).toMatchObject({ ponto: false, codigo: 'SERIGYITEM_NOT_FOUND' });
  });

  it('resumo Serigy conta só os itens com veredito', () => {
    expect(serigySummarize([{ serigy: { ponto: true } }, { serigy: { ponto: false } }, {}])).toEqual({ total: 2, atendidos: 1, score: 50 });
  });
});

describe('schema da seção 25 (documentação atualizada: consorcio/atividades-finalisticas.html)', () => {
  const E = 'https://p.gov.br/atividades/estatuto';
  const NOVO = 'https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html';
  const ANTIGO = 'https://serigy.tce.se.gov.br/consorcios/atividades-finalisticas.html';
  const pagina = (schema: string) => `<div serigySchema="${schema}"><a serigyItem="estatutoConsorcio" href="https://p.gov.br/estatuto.pdf">Estatuto</a></div>`;
  const go = (html: string) =>
    evaluate({ url: P, poder: 'consorcios-publicos', items: ['25.2.1'] }, { loader: new FakeLoader({ [P]: '<html/>', [E]: html }) });

  it('o schema atual da documentação é encontrado e o item atende, sem desvio conhecido', async () => {
    const i = find(await go(pagina(NOVO)), '25.2.1');
    expect(i.status).toBe('ok');
    expect(i.serigy).toEqual({ ponto: true });
    expect(i.schema.confere).toBe(true);
  });

  it('o schema antigo (consorcios/) não é mais o da documentação: o item não é encontrado e não pontua', async () => {
    const i = find(await go(pagina(ANTIGO)), '25.2.1');
    expect(i.status).toBe('missing');
    expect(i.serigy).toMatchObject({ ponto: false, codigo: 'SCHEMA_NOT_FOUND' });
  });
});

describe('arquivo e pareamento do Serigy oficial', () => {
  const item = (itemId: string, serigyItem: string, ponto: boolean, dimensao = 'Despesas', detalhe: string | null = null): SerigyOficialItem => ({
    dimensao,
    itemId,
    serigyItem,
    serigySchema: SCHEMA,
    ponto,
    detalhe,
  });

  it('aceita a lista do Serigy e recusa formato inválido, chaves extras e repetidos', () => {
    expect(parseSerigyArquivo([item('4.1.1', 'valorEmpenhado', true)]).ok).toBe(true);
    expect(parseSerigyArquivo({}).ok).toBe(false);
    expect(parseSerigyArquivo([]).ok).toBe(false);
    expect(parseSerigyArquivo([{ ...item('4.1.1', 'a', true), extra: 1 }]).ok).toBe(false);
    expect(parseSerigyArquivo([{ ...item('4.1.1', 'a', true), itemId: 'x' }]).ok).toBe(false);
    expect(parseSerigyArquivo([item('4.1.1', 'a', true), item('4.1.1', 'a', false)]).ok).toBe(false);
  });

  let resultado: EvaluationResult;
  beforeAll(async () => {
    resultado = await run(new FakeLoader({ [P]: '<html/>' }));
  });

  it('pareia por número + atributo e, na falta, por dimensão + atributo (numeração deslocada)', () => {
    const itens = [
      item('4.1.1', 'valorEmpenhado', true),
      // Receitas no Serigy não tem 3.1.4/3.1.5: filtroPesquisa é 3.1.4 lá e 3.1.6 na matriz
      item('3.1.4', 'filtroPesquisa', false, 'Receitas/PrevistaArrecada', 'WAITSECTION_NOT_FOUND|x'),
      item('3.1.7', 'historicoExercicio', false, 'Receitas/PrevistaArrecada', 'WAITSECTION_NOT_FOUND|y'),
    ];
    const pares = pairSerigy(resultado, { importadoEm: '2026-10-30T00:00:00Z', itens });
    expect(pares['4.1.1']).toBe(itens[0]);
    expect(pares['3.1.6']).toBe(itens[1]); // filtroPesquisa na matriz
    expect(pares['3.1.9']).toBe(itens[2]); // historicoExercicio na matriz
    expect(pares['3.1.4']).toBeUndefined(); // dataPrevistaReceita: o Serigy não avalia
  });
});

describe('Serigy oficial no histórico', () => {
  let resultado: EvaluationResult;
  beforeAll(async () => {
    resultado = await run(new FakeLoader({ [P]: '<html/>' }), { portalNome: 'Exemplo' });
  });
  const arquivo = [
    { dimensao: 'Despesas', itemId: '4.1.1', serigyItem: 'valorEmpenhado', serigySchema: SCHEMA, ponto: true, detalhe: null },
    { dimensao: 'Despesas', itemId: '4.1.2', serigyItem: 'valorLiquidado', serigySchema: SCHEMA, ponto: false, detalhe: 'URL_NOT_ACCESSIBLE|erro' },
  ];
  const repo = () => new AvaliacoesRepo(openDatabase(':memory:'), () => new Date('2026-10-30T10:00:00Z'));

  it('anexa, resume na lista, devolve pareado, substitui e remove', () => {
    const r = repo();
    const s = r.save(resultado, 'local');
    expect(s.serigy).toBeUndefined();
    expect(r.get(s.id)!.serigyOficial).toBeUndefined();

    const parsed = parseSerigyArquivo(arquivo);
    if (!parsed.ok) throw new Error('arquivo inválido');
    const com = r.setSerigy(s.id, parsed.itens);
    expect(com.serigy).toEqual({ total: 2, atendidos: 1, score: 50 });
    expect(r.list()[0]!.serigy).toEqual({ total: 2, atendidos: 1, score: 50 });
    const d = r.get(s.id)!;
    expect(d.serigyOficial?.itens).toHaveLength(2);
    expect(d.serigyPorItem?.['4.1.1']?.ponto).toBe(true);

    expect(r.setSerigy(s.id, parsed.itens.slice(0, 1)).serigy?.total).toBe(1);
    expect(r.clearSerigy(s.id).serigy).toBeUndefined();
    expect(r.get(s.id)!.serigyOficial).toBeUndefined();
    expect(() => r.setSerigy(999, parsed.itens)).toThrow('não encontrada');
  });

  it('a exportação JSON carrega o Serigy anexado e a importação o restaura', () => {
    const parsed = parseSerigyArquivo(arquivo);
    if (!parsed.ok) throw new Error('arquivo inválido');
    const oficial = { importadoEm: '2026-10-30T10:00:00Z', itens: parsed.itens };
    const env = JSON.parse(JSON.stringify(buildEnvelope(resultado, '2026-10-01T00:00:00Z', new Date(), oficial))) as unknown;
    const back = parseEnvelope(env);
    expect(back.ok && back.envelope.serigyOficial?.itens).toHaveLength(2);

    const r = repo();
    const saved = r.save(resultado, 'importada', undefined, back.ok ? back.envelope.serigyOficial : undefined);
    expect(saved.serigy?.total).toBe(2);

    // um Serigy adulterado no envelope é recusado
    const ruim = JSON.parse(JSON.stringify(env)) as { serigyOficial: { itens: Array<Record<string, unknown>> } };
    ruim.serigyOficial.itens[0]!.ponto = 'sim';
    expect(parseEnvelope(ruim).ok).toBe(false);
  });

  it('o relatório Markdown mostra o Serigy estimado e o oficial', () => {
    const parsed = parseSerigyArquivo(arquivo);
    if (!parsed.ok) throw new Error('arquivo inválido');
    const pares = pairSerigy(resultado, { importadoEm: '2026-10-30T10:00:00Z', itens: parsed.itens });
    const md = renderMarkdown(resultado, pares);
    expect(md).toContain('**Serigy (estimado):**');
    expect(md).toContain('**Serigy (oficial):**');
    expect(md).toContain('oficial: ✅');
    expect(md).toContain('oficial: ❌ `URL_NOT_ACCESSIBLE`');
  });
});

describe('API do Serigy oficial', () => {
  let server: Server | undefined;
  afterEach(() => new Promise<void>((done) => (server ? server.close(() => done()) : done())));

  async function boot() {
    const db = openDatabase(':memory:');
    const avaliacoes = new AvaliacoesRepo(db);
    const app = createApp({ avaliacoes, settings: new SettingsRepo(db), portais: new PortaisRepo(db), loader: new FakeLoader({ [P]: '<html/>' }) });
    await new Promise<void>((ok) => {
      server = app.listen(0, '127.0.0.1', () => ok());
    });
    const { port } = server!.address() as { port: number };
    const base = `http://127.0.0.1:${port}`;
    const resultado = await run(new FakeLoader({ [P]: '<html/>' }));
    const salvo = (await (await fetch(`${base}/api/avaliacoes`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(resultado) })).json()) as { id: number };
    return { base, id: salvo.id };
  }
  const put = (url: string, body: unknown) => fetch(url, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  it('anexa, baixa, exporta e remove', async () => {
    const { base, id } = await boot();
    const sem = await fetch(`${base}/api/avaliacoes/${id}/serigy`);
    expect(sem.status).toBe(404);

    const itens = [{ dimensao: 'Despesas', itemId: '4.1.1', serigyItem: 'valorEmpenhado', serigySchema: SCHEMA, ponto: true, detalhe: null }];
    const ok = await put(`${base}/api/avaliacoes/${id}/serigy`, itens);
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { resumo: { serigy: { total: number } } }).resumo.serigy.total).toBe(1);

    const lista = (await (await fetch(`${base}/api/avaliacoes`)).json()) as Array<{ serigy?: { total: number } }>;
    expect(lista[0]!.serigy?.total).toBe(1);

    const baixa = await fetch(`${base}/api/avaliacoes/${id}/serigy`);
    expect(baixa.status).toBe(200);
    expect(baixa.headers.get('content-disposition')).toContain('serigy-');
    expect((await baixa.json()) as unknown[]).toEqual(itens);

    const json = (await (await fetch(`${base}/api/avaliacoes/${id}/exportar?formato=json`)).json()) as { serigyOficial?: { itens: unknown[] } };
    expect(json.serigyOficial?.itens).toHaveLength(1);

    const md = await (await fetch(`${base}/api/avaliacoes/${id}/exportar?formato=md`)).text();
    expect(md).toContain('**Serigy (oficial):**');

    const del = await fetch(`${base}/api/avaliacoes/${id}/serigy`, { method: 'DELETE' });
    expect(del.status).toBe(200);
    expect((await fetch(`${base}/api/avaliacoes/${id}/serigy`)).status).toBe(404);
  });

  it('recusa arquivo inválido e avaliação inexistente', async () => {
    const { base, id } = await boot();
    const ruim = await put(`${base}/api/avaliacoes/${id}/serigy`, { nao: 'e uma lista' });
    expect(ruim.status).toBe(400);
    expect(((await ruim.json()) as { problemas: string[] }).problemas.length).toBeGreaterThan(0);
    expect((await put(`${base}/api/avaliacoes/9999/serigy`, [])).status).toBe(400);
    const itens = [{ dimensao: 'D', itemId: '4.1.1', serigyItem: 'a', serigySchema: SCHEMA, ponto: true, detalhe: null }];
    expect((await put(`${base}/api/avaliacoes/9999/serigy`, itens)).status).toBe(404);
  });
});

describe('códigos do Serigy oficial na troca de ano', () => {
  it('lê todos os códigos emendados no detalhe, sem repetir', () => {
    const d = 'TABLE_NOT_CHANGED|O valor 2025 não alterou [serigyLoadSection="x"]: Waiting failed: 30000ms exceededERROR_ON_SET_OPTION|Erro ao selecionar 2025 em https://a.b/cTABLE_NOT_CHANGED|O valor 2024 não alterou…Múltiplas falhas ao selecionar anos';
    expect(parseSerigyDetalhe(d).codigos).toEqual(['TABLE_NOT_CHANGED', 'ERROR_ON_SET_OPTION']);
    expect(parseSerigyDetalhe('INVALID_OPTION|2025 é uma opção inválida')).toMatchObject({ codigo: 'INVALID_OPTION', codigos: ['INVALID_OPTION'] });
    expect(parseSerigyDetalhe(null)).toEqual({});
  });

  it('a lista de códigos aceitos inclui os da troca de ano', () => {
    for (const c of ['INVALID_OPTION', 'ERROR_ON_SET_OPTION', 'TABLE_NOT_CHANGED']) expect(SERIGY_CODIGOS).toContain(c);
  });
});

describe('Serigy oficial anexado não altera a estatística do avaliador', () => {
  it('o resultado, o resumo e o relatório do avaliador ficam iguais; o oficial só aparece por item', async () => {
    const html = `<table serigySchema="${SCHEMA}"><tr><td serigyItem="valorEmpenhado">1,00</td></tr></table>`;
    const r = await run(new FakeLoader({ [P]: '<html/>', [D]: html }), { items: ['4.1.1', '4.1.2'] });
    const antes = JSON.stringify(r.summary);
    const par: SerigyOficialItem = { dimensao: 'Despesas', itemId: '4.1.1', serigyItem: 'valorEmpenhado', serigySchema: SCHEMA, ponto: false, detalhe: 'SERIGYITEM_NOT_VALID|x' };

    const repo = new AvaliacoesRepo(openDatabase(':memory:'), () => new Date('2026-10-30T10:00:00Z'));
    const salvo = repo.save({ ...r, scope: { ...r.scope, mode: 'todos' } }, 'local');
    repo.setSerigy(salvo.id, [par]);
    const d = repo.get(salvo.id)!;
    expect(JSON.stringify(d.resultado.summary)).toBe(antes);
    expect(salvo.summary.score).toBe(repo.resumo(salvo.id)!.summary.score);
    expect(find(d.resultado, '4.1.1').status).toBe('ok'); // continua atendido para o avaliador
    expect(d.serigyPorItem?.['4.1.1']?.ponto).toBe(false);

    const md = renderMarkdown(d.resultado, d.serigyPorItem);
    expect(md).toContain('oficial: ❌');
    expect(md).not.toContain('Atenção: o Serigy oficial');
  });
});

describe('marcação de tempo da avaliação', () => {
  it('formata a duração', () => {
    expect(formatDuration(0)).toBe('0 s');
    expect(formatDuration(45_400)).toBe('45 s');
    expect(formatDuration(67_600)).toBe('1 min 8 s');
    expect(formatDuration(3_723_000)).toBe('1 h 02 min 03 s');
    expect(formatDuration(-5)).toBe('0 s');
  });

  it('calcula a duração do resultado e o relatório mostra início, término e duração', async () => {
    const r = await run(new FakeLoader({ [P]: '<html/>' }));
    const marcado = { ...r, startedAt: '2026-10-29T20:33:02.862Z', finishedAt: '2026-10-29T20:34:10.503Z' };
    expect(evaluationDuration(marcado)).toBe('1 min 8 s');
    expect(evaluationDuration({ startedAt: 'x', finishedAt: 'y' })).toBe('');
    const md = renderMarkdown(marcado);
    expect(md).toContain('**Iniciada em:**');
    expect(md).toContain('**Terminada em:**');
    expect(md).toContain('**Duração:** 1 min 8 s');
  });
});
