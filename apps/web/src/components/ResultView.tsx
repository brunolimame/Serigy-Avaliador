import { useState } from 'react';
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  CircleX,
  Clock,
  Download,
  FileJson,
  Frame,
  Loader2,
  RefreshCw,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { EvaluationResult, ItemResult, ItemStatus, PageResult, SectionResult, Summary } from '@serigy/shared';
import { groupPagesByNumber, summarize } from '@serigy/shared';
import { api, download } from '../api';
import { SCORE_STYLE, scoreTone, type ScoreTone } from '../score';
import { AMBIENTE_TONE } from './AmbienteBadge';
import type { PendingState } from '../live';
import { mergeReevaluated, mergeReevaluatedMany } from '../merge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/** Paleta suave por resultado: fundo do item, borda, selo e ícone. */
const TONE: Record<ItemStatus, { label: string; row: string; chip: string; icon: LucideIcon; iconClass: string }> = {
  ok: {
    label: 'Atendido',
    row: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30',
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
    icon: CircleCheck,
    iconClass: 'text-emerald-600',
  },
  warning: {
    label: 'Atenção',
    row: 'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
    icon: TriangleAlert,
    iconClass: 'text-amber-600',
  },
  empty: {
    label: 'serigyEmpty declarado',
    row: 'border-sky-200 bg-sky-50/80 dark:border-sky-900 dark:bg-sky-950/30',
    chip: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
    icon: CircleMinus,
    iconClass: 'text-sky-600',
  },
  missing: {
    label: 'Não encontrado',
    row: 'border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/30',
    chip: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
    icon: CircleX,
    iconClass: 'text-rose-600',
  },
};

const PENDING_TONE: Record<PendingState, { label: string; row: string; chip: string }> = {
  waiting: { label: 'Aguardando…', row: 'border-slate-200 bg-slate-50/70 dark:bg-slate-900/30', chip: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  running: { label: 'Analisando…', row: 'border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/30', chip: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' },
  skipped: { label: 'Não analisado', row: 'border-slate-200 bg-slate-50/70 dark:bg-slate-900/30', chip: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
};

function Spinner({ className }: { className?: string }) {
  return <Loader2 aria-hidden className={cn('size-3.5 animate-spin', className)} />;
}

function Stat({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: LucideIcon; color: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <Icon className={cn('size-6 shrink-0', color)} />
        <div>
          <div className={cn('text-2xl font-semibold tabular-nums leading-tight', color)}>{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStats({ s }: { s: Summary }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Stat
        label="Atendimento"
        value={`${s.score}%`}
        icon={CircleCheck}
        color={s.total > 0 ? SCORE_STYLE[scoreTone(s.score)].text : 'text-primary'}
      />
      <Stat label="Itens avaliados" value={s.total} icon={Clock} color="text-slate-700" />
      <Stat label="Atendidos" value={s.ok} icon={CircleCheck} color="text-emerald-700" />
      <Stat label="Atenção" value={s.warning} icon={TriangleAlert} color="text-amber-700" />
      <Stat label="serigyEmpty declarados" value={s.empty} icon={CircleMinus} color="text-sky-700" />
      <Stat label="Não encontrados" value={s.missing} icon={CircleX} color="text-rose-700" />
    </div>
  );
}

function UrlList({ urls }: { urls: string[] }) {
  return (
    <>
      {urls.map((u, n) => (
        <span key={u}>
          {n > 0 && ', '}
          <a href={u} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
            {u}
          </a>
        </span>
      ))}
    </>
  );
}

/** Ícone do nível de atendimento do grupo/página (mesmos ícones e cores dos itens: ok, atenção e não encontrado). */
const SCORE_ICON: Record<ScoreTone, { icon: LucideIcon; className: string; label: string }> = {
  green: { icon: CircleCheck, className: 'text-emerald-600', label: 'Atendimento total' },
  amber: { icon: TriangleAlert, className: 'text-amber-600', label: 'Atendimento parcial' },
  red: { icon: CircleX, className: 'text-rose-600', label: 'Atendimento baixo' },
};

/** Selo do percentual de atendimento: < 40% vermelho, de 40% a < 100% amarelo, 100% verde. */
function ScoreBadge({ summary }: { summary: Summary }) {
  const tone = SCORE_STYLE[scoreTone(summary.score)];
  return (
    <Badge variant="outline" className={cn('font-medium tabular-nums', tone.badge)}>
      {summary.score}% · {summary.ok + summary.empty}/{summary.total}
    </Badge>
  );
}

/** Percentual da seção; só aparece quando todos os itens dela já têm resultado. */
function SectionScore({ items, pending }: { items: ItemResult[]; pending?: Map<string, PendingState> }) {
  const finished = items.filter((i) => !pending?.has(i.id));
  if (items.length === 0 || finished.length < items.length) return null;
  return <ScoreBadge summary={summarize(finished)} />;
}

/** Validação do schema: esperado pela documentação x encontrado no HTML. */
function SchemaLine({ item }: { item: ItemResult }) {
  if (!item.schema.encontrado) return null;
  return (
    <div className="break-all text-xs text-muted-foreground">
      Schema:{' '}
      {item.schema.confere ? (
        <span className="font-medium text-emerald-700">✓ confere</span>
      ) : (
        <span className="font-medium text-rose-700">✗ não confere</span>
      )}{' '}
      · encontrado <code>{item.schema.encontrado}</code>
      {!item.schema.confere && (
        <>
          {' '}
          · esperado <code>{item.schema.esperado}</code>
        </>
      )}
    </div>
  );
}

/** Explica por que o item não foi atendido, com o que era esperado e o que foi encontrado. */
function ItemDetails({ item, page, section }: { item: ItemResult; page: PageResult; section: SectionResult }) {
  return (
    <div className="space-y-2 rounded-lg border bg-white/70 p-3 text-xs dark:bg-black/20">
      <div>
        <div className="text-sm font-semibold">
          {item.id} — {item.descricao}
        </div>
        <div className="text-muted-foreground">
          Critério(s): {item.criterios.join(', ') || '—'} · Página {page.number}. {page.title} › {section.id}. {section.title}
          {section.caminhoUrl && (
            <>
              {' '}
              · Caminho sugerido: <code>{section.caminhoUrl}</code>
            </>
          )}
        </div>
      </div>
      <p>
        <strong>Não atendido:</strong> {item.message}
      </p>
      <p>
        <strong>Esperado:</strong> {item.expected}
      </p>
      <p>
        <strong>Schema:</strong> {item.schema.confere ? '✓ confere' : '✗ não confere'} — esperado <code>{item.schema.esperado}</code>; encontrado{' '}
        {item.schema.encontrado ? <code>{item.schema.encontrado}</code> : 'nenhum'}
      </p>
      {item.serigyEmpty?.map((c, n) => (
        <p key={`${c.pageUrl}-${n}`}>
          <strong>serigyEmpty:</strong>{' '}
          {c.valido ? (
            <>declarado — motivo “{c.motivo}” (atende parcialmente)</>
          ) : c.motivo ? (
            <>
              motivo “{c.motivo}” inválido — {c.problema}
            </>
          ) : (
            'declarado mas motivo não informado'
          )}
        </p>
      ))}
      {item.evidence.length > 0 && (
        <div>
          <strong>Encontrado:</strong>
          <ul className="mt-1 space-y-1">
            {item.evidence.map((e) => (
              <li key={e.pageUrl + e.snippet} className="break-all">
                <code className="rounded bg-muted px-1">{e.snippet}</code> em {e.pageUrl}
              </li>
            ))}
          </ul>
        </div>
      )}
      {item.examples?.map((ex) => (
        <Collapsible key={ex.title + ex.html}>
          <CollapsibleTrigger className="flex items-center gap-1 text-primary hover:underline">
            <ChevronRight className="size-3.5" />
            Exemplo da documentação: {ex.title}
          </CollapsibleTrigger>
          <CollapsibleContent>
            {/* Barra de rolagem vertical e horizontal para exemplos longos */}
            <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-slate-800 p-3 text-slate-100">{ex.html}</pre>
          </CollapsibleContent>
        </Collapsible>
      ))}
      <a href={page.docUrl} target="_blank" rel="noreferrer" className="inline-block text-primary hover:underline">
        Ver documentação oficial desta página
      </a>
    </div>
  );
}

/** Cor da página (borda lateral e cabeçalho) conforme o pior resultado dos itens. */
function pageTone(summary: Summary, pendingCount: number): string {
  if (pendingCount > 0) return 'border-l-blue-400';
  return SCORE_STYLE[scoreTone(summary.score)].stripe;
}

interface Props {
  result: EvaluationResult;
  onChange: (next: EvaluationResult) => void;
  /** Itens ainda sem resultado (avaliação em andamento ou interrompida). */
  pending?: Map<string, PendingState>;
  progress?: { done: number; total: number };
  /** Presente enquanto a avaliação está rodando. */
  onCancel?: () => void;
}

export function ResultView({ result, onChange, pending, progress, onCancel }: Props) {
  const isLive = pending !== undefined;
  const running = onCancel !== undefined;
  const lastFetched = result.fetched.at(-1);

  const [filter, setFilter] = useState<ItemStatus | 'all'>('all');
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reevaluating, setReevaluating] = useState<string | null>(null);
  // Número do grupo cujos itens estão sendo todos reavaliados
  const [reevaluatingGroup, setReevaluatingGroup] = useState<string | null>(null);
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  // Tudo começa FECHADO; só as páginas em análise abrem sozinhas (e fecham ao terminar). O usuário manda depois.
  const [openPages, setOpenPages] = useState<Record<string, boolean>>({});
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const stamp = result.finishedAt.slice(0, 10);
  const host = new URL(result.url).hostname.replace(/[^a-z0-9.-]/gi, '_');

  async function exportMarkdown() {
    setBusy(true);
    setExportError(null);
    try {
      download(`avaliacao-serigy-${host}-${stamp}.md`, await api.reportMarkdown(result), 'text/markdown');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  /** Executa de novo a avaliação só deste item (com os mesmos parâmetros) e atualiza o resultado. */
  async function reevaluate(itemId: string) {
    setReevaluating(itemId);
    setItemErrors(({ [itemId]: _drop, ...rest }) => rest);
    try {
      const fresh = await api.evaluate({
        url: result.url,
        poder: result.poder,
        items: [itemId],
        maxPages: result.crawl.maxPages,
        tryDocumentedCase: result.crawl.tryDocumentedCase,
        renderer: result.crawl.renderer,
      });
      onChange(mergeReevaluated(result, fresh, itemId));
    } catch (err) {
      setItemErrors((prev) => ({ ...prev, [itemId]: err instanceof Error ? err.message : String(err) }));
    } finally {
      setReevaluating(null);
    }
  }

  /**
   * Reavalia TODOS os itens de um grupo (um número da matriz, que pode reunir mais de uma pasta) com os mesmos
   * parâmetros. É uma única chamada à API: cada página é baixada uma vez e os resultados são mesclados de uma vez.
   */
  async function reevaluateGroup(groupNumber: string, itemIds: string[]) {
    setReevaluatingGroup(groupNumber);
    setGroupErrors(({ [groupNumber]: _drop, ...rest }) => rest);
    try {
      const fresh = await api.evaluate({
        url: result.url,
        poder: result.poder,
        items: itemIds,
        maxPages: result.crawl.maxPages,
        tryDocumentedCase: result.crawl.tryDocumentedCase,
        renderer: result.crawl.renderer,
      });
      onChange(mergeReevaluatedMany(result, fresh));
    } catch (err) {
      setGroupErrors((prev) => ({ ...prev, [groupNumber]: err instanceof Error ? err.message : String(err) }));
    } finally {
      setReevaluatingGroup(null);
    }
  }

  const failedFetches = result.fetched.filter((f) => f.error);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Resultado</h2>
        <span className="text-sm text-muted-foreground">
          {result.poderLabel} · {result.scope.items} itens · {result.fetched.length} páginas analisadas
        </span>
        <div className="ml-auto flex gap-2">
          <Button type="button" size="sm" onClick={exportMarkdown} disabled={busy || isLive}>
            <Download />
            Exportar Markdown
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isLive}
            onClick={() => download(`avaliacao-serigy-${host}-${stamp}.json`, JSON.stringify(result, null, 2), 'application/json')}
          >
            <FileJson />
            JSON
          </Button>
        </div>
      </div>
      {/* Identificação do portal e do ambiente (produção/desenvolvimento) */}
      {(result.portalNome || result.portalAmbiente) && (
        <div
          className={cn(
            'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-l-4 px-4 py-2.5 text-sm',
            result.portalAmbiente ? AMBIENTE_TONE[result.portalAmbiente].banner : 'bg-muted/40',
            result.portalAmbiente && AMBIENTE_TONE[result.portalAmbiente].stripe,
          )}
        >
          {result.portalAmbiente &&
            (() => {
              const t = AMBIENTE_TONE[result.portalAmbiente];
              const Icon = t.icon;
              return (
                <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wide">
                  <Icon className="size-4" />
                  Ambiente de {t.label.toLowerCase()}
                </span>
              );
            })()}
          {result.portalNome && <span className="font-medium">{result.portalNome}</span>}
          <a href={result.url} target="_blank" rel="noreferrer" className="break-all text-xs underline-offset-2 hover:underline sm:ml-auto">
            {result.url}
          </a>
        </div>
      )}

      {exportError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{exportError}</AlertDescription>
        </Alert>
      )}

      {progress && isLive && (
        <Card size="sm" role="status" aria-live="polite" className="border-blue-200">
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {running && <Spinner className="text-primary" />}
              <span className="font-medium">
                {running ? 'Analisando' : 'Interrompida'}: {progress.done} de {progress.total} itens concluídos
              </span>
              {onCancel && (
                <Button type="button" size="xs" variant="outline" className="ml-auto bg-white" onClick={onCancel}>
                  <X />
                  Cancelar
                </Button>
              )}
            </div>
            <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} />
            {running && lastFetched && (
              <div className="break-all text-xs text-muted-foreground">
                {result.fetched.length} página(s) baixada(s) · última: {lastFetched.url}
                {lastFetched.error ? ` (${lastFetched.error})` : ''}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <SummaryStats s={result.summary} />

      <Alert
        variant={result.invoker.found ? 'default' : 'destructive'}
        className={result.invoker.found ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-200 bg-rose-50/80'}
      >
        {result.invoker.found ? <CircleCheck className="text-emerald-600" /> : <CircleAlert />}
        <AlertTitle>Invoker</AlertTitle>
        <AlertDescription>{result.invoker.message}</AlertDescription>
      </Alert>

      {result.warnings.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50/80">
          <TriangleAlert className="text-amber-600" />
          <AlertTitle>
            Avisos e falhas ({result.warnings.length})
            {failedFetches.length > 0 && ` · ${failedFetches.length} página(s) com erro`}
          </AlertTitle>
          <AlertDescription>
            {/* Lista rolável: pode haver dezenas de falhas */}
            <ScrollArea className="mt-1 max-h-48 rounded-md border bg-white/80">
              <ul className="space-y-1.5 p-2 text-xs">
                {result.warnings.map((w) => (
                  <li key={w} className="break-all">
                    {w}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {(['all', 'missing', 'warning', 'empty', 'ok'] as const).map((f) => (
          <Button key={f} type="button" size="sm" variant={filter === f ? 'default' : 'outline'} className={filter === f ? '' : 'bg-white'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todos' : TONE[f].label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {/* Um item da matriz = um número: páginas de pastas diferentes com o mesmo número viram um grupo só */}
        {groupPagesByNumber(result.pages).map((group) => {
          const sections = group.sections
            .map((s) => ({ ...s, items: s.items.filter((i) => filter === 'all' || (!pending?.has(i.id) && i.status === filter)) }))
            .filter((s) => s.items.length > 0);
          if (sections.length === 0) return null;

          const allItems = group.sections.flatMap((s) => s.items);
          const summary = summarize(allItems.filter((i) => !pending?.has(i.id)));
          const pendingCount = allItems.filter((i) => pending?.has(i.id)).length;
          const hasRunning = allItems.some((i) => pending?.get(i.id) === 'running');
          const isOpen = openPages[group.number] ?? hasRunning;
          const noSchema = group.pages.filter((p) => !p.schemaFound);

          return (
            <Collapsible
              key={group.number}
              open={isOpen}
              onOpenChange={(o) => setOpenPages((prev) => ({ ...prev, [group.number]: o }))}
              className={cn('overflow-hidden rounded-xl border border-l-4 bg-card shadow-sm', pageTone(summary, pendingCount))}
            >
              <div className="flex items-center hover:bg-muted/60">
              <CollapsibleTrigger className="flex min-w-0 flex-1 flex-wrap items-center gap-2 p-3.5 text-left font-medium">
                <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                {/* Ícone do nível de atendimento do grupo: em análise (spinner/relógio) ou verde, amarelo, vermelho */}
                {pendingCount > 0 ? (
                  hasRunning ? (
                    <Spinner className="size-5 shrink-0 text-primary" />
                  ) : (
                    <Clock aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                  )
                ) : (
                  (() => {
                    const level = SCORE_ICON[scoreTone(summary.score)];
                    const LevelIcon = level.icon;
                    return (
                      <LevelIcon
                        role="img"
                        aria-label={`${level.label} (${summary.score}%)`}
                        className={cn('size-5 shrink-0', level.className)}
                      />
                    );
                  })()
                )}
                {group.number}. {group.title}
                {group.pages.map((p) => (
                  <code key={p.id} className="text-xs font-normal text-muted-foreground">
                    {p.id}
                  </code>
                ))}
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {pendingCount > 0 ? (
                    `${allItems.length - pendingCount}/${allItems.length} concluídos`
                  ) : (
                    <ScoreBadge summary={summary} />
                  )}
                </span>
                {!isLive && noSchema.length > 0 && (
                  <Badge variant="destructive">
                    schema ausente{group.pages.length > 1 ? ` (${noSchema.map((p) => p.folder).join(', ')})` : ''}
                  </Badge>
                )}
              </CollapsibleTrigger>
              {/* Reavaliar todos os itens do grupo (não faz parte do gatilho de abrir/fechar) */}
              {!isLive && (
                <div className="shrink-0 pr-3">
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    className="bg-white/80"
                    onClick={() => reevaluateGroup(group.number, allItems.map((i) => i.id))}
                    disabled={reevaluating !== null || reevaluatingGroup !== null}
                  >
                    {reevaluatingGroup === group.number ? <Spinner /> : <RefreshCw />}
                    {reevaluatingGroup === group.number ? `Reavaliando ${allItems.length} itens…` : 'Reavaliar grupo'}
                  </Button>
                </div>
              )}
              </div>
              {groupErrors[group.number] && <p className="px-4 pb-2 text-xs text-destructive">{groupErrors[group.number]}</p>}
              <CollapsibleContent>
                <div className="space-y-5 border-t bg-card/60 p-4">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {group.pages.map((p) => (
                      <a key={p.id} href={p.docUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                        Documentação oficial{group.pages.length > 1 ? ` (${p.folder})` : ''}
                      </a>
                    ))}
                  </div>
                  {sections.map((s) => {
                    const page = s.page; // página (pasta) de origem desta seção
                    return (
                    <div key={`${page.id}-${s.id}`} className="space-y-2">
                      <div>
                        <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {s.id}. {s.title}
                          <SectionScore items={page.sections.find((x) => x.id === s.id)?.items ?? []} pending={pending} />
                        </h3>
                        {s.notes.map((n) => (
                          <p key={n} className="text-xs text-muted-foreground">
                            {n}
                          </p>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {s.items.map((i) => {
                          const wait = pending?.get(i.id);
                          if (wait) {
                            // Ainda sem resultado: mostra que está na fila / sendo analisado.
                            const t = PENDING_TONE[wait];
                            return (
                              <div key={i.id} aria-busy={wait === 'running'} className={cn('flex items-start gap-3 rounded-xl border p-3', t.row)}>
                                <span className="w-14 shrink-0 text-sm text-muted-foreground">{i.id}</span>
                                <div className={cn('min-w-0 flex-1 text-sm', wait === 'skipped' && 'text-muted-foreground')}>
                                  {i.descricao}
                                  <div className="text-xs text-muted-foreground">
                                    <code>{i.atributo}</code>
                                  </div>
                                </div>
                                <Badge className={cn('border-transparent', t.chip)}>
                                  {wait === 'running' && <Spinner />}
                                  {t.label}
                                </Badge>
                              </div>
                            );
                          }

                          const tone = TONE[i.status];
                          const StatusIcon = tone.icon;
                          const hasDetails = i.status === 'missing' || i.status === 'warning';
                          const detailsOpen = openItems[i.id] ?? false; // detalhes sempre começam fechados
                          const iframes = (i.loadedVia ?? []).filter((v) => v.kind === 'iframe');
                          const links = (i.loadedVia ?? []).filter((v) => v.kind !== 'iframe');
                          return (
                            <Collapsible
                              key={i.id}
                              open={detailsOpen}
                              onOpenChange={(o) => setOpenItems((prev) => ({ ...prev, [i.id]: o }))}
                              className={cn('rounded-xl border p-3 transition-colors', tone.row)}
                            >
                              <div className="flex items-start gap-3">
                                <StatusIcon className={cn('mt-0.5 size-5 shrink-0', tone.iconClass)} />
                                <span className="w-14 shrink-0 text-sm text-muted-foreground">{i.id}</span>
                                <div className="min-w-0 flex-1 text-sm">
                                  <div className="font-medium">{i.descricao}</div>
                                  <div className="text-xs text-muted-foreground">
                                    <code>{i.atributo}</code> · {i.message}
                                  </div>
                                  <SchemaLine item={i} />
                                  <div className="break-all text-xs text-muted-foreground">
                                    URL analisada: <UrlList urls={i.analyzedUrls} />
                                  </div>

                                  {/* Alerta do iframe junto do item que depende dele */}
                                  {iframes.map((v) => {
                                    const where = page.iframes.find((f) => f.target === v.url)?.pageUrl;
                                    return (
                                      <div
                                        key={v.url}
                                        className="mt-2 flex items-start gap-2 break-all rounded-lg border border-violet-200 bg-violet-50 p-2 text-xs text-violet-900 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200"
                                      >
                                        <Frame className="mt-0.5 size-4 shrink-0" />
                                        <span>
                                          Esta página usa <strong>iframe</strong> com serigyLink: o conteúdo avaliado é <code>{v.url}</code>
                                          {where ? ` (iframe em ${where})` : ''}.
                                        </span>
                                      </div>
                                    );
                                  })}
                                  {links.map((v) => (
                                    <div key={v.url} className="mt-1 break-all text-xs text-violet-700 dark:text-violet-300">
                                      Via serigyLink{v.tag ? ` (<${v.tag}>)` : ''} → avaliado: {v.url}
                                    </div>
                                  ))}
                                  {itemErrors[i.id] && <p className="mt-1 text-xs text-destructive">{itemErrors[i.id]}</p>}
                                </div>

                                <div className="flex shrink-0 flex-col items-end gap-1.5">
                                  <Badge className={cn('border-transparent', tone.chip)}>{tone.label}</Badge>
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="outline"
                                    className="bg-white/80"
                                    onClick={() => reevaluate(i.id)}
                                    disabled={reevaluating !== null || reevaluatingGroup !== null || isLive}
                                  >
                                    {reevaluating === i.id ? <Spinner /> : <RefreshCw />}
                                    {reevaluating === i.id ? 'Reavaliando…' : 'Reavaliar'}
                                  </Button>
                                  {hasDetails && (
                                    <CollapsibleTrigger className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-primary hover:bg-white/70">
                                      <ChevronRight className={cn('size-3.5 transition-transform', detailsOpen && 'rotate-90')} />
                                      Detalhes
                                    </CollapsibleTrigger>
                                  )}
                                </div>
                              </div>
                              {hasDetails && (
                                <CollapsibleContent>
                                  <div className="mt-3">
                                    <ItemDetails item={i} page={page} section={s} />
                                  </div>
                                </CollapsibleContent>
                              )}
                            </Collapsible>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </section>
  );
}
