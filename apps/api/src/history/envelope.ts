import { readFileSync } from 'node:fs';
import {
  EXPORT_FORMAT,
  EXPORT_VERSION,
  type AvaliacaoEnvelope,
  type EvaluationResult,
  type SerigyOficial,
} from '@serigy/shared';
import { hashResultado } from './canonical';
import { envelopeSchema, formatIssues, validateResultado } from './schema';
import { serigyOficialSchema } from './serigy';

let cachedApp: { nome: string; versao: string } | undefined;

/** Nome e versão do aplicativo (de apps/api/package.json), gravados nos arquivos exportados. */
export function appInfo(): { nome: string; versao: string } {
  if (!cachedApp) {
    try {
      const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version?: string };
      cachedApp = { nome: 'serigy-avaliador', versao: pkg.version ?? '0.0.0' };
    } catch {
      cachedApp = { nome: 'serigy-avaliador', versao: '0.0.0' };
    }
  }
  return cachedApp;
}

/** Monta o arquivo de exportação de uma avaliação (formato `serigy-avaliacao`, versão 1). */
export function buildEnvelope(
  resultado: EvaluationResult,
  catalogoGeradoEm: string,
  now: Date = new Date(),
  serigyOficial?: SerigyOficial,
): AvaliacaoEnvelope {
  return {
    formato: EXPORT_FORMAT,
    versao: EXPORT_VERSION,
    exportadoEm: now.toISOString(),
    app: appInfo(),
    catalogo: { geradoEm: catalogoGeradoEm },
    hash: hashResultado(resultado),
    resultado,
    ...(serigyOficial ? { serigyOficial } : {}),
  };
}

export type ParsedEnvelope = { ok: true; envelope: AvaliacaoEnvelope } | { ok: false; problemas: string[] };

/**
 * Valida um arquivo de avaliação recebido (já convertido de JSON):
 *  1. estrutura do envelope (sem chaves desconhecidas) e identificação do formato;
 *  2. versão do formato suportada por este aplicativo;
 *  3. o resultado inteiro (esquema estrito + consistência + avaliação completa);
 *  4. o hash SHA-256 do resultado (arquivo corrompido ou editado à mão não passa).
 * O hash NÃO prova autoria: quem edita o resultado pode recalcular o hash. Assinatura digital é uma opção futura.
 */
export function parseEnvelope(input: unknown, opts: { requireComplete?: boolean } = {}): ParsedEnvelope {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, problemas: ['O arquivo deve conter um objeto JSON de avaliação do Serigy'] };
  }
  const head = envelopeSchema.safeParse(input);
  if (!head.success) return { ok: false, problemas: formatIssues(head.error) };
  const env = head.data;

  if (env.formato !== EXPORT_FORMAT) {
    return { ok: false, problemas: [`formato: "${env.formato}" não é uma avaliação do Serigy (esperado "${EXPORT_FORMAT}")`] };
  }
  if (env.versao > EXPORT_VERSION) {
    return { ok: false, problemas: [`versao: ${env.versao} é mais nova que a suportada (${EXPORT_VERSION}); atualize o aplicativo`] };
  }

  const checked = validateResultado(env.resultado, { requireComplete: opts.requireComplete ?? true });
  if (!checked.ok) return { ok: false, problemas: checked.problemas };

  if (hashResultado(checked.resultado) !== env.hash) {
    return { ok: false, problemas: ['hash: não confere com o conteúdo; o arquivo foi alterado ou está corrompido'] };
  }
  let serigyOficial: SerigyOficial | undefined;
  if (env.serigyOficial !== undefined) {
    const s = serigyOficialSchema.safeParse(env.serigyOficial);
    if (!s.success) return { ok: false, problemas: formatIssues(s.error, 'serigyOficial') };
    serigyOficial = s.data;
  }
  return {
    ok: true,
    envelope: {
      formato: EXPORT_FORMAT,
      versao: env.versao,
      exportadoEm: env.exportadoEm,
      app: env.app,
      catalogo: env.catalogo,
      hash: env.hash,
      resultado: checked.resultado,
      ...(serigyOficial ? { serigyOficial } : {}),
    },
  };
}

/** Nome de arquivo para a exportação: avaliacao-<host>-<data>-<id>.<ext> (só caracteres seguros). */
export function exportFileName(resultado: EvaluationResult, id: number | undefined, ext: 'json' | 'md'): string {
  let host = 'portal';
  try {
    host = new URL(resultado.url).hostname;
  } catch {
    /* mantém "portal" */
  }
  const safeHost = host.replace(/[^a-z0-9.-]/gi, '_');
  const date = resultado.finishedAt.slice(0, 10);
  return `avaliacao-${safeHost}-${date}${id === undefined ? '' : `-${id}`}.${ext}`;
}
