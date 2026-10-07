import type { DatabaseSync } from 'node:sqlite';
import { SETTINGS, type SettingDef, type SettingValue, type SettingsResponse } from '@serigy/shared';
import { HttpError } from '../errors';

export class SettingError extends HttpError {}

const DEFS = new Map<string, SettingDef>(SETTINGS.map((d) => [d.chave, d]));

function defOf(chave: string): SettingDef {
  const def = DEFS.get(chave);
  if (!def) throw new SettingError(`Configuração desconhecida: ${chave}`, 404);
  return def;
}

/** Confere o tipo e a faixa do valor conforme a definição (SETTINGS em packages/shared). */
export function validateSetting(def: SettingDef, value: unknown): SettingValue {
  if (def.tipo === 'boolean') {
    if (typeof value !== 'boolean') throw new SettingError(`"${def.rotulo}" aceita apenas verdadeiro ou falso`, 400);
    return value;
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new SettingError(`"${def.rotulo}" precisa ser um número inteiro`, 400);
  }
  if (def.min !== undefined && value < def.min) throw new SettingError(`"${def.rotulo}" deve ser no mínimo ${def.min}`, 400);
  if (def.max !== undefined && value > def.max) throw new SettingError(`"${def.rotulo}" deve ser no máximo ${def.max}`, 400);
  return value;
}

/**
 * Configurações gerais da aplicação (tabela `configuracoes`). Só se grava o que difere do padrão: voltar ao
 * padrão apaga a linha. Um valor salvo que deixou de ser válido (definição mudou) é ignorado e vale o padrão.
 */
export class SettingsRepo {
  constructor(
    private readonly db: DatabaseSync,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private stored(): Map<string, SettingValue> {
    const rows = this.db.prepare('SELECT chave, valor FROM configuracoes').all() as unknown as Array<{ chave: string; valor: string }>;
    const out = new Map<string, SettingValue>();
    for (const row of rows) {
      const def = DEFS.get(row.chave);
      if (!def) continue;
      try {
        out.set(row.chave, validateSetting(def, JSON.parse(row.valor)));
      } catch {
        /* valor inválido: vale o padrão */
      }
    }
    return out;
  }

  /** Valor efetivo de cada configuração. */
  values(): Record<string, SettingValue> {
    const stored = this.stored();
    return Object.fromEntries(SETTINGS.map((d) => [d.chave, stored.get(d.chave) ?? d.padrao]));
  }

  response(): SettingsResponse {
    const stored = this.stored();
    return {
      definicoes: SETTINGS,
      valores: Object.fromEntries(SETTINGS.map((d) => [d.chave, stored.get(d.chave) ?? d.padrao])),
      modificadas: [...stored.keys()],
    };
  }

  set(chave: string, valor: unknown): void {
    const def = defOf(chave);
    const value = validateSetting(def, valor);
    if (value === def.padrao) {
      this.db.prepare('DELETE FROM configuracoes WHERE chave = ?').run(chave);
      return;
    }
    this.db
      .prepare(
        `INSERT INTO configuracoes (chave, valor, atualizado_em) VALUES (?, ?, ?)
         ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em`,
      )
      .run(chave, JSON.stringify(value), this.now().toISOString());
  }

  /** Volta uma configuração (ou todas, sem argumento) ao padrão. */
  reset(chave?: string): void {
    if (chave === undefined) {
      this.db.exec('DELETE FROM configuracoes');
      return;
    }
    defOf(chave);
    this.db.prepare('DELETE FROM configuracoes WHERE chave = ?').run(chave);
  }
}
