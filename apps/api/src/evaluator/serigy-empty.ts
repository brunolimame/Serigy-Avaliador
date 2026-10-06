import type { SerigyEmptyCheck } from '@serigy/shared';
import type { MarkupElement } from './markup';

/**
 * Avaliação do atributo `serigyEmpty` (docs/pntp-2026/definicoes.md): declara que a ausência de conteúdo é
 * intencional e traz o MOTIVO. Regras aplicadas sempre que o atributo é declarado:
 *  1. motivo em branco                    -> "serigyEmpty declarado mas motivo não informado" (não atende);
 *  2. motivo sem conteúdo válido          -> não atende (texto genérico/placeholder, poucas letras…);
 *  3. motivo repetido na mesma página     -> não atende (o motivo deve ser único e distinto);
 *  4. motivo preenchido e válido          -> "serigyEmpty declarado" (atende parcialmente).
 * O motivo é sanitizado antes de ser validado e exibido.
 */

const MAX_REASON = 200;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

/** Textos que não explicam nada (comparados sem acentos, caixa ou pontuação). */
const PLACEHOLDERS = new Set([
  'na',
  'nd',
  'nulo',
  'null',
  'undefined',
  'none',
  'nenhum',
  'nenhuma',
  'nada',
  'vazio',
  'vazia',
  'sem',
  'semmotivo',
  'motivo',
  'teste',
  'test',
  'xxx',
  'tbd',
]);

const fold = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Sanitiza o motivo: remove tags HTML e caracteres de controle, junta espaços e limita o tamanho. O resultado
 * é seguro para exibir (UI e relatório Markdown) e é o texto que passa pela validação de conteúdo.
 */
export function sanitizeReason(raw: string): string {
  return raw.replace(/<[^>]*>/g, ' ').replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_REASON);
}

/** null se o motivo (já sanitizado e não vazio) tem conteúdo válido; senão, por que não vale. */
export function reasonProblem(clean: string): string | null {
  const letters = (clean.match(/\p{L}/gu) ?? []).length;
  if (letters < 3) return 'o motivo precisa ter ao menos 3 letras';
  const key = fold(clean).replace(/[^a-z0-9]/g, '');
  if (PLACEHOLDERS.has(key)) return 'o motivo é um texto genérico, que não explica a ausência de conteúdo';
  if (/^(.)\1+$/.test(key)) return 'o motivo repete o mesmo caractere';
  return null;
}

/** Chave para comparar motivos (sem acentos/caixa, espaços e pontuação colapsados). */
const reasonKey = (clean: string): string => fold(clean).replace(/[^a-z0-9]+/g, ' ').trim();

/** Avalia um serigyEmpty declarado; `all` são os elementos analisados (para conferir a unicidade do motivo). */
export function checkSerigyEmpty(el: MarkupElement, all: MarkupElement[]): SerigyEmptyCheck {
  const motivo = sanitizeReason(el.empty ?? '');
  const base = { motivo, pageUrl: el.pageUrl };
  if (!motivo) return { ...base, valido: false, problema: 'motivo não informado' };

  const problem = reasonProblem(motivo);
  if (problem) return { ...base, valido: false, problema: problem };

  const key = reasonKey(motivo);
  const same = all.filter(
    (o) => o.empty !== undefined && o.pageUrl === el.pageUrl && reasonKey(sanitizeReason(o.empty)) === key,
  ).length;
  if (same > 1) {
    return { ...base, valido: false, problema: `o motivo se repete em ${same} serigyEmpty desta página; deve ser único e distinto` };
  }
  return { ...base, valido: true };
}

/** Texto do resultado do item sobre o(s) serigyEmpty declarado(s). */
export function describeSerigyEmpty(checks: SerigyEmptyCheck[]): string {
  const parts = checks.map((c) => {
    if (c.valido) return `serigyEmpty declarado — motivo: "${c.motivo}"`;
    if (!c.motivo) return 'serigyEmpty declarado mas motivo não informado';
    return `serigyEmpty declarado, mas motivo inválido ("${c.motivo}"): ${c.problema}`;
  });
  return [...new Set(parts)].join('; ');
}
