/**
 * Cor do percentual de atendimento (página, seção e total):
 *  - abaixo de 40%            → vermelho
 *  - de 40% até menos de 100% → amarelo
 *  - 100%                     → verde
 */
export type ScoreTone = 'red' | 'amber' | 'green';

export function scoreTone(score: number): ScoreTone {
  if (score >= 100) return 'green';
  if (score >= 40) return 'amber';
  return 'red';
}

export const SCORE_STYLE: Record<ScoreTone, { stripe: string; badge: string; text: string; bar: string }> = {
  red: {
    stripe: 'border-l-rose-500',
    badge: 'border-rose-300 bg-rose-100 text-rose-800',
    text: 'text-rose-700',
    bar: 'bg-rose-500',
  },
  amber: {
    stripe: 'border-l-amber-400',
    badge: 'border-amber-300 bg-amber-100 text-amber-900',
    text: 'text-amber-700',
    bar: 'bg-amber-400',
  },
  green: {
    stripe: 'border-l-emerald-500',
    badge: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    text: 'text-emerald-700',
    bar: 'bg-emerald-500',
  },
};
