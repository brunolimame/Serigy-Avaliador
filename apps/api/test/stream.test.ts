import type { Server } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import type { StreamEvent } from '@serigy/shared';
import { createApp } from '../src/app';
import type { LoadedPage } from '../src/evaluator/loader';
import { FakeLoader, SCHEMAS } from './helpers';

const P = 'https://p.gov.br/';

/** FakeLoader com atraso por URL (simula portal lento). */
class SlowLoader extends FakeLoader {
  constructor(pages: Record<string, string>, private readonly delay: (url: string) => number) {
    super(pages);
  }
  override async load(url: string): Promise<LoadedPage> {
    await new Promise((r) => setTimeout(r, this.delay(url)));
    return super.load(url);
  }
}

const pages = {
  [P]: '<meta serigyItem="invoker" serigyValue="h">',
  'https://p.gov.br/despesas': `<div serigySchema="${SCHEMAS.despesas}"><b serigyItem="valorEmpenhado">1,00</b></div>`,
  'https://p.gov.br/ouvidoria': `<div serigySchema="${SCHEMAS.ouvidoria}"><p serigyItem="enderecoSetor">Rua A</p></div>`,
};

let server: Server | undefined;
afterEach(() => {
  server?.close();
  server = undefined;
});

function start(loader: FakeLoader): string {
  server = createApp({ loader }).listen(0);
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}

/** Lê o NDJSON, chamando `onEvent(evento, ms desde o início)` para cada linha. */
async function readStream(
  base: string,
  body: unknown,
  onEvent: (e: StreamEvent, ms: number) => void = () => {},
  signal?: AbortSignal,
): Promise<StreamEvent[]> {
  const t0 = Date.now();
  const res = await fetch(`${base}/api/evaluate/stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  expect(res.headers.get('content-type')).toContain('application/x-ndjson');
  const events: StreamEvent[] = [];
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf(String.fromCharCode(10))) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      const event = JSON.parse(line) as StreamEvent;
      events.push(event);
      onEvent(event, Date.now() - t0);
    }
  }
  return events;
}

describe('POST /api/evaluate/stream', () => {
  it('envia o plano primeiro, depois progresso por seção, itens e o resultado final por último', async () => {
    const base = start(new FakeLoader(pages));
    const events = await readStream(base, { url: P, poder: 'executivo', items: ['4.1.1', '4.1.2', '14.1'] });

    const types = events.map((e) => e.type);
    expect(types[0]).toBe('plan');
    expect(types.at(-1)).toBe('done');
    expect(types.indexOf('invoker')).toBeGreaterThan(0);

    const plan = (events[0] as Extract<StreamEvent, { type: 'plan' }>).plan;
    expect(plan.scope).toMatchObject({ mode: 'parcial', items: 3 });
    expect(plan.pages.flatMap((p) => p.sections.flatMap((s) => s.items.map((i) => i.id)))).toEqual(['4.1.1', '4.1.2', '14.1']);
    expect(plan.pages.find((p) => p.id === 'comum/despesas')!.sections[0]!.url).toBe('https://p.gov.br/Despesas'); // grafia da documentação

    // cada seção começa antes dos seus itens
    for (const sectionId of ['4.1', '14']) {
      const start = events.findIndex((e) => e.type === 'section-start' && e.sectionId === sectionId);
      const firstItem = events.findIndex((e) => e.type === 'item' && e.sectionId === sectionId);
      expect(start, sectionId).toBeGreaterThanOrEqual(0);
      expect(firstItem, sectionId).toBeGreaterThan(start);
    }

    const items = events.filter((e): e is Extract<StreamEvent, { type: 'item' }> => e.type === 'item');
    expect(items.map((e) => e.item.id).sort()).toEqual(['14.1', '4.1.1', '4.1.2']);
    const done = events.at(-1) as Extract<StreamEvent, { type: 'done' }>;
    for (const e of items) {
      const final = done.result.pages.flatMap((p) => p.sections.flatMap((s) => s.items)).find((i) => i.id === e.item.id);
      expect(final).toEqual(e.item); // o item transmitido é o mesmo do resultado final
    }
    expect(events.some((e) => e.type === 'fetched')).toBe(true);
  });

  it('entrega cada item assim que a sua seção termina, sem esperar as mais lentas', async () => {
    const base = start(new SlowLoader(pages, (u) => (u.endsWith('/ouvidoria') ? 400 : 0)));
    const at: Record<string, number> = {};
    await readStream(base, { url: P, poder: 'executivo', items: ['4.1.1', '14.1'] }, (e, ms) => {
      if (e.type === 'item') at[e.item.id] = ms;
      if (e.type === 'done') at.done = ms;
    });
    expect(at['4.1.1']).toBeDefined();
    expect(at['14.1']! - at['4.1.1']!).toBeGreaterThan(250); // a seção rápida chegou bem antes
    expect(at.done! - at['14.1']!).toBeLessThan(250);
  });

  it('falha ao acessar o portal chega como evento de erro, depois do plano', async () => {
    const base = start(new FakeLoader({}));
    const events = await readStream(base, { url: P, poder: 'executivo', items: ['4.1.1'] });
    expect(events.map((e) => e.type)).toEqual(['plan', 'fetched', 'error']);
    expect(events.at(-1)).toMatchObject({ type: 'error', status: 502 });
  });

  it('erros de validação respondem como HTTP normal (sem stream)', async () => {
    const base = start(new FakeLoader(pages));
    const post = (body: unknown) =>
      fetch(`${base}/api/evaluate/stream`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    expect((await post({ url: P, poder: 'inexistente' })).status).toBe(400);
    const bad = await post({ url: P, poder: 'executivo', items: ['999.9'] });
    expect(bad.status).toBe(400);
    expect(((await bad.json()) as { error: string }).error).toContain('999.9');
  });

  it('o cliente pode cancelar: o servidor para de iniciar novas seções', async () => {
    const loader = new SlowLoader(pages, () => 60);
    const base = start(loader);
    const ctrl = new AbortController();
    let items = 0;
    await readStream(base, { url: P, poder: 'executivo' }, (e) => {
      if (e.type === 'item' && ++items === 1) ctrl.abort();
    }, ctrl.signal).catch(() => undefined);
    const atAbort = loader.calls.length;
    await new Promise((r) => setTimeout(r, 500));
    expect(loader.calls.length - atAbort).toBeLessThanOrEqual(6); // só o que já estava em andamento
    expect(loader.calls.length).toBeLessThan(25); // havia dezenas de URLs a baixar
  });
});
