import { describe, expect, it } from 'vitest';
import { applyEvent, buildView, startLive } from '../../web/src/live';
import { displayWait, groupIconState, pendingIconKind, temAnaliseEmAndamento } from '../../web/src/status-icons';
import { prepareEvaluation } from '../src/evaluator/evaluate';
import { FakeLoader, SCHEMAS } from './helpers';

describe('ícone do estado atual de um item sem resultado', () => {
  it('na fila e em análise mostram o loader; só "não analisado" (interrompida) deixa de mostrar', () => {
    expect(pendingIconKind('waiting')).toBe('loader');
    expect(pendingIconKind('running')).toBe('loader');
    expect(pendingIconKind('skipped')).toBe('skipped');
  });
});

describe('ícone do estado atual de um grupo', () => {
  const base = { total: 4, pending: 4, active: true, score: 0 };

  it('nenhum item concluído: loader enquanto a análise roda; "não analisado" se interrompida', () => {
    expect(groupIconState(base)).toEqual({ icon: 'loader' });
    expect(groupIconState({ ...base, active: false })).toEqual({ icon: 'skipped' });
  });

  it('com itens concluídos: nível de atendimento parcial (verde/amarelo/vermelho) + loader enquanto houver itens em análise', () => {
    expect(groupIconState({ total: 4, pending: 2, active: true, score: 100 })).toEqual({ icon: 'level', tone: 'green', loader: true });
    expect(groupIconState({ total: 4, pending: 2, active: true, score: 50 })).toEqual({ icon: 'level', tone: 'amber', loader: true });
    expect(groupIconState({ total: 4, pending: 3, active: true, score: 0 })).toEqual({ icon: 'level', tone: 'red', loader: true });
  });

  it('análise interrompida ou concluída: só o ícone do nível, sem loader', () => {
    expect(groupIconState({ total: 4, pending: 2, active: false, score: 100 })).toEqual({ icon: 'level', tone: 'green', loader: false });
    expect(groupIconState({ total: 4, pending: 0, active: false, score: 39.9 })).toEqual({ icon: 'level', tone: 'red', loader: false });
    expect(groupIconState({ total: 4, pending: 0, active: false, score: 40 })).toEqual({ icon: 'level', tone: 'amber', loader: false });
  });
});

describe('item em reavaliação (botão Reavaliar do item ou do grupo)', () => {
  it('aparece como "analisando" (loader e tema azul), não com a cor/ícone do último resultado', () => {
    expect(displayWait(undefined, true)).toBe('running');
    expect(pendingIconKind(displayWait(undefined, true)!)).toBe('loader');
  });

  it('sem reavaliação, o resultado é mostrado normalmente', () => {
    expect(displayWait(undefined, false)).toBeUndefined();
  });

  it('a análise em andamento tem prioridade sobre a reavaliação', () => {
    expect(displayWait('waiting', true)).toBe('waiting');
    expect(displayWait('skipped', true)).toBe('skipped');
    expect(displayWait('running', false)).toBe('running');
  });
});

describe('estado ao vivo alimenta os ícones', () => {
  it('durante a análise, os pendentes são "waiting"/"running" (loader) e viram resultado ao concluir; cancelada vira "skipped"', async () => {
    const loader = new FakeLoader({
      'https://p.gov.br/': '<html/>',
      'https://p.gov.br/despesas': `<div serigySchema="${SCHEMAS.despesas}"><b serigyItem="valorEmpenhado">1,00</b></div>`,
    });
    const prepared = prepareEvaluation({ url: 'https://p.gov.br/', poder: 'executivo', items: ['4.1.1', '4.1.2', '14.1'] }, { loader });
    const events: Parameters<typeof applyEvent>[1][] = [];
    await prepared.run((e) => events.push(e));

    let live = startLive(prepared.plan);
    expect([...buildView(live).pending.values()].map(pendingIconKind)).toEqual(['loader', 'loader', 'loader']);

    live = applyEvent(live, events.find((e) => e.type === 'section-start' && e.sectionId === '4.1')!);
    live = applyEvent(live, events.find((e) => e.type === 'item' && e.item.id === '4.1.1')!);
    const view = buildView(live);
    expect(view.pending.has('4.1.1')).toBe(false); // concluído: passa a mostrar o ícone do resultado
    expect(view.pending.get('4.1.2')).toBe('running'); // loader azul
    expect(view.pending.get('14.1')).toBe('waiting'); // loader cinza (na fila)

    const cancelled = buildView({ ...live, status: 'cancelled' });
    expect(cancelled.pending.get('4.1.2')).toBe('skipped');
    expect([...cancelled.pending.values()].map(pendingIconKind)).toEqual(['skipped', 'skipped']);
  });
});

describe('análise em andamento inclui os anos do histórico pendentes', () => {
  it('um item já concluído com anos pendentes conta como análise em andamento (grupo e item mostram o loader)', () => {
    const pending = new Map<string, 'waiting' | 'running' | 'skipped'>();
    // todos os itens do grupo já concluídos, nenhum na fila; só os anos do item 4.1.18 seguem
    expect(temAnaliseEmAndamento(['4.1.17', '4.1.18'], pending, ['4.1.18'])).toBe(true);
    expect(temAnaliseEmAndamento(['4.1.17', '4.1.18'], pending, [])).toBe(false);
    expect(temAnaliseEmAndamento(['4.1.17'], new Map([['4.1.17', 'running']]), [])).toBe(true);
  });

  it('grupo sem nada na fila e com anos pendentes mostra o nível de atendimento com o loader ao lado', () => {
    const active = temAnaliseEmAndamento(['4.1.18'], new Map(), ['4.1.18']);
    expect(groupIconState({ total: 1, pending: 0, active, score: 50 })).toEqual({ icon: 'level', tone: 'amber', loader: true });
  });
});
