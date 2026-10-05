import type { CatalogItem } from '@serigy/shared';
import type { MarkupElement } from './markup';

/**
 * Validadores de "Valor" (tipo esperado) de cada item.
 * Cada validador retorna true se o elemento parece conter um valor do tipo.
 * Tipos sem validador (Texto, Nome, Endereço, Variável, N/A, Dataset…) sempre passam:
 * a presença do serigyItem é o que importa para eles.
 *
 * Para suportar um novo tipo, adicione uma entrada em TYPES (a chave é o nome
 * normalizado: minúsculas e sem acentos).
 */

/** Conteúdo "efetivo" do elemento: serigyValue, senão o texto visível. */
const content = (e: MarkupElement): string => (e.value ?? e.text ?? '').trim();
const isUrl = (s: string): boolean => /^https?:\/\//i.test(s);
const hasLink = (e: MarkupElement): boolean => Boolean(e.href || e.link || e.hasInnerLink || isUrl(content(e)));

interface TypeRule {
  /** Descrição legível do que é esperado. */
  hint: string;
  test: (e: MarkupElement) => boolean;
}

const TYPES: Record<string, TypeRule> = {
  numerico: { hint: 'valor numérico (contém dígitos)', test: (e) => /\d/.test(content(e)) },
  numero: { hint: 'número (contém dígitos)', test: (e) => /\d/.test(content(e)) },
  monetario: { hint: 'valor monetário (ex.: 1.234,56)', test: (e) => /\d/.test(content(e)) },
  ano: { hint: 'ano com 4 dígitos (ex.: 2026)', test: (e) => /(19|20)\d{2}/.test(content(e)) },
  data: { hint: 'data (dd/mm/aaaa ou aaaa-mm-dd)', test: (e) => /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/.test(content(e)) },
  hora: { hint: 'horário (ex.: 08:00 ou 8h)', test: (e) => /\d{1,2}\s*[:hH]\s*\d{0,2}/.test(content(e)) },
  telefone: { hint: 'telefone (ao menos 8 dígitos)', test: (e) => content(e).replace(/\D/g, '').length >= 8 },
  cpf: { hint: 'CPF (11 dígitos)', test: (e) => content(e).replace(/\D/g, '').length >= 11 },
  'e-mail': { hint: 'e-mail (nome@dominio)', test: (e) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(content(e)) },
  link: { hint: 'link (href, serigyLink ou URL no conteúdo)', test: hasLink },
  anexo: { hint: 'arquivo/anexo com link (href ou serigyLink)', test: hasLink },
  arquivo: { hint: 'arquivo com link (href ou serigyLink)', test: hasLink },
  imagem: { hint: 'imagem (<img src> ou URL)', test: (e) => Boolean(e.src || e.hasInnerImage || isUrl(content(e))) },
};

const FREE = 'qualquer conteúdo (basta o serigyItem estar presente)';

/** "Número/Ano" -> ["numero", "ano"]; "Monetário" -> ["monetario"]. */
function keysOf(tipo: string): string[] {
  return tipo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split('/')
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Regras aplicáveis; `null` no array indica um tipo sem validação (aceita qualquer valor). */
function rulesFor(tipos: string[]): Array<TypeRule | null> {
  return tipos.flatMap(keysOf).map((k) => TYPES[k] ?? null);
}

/**
 * Retorna null se o elemento é coerente com algum dos tipos aceitos;
 * caso contrário, uma mensagem descrevendo o problema.
 */
export function validateType(tipos: string[], e: MarkupElement): string | null {
  const rules = rulesFor(tipos);
  // Se algum tipo aceito não tem validador (ex.: Texto), qualquer valor serve.
  if (rules.length === 0 || rules.some((r) => r === null)) return null;
  if (rules.some((r) => r!.test(e))) return null;
  const shown = content(e).slice(0, 40) || '(vazio)';
  return `valor "${shown}" não parece ser do tipo ${tipos.join(' | ')}: esperado ${rules.map((r) => r!.hint).join(' ou ')}`;
}

/** Descrição da marcação esperada para um item (usada nos resultados e no relatório). */
export function describeExpected(item: CatalogItem, schemaUrl: string): string {
  const hints = rulesFor(item.tipos).map((r) => r?.hint ?? FREE);
  const valor = unique(hints).join(' ou ') || FREE;
  return `Elemento com serigySchema="${schemaUrl}" (próprio ou ancestral) e serigyItem="${item.atributo}"; valor: ${valor}.`;
}

const unique = <T>(list: T[]): T[] => [...new Set(list)];
