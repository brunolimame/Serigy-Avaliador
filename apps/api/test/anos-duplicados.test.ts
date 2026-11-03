import { describe, expect, it } from 'vitest';
import type { HistoricoAno, StreamEvent } from '@serigy/shared';
import { prepareEvaluation } from '../src/evaluator/evaluate';
import type { AnoRequest } from '../src/evaluator/loader';
import { FakeLoader, find } from './helpers';

/**
 * Itens que caem na MESMA página (mesma URL, mesmo serigyExecuteWaitSection) não devem repetir a análise dos anos:
 * a página já foi analisada por outro item. Ex.: 4.2.9, 4.3.9 e 4.4.7 (estatais) não têm caminho próprio e todos
 * apontam para /estatais/despesas.html.
 */

const P = 'https://p.gov.br/';
const SCHEMA = 'https://serigy.tce.se.gov.br/estatais/despesas.html';
const HTML =
  `<div serigySchema="${SCHEMA}" serigyItem="filtroPesquisa">` +
  '<select serigyItem="historicoExercicio"><option serigyValue="2026">2026</option><option serigyValue="2025">2025</option></select>' +
  '<button serigyExecuteWaitSection="tabela">Pesquisar</button></div><div serigyLoadSection="tabela"></div>';

/** Carregador que conta as trocas de ano pedidas (e não só as páginas baixadas). */
class ContaAnos extends FakeLoader {
  readonly pedidos: AnoRequest[] = [];
  constructor() {
    super({ [P]: HTML });
  }
  async analisarAno(req: AnoRequest): Promise<HistoricoAno> {
    this.pedidos.push(req);
    await new Promise((r) => setTimeout(r, 5));
    return { ano: req.ano, passou: true, comDados: true };
  }
}

const ITENS = ['4.2.9', '4.3.9', '4.4.7'];

const rodar = (loader: ContaAnos) => {
  const events: StreamEvent[] = [];
  const prepared = prepareEvaluation(
    { url: P, poder: 'estatais', items: ITENS, anosHistorico: 1 },
    { loader, now: () => new Date('2026-11-03T12:00:00Z') },
  );
  return prepared.run((e) => events.push(e)).then((result) => ({ result, events }));
};

describe('itens na mesma página não repetem a análise dos anos', () => {
  it('a página é baixada uma vez, mesmo com três itens nela', async () => {
    const loader = new ContaAnos();
    await rodar(loader);
    expect(loader.calls.filter((u) => u === P)).toHaveLength(1);
  });

  it('cada ano é trocado uma vez por página, não uma vez por item (3 itens × 2 anos = 2 trocas, não 6)', async () => {
    const loader = new ContaAnos();
    await rodar(loader);
    const anos = loader.pedidos.map((p) => p.ano).sort();
    expect(anos).toEqual(['2025', '2026']);
  });

  it('os três itens recebem o mesmo resultado dos anos', async () => {
    const loader = new ContaAnos();
    const { result } = await rodar(loader);
    const resultados = ITENS.map((id) => JSON.stringify(find(result, id).anos));
    expect(new Set(resultados).size).toBe(1);
    expect(find(result, '4.2.9').anos).toHaveLength(2);
  });
});
