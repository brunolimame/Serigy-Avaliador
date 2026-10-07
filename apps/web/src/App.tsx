import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CircleAlert, CircleCheck, History, Play, Save, Settings } from 'lucide-react';
import type {
  AvaliacaoDetalhe,
  AvaliacaoResumo,
  CatalogPage,
  EvaluationResult,
  PoderId,
  PoderInfo,
  Portal,
  SettingsResponse,
} from '@serigy/shared';
import { api, ApiError } from './api';
import { AmbienteBadge } from './components/AmbienteBadge';
import { formatDateTime, HistoryPanel } from './components/HistoryPanel';
import { ItemSelectorModal, selectionSummary } from './components/ItemSelector';
import { ResultView } from './components/ResultView';
import { SettingsPanel } from './components/SettingsPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { applyEvent, buildView, startLive, type Live } from './live';

type Mode = 'todos' | 'selecionar';
type Tab = 'avaliar' | 'historico';
type SaveState = 'idle' | 'saving' | 'saved' | 'duplicate' | 'error';

/** Valor do seletor para uma URL que não está cadastrada. */
const AVULSO = 'avulso';
const STORAGE_KEY = 'avaliador.portalId';

const remembered = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export function App() {
  const [poderes, setPoderes] = useState<PoderInfo[]>([]);
  const [portais, setPortais] = useState<Portal[]>([]);
  const [portalId, setPortalId] = useState<string>(AVULSO);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tab, setTab] = useState<Tab>('avaliar');
  const [historico, setHistorico] = useState<AvaliacaoResumo[]>([]);
  // Avaliação aberta a partir do histórico (somente leitura); tem precedência sobre o resultado atual na coluna direita.
  const [opened, setOpened] = useState<AvaliacaoDetalhe | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<number | null>(null);
  // URL avulsa (quando nenhum portal cadastrado é selecionado)
  const [url, setUrl] = useState('');
  const [avulsoPoder, setAvulsoPoder] = useState<PoderId>('executivo');
  const [mode, setMode] = useState<Mode>('todos');
  const [showSelector, setShowSelector] = useState(false);
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // "Extra" desta avaliação: começa no valor das configurações e vale só para esta execução.
  const [maxPagesOverride, setMaxPagesOverride] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  // Avaliação em andamento (ou interrompida): itens vão chegando pelo stream.
  const [live, setLive] = useState<Live | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const view = useMemo(() => (live ? buildView(live) : null), [live]);

  // O que será avaliado: o portal cadastrado selecionado ou a URL avulsa.
  const portal = portais.find((p) => String(p.id) === portalId);
  const targetUrl = portal ? portal.url : url.trim();
  const poder: PoderId = portal ? portal.poder : avulsoPoder;
  const settingMaxPages = (settings?.valores['comportamento.maxPaginasSerigyLink'] as number | undefined) ?? 40;
  const maxPages = maxPagesOverride ?? settingMaxPages;

  const loadPortais = useCallback(async (preferId?: number) => {
    try {
      const list = await api.portais.list();
      setPortais(list);
      setPortalId((current) => {
        if (preferId !== undefined && list.some((p) => p.id === preferId)) return String(preferId);
        if (list.some((p) => String(p.id) === current)) return current;
        const saved = remembered();
        if (saved && list.some((p) => String(p.id) === saved)) return saved;
        return list[0] ? String(list[0].id) : AVULSO;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const loadHistorico = useCallback(async () => {
    try {
      setHistorico(await api.avaliacoes.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    api.poderes().then(setPoderes).catch((e: Error) => setError(e.message));
    api.configuracoes.get().then(setSettings).catch((e: Error) => setError(e.message));
    void loadPortais();
    void loadHistorico();
  }, [loadPortais, loadHistorico]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, portalId);
    } catch {
      /* sem armazenamento: só não lembra a escolha */
    }
  }, [portalId]);

  // Ctrl+, (Windows/Linux) ou Cmd+, (Mac) abre/fecha as configurações
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // O catálogo (comum + poder) muda com o poder; a seleção é reiniciada.
  useEffect(() => {
    setSelected(new Set());
    api.catalog(poder).then((c) => setPages(c.pages)).catch((e: Error) => setError(e.message));
  }, [poder]);

  // Qualquer mudança no resultado atual (nova avaliação, reavaliação) invalida o "salvo"
  useEffect(() => {
    setSaveState('idle');
    setSaveMessage(null);
    setDuplicateId(null);
  }, [result]);

  const canRun = targetUrl !== '' && !loading && (mode === 'todos' || selected.size > 0);
  const poderLabel = poderes.find((p) => p.id === poder)?.label;
  const portalItems = [
    ...portais.map((p) => ({ value: String(p.id), label: p.nome })),
    { value: AVULSO, label: 'URL avulsa (não cadastrada)' },
  ];

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setResult(null);
    setLive(null);
    setOpened(null);
    try {
      await api.evaluateStream(
        {
          url: targetUrl,
          poder,
          portalNome: portal?.nome,
          portalAmbiente: portal?.ambiente,
          items: mode === 'selecionar' ? [...selected] : undefined,
          // Só o "extra" desta avaliação; o resto (navegador, grafia) vem das configurações no servidor
          maxPages: maxPagesOverride ?? undefined,
        },
        (event) => {
          if (event.type === 'plan') setLive(startLive(event.plan));
          else if (event.type === 'done') {
            setLive(null);
            setResult(event.result);
          } else if (event.type === 'error') {
            setError(event.message);
            setLive((l) => (l ? { ...l, status: 'error' } : l));
          } else setLive((l) => (l ? applyEvent(l, event) : l));
        },
        ctrl.signal,
      );
    } catch (err) {
      if (ctrl.signal.aborted) setLive((l) => (l ? { ...l, status: 'cancelled' } : l));
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  /** Interrompe a avaliação; o servidor para de iniciar novas seções. */
  function cancel() {
    abortRef.current?.abort();
  }

  async function saveCurrent() {
    if (!result) return;
    setSaveState('saving');
    setSaveMessage(null);
    try {
      await api.avaliacoes.save(result);
      setSaveState('saved');
      void loadHistorico();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setSaveState('duplicate');
        setDuplicateId(e.extra.id ?? null);
      } else {
        setSaveState('error');
        setSaveMessage(e instanceof Error ? e.message : String(e));
      }
    }
  }

  async function openSaved(id: number) {
    try {
      setOpened(await api.avaliacoes.get(id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const complete = result?.scope.mode === 'todos';
  const saveButton = result && !live && (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!complete || saveState === 'saving' || saveState === 'saved'}
        title={complete ? 'Salva esta avaliação no histórico' : 'Só avaliações completas (todos os itens) podem ser salvas'}
        onClick={() => void saveCurrent()}
      >
        {saveState === 'saved' ? <CircleCheck /> : <Save />}
        {saveState === 'saving' ? 'Salvando…' : saveState === 'saved' ? 'Salva no histórico' : 'Salvar avaliação'}
      </Button>
      {saveState === 'duplicate' && (
        <span className="flex items-center gap-1.5 text-xs text-amber-700">
          Já está no histórico.
          {duplicateId && (
            <Button type="button" size="xs" variant="link" onClick={() => void openSaved(duplicateId)}>
              Abrir
            </Button>
          )}
        </span>
      )}
      {saveState === 'error' && <span className="text-xs text-destructive">{saveMessage}</span>}
    </>
  );

  return (
    <main className="mx-auto flex max-w-[1700px] flex-col gap-4 p-4 sm:p-6 ">
      <header className="flex shrink-0 flex-wrap items-center gap-4 rounded-xl border-b-4 border-blue-400 bg-blue-950 px-6 py-3 text-white shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-200">PNTP 2026 · Serigy</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Avaliador de Portais da Transparência</h1>
          <p className="mt-1 text-sm text-blue-100/90">
            Verifica a marcação Serigy do portal contra a matriz de requisitos (comuns + do poder) e gera o relatório da avaliação.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          onClick={() => setShowSettings(true)}
          title="Configurações (Ctrl+, ou Cmd+,)"
        >
          <Settings />
          Configurações
        </Button>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[26rem_minmax(0,1fr)]">
        {/* Coluna esquerda: nova avaliação / histórico */}
        <aside className="space-y-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
            {(
              [
                ['avaliar', 'Nova avaliação', Play],
                ['historico', `Histórico (${historico.length})`, History],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm',
                  tab === id ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab === 'historico' ? (
            <HistoryPanel
              items={historico}
              portais={portais}
              openId={opened?.resumo.id ?? null}
              onOpen={(id) => void openSaved(id)}
              onChanged={() => void loadHistorico()}
              onRemoved={(id) => setOpened((o) => (o?.resumo.id === id ? null : o))}
              onPortaisChanged={(id) => void loadPortais(id)}
            />
          ) : (
            <form onSubmit={run}>
              <Card>
                <CardHeader>
                  <CardTitle>Nova avaliação</CardTitle>
                  <CardDescription>Selecione o portal cadastrado; os requisitos comuns valem para todos os poderes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-1.5">
                    <Label>Portal da transparência</Label>
                    <Select value={portalId} onValueChange={(v) => v && setPortalId(v)} items={portalItems}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {portais.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            <span className="flex items-center gap-2">
                              {p.nome}
                              <AmbienteBadge ambiente={p.ambiente} />
                            </span>
                          </SelectItem>
                        ))}
                        <SelectItem value={AVULSO}>URL avulsa (não cadastrada)</SelectItem>
                      </SelectContent>
                    </Select>
                    {portais.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum portal cadastrado: cadastre em Configurações › Portais (Ctrl+,), ou informe uma URL avulsa.
                      </p>
                    )}
                  </div>

                  {portal ? (
                    <div className="space-y-1 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <AmbienteBadge ambiente={portal.ambiente} />
                        <span>
                          <span className="text-muted-foreground">Poder:</span> {poderLabel}
                        </span>
                      </div>
                      <a href={portal.url} target="_blank" rel="noreferrer" className="block break-all text-primary hover:underline">
                        {portal.url}
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="url">URL do portal da transparência</Label>
                        <Input
                          id="url"
                          type="url"
                          required
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://transparencia.exemplo.gov.br/"
                        />
                        <p className="text-xs text-muted-foreground">
                          Raiz do portal (<code>[Portal da Transparencia]</code> na documentação); o caminho de cada seção é acrescentado a ela.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Poder / esfera</Label>
                        <Select
                          value={avulsoPoder}
                          onValueChange={(v) => v && setAvulsoPoder(v as PoderId)}
                          items={poderes.map((p) => ({ value: p.id, label: p.label }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {poderes.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>O que avaliar</Label>
                    <RadioGroup
                      value={mode}
                      onValueChange={(v) => {
                        setMode(v as Mode);
                        if (v === 'selecionar') setShowSelector(true);
                      }}
                      className="grid gap-2"
                    >
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <RadioGroupItem value="todos" />
                        Todos os itens (comuns + {poderLabel})
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <RadioGroupItem value="selecionar" />
                        Selecionar itens
                      </label>
                    </RadioGroup>
                  </div>

                  {mode === 'selecionar' && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                      {(() => {
                        const s = selectionSummary(pages, selected);
                        return s.itemsSelected === 0 ? (
                          <span className="text-muted-foreground">Nenhum item selecionado</span>
                        ) : (
                          <span>
                            <strong>{s.groupsSelected}</strong> de {s.groupsTotal} grupos · <strong>{s.itemsSelected}</strong> de {s.itemsTotal} itens
                          </span>
                        );
                      })()}
                      <Button type="button" size="xs" variant="outline" className="ml-auto bg-white" onClick={() => setShowSelector(true)}>
                        Selecionar itens…
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      Extras desta avaliação
                      <Badge variant="secondary">não altera as configurações</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Label htmlFor="maxPages" className="font-normal">
                        Máx. de páginas seguidas por serigyLink
                      </Label>
                      <Input
                        id="maxPages"
                        type="number"
                        min={1}
                        max={200}
                        value={maxPages}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setMaxPagesOverride(Number.isFinite(n) && n >= 1 ? n : null);
                        }}
                        className="w-20 shrink-0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Começa com o valor das configurações ({settingMaxPages}). Navegador e grafia da documentação também ficam em Configurações ›
                      Comportamento.
                    </p>
                  </div>
                </CardContent>
                <div className="px-4 pb-4">
                  <Button type="submit" disabled={!canRun}>
                    <Play />
                    {loading ? 'Avaliando…' : 'Avaliar'}
                  </Button>
                </div>
              </Card>
            </form>
          )}
        </aside>

        {/* Coluna direita: resultado (estatísticas fixas no topo) */}
        <section className="flex min-w-0 flex-col gap-4">
          {error && (
            <Alert variant="destructive" className="shrink-0">
              <CircleAlert />
              <AlertTitle>Não foi possível concluir a operação</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {opened ? (
            <ResultView
              key={opened.resumo.id}
              result={opened.resultado}
              onChange={() => undefined}
              readOnly
              banner={
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-l-4 border-l-blue-400 bg-blue-50/80 px-4 py-2.5 text-sm">
                  <History className="size-4 text-blue-600" />
                  <span className="font-medium">Avaliação do histórico</span>
                  <span className="text-muted-foreground">avaliada em {formatDateTime(opened.resumo.avaliadaEm)}</span>
                  {opened.resumo.origem === 'importada' && <Badge variant="secondary">Importada</Badge>}
                  <span className="text-xs text-muted-foreground">somente leitura — para reavaliar, faça uma nova avaliação</span>
                  <Button type="button" size="xs" variant="outline" className="ml-auto bg-white" onClick={() => setOpened(null)}>
                    <ArrowLeft />
                    Fechar
                  </Button>
                </div>
              }
            />
          ) : view && live ? (
            <ResultView
              result={view.result}
              onChange={setResult}
              pending={view.pending}
              progress={view.progress}
              onCancel={live.status === 'running' ? cancel : undefined}
            />
          ) : result ? (
            <ResultView result={result} onChange={setResult} actions={saveButton} />
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              O resultado da avaliação aparece aqui. Escolha o portal e clique em “Avaliar”, ou abra uma avaliação do histórico.
            </div>
          )}
        </section>
      </div>

      <ItemSelectorModal open={showSelector} onClose={() => setShowSelector(false)} pages={pages} selected={selected} onChange={setSelected} />

      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
        portais={portais}
        poderes={poderes}
        onPortaisChanged={(id) => void loadPortais(id)}
        historyCount={historico.length}
        onHistoryCleared={() => {
          setOpened(null);
          void loadHistorico();
        }}
      />
    </main>
  );
}
