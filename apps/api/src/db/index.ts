import type { DatabaseSync } from 'node:sqlite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AvaliacoesRepo } from './avaliacoes';
import { openDatabase } from './database';
import { PortaisRepo } from './portais';
import { SettingsRepo } from './settings';

export { AvaliacoesRepo, HistoryError } from './avaliacoes';
export { PortaisRepo, PortalError } from './portais';
export { SettingError, SettingsRepo } from './settings';

let database: DatabaseSync | undefined;
let portais: PortaisRepo | undefined;
let settings: SettingsRepo | undefined;
let avaliacoes: AvaliacoesRepo | undefined;

/**
 * Banco SQLite único da aplicação (padrão `apps/api/data/avaliador.sqlite`; troque com `DATABASE_PATH`). Aberto na
 * primeira utilização; portais, configurações e histórico compartilham o mesmo arquivo.
 */
export function defaultDatabase(): DatabaseSync {
  if (!database) {
    const file = process.env.DATABASE_PATH ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../data/avaliador.sqlite');
    database = openDatabase(file);
  }
  return database;
}

export const defaultPortais = (): PortaisRepo => (portais ??= new PortaisRepo(defaultDatabase()));
export const defaultSettings = (): SettingsRepo => (settings ??= new SettingsRepo(defaultDatabase()));
export const defaultAvaliacoes = (): AvaliacoesRepo => (avaliacoes ??= new AvaliacoesRepo(defaultDatabase()));
