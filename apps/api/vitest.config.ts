import { defineConfig } from 'vitest/config';

// Os testes usam um banco SQLite em memória: nunca tocam apps/api/data/avaliador.sqlite (o banco real do usuário).
export default defineConfig({
  test: { env: { DATABASE_PATH: ':memory:' } },
});
