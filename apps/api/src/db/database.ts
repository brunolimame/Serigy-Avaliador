import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * SQLite embutido do Node (node:sqlite, Node >= 22.13): não há biblioteca nativa para instalar.
 * Migrações simples por `PRAGMA user_version`: para evoluir o esquema, acrescente um item em MIGRATIONS
 * (nunca altere um já publicado).
 */
const MIGRATIONS: string[] = [
  // v1 – portais da transparência cadastrados
  `CREATE TABLE portais (
     id            INTEGER PRIMARY KEY AUTOINCREMENT,
     nome          TEXT NOT NULL,
     url           TEXT NOT NULL,
     url_chave     TEXT NOT NULL UNIQUE,
     poder         TEXT NOT NULL,
     criado_em     TEXT NOT NULL,
     atualizado_em TEXT NOT NULL
   );
   CREATE INDEX idx_portais_poder ON portais (poder);`,
  // v2 – ambiente do endereço (produção/desenvolvimento); os já cadastrados ficam como produção
  `ALTER TABLE portais ADD COLUMN ambiente TEXT NOT NULL DEFAULT 'producao';`,
];

/** Abre (e cria, se preciso) o banco e aplica as migrações pendentes. `:memory:` serve para testes. */
export function openDatabase(file: string): DatabaseSync {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
  for (let v = row.user_version; v < MIGRATIONS.length; v++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[v]!);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
  return db;
}
