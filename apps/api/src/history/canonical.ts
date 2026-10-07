import { createHash } from 'node:crypto';
import type { EvaluationResult } from '@serigy/shared';

/**
 * JSON canônico: chaves de objetos em ordem alfabética (recursivamente) e sem valores indefinidos. Duas cópias do
 * mesmo resultado dão sempre o mesmo texto, independentemente da ordem em que as chaves foram escritas.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map((v) => canonicalize(v)).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(',')}}`;
}

/** SHA-256 (hex) do resultado canônico: identifica a avaliação e detecta arquivo corrompido ou editado. */
export function hashResultado(resultado: EvaluationResult): string {
  return createHash('sha256').update(canonicalize(resultado)).digest('hex');
}
