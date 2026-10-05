import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './database';
import { PortaisRepo } from './portais';

export { PortaisRepo, PortalError } from './portais';

let repo: PortaisRepo | undefined;

/**
 * Cadastro de portais no arquivo SQLite (padrão `apps/api/data/avaliador.sqlite`; troque com
 * `DATABASE_PATH`). Aberto na primeira utilização.
 */
export function defaultPortais(): PortaisRepo {
  if (!repo) {
    const file = process.env.DATABASE_PATH ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../data/avaliador.sqlite');
    repo = new PortaisRepo(openDatabase(file));
  }
  return repo;
}
