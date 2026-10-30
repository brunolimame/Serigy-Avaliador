import type { EvaluationResult, SerigyOficial, SerigyOficialItem, SerigySummary } from '@serigy/shared';
import { z } from 'zod';
import { formatIssues } from './schema';

/**
 * Avaliação do validador oficial do Serigy anexada a uma avaliação salva. O arquivo é o JSON baixado do Serigy:
 * uma lista de itens `{ dimensao, itemId, serigyItem, serigySchema, ponto, detalhe }`. Validação estrita, como
 * qualquer conteúdo importado: nada é interpretado como HTML ou código.
 */

const MAX_ITENS = 5000;
const text = (max: number) => z.string().max(max);

export const serigyOficialItemSchema = z.strictObject({
  dimensao: text(300),
  itemId: z.string().regex(/^\d+(\.\d+)+$/, 'número de item inválido (ex.: 4.1.2)'),
  serigyItem: text(200),
  serigySchema: text(2048),
  ponto: z.boolean(),
  detalhe: text(4000).nullable(),
});

const itensSchema = z.array(serigyOficialItemSchema).min(1, 'o arquivo não tem itens').max(MAX_ITENS);

export const serigyOficialSchema = z.strictObject({
  importadoEm: z.string().max(40).refine((s) => !Number.isNaN(Date.parse(s)), 'data inválida'),
  itens: itensSchema,
});

export type ParsedSerigy = { ok: true; itens: SerigyOficialItem[] } | { ok: false; problemas: string[] };

/** Valida o conteúdo do arquivo do Serigy (lista de itens). Ids repetidos são recusados. */
export function parseSerigyArquivo(input: unknown): ParsedSerigy {
  if (!Array.isArray(input)) {
    return { ok: false, problemas: ['O arquivo do Serigy deve conter uma lista (JSON) de itens avaliados'] };
  }
  const parsed = itensSchema.safeParse(input);
  if (!parsed.success) return { ok: false, problemas: formatIssues(parsed.error, 'serigy') };
  const seen = new Set<string>();
  const problemas: string[] = [];
  for (const i of parsed.data) {
    const key = `${i.itemId}|${i.serigyItem}`;
    if (seen.has(key)) problemas.push(`item ${i.itemId} (${i.serigyItem}): repetido no arquivo do Serigy`);
    seen.add(key);
  }
  return problemas.length > 0 ? { ok: false, problemas: problemas.slice(0, 20) } : { ok: true, itens: parsed.data };
}

/** Resumo do Serigy oficial: itens que pontuaram / total. */
export function resumoSerigy(itens: SerigyOficialItem[]): SerigySummary {
  const atendidos = itens.filter((i) => i.ponto).length;
  return { total: itens.length, atendidos, score: itens.length === 0 ? 0 : Math.round((atendidos / itens.length) * 1000) / 10 };
}

/** "[Portal da Transparencia]/Receitas/PrevistaArrecada" -> "receitas/previstaarrecada" (como a dimensão do Serigy). */
const caminhoKey = (caminho: string | undefined): string =>
  (caminho ?? '')
    .replace(/^\[[^\]]*\]\/?/, '')
    .replace(/\/+$/, '')
    .toLowerCase();

/**
 * Pareia os itens do avaliador com os do Serigy oficial (id do avaliador -> item do Serigy):
 *  1. mesmo número e mesmo serigyItem;
 *  2. na falta, mesmo serigyItem na mesma dimensão (caminho da seção). O Serigy omite alguns itens da matriz e a
 *     numeração se desloca (ex.: Receitas), então o número sozinho não basta.
 * Cada item do Serigy é usado uma só vez.
 */
export function pairSerigy(resultado: EvaluationResult, oficial: SerigyOficial): Record<string, SerigyOficialItem> {
  const used = new Set<SerigyOficialItem>();
  const byId = new Map<string, SerigyOficialItem>();
  for (const i of oficial.itens) byId.set(`${i.itemId}|${i.serigyItem}`, i);
  const byDim = new Map<string, SerigyOficialItem[]>();
  for (const i of oficial.itens) {
    const k = `${i.dimensao.toLowerCase()}|${i.serigyItem}`;
    byDim.set(k, [...(byDim.get(k) ?? []), i]);
  }

  const pairs: Record<string, SerigyOficialItem> = {};
  const pending: Array<{ id: string; atributo: string; caminho: string }> = [];
  for (const page of resultado.pages) {
    for (const section of page.sections) {
      for (const item of section.items) {
        const exact = byId.get(`${item.id}|${item.atributo}`);
        if (exact && !used.has(exact)) {
          used.add(exact);
          pairs[item.id] = exact;
        } else {
          pending.push({ id: item.id, atributo: item.atributo, caminho: caminhoKey(section.caminhoUrl) });
        }
      }
    }
  }
  for (const p of pending) {
    const found = (byDim.get(`${p.caminho}|${p.atributo}`) ?? []).find((i) => !used.has(i));
    if (found) {
      used.add(found);
      pairs[p.id] = found;
    }
  }
  return pairs;
}
