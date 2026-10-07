import type { Server } from 'node:http';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { EXPORT_FORMAT, EXPORT_VERSION, SETTINGS, type EvaluationResult } from '@serigy/shared';
import { createApp } from '../src/app';
import { AvaliacoesRepo, PortaisRepo, SettingsRepo } from '../src/db';
import { openDatabase } from '../src/db/database';
import { hashResultado } from '../src/history/canonical';
import { buildEnvelope, parseEnvelope } from '../src/history/envelope';
import { validateResultado } from '../src/history/schema';
import { evaluate } from '../src/evaluator/evaluate';
import { FakeLoader } from './helpers';

const HOME = { 'https://portal.exemplo.gov.br/': '<html></html>', 'https://p.gov.br/': '<html></html>' };
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
let completo: EvaluationResult;

beforeAll(async () => {
  completo = await evaluate(
    { url: 'https://portal.exemplo.gov.br/', poder: 'executivo', portalNome: 'Portal de Exemplo', portalAmbiente: 'producao' },
    { loader: new FakeLoader(HOME) },
  );
});

const reg = () => {
  const db = openDatabase(':memory:');
  return { avaliacoes: new AvaliacoesRepo(db, () => new Date('2026-10-07T10:00:00Z')), settings: new SettingsRepo(db), portais: new PortaisRepo(db) };
};

describe('validação do resultado', () => {
  it('aceita uma avaliação completa', () => {
    expect(validateResultado(completo).ok).toBe(true);
  });
  it('recusa avaliação parcial (salvar/importar) mas aceita quando não se exige completa', async () => {
    const parcial = await evaluate({ url: 'https://p.gov.br/', poder: 'executivo', items: ['1.1'] }, { loader: new FakeLoader(HOME) });
    expect(validateResultado(parcial).ok).toBe(false);
    expect(validateResultado(parcial, { requireComplete: false }).ok).toBe(true);
  });
  it('recusa chaves desconhecidas, summary inconsistente e ids repetidos', () => {
    const extra = clone(completo) as unknown as Record<string, unknown>;
    extra.invasora = 1;
    expect(validateResultado(extra).ok).toBe(false);

    const sum = clone(completo);
    sum.summary.ok += 1;
    expect(JSON.stringify(validateResultado(sum))).toContain('summary');

    const dup = clone(completo);
    const itens = dup.pages[0]!.sections.flatMap((s) => s.items);
    const [a, b] = itens;
    b!.id = a!.id;
    expect(JSON.stringify(validateResultado(dup))).toContain('id repetido');
  });
  it('recusa URL que não seja http(s) e chave __proto__', () => {
    const r = clone(completo);
    r.url = 'javascript:alert(1)';
    expect(validateResultado(r).ok).toBe(false);
    const proto = JSON.parse(JSON.stringify(completo).replace('{"url"', '{"__proto__":{"x":1},"url"')) as unknown;
    expect(validateResultado(proto).ok).toBe(false);
  });
});

describe('envelope de exportação', () => {
  it('ida e volta preserva o resultado', () => {
    const env = buildEnvelope(completo, '2026-10-01T00:00:00Z');
    expect(env.formato).toBe(EXPORT_FORMAT);
    const back = parseEnvelope(JSON.parse(JSON.stringify(env)));
    expect(back.ok).toBe(true);
    if (back.ok) expect(hashResultado(back.envelope.resultado)).toBe(env.hash);
  });
  it('detecta adulteração pelo hash', () => {
    const env = clone(buildEnvelope(completo, '2026-10-01T00:00:00Z'));
    env.resultado.portalNome = 'Adulterado';
    const r = parseEnvelope(env);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.problemas.join()).toContain('hash');
  });
  it('recusa formato, versão futura, JSON que não é objeto e campos extras', () => {
    const env = buildEnvelope(completo, 'x');
    expect(parseEnvelope({ ...env, formato: 'outro' }).ok).toBe(false);
    expect(parseEnvelope({ ...env, versao: EXPORT_VERSION + 1 }).ok).toBe(false);
    expect(parseEnvelope([1]).ok).toBe(false);
    expect(parseEnvelope('texto').ok).toBe(false);
    expect(parseEnvelope({ ...env, extra: true }).ok).toBe(false);
  });
});

describe('AvaliacoesRepo', () => {
  it('salva, lista, abre, recusa duplicata e apaga', () => {
    const { avaliacoes } = reg();
    const r = avaliacoes.save(completo, 'local', '2026-10-01');
    expect(r).toMatchObject({ id: 1, origem: 'local', portalNome: 'Portal de Exemplo', poder: 'executivo' });
    expect(avaliacoes.list()).toHaveLength(1);
    expect(avaliacoes.get(1)?.resultado).toEqual(completo);
    expect(() => avaliacoes.save(completo, 'importada')).toThrowError(/já está no histórico/);
    avaliacoes.remove(1);
    expect(() => avaliacoes.remove(1)).toThrow('não encontrada');
    avaliacoes.save(completo, 'local');
    expect(avaliacoes.removeAll()).toBe(1);
  });
});

describe('SettingsRepo', () => {
  it('usa padrões, grava, valida e restaura', () => {
    const { settings } = reg();
    expect(settings.values()['comportamento.maxPaginasSerigyLink']).toBe(40);
    settings.set('comportamento.maxPaginasSerigyLink', 60);
    expect(settings.response().modificadas).toEqual(['comportamento.maxPaginasSerigyLink']);
    expect(() => settings.set('comportamento.maxPaginasSerigyLink', 0)).toThrow();
    expect(() => settings.set('comportamento.maxPaginasSerigyLink', 'x')).toThrow();
    expect(() => settings.set('nao.existe', 1)).toThrow();
    settings.set('comportamento.maxPaginasSerigyLink', 40);
    expect(settings.response().modificadas).toEqual([]);
    settings.set('comportamento.navegador', false);
    settings.reset();
    expect(settings.values()['comportamento.navegador']).toBe(true);
    expect(SETTINGS.length).toBeGreaterThan(0);
  });
});

describe('rotas HTTP', () => {
  let server: Server;
  afterEach(() => server?.close());

  const setup = () => {
    const repos = reg();
    const loader = new FakeLoader(HOME);
    server = createApp({ ...repos, loader }).listen(0);
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const call = (method: string, path: string, body?: unknown) =>
      fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { call, repos, loader };
  };

  it('salva, duplica (409 com id), lista, exporta e reimporta', async () => {
    const { call } = setup();
    const salvo = await call('POST', '/api/avaliacoes', completo);
    expect(salvo.status).toBe(201);
    const dup = await call('POST', '/api/avaliacoes', completo);
    expect(dup.status).toBe(409);
    expect(await dup.json()).toMatchObject({ id: 1 });

    expect(((await (await call('GET', '/api/avaliacoes')).json()) as unknown[]).length).toBe(1);

    const exp = await call('GET', '/api/avaliacoes/1/exportar?formato=json');
    expect(exp.headers.get('content-disposition')).toContain('avaliacao-portal.exemplo.gov.br');
    const arquivo = (await exp.json()) as unknown;

    const md = await call('GET', '/api/avaliacoes/1/exportar?formato=md');
    expect(md.status).toBe(200);
    expect((await call('GET', '/api/avaliacoes/1/exportar?formato=pdf')).status).toBe(400);

    // reimportar a mesma avaliação = duplicata
    expect((await call('POST', '/api/avaliacoes/importar', arquivo)).status).toBe(409);
    await call('DELETE', '/api/avaliacoes/1');
    const imp = await call('POST', '/api/avaliacoes/importar', arquivo);
    expect(imp.status).toBe(201);
    expect(await imp.json()).toMatchObject({ origem: 'importada' });
  });

  it('importação recusa arquivo adulterado com a lista de problemas', async () => {
    const { call } = setup();
    const env = clone(buildEnvelope(completo, 'x'));
    env.resultado.warnings = ['injetado'];
    const res = await call('POST', '/api/avaliacoes/importar', env);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { problemas: string[] };
    expect(body.problemas.join()).toContain('hash');
  });

  it('salvar recusa avaliação parcial e apagar tudo exige confirmação', async () => {
    const { call } = setup();
    const parcial = await evaluate({ url: 'https://p.gov.br/', poder: 'executivo', items: ['1.1'] }, { loader: new FakeLoader(HOME) });
    expect((await call('POST', '/api/avaliacoes', parcial)).status).toBe(400);
    expect((await call('POST', '/api/avaliacoes/exportar', parcial)).status).toBe(200);
    expect((await call('DELETE', '/api/avaliacoes')).status).toBe(400);
    expect((await call('DELETE', '/api/avaliacoes?confirmar=sim')).status).toBe(200);
    expect((await call('GET', '/api/avaliacoes/abc')).status).toBe(400);
    expect((await call('GET', '/api/avaliacoes/99')).status).toBe(404);
  });

  it('configurações: altera, valida e restaura; a avaliação usa o padrão configurado', async () => {
    const { call } = setup();
    const put = await call('PUT', '/api/configuracoes/comportamento.maxPaginasSerigyLink', { valor: 7 });
    expect(((await put.json()) as { valores: Record<string, number> }).valores['comportamento.maxPaginasSerigyLink']).toBe(7);
    expect((await call('PUT', '/api/configuracoes/comportamento.maxPaginasSerigyLink', { valor: 'a' })).status).toBe(400);
    expect((await call('PUT', '/api/configuracoes/inexistente', { valor: 1 })).status).toBe(404);

    await call('PUT', '/api/configuracoes/comportamento.navegador', { valor: false });
    const r = (await (await call('POST', '/api/evaluate', { url: 'https://p.gov.br/', poder: 'executivo', items: ['1.1'] })).json()) as EvaluationResult;
    expect(r.crawl).toMatchObject({ maxPages: 7, renderer: 'http' });
    // valor explícito da requisição prevalece
    const r2 = (await (await call('POST', '/api/evaluate', { url: 'https://p.gov.br/', poder: 'executivo', items: ['1.1'], maxPages: 9 })).json()) as EvaluationResult;
    expect(r2.crawl.maxPages).toBe(9);

    // restaurar tudo também apaga os portais cadastrados (e mantém o histórico)
    await call('POST', '/api/portais', { nome: 'P', url: 'https://p.gov.br', poder: 'executivo', ambiente: 'producao' });
    await call('POST', '/api/avaliacoes', completo);
    expect(((await (await call('GET', '/api/portais')).json()) as unknown[]).length).toBe(1);
    const reset = await call('DELETE', '/api/configuracoes');
    expect(((await reset.json()) as { modificadas: string[] }).modificadas).toEqual([]);
    expect(((await (await call('GET', '/api/portais')).json()) as unknown[]).length).toBe(0);
    expect(((await (await call('GET', '/api/avaliacoes')).json()) as unknown[]).length).toBe(1);
  });
});
