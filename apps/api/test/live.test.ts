import { describe, expect, it } from 'vitest';
import { applyEvent, buildView, startLive } from '../../web/src/live';
import { prepareEvaluation } from '../src/evaluator/evaluate';
import { FakeLoader, SCHEMAS } from './helpers';

const P = 'https://p.gov.br/';

describe('estado ao vivo da UI', () => {
  it('itens passam de aguardando -> analisando -> concluído, e só os concluídos entram nos resumos', async () => {
    const loader = new FakeLoader({
      [P]: '<html/>',
      'https://p.gov.br/despesas': `<div serigySchema="${SCHEMAS.despesas}"><b serigyItem="valorEmpenhado">1,00</b></div>`,
    });
    const prepared = prepareEvaluation({ url: P, poder: 'executivo', items: ['4.1.1', '4.1.2', '14.1'] }, { loader });
    const events: Parameters<typeof applyEvent>[1][] = [];
    await prepared.run((e) => events.push(e));

    let live = startLive(prepared.plan);
    let view = buildView(live);
    expect([...view.pending.values()]).toEqual(['waiting', 'waiting', 'waiting']);
    expect(view.progress).toEqual({ done: 0, total: 3 });
    expect(view.result.summary.total).toBe(0);

    const sectionStart = events.find((e) => e.type === 'section-start' && e.sectionId === '4.1')!;
    live = applyEvent(live, sectionStart);
    view = buildView(live);
    expect(view.pending.get('4.1.1')).toBe('running');
    expect(view.pending.get('4.1.2')).toBe('running');
    expect(view.pending.get('14.1')).toBe('waiting');

    const first = events.find((e) => e.type === 'item' && e.item.id === '4.1.1')!;
    live = applyEvent(live, first);
    view = buildView(live);
    expect(view.pending.has('4.1.1')).toBe(false);
    expect(view.pending.get('4.1.2')).toBe('running');
    expect(view.progress).toEqual({ done: 1, total: 3 });
    expect(view.result.summary).toMatchObject({ total: 1, ok: 1 });
    // o marcador pendente (status "missing") não é contado como não encontrado
    expect(view.result.pages[0]!.summary.missing).toBe(0);

    // interrompida: o que não foi analisado aparece como "não analisado"
    view = buildView({ ...live, status: 'cancelled' });
    expect(view.pending.get('4.1.2')).toBe('skipped');
    expect(view.pending.get('14.1')).toBe('skipped');
  });
});
