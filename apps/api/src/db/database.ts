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
  // v3 – configurações gerais da aplicação (chave -> valor em JSON; só o que difere do padrão é guardado)
  `CREATE TABLE configuracoes (
     chave         TEXT PRIMARY KEY,
     valor         TEXT NOT NULL,
     atualizado_em TEXT NOT NULL
   );`,
  // v4 – histórico de avaliações completas (salvas ou importadas). O resultado fica compactado (gzip) em `payload`;
  // as colunas de resumo servem para listar sem abrir cada resultado. `hash` evita guardar a mesma avaliação duas vezes.
  `CREATE TABLE avaliacoes (
     id                 INTEGER PRIMARY KEY AUTOINCREMENT,
     criado_em          TEXT NOT NULL,
     origem             TEXT NOT NULL CHECK (origem IN ('local', 'importada')),
     avaliada_em        TEXT NOT NULL,
     portal_nome        TEXT,
     portal_url         TEXT NOT NULL,
     portal_ambiente    TEXT,
     poder              TEXT NOT NULL,
     poder_label        TEXT NOT NULL,
     total              INTEGER NOT NULL,
     ok                 INTEGER NOT NULL,
     warning            INTEGER NOT NULL,
     empty              INTEGER NOT NULL,
     missing            INTEGER NOT NULL,
     score              REAL NOT NULL,
     catalogo_gerado_em TEXT,
     hash               TEXT NOT NULL UNIQUE,
     payload            BLOB NOT NULL
   );
   CREATE INDEX idx_avaliacoes_avaliada_em ON avaliacoes (avaliada_em DESC);`,
  // v5 – avaliação do validador oficial do Serigy anexada a uma avaliação salva (itens em gzip + resumo para a lista)
  `ALTER TABLE avaliacoes ADD COLUMN serigy_payload BLOB;
   ALTER TABLE avaliacoes ADD COLUMN serigy_importado_em TEXT;
   ALTER TABLE avaliacoes ADD COLUMN serigy_total INTEGER;
   ALTER TABLE avaliacoes ADD COLUMN serigy_atendidos INTEGER;`,
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
