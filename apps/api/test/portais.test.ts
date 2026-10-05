import { mkdtempSync, rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Portal } from '@serigy/shared';
import { createApp } from '../src/app';
import { openDatabase } from '../src/db/database';
import { normalizePortalUrl, PortaisRepo, PortalError } from '../src/db/portais';

const repo = () => new PortaisRepo(openDatabase(':memory:'), () => new Date('2026-10-05T12:00:00Z'));
const novo = {
  nome: 'Prefeitura de Exemplo',
  url: 'https://transparencia.exemplo.se.gov.br/',
  poder: 'executivo' as const,
  ambiente: 'producao' as const,
};

describe('normalizePortalUrl', () => {
  it('remove âncora e ignora caixa/barra final na chave de unicidade', () => {
    const a = normalizePortalUrl('  https://Transparencia.Exemplo.gov.br/portal/#topo ');
    expect(a.url).toBe('https://transparencia.exemplo.gov.br/portal/');
    expect(normalizePortalUrl('https://transparencia.exemplo.gov.br/PORTAL').chave).toBe(a.chave);
  });
  it('rejeita URL inválida ou que não seja http(s)', () => {
    expect(() => normalizePortalUrl('exemplo.gov.br')).toThrow(PortalError);
    expect(() => normalizePortalUrl('ftp://exemplo.gov.br')).toThrow('http');
  });
});

describe('PortaisRepo (SQLite)', () => {
  it('cadastra, lista, busca, atualiza e remove', () => {
    const r = repo();
    const criado = r.create(novo);
    expect(criado).toMatchObject({ id: 1, ...novo, criadoEm: '2026-10-05T12:00:00.000Z' });
    expect(r.get(1)).toEqual(criado);

    r.create({ nome: 'Câmara de Exemplo', url: 'https://camara.exemplo.gov.br', poder: 'legislativo', ambiente: 'producao' });
    expect(r.list().map((p) => p.nome)).toEqual(['Câmara de Exemplo', 'Prefeitura de Exemplo']); // ordem alfabética

    const editado = r.update(1, { ...novo, nome: 'Prefeitura (renomeada)', poder: 'executivo' });
    expect(editado.nome).toBe('Prefeitura (renomeada)');

    r.remove(1);
    expect(r.get(1)).toBeUndefined();
    expect(() => r.remove(1)).toThrow('não encontrado');
  });

  it('não permite a mesma URL duas vezes (mesmo com caixa/barra diferentes), mas permite ao editar o próprio registro', () => {
    const r = repo();
    r.create(novo);
    expect(() => r.create({ ...novo, nome: 'Outro', url: 'HTTPS://Transparencia.Exemplo.SE.gov.br' })).toThrowError(/já está cadastrada/);
    const outro = r.create({ nome: 'Outro', url: 'https://outro.gov.br', poder: 'judiciario', ambiente: 'producao' });
    expect(() => r.update(outro.id, { ...outro, url: novo.url })).toThrow('já está cadastrada');
    expect(r.update(1, { ...novo, nome: 'Mesma URL, novo nome' }).nome).toBe('Mesma URL, novo nome');
  });

  it('valida nome e poder', () => {
    const r = repo();
    expect(() => r.create({ ...novo, nome: '   ' })).toThrow('nome');
    expect(() => r.create({ ...novo, poder: 'inexistente' as never })).toThrow('Poder inválido');
    expect(() => r.update(99, novo)).toThrowError(expect.objectContaining({ status: 404 }));
  });
});

describe('ambiente (produção/desenvolvimento)', () => {
  it('omitido = produção; aceita desenvolvimento; rejeita valor inválido; pode ser alterado', () => {
    const r = repo();
    const semAmbiente = r.create({ nome: 'A', url: 'https://a.gov.br', poder: 'executivo' } as never);
    expect(semAmbiente.ambiente).toBe('producao');
    const dev = r.create({ nome: 'A (dev)', url: 'https://dev.a.gov.br', poder: 'executivo', ambiente: 'desenvolvimento' });
    expect(dev.ambiente).toBe('desenvolvimento');
    expect(() => r.create({ ...novo, ambiente: 'teste' as never })).toThrow('Ambiente inválido');
    expect(r.update(dev.id, { ...dev, ambiente: 'producao' }).ambiente).toBe('producao');
  });

  it('migra um banco v1 (sem a coluna): os portais existentes viram produção', () => {
    const dir = mkdtempSync(join(tmpdir(), 'avaliador-mig-'));
    const file = join(dir, 'v1.sqlite');
    try {
      const old = new DatabaseSync(file);
      old.exec(`CREATE TABLE portais (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, url TEXT NOT NULL,
        url_chave TEXT NOT NULL UNIQUE, poder TEXT NOT NULL, criado_em TEXT NOT NULL, atualizado_em TEXT NOT NULL);
        PRAGMA user_version = 1;`);
      old
        .prepare('INSERT INTO portais (nome, url, url_chave, poder, criado_em, atualizado_em) VALUES (?,?,?,?,?,?)')
        .run('Antigo', 'https://x.gov.br/', 'https://x.gov.br', 'executivo', 't', 't');
      old.close();
      const db = openDatabase(file);
      expect(new PortaisRepo(db).list()[0]).toMatchObject({ nome: 'Antigo', ambiente: 'producao' });
      expect((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version).toBe(2);
      db.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('persistência em arquivo', () => {
  it('os registros sobrevivem a reabrir o banco', () => {
    const dir = mkdtempSync(join(tmpdir(), 'avaliador-'));
    const file = join(dir, 'sub', 'avaliador.sqlite'); // a pasta é criada
    try {
      const db1 = openDatabase(file);
      new PortaisRepo(db1).create(novo);
      db1.close();
      const db2 = openDatabase(file); // reabre: migração já aplicada, dados mantidos
      expect(new PortaisRepo(db2).list()).toHaveLength(1);
      expect((db2.prepare('PRAGMA user_version').get() as { user_version: number }).user_version).toBe(2);
      db2.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('API /api/portais', () => {
  let server: Server | undefined;
  afterEach(() => {
    server?.close();
    server = undefined;
  });
  const start = () => {
    server = createApp({ portais: repo() }).listen(0);
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const call = (method: string, path: string, body?: unknown) =>
      fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return call;
  };

  it('CRUD completo com códigos HTTP corretos', async () => {
    const call = start();
    expect(await (await call('GET', '/api/portais')).json()).toEqual([]);

    const created = await call('POST', '/api/portais', novo);
    expect(created.status).toBe(201);
    const portal = (await created.json()) as Portal;
    expect(portal).toMatchObject({ id: 1, nome: novo.nome, poder: 'executivo' });

    const dup = await call('POST', '/api/portais', novo);
    expect(dup.status).toBe(409);
    expect(((await dup.json()) as { error: string }).error).toContain('já está cadastrada');

    const upd = await call('PUT', `/api/portais/${portal.id}`, { ...novo, nome: 'Novo nome', poder: 'legislativo', ambiente: 'producao' });
    expect(upd.status).toBe(200);
    expect(await upd.json()).toMatchObject({ nome: 'Novo nome', poder: 'legislativo', ambiente: 'producao' });

    const dev = await call('POST', '/api/portais', {
      nome: 'Dev',
      url: 'https://dev.exemplo.gov.br',
      poder: 'executivo',
      ambiente: 'desenvolvimento',
    });
    expect(((await dev.json()) as Portal).ambiente).toBe('desenvolvimento');
    const padrao = await call('POST', '/api/portais', { nome: 'Sem ambiente', url: 'https://sem.exemplo.gov.br', poder: 'executivo' });
    expect(((await padrao.json()) as Portal).ambiente).toBe('producao');
    expect((await call('PUT', '/api/portais/99', novo)).status).toBe(404);
    expect((await call('PUT', '/api/portais/abc', novo)).status).toBe(400);
    expect((await call('DELETE', `/api/portais/${portal.id}`)).status).toBe(204);
    expect((await call('DELETE', `/api/portais/${portal.id}`)).status).toBe(404);
    // sobraram os dois cadastrados com ambiente (desenvolvimento e o padrão, produção)
    const restantes = (await (await call('GET', '/api/portais')).json()) as Portal[];
    expect(restantes.map((p) => [p.nome, p.ambiente]).sort()).toEqual([
      ['Dev', 'desenvolvimento'],
      ['Sem ambiente', 'producao'],
    ]);
  });

  it('valida o corpo (400)', async () => {
    const call = start();
    expect((await call('POST', '/api/portais', { nome: 'x' })).status).toBe(400);
    expect((await call('POST', '/api/portais', { ...novo, poder: 'nada' })).status).toBe(400);
    expect((await call('POST', '/api/portais', { ...novo, ambiente: 'teste' })).status).toBe(400);
    const bad = await call('POST', '/api/portais', { ...novo, url: 'sem-protocolo' });
    expect(bad.status).toBe(400);
    expect(((await bad.json()) as { error: string }).error).toContain('URL inválida');
  });
});
