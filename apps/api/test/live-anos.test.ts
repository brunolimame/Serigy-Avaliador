import { describe, expect, it } from 'vitest';
import type { HistoricoAno, StreamEvent } from '@serigy/shared';
import { applyEvent, buildView, startLive } from '../../web/src/live';
import { prepareEvaluation } from '../src/evaluator/evaluate';
import type { AnoRequest } from '../src/evaluator/loader';
import { FakeLoader, SCHEMAS } from './helpers';

/**
 * Enquanto as trocas de ano do historicoExercicio ainda não terminaram, a interface não pode mostrar
 * "Analisando N de N itens concluídos" sem dizer o que falta: o item segue pendente de anos.
 */

const P = 'https://p.gov.br/';
const D = 'https://p.gov.br/despesas';
const SCHEMA = SCHEMAS.despesas;
const HTML =
  `<div serigySchema="${SCHEMA}" serigyItem="filtroPesquisa">` +
  '<select serigyItem="historicoExercicio"><option serigyValue="2026">2026</option><option serigyValue="2025">2025</option></select>' +
  '<button serigyExecuteWaitSection="tabela">Pesquisar</button></div><div serigyLoadSection="tabela"></div>';

class LentoAnos extends FakeLoader {
  constructor() {
    super({ [P]: '<html/>', [D]: HTML });
  }
  async analisarAno(req: AnoRequest): Promise<HistoricoAno> {
    await new Promise((r) => setTimeout(r, 20));
    return { ano: req.ano, passou: true, comDados: true };
  }
}

describe('estado ao vivo enquanto os anos do histórico terminam', () => {
  it('o item fica pendente de anos até a última troca de ano, e a interface diz qual item é', async () => {
    const prepared = prepareEvaluation(
      { url: P, poder: 'executivo', items: ['4.1.18'], anosHistorico: 1 },
      { loader: new LentoAnos(), now: () => new Date('2026-11-03T12:00:00Z') },
    );
    const events: StreamEvent[] = [];
    await prepared.run((e) => events.push(e));

    const finalIdx = events.findIndex((e) => e.type === 'item' && e.item.anos !== undefined);
    expect(finalIdx).toBeGreaterThan(0);

    let live = startLive(prepared.plan);
    for (const e of events.slice(0, finalIdx)) live = applyEvent(live, e);
    const parcial = buildView(live);
    expect(parcial.progress).toMatchObject({ done: 1, total: 1 });
    expect(parcial.progress.anosPendentes).toEqual(['4.1.18']);

    live = applyEvent(live, events[finalIdx]!);
    const final = buildView(live);
    expect(final.progress.anosPendentes).toEqual([]);
  });
});
