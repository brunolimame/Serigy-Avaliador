import type { PendingState } from './live';
import { scoreTone, type ScoreTone } from './score';

/**
 * Qual ícone mostrar para o ESTADO ATUAL, durante e depois da análise.
 *
 * Item sem resultado:
 *  - na fila ou sendo analisado -> loader (análise em execução);
 *  - análise interrompida       -> "não analisado".
 * Item com resultado: o ícone do próprio status (decidido em ResultView).
 */
export type PendingIconKind = 'loader' | 'skipped';

export function pendingIconKind(wait: PendingState): PendingIconKind {
  return wait === 'skipped' ? 'skipped' : 'loader';
}

/**
 * Grupo (um número da matriz):
 *  - nenhum item concluído ainda -> loader (se algum item está na fila/em análise) ou "não analisado" (interrompida);
 *  - já há itens concluídos      -> ícone do nível de atendimento PARCIAL (verde/amarelo/vermelho), mais o loader ao
 *                                   lado enquanto ainda houver itens na fila/em análise.
 */
export type GroupIconState =
  | { icon: 'loader' }
  | { icon: 'skipped' }
  | { icon: 'level'; tone: ScoreTone; loader: boolean };

export function groupIconState(args: {
  /** Total de itens do grupo. */
  total: number;
  /** Itens ainda sem resultado (na fila, em análise ou não analisados). */
  pending: number;
  /** Algum item está na fila ou em análise agora (a análise está em execução). */
  active: boolean;
  /** Percentual de atendimento dos itens já concluídos. */
  score: number;
}): GroupIconState {
  if (args.total - args.pending === 0) return { icon: args.active ? 'loader' : 'skipped' };
  return { icon: 'level', tone: scoreTone(args.score), loader: args.active };
}

/**
 * Estado exibido de um item: o estado da análise em andamento (`pending`) tem prioridade; senão, um item que está
 * sendo REAVALIADO (botão "Reavaliar" do item ou do grupo) aparece como "analisando", em vez de ficar com a cor e o
 * ícone do último resultado. `undefined` = mostrar o resultado normalmente.
 */
export function displayWait(pending: PendingState | undefined, reevaluating: boolean): PendingState | undefined {
  return pending ?? (reevaluating ? 'running' : undefined);
}

/**
 * Há análise em andamento entre estes itens: algum na fila ou em análise, ou com as trocas de ano do histórico ainda
 * pendentes (o item já está concluído, mas os anos chegam depois). Vale para o grupo e para cada item.
 */
export function temAnaliseEmAndamento(ids: string[], pending: Map<string, PendingState> | undefined, anosPendentes: string[]): boolean {
  return ids.some((id) => {
    const state = pending?.get(id);
    return state === 'running' || state === 'waiting' || anosPendentes.includes(id);
  });
}
