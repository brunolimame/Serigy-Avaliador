import { gunzipSync, gzipSync } from 'node:zlib';
import type { DatabaseSync } from 'node:sqlite';
import type { AvaliacaoDetalhe, AvaliacaoOrigem, AvaliacaoResumo, EvaluationResult, PoderId } from '@serigy/shared';
import { HttpError } from '../errors';
import { hashResultado } from '../history/canonical';

export class HistoryError extends HttpError {}

interface Row {
  id: number;
  criado_em: string;
  origem: AvaliacaoOrigem;
  avaliada_em: string;
  portal_nome: string | null;
  portal_url: string;
  portal_ambiente: string | null;
  poder: string;
  poder_label: string;
  total: number;
  ok: number;
  warning: number;
  empty: number;
  missing: number;
  score: number;
}

const COLUMNS =
  'id, criado_em, origem, avaliada_em, portal_nome, portal_url, portal_ambiente, poder, poder_label, total, ok, warning, empty, missing, score';

const toResumo = (r: Row): AvaliacaoResumo => ({
  id: r.id,
  criadoEm: r.criado_em,
  origem: r.origem,
  avaliadaEm: r.avaliada_em,
  portalNome: r.portal_nome ?? undefined,
  portalUrl: r.portal_url,
  portalAmbiente: (r.portal_ambiente as AvaliacaoResumo['portalAmbiente']) ?? undefined,
  poder: r.poder as PoderId,
  poderLabel: r.poder_label,
  summary: { total: r.total, ok: r.ok, warning: r.warning, empty: r.empty, missing: r.missing, score: r.score },
});

/**
 * Histórico de avaliações completas (tabela `avaliacoes`). O resultado fica compactado (gzip) em `payload`; as
 * colunas de resumo servem para a lista. A mesma avaliação (mesmo hash) não é guardada duas vezes. Não há limite
 * de quantidade: quem decide o que manter é o usuário (apagar uma ou todas).
 */
export class AvaliacoesRepo {
  constructor(
    private readonly db: DatabaseSync,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** O resultado já deve ter sido validado (history/schema.ts). Repetido => 409 com o id da existente. */
  save(resultado: EvaluationResult, origem: AvaliacaoOrigem, catalogoGeradoEm?: string): AvaliacaoResumo {
    const hash = hashResultado(resultado);
    const existing = this.db.prepare('SELECT id FROM avaliacoes WHERE hash = ?').get(hash) as { id: number } | undefined;
    if (existing) throw new HistoryError('Esta avaliação já está no histórico', 409, { id: existing.id });

    const s = resultado.summary;
    const res = this.db
      .prepare(
        `INSERT INTO avaliacoes (criado_em, origem, avaliada_em, portal_nome, portal_url, portal_ambiente, poder, poder_label,
           total, ok, warning, empty, missing, score, catalogo_gerado_em, hash, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        this.now().toISOString(),
        origem,
        resultado.finishedAt,
        resultado.portalNome ?? null,
        resultado.url,
        resultado.portalAmbiente ?? null,
        resultado.poder,
        resultado.poderLabel,
        s.total,
        s.ok,
        s.warning,
        s.empty,
        s.missing,
        s.score,
        catalogoGeradoEm ?? null,
        hash,
        gzipSync(Buffer.from(JSON.stringify(resultado), 'utf8')),
      );
    return this.resumo(Number(res.lastInsertRowid))!;
  }

  /** Mais recentes primeiro (pela data em que a avaliação terminou). */
  list(): AvaliacaoResumo[] {
    const rows = this.db.prepare(`SELECT ${COLUMNS} FROM avaliacoes ORDER BY avaliada_em DESC, id DESC`).all() as unknown as Row[];
    return rows.map(toResumo);
  }

  resumo(id: number): AvaliacaoResumo | undefined {
    const row = this.db.prepare(`SELECT ${COLUMNS} FROM avaliacoes WHERE id = ?`).get(id) as Row | undefined;
    return row ? toResumo(row) : undefined;
  }

  get(id: number): AvaliacaoDetalhe | undefined {
    const resumo = this.resumo(id);
    if (!resumo) return undefined;
    const row = this.db.prepare('SELECT payload, catalogo_gerado_em FROM avaliacoes WHERE id = ?').get(id) as {
      payload: Uint8Array;
      catalogo_gerado_em: string | null;
    };
    const resultado = JSON.parse(gunzipSync(row.payload).toString('utf8')) as EvaluationResult;
    return { resumo, resultado, catalogoGeradoEm: row.catalogo_gerado_em ?? undefined };
  }

  remove(id: number): void {
    const res = this.db.prepare('DELETE FROM avaliacoes WHERE id = ?').run(id);
    if (Number(res.changes) === 0) throw new HistoryError('Avaliação não encontrada', 404);
  }

  /** Apaga todo o histórico e devolve quantas avaliações foram removidas. */
  removeAll(): number {
    const res = this.db.prepare('DELETE FROM avaliacoes').run();
    return Number(res.changes);
  }
}
