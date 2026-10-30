import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { PODERES, type CatalogResponse, type StreamEvent } from '@serigy/shared';
import { z } from 'zod';
import { getPoder, loadCatalog, pagesForPoder } from './catalog/load';
import {
  defaultAvaliacoes,
  defaultPortais,
  defaultSettings,
  HistoryError,
  PortalError,
  type AvaliacoesRepo,
  type PortaisRepo,
  type SettingsRepo,
} from './db';
import { HttpError } from './errors';
import { buildEnvelope, exportFileName, parseEnvelope } from './history/envelope';
import { validateResultado } from './history/schema';
import { parseSerigyArquivo } from './history/serigy';
import { evaluate, EvaluationError, prepareEvaluation, type EvaluateDeps, type PreparedEvaluation } from './evaluator/evaluate';
import { renderMarkdown } from './report/markdown';

const poderIds = PODERES.map((p) => p.id) as [string, ...string[]];

const evaluationSchema = z.object({
  url: z.string().min(1),
  poder: z.enum(poderIds),
  pages: z.array(z.string()).optional(),
  items: z.array(z.string()).optional(),
  maxPages: z.number().int().min(1).max(200).optional(),
  tryDocumentedCase: z.boolean().optional(),
  renderer: z.enum(['browser', 'http']).optional(),
  compatibilidadeSerigy: z.boolean().optional(),
  portalNome: z.string().max(120).optional(),
  portalAmbiente: z.enum(['producao', 'desenvolvimento']).optional(),
});

const portalSchema = z.object({
  nome: z.string(),
  url: z.string(),
  poder: z.enum(poderIds),
  ambiente: z.enum(['producao', 'desenvolvimento']).default('producao'),
});

export interface AppDeps extends EvaluateDeps {
  /** Cadastro de portais (SQLite). Padrão: arquivo apps/api/data/avaliador.sqlite. */
  portais?: PortaisRepo;
  /** Configurações gerais (SQLite). */
  settings?: SettingsRepo;
  /** Histórico de avaliações (SQLite). */
  avaliacoes?: AvaliacoesRepo;
}

/** `deps` permite injetar loader/catálogo/banco nos testes. */
export function createApp(deps: AppDeps = {}) {
  const app = express();
  app.use(express.json({ limit: '30mb' }));

  // --- cadastro de portais (SQLite) --------------------------------------------------------------
  const portais = () => deps.portais ?? defaultPortais();
  const portalId = (raw: string | undefined): number => {
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) throw new PortalError('Identificador de portal inválido', 400);
    return id;
  };
  const portalBody = (body: unknown) => {
    const parsed = portalSchema.safeParse(body);
    if (!parsed.success) throw new PortalError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
    return parsed.data as Parameters<PortaisRepo['create']>[0];
  };

  app.get('/api/portais', (_req, res) => {
    res.json(portais().list());
  });
  app.post('/api/portais', (req, res, next) => {
    try {
      res.status(201).json(portais().create(portalBody(req.body)));
    } catch (err) {
      next(err);
    }
  });
  app.put('/api/portais/:id', (req, res, next) => {
    try {
      res.json(portais().update(portalId(req.params.id), portalBody(req.body)));
    } catch (err) {
      next(err);
    }
  });
  app.delete('/api/portais/:id', (req, res, next) => {
    try {
      portais().remove(portalId(req.params.id));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // --- configurações gerais (SQLite) -------------------------------------------------------------
  const settings = () => deps.settings ?? defaultSettings();

  /** Os campos que a requisição não informa vêm das configurações gerais da aplicação. */
  const withSettings = <
    T extends { maxPages?: number; tryDocumentedCase?: boolean; renderer?: 'browser' | 'http'; compatibilidadeSerigy?: boolean },
  >(
    req: T,
  ): T => {
    const v = settings().values();
    return {
      ...req,
      maxPages: req.maxPages ?? (v['comportamento.maxPaginasSerigyLink'] as number),
      tryDocumentedCase: req.tryDocumentedCase ?? (v['comportamento.testarGrafiaDocumentacao'] as boolean),
      renderer: req.renderer ?? (v['comportamento.navegador'] ? 'browser' : 'http'),
      compatibilidadeSerigy: req.compatibilidadeSerigy ?? (v['comportamento.compatibilidadeSerigy'] as boolean),
    };
  };

  app.get('/api/configuracoes', (_req, res) => {
    res.json(settings().response());
  });
  app.put('/api/configuracoes/:chave', (req, res, next) => {
    try {
      settings().set(String(req.params.chave), (req.body as { valor?: unknown } | undefined)?.valor);
      res.json(settings().response());
    } catch (err) {
      next(err);
    }
  });
  // Restaura UMA configuração ao padrão
  app.delete('/api/configuracoes/:chave', (req, res, next) => {
    try {
      settings().reset(String(req.params.chave));
      res.json(settings().response());
    } catch (err) {
      next(err);
    }
  });
  // Restaura TODAS as configurações ao padrão e apaga os portais cadastrados (o histórico é mantido)
  app.delete('/api/configuracoes', (_req, res) => {
    settings().reset();
    (deps.portais ?? defaultPortais()).removeAll();
    res.json(settings().response());
  });

  // --- histórico de avaliações (SQLite) ----------------------------------------------------------
  const avaliacoes = () => deps.avaliacoes ?? defaultAvaliacoes();
  const avaliacaoId = (raw: string | undefined): number => {
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) throw new HistoryError('Identificador de avaliação inválido', 400);
    return id;
  };
  const catalogDate = () => (deps.catalog ?? loadCatalog()).generatedAt;
  /** Valida um resultado vindo do cliente; só avaliações completas, a menos que `requireComplete` seja falso. */
  const resultadoBody = (body: unknown, requireComplete = true) => {
    const checked = validateResultado(body, { requireComplete });
    if (!checked.ok) throw new HistoryError('Avaliação inválida', 400, { problemas: checked.problemas });
    return checked.resultado;
  };

  app.get('/api/avaliacoes', (_req, res) => {
    res.json(avaliacoes().list());
  });

  // Salva o resultado atual (só avaliação completa). Repetida => 409 com o id da já salva.
  app.post('/api/avaliacoes', (req, res, next) => {
    try {
      const resultado = resultadoBody(req.body);
      res.status(201).json(avaliacoes().save(resultado, 'local', catalogDate()));
    } catch (err) {
      next(err);
    }
  });

  // Importa o arquivo JSON de uma avaliação (validação estrita + hash). Entra no histórico como "importada".
  app.post('/api/avaliacoes/importar', (req, res, next) => {
    try {
      const parsed = parseEnvelope(req.body);
      if (!parsed.ok) throw new HistoryError('Arquivo de avaliação inválido', 400, { problemas: parsed.problemas });
      res
        .status(201)
        .json(avaliacoes().save(parsed.envelope.resultado, 'importada', parsed.envelope.catalogo.geradoEm, parsed.envelope.serigyOficial));
    } catch (err) {
      next(err);
    }
  });

  // Arquivo JSON (importável) do resultado atual, salvo ou não. Aceita avaliação parcial, mas ela não poderá ser importada.
  app.post('/api/avaliacoes/exportar', (req, res, next) => {
    try {
      const resultado = resultadoBody(req.body, false);
      res
        .attachment(exportFileName(resultado, undefined, 'json'))
        .type('application/json')
        .send(JSON.stringify(buildEnvelope(resultado, catalogDate()), null, 2));
    } catch (err) {
      next(err);
    }
  });

  // Apaga TODO o histórico (exige ?confirmar=sim)
  app.delete('/api/avaliacoes', (req, res, next) => {
    try {
      if (req.query.confirmar !== 'sim') throw new HistoryError('Confirme com ?confirmar=sim para apagar todo o histórico', 400);
      res.json({ removidas: avaliacoes().removeAll() });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/avaliacoes/:id', (req, res, next) => {
    try {
      const detalhe = avaliacoes().get(avaliacaoId(req.params.id));
      if (!detalhe) throw new HistoryError('Avaliação não encontrada', 404);
      res.json(detalhe);
    } catch (err) {
      next(err);
    }
  });

  // Exporta uma avaliação do histórico: ?formato=json (arquivo importável) ou ?formato=md (relatório)
  app.get('/api/avaliacoes/:id/exportar', (req, res, next) => {
    try {
      const id = avaliacaoId(req.params.id);
      const formato = String(req.query.formato ?? 'json');
      if (formato !== 'json' && formato !== 'md') throw new HistoryError('formato deve ser "json" ou "md"', 400);
      const detalhe = avaliacoes().get(id);
      if (!detalhe) throw new HistoryError('Avaliação não encontrada', 404);
      const name = exportFileName(detalhe.resultado, id, formato);
      if (formato === 'md') {
        res.attachment(name).type('text/markdown; charset=utf-8').send(renderMarkdown(detalhe.resultado, detalhe.serigyPorItem));
      } else {
        res
          .attachment(name)
          .type('application/json')
          .send(JSON.stringify(buildEnvelope(detalhe.resultado, detalhe.catalogoGeradoEm ?? catalogDate(), undefined, detalhe.serigyOficial), null, 2));
      }
    } catch (err) {
      next(err);
    }
  });

  // Avaliação do validador oficial do Serigy anexada a uma avaliação salva: anexar/substituir (corpo = JSON do Serigy),
  // baixar o JSON no formato do Serigy e remover.
  app.put('/api/avaliacoes/:id/serigy', (req, res, next) => {
    try {
      const id = avaliacaoId(req.params.id);
      const parsed = parseSerigyArquivo(req.body);
      if (!parsed.ok) throw new HistoryError('Arquivo do Serigy inválido', 400, { problemas: parsed.problemas });
      avaliacoes().setSerigy(id, parsed.itens);
      const detalhe = avaliacoes().get(id);
      if (!detalhe) throw new HistoryError('Avaliação não encontrada', 404);
      res.json(detalhe);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/avaliacoes/:id/serigy', (req, res, next) => {
    try {
      const id = avaliacaoId(req.params.id);
      avaliacoes().clearSerigy(id);
      const detalhe = avaliacoes().get(id);
      if (!detalhe) throw new HistoryError('Avaliação não encontrada', 404);
      res.json(detalhe);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/avaliacoes/:id/serigy', (req, res, next) => {
    try {
      const id = avaliacaoId(req.params.id);
      const detalhe = avaliacoes().get(id);
      if (!detalhe) throw new HistoryError('Avaliação não encontrada', 404);
      if (!detalhe.serigyOficial) throw new HistoryError('Esta avaliação não tem a avaliação do Serigy anexada', 404);
      res
        .attachment(exportFileName(detalhe.resultado, id, 'json').replace(/^avaliacao-/, 'serigy-'))
        .type('application/json')
        .send(JSON.stringify(detalhe.serigyOficial.itens, null, 2));
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/avaliacoes/:id', (req, res, next) => {
    try {
      avaliacoes().remove(avaliacaoId(req.params.id));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, generatedAt: loadCatalog().generatedAt });
  });

  app.get('/api/poderes', (_req, res) => {
    res.json(PODERES);
  });

  // Catálogo aplicável a um poder (comum + específicos) – alimenta a seleção de itens na UI.
  app.get('/api/catalog', (req, res) => {
    const poder = getPoder(String(req.query.poder ?? ''));
    if (!poder) {
      res.status(400).json({ error: 'Parâmetro "poder" inválido' });
      return;
    }
    const body: CatalogResponse = { poder, pages: pagesForPoder(poder.id, deps.catalog) };
    res.json(body);
  });

  app.post('/api/evaluate', async (req, res, next) => {
    try {
      const parsed = evaluationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
        return;
      }
      res.json(await evaluate(withSettings(parsed.data as Parameters<typeof evaluate>[0]), deps));
    } catch (err) {
      next(err);
    }
  });

  // Mesma avaliação, em streaming (NDJSON): plano, progresso por seção e cada item assim que concluído.
  // Erros de validação respondem como HTTP normal; falhas durante a análise chegam como evento `error`.
  app.post('/api/evaluate/stream', async (req, res, next) => {
    const parsed = evaluationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
      return;
    }
    let prepared: PreparedEvaluation;
    try {
      prepared = prepareEvaluation(withSettings(parsed.data as Parameters<typeof prepareEvaluation>[0]), deps);
    } catch (err) {
      next(err);
      return;
    }

    res.status(200).set({
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    // Cliente fechou a conexão (ex.: "Cancelar"): para de iniciar novas seções.
    const abort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) abort.abort();
    });
    const send = (event: StreamEvent) => {
      if (!res.writableEnded && !abort.signal.aborted) res.write(JSON.stringify(event) + '\n');
    };

    send({ type: 'plan', plan: prepared.plan });
    try {
      await prepared.run(send, abort.signal);
    } catch (err) {
      if (err instanceof EvaluationError) send({ type: 'error', message: err.message, status: err.status });
      else {
        console.error(err);
        send({ type: 'error', message: 'Erro interno', status: 500 });
      }
    }
    res.end();
  });

  // Recebe um resultado de avaliação e devolve o relatório em Markdown.
  app.post('/api/report', (req, res) => {
    const body = req.body as { pages?: unknown; summary?: unknown };
    if (!body || !Array.isArray(body.pages) || !body.summary) {
      res.status(400).json({ error: 'Corpo deve ser um resultado de /api/evaluate' });
      return;
    }
    res.type('text/markdown; charset=utf-8').send(renderMarkdown(req.body));
  });

  // Em produção serve a UI compilada (apps/web/dist)
  const webDist = resolve(dirname(fileURLToPath(import.meta.url)), '../../web/dist');
  if (existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(resolve(webDist, 'index.html')));
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, ...err.extra });
      return;
    }
    if (err instanceof EvaluationError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  });

  return app;
}
