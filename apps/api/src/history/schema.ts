import { MAX_EVIDENCE, PODERES, summarize, type EvaluationResult } from '@serigy/shared';
import { z } from 'zod';

/**
 * Validação de um EvaluationResult vindo de FORA (importação, salvamento). Dois níveis:
 *  1. esquema estrito (zod): tipos, valores permitidos, limites de tamanho e NENHUMA chave desconhecida;
 *  2. consistência interna: contagens, resumos, ids únicos, datas e escopo completo.
 * O conteúdo importado nunca é interpretado como HTML ou código: só é exibido (a UI escapa o texto) e reexportado.
 */

const MAX_ITEMS = 5000;
const text = (max: number) => z.string().max(max);
const httpUrl = z
  .string()
  .max(2048)
  .refine((s) => /^https?:\/\//i.test(s), 'esperado um endereço http(s)');
const isoDate = z.string().max(40).refine((s) => !Number.isNaN(Date.parse(s)), 'data inválida');
const count = z.number().int().min(0).max(MAX_ITEMS);
const itemId = z.string().regex(/^\d+(\.\d+)+$/, 'número de item inválido (ex.: 4.1.2)');

const poderIds = PODERES.map((p) => p.id) as [string, ...string[]];

const summarySchema = z.strictObject({
  total: count,
  ok: count,
  warning: count,
  empty: count,
  missing: count,
  score: z.number().min(0).max(100),
});

const itemSchema = z.strictObject({
  id: itemId,
  sectionId: text(40),
  atributo: text(120),
  descricao: text(1000),
  criterios: z.array(text(40)).max(50),
  tipos: z.array(text(60)).max(10),
  status: z.enum(['ok', 'warning', 'empty', 'missing']),
  message: text(4000),
  expected: text(2000),
  examples: z.array(z.strictObject({ title: text(300), html: text(20000) })).max(5).optional(),
  expectedUrl: httpUrl.optional(),
  analyzedUrls: z.array(httpUrl).max(100),
  loadedVia: z
    .array(z.strictObject({ kind: z.enum(['iframe', 'serigyLink']), url: httpUrl, tag: text(40).optional() }))
    .max(100)
    .optional(),
  schema: z.strictObject({ esperado: text(2048), encontrado: text(4000).optional(), confere: z.boolean() }),
  serigyEmpty: z
    .array(z.strictObject({ motivo: text(500), valido: z.boolean(), problema: text(500).optional(), pageUrl: httpUrl }))
    .max(200)
    .optional(),
  evidence: z.array(z.strictObject({ pageUrl: httpUrl, snippet: text(1000) })).max(MAX_EVIDENCE),
});

const sectionSchema = z.strictObject({
  id: text(40),
  title: text(300),
  caminhoUrl: text(500).optional(),
  notes: z.array(text(2000)).max(50),
  items: z.array(itemSchema).max(MAX_ITEMS),
});

const pageSchema = z.strictObject({
  id: text(120),
  number: text(10),
  title: text(300),
  folder: text(60),
  schemaUrl: httpUrl,
  docUrl: httpUrl,
  schemaFound: z.boolean(),
  analyzedUrls: z.array(httpUrl).max(200),
  iframes: z.array(z.strictObject({ pageUrl: httpUrl, target: httpUrl })).max(200),
  summary: summarySchema,
  sections: z.array(sectionSchema).max(200),
});

export const resultadoSchema = z.strictObject({
  url: httpUrl,
  portalNome: text(120).optional(),
  portalAmbiente: z.enum(['producao', 'desenvolvimento']).optional(),
  poder: z.enum(poderIds),
  poderLabel: text(100),
  startedAt: isoDate,
  finishedAt: isoDate,
  scope: z.strictObject({ mode: z.enum(['todos', 'parcial']), pages: count, items: count }),
  invoker: z.strictObject({ found: z.boolean(), value: text(500).optional(), message: text(1000) }),
  fetched: z
    .array(
      z.strictObject({
        url: httpUrl,
        origin: z.enum(['inicial', 'documentacao', 'iframe', 'serigyLink']),
        status: z.number().int().min(0).max(999).nullable(),
        error: text(1000).optional(),
        serigyElements: z.number().int().min(0).max(1_000_000),
      }),
    )
    .max(2000),
  warnings: z.array(text(2000)).max(5000),
  crawl: z.strictObject({
    maxPages: z.number().int().min(1).max(200),
    tryDocumentedCase: z.boolean(),
    renderer: z.enum(['browser', 'http']),
  }),
  summary: summarySchema,
  pages: z.array(pageSchema).max(200),
});

export const envelopeSchema = z.strictObject({
  formato: z.string(),
  versao: z.number().int().min(1),
  exportadoEm: isoDate,
  app: z.strictObject({ nome: text(100), versao: text(40) }),
  catalogo: z.strictObject({ geradoEm: text(40) }),
  hash: z.string().regex(/^[0-9a-f]{64}$/, 'hash SHA-256 inválido'),
  resultado: z.unknown(),
});

const MAX_PROBLEMS = 20;

/** `caminho: mensagem` para cada problema do zod, limitado para não encher a tela. */
export function formatIssues(error: z.ZodError, prefix = ''): string[] {
  const lines = error.issues.map((i) => {
    const path = [prefix, ...i.path.map(String)].filter(Boolean).join('.');
    return `${path || '(raiz)'}: ${i.message}`;
  });
  return lines.length > MAX_PROBLEMS ? [...lines.slice(0, MAX_PROBLEMS), `… e mais ${lines.length - MAX_PROBLEMS} problema(s)`] : lines;
}

/** Regras que o esquema não expressa: o resultado precisa ser internamente coerente e de uma avaliação COMPLETA. */
export function consistencyProblems(r: EvaluationResult): string[] {
  const problems: string[] = [];
  const items = r.pages.flatMap((p) => p.sections.flatMap((s) => s.items));

  if (r.scope.mode !== 'todos') problems.push('scope.mode: só avaliações completas (todos os itens) podem ser salvas ou importadas');
  if (Date.parse(r.finishedAt) < Date.parse(r.startedAt)) problems.push('finishedAt: anterior a startedAt');
  if (r.scope.pages !== r.pages.length) problems.push(`scope.pages: ${r.scope.pages} não confere com ${r.pages.length} página(s)`);
  if (r.scope.items !== items.length) problems.push(`scope.items: ${r.scope.items} não confere com ${items.length} item(ns)`);

  const ids = new Set<string>();
  for (const page of r.pages) {
    for (const section of page.sections) {
      for (const item of section.items) {
        if (ids.has(item.id)) problems.push(`item ${item.id}: id repetido`);
        ids.add(item.id);
        if (item.sectionId !== section.id) problems.push(`item ${item.id}: sectionId "${item.sectionId}" difere da seção "${section.id}"`);
      }
    }
    const expected = summarize(page.sections.flatMap((s) => s.items));
    if (JSON.stringify(expected) !== JSON.stringify(page.summary)) {
      problems.push(`página ${page.id}: o resumo não confere com os itens`);
    }
  }
  if (JSON.stringify(summarize(items)) !== JSON.stringify(r.summary)) problems.push('summary: o resumo geral não confere com os itens');
  if (items.length === 0) problems.push('pages: a avaliação não tem itens');
  return problems.length > MAX_PROBLEMS ? [...problems.slice(0, MAX_PROBLEMS), `… e mais ${problems.length - MAX_PROBLEMS} problema(s)`] : problems;
}

export type ValidationResult = { ok: true; resultado: EvaluationResult } | { ok: false; problemas: string[] };

/** Valida um resultado (esquema estrito + consistência + escopo completo). */
export function validateResultado(input: unknown, opts: { requireComplete?: boolean } = {}): ValidationResult {
  const parsed = resultadoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, problemas: formatIssues(parsed.error, 'resultado') };
  const resultado = parsed.data as EvaluationResult;
  let problemas = consistencyProblems(resultado).map((p) => `resultado.${p}`);
  if (opts.requireComplete === false) problemas = problemas.filter((p) => !p.includes('scope.mode'));
  return problemas.length > 0 ? { ok: false, problemas } : { ok: true, resultado };
}
