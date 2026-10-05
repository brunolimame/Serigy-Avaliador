import type { DatabaseSync } from 'node:sqlite';
import { AMBIENTES, PODERES, type Portal, type PortalInput } from '@serigy/shared';

/** Erro de regra de negócio do cadastro (a API responde com `status`). */
export class PortalError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409) {
    super(message);
  }
}

interface Row {
  id: number;
  nome: string;
  url: string;
  poder: string;
  ambiente: string;
  criado_em: string;
  atualizado_em: string;
}

const toPortal = (r: Row): Portal => ({
  id: r.id,
  nome: r.nome,
  url: r.url,
  poder: r.poder as Portal['poder'],
  ambiente: r.ambiente as Portal['ambiente'],
  criadoEm: r.criado_em,
  atualizadoEm: r.atualizado_em,
});

/**
 * Normaliza a URL: http(s) obrigatório, sem espaços nem âncora. Devolve a URL a guardar e a chave de
 * unicidade (host e caminho em minúsculas, sem barra final), para que `https://X.gov.br/` e
 * `https://x.gov.br` sejam o mesmo portal.
 */
export function normalizePortalUrl(raw: string): { url: string; chave: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new PortalError('URL inválida: informe um endereço http(s):// completo', 400);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new PortalError('URL inválida: use http:// ou https://', 400);
  }
  parsed.hash = '';
  const url = parsed.href;
  const chave = `${parsed.origin}${parsed.pathname}${parsed.search}`.replace(/\/+$/, '').toLowerCase();
  return { url, chave };
}

function validate(input: PortalInput): {
  nome: string;
  url: string;
  chave: string;
  poder: PortalInput['poder'];
  ambiente: PortalInput['ambiente'];
} {
  const nome = input.nome?.trim() ?? '';
  if (!nome) throw new PortalError('Informe o nome do portal', 400);
  if (nome.length > 120) throw new PortalError('O nome deve ter no máximo 120 caracteres', 400);
  if (!PODERES.some((p) => p.id === input.poder)) throw new PortalError(`Poder inválido: ${input.poder}`, 400);
  const ambiente = input.ambiente ?? 'producao'; // omitido = produção
  if (!AMBIENTES.some((a) => a.id === ambiente)) throw new PortalError(`Ambiente inválido: ${ambiente}`, 400);
  const { url, chave } = normalizePortalUrl(input.url ?? '');
  return { nome, url, chave, poder: input.poder, ambiente };
}

/** Cadastro de portais da transparência (tabela `portais`). */
export class PortaisRepo {
  constructor(private readonly db: DatabaseSync, private readonly now: () => Date = () => new Date()) {}

  list(): Portal[] {
    const rows = this.db.prepare('SELECT * FROM portais ORDER BY nome COLLATE NOCASE, id').all() as unknown as Row[];
    return rows.map(toPortal);
  }

  get(id: number): Portal | undefined {
    const row = this.db.prepare('SELECT * FROM portais WHERE id = ?').get(id) as Row | undefined;
    return row ? toPortal(row) : undefined;
  }

  create(input: PortalInput): Portal {
    const v = validate(input);
    const agora = this.now().toISOString();
    this.assertFree(v.chave);
    const res = this.db
      .prepare('INSERT INTO portais (nome, url, url_chave, poder, ambiente, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(v.nome, v.url, v.chave, v.poder, v.ambiente, agora, agora);
    return this.get(Number(res.lastInsertRowid))!;
  }

  update(id: number, input: PortalInput): Portal {
    if (!this.get(id)) throw new PortalError('Portal não encontrado', 404);
    const v = validate(input);
    this.assertFree(v.chave, id);
    this.db
      .prepare('UPDATE portais SET nome = ?, url = ?, url_chave = ?, poder = ?, ambiente = ?, atualizado_em = ? WHERE id = ?')
      .run(v.nome, v.url, v.chave, v.poder, v.ambiente, this.now().toISOString(), id);
    return this.get(id)!;
  }

  remove(id: number): void {
    const res = this.db.prepare('DELETE FROM portais WHERE id = ?').run(id);
    if (Number(res.changes) === 0) throw new PortalError('Portal não encontrado', 404);
  }

  private assertFree(chave: string, exceptId?: number): void {
    const row = this.db.prepare('SELECT id, nome FROM portais WHERE url_chave = ?').get(chave) as { id: number; nome: string } | undefined;
    if (row && row.id !== exceptId) throw new PortalError(`Esta URL já está cadastrada (${row.nome})`, 409);
  }
}
