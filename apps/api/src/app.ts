import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { PODERES, type CatalogResponse, type StreamEvent } from '@serigy/shared';
import { z } from 'zod';
import { getPoder, loadCatalog, pagesForPoder } from './catalog/load';
import { defaultPortais, PortalError, type PortaisRepo } from './db';
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
}

/** `deps` permite injetar loader/catálogo/banco nos testes. */
export function createApp(deps: AppDeps = {}) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

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
      res.json(await evaluate(parsed.data as Parameters<typeof evaluate>[0], deps));
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
      prepared = prepareEvaluation(parsed.data as Parameters<typeof prepareEvaluation>[0], deps);
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
    if (err instanceof PortalError) {
      res.status(err.status).json({ error: err.message });
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
