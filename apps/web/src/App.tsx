import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, Play, Settings2 } from 'lucide-react';
import type { CatalogPage, EvaluationResult, PoderId, PoderInfo, Portal } from '@serigy/shared';
import { api } from './api';
import { AmbienteBadge } from './components/AmbienteBadge';
import { ItemSelector } from './components/ItemSelector';
import { PortalManager } from './components/PortalManager';
import { ResultView } from './components/ResultView';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applyEvent, buildView, startLive, type Live } from './live';

type Mode = 'todos' | 'selecionar';

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
  const [showManager, setShowManager] = useState(false);
  // URL avulsa (quando nenhum portal cadastrado é selecionado)
  const [url, setUrl] = useState('');
  const [avulsoPoder, setAvulsoPoder] = useState<PoderId>('executivo');
  const [mode, setMode] = useState<Mode>('todos');
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [maxPages, setMaxPages] = useState(200);
  // Por padrão os caminhos da documentação são testados só em minúsculas.
  const [tryDocumentedCase, setTryDocumentedCase] = useState(false);
  // Navegador real (executa JavaScript) por padrão; desmarcado = só baixa o HTML.
  const [useBrowser, setUseBrowser] = useState(true);
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

  useEffect(() => {
    api.poderes().then(setPoderes).catch((e: Error) => setError(e.message));
    void loadPortais();
  }, [loadPortais]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, portalId);
    } catch {
      /* sem armazenamento: só não lembra a escolha */
    }
  }, [portalId]);

  // O catálogo (comum + poder) muda com o poder; a seleção é reiniciada.
  useEffect(() => {
    setSelected(new Set());
    api.catalog(poder).then((c) => setPages(c.pages)).catch((e: Error) => setError(e.message));
  }, [poder]);

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
    try {
      await api.evaluateStream(
        {
          url: targetUrl,
          poder,
          portalNome: portal?.nome,
          portalAmbiente: portal?.ambiente,
          items: mode === 'selecionar' ? [...selected] : undefined,
          maxPages,
          tryDocumentedCase,
          renderer: useBrowser ? 'browser' : 'http',
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

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center gap-4 rounded-xl border-b-4 border-blue-400 bg-blue-950 px-6 py-5 text-white shadow-sm">
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
          onClick={() => setShowManager((v) => !v)}
        >
          <Settings2 />
          {showManager ? 'Fechar cadastro' : 'Gerenciar portais'}
        </Button>
      </header>

      {showManager && (
        <PortalManager
          portais={portais}
          poderes={poderes}
          onChanged={(savedId) => {
            void loadPortais(savedId);
          }}
        />
      )}

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
                <SelectTrigger className="w-full sm:max-w-xl">
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
                <p className="text-xs text-muted-foreground">Nenhum portal cadastrado: use “Gerenciar portais” para cadastrar, ou informe uma URL avulsa.</p>
              )}
            </div>

            {portal ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <AmbienteBadge ambiente={portal.ambiente} />
                <span>
                  <span className="text-muted-foreground">Poder:</span> {poderLabel}
                </span>
                <a href={portal.url} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
                  {portal.url}
                </a>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-[1fr_16rem]">
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
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="flex flex-wrap gap-x-6 gap-y-2">
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

            {mode === 'selecionar' && <ItemSelector pages={pages} selected={selected} onChange={setSelected} />}

            <div className="space-y-3 rounded-lg border p-3">
              <div className="text-sm font-medium">Opções</div>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox className="mt-0.5" checked={useBrowser} onCheckedChange={setUseBrowser} />
                <span>
                  Abrir as páginas em um navegador (executa JavaScript)
                  <span className="block text-xs text-muted-foreground">
                    Recomendado: páginas reativas só mostram os resultados depois de carregar scripts, e o navegador se apresenta como
                    um acesso comum. Desmarcado, apenas o HTML é baixado (mais rápido, sem JavaScript).
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox className="mt-0.5" checked={tryDocumentedCase} onCheckedChange={setTryDocumentedCase} />
                <span>
                  Testar também a grafia da documentação (com maiúsculas)
                  <span className="block text-xs text-muted-foreground">
                    Os caminhos (ex.: <code>/Despesas</code>) são testados sempre em minúsculas (<code>/despesas</code>). Com esta opção
                    marcada, se a minúscula falhar (404 ou outro erro), a grafia da documentação também é testada.
                  </span>
                </span>
              </label>
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
                  onChange={(e) => setMaxPages(Number(e.target.value))}
                  className="w-24"
                />
              </div>
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

      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Não foi possível concluir a avaliação</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {view && live && (
        <ResultView
          result={view.result}
          onChange={setResult}
          pending={view.pending}
          progress={view.progress}
          onCancel={live.status === 'running' ? cancel : undefined}
        />
      )}
      {!live && result && <ResultView result={result} onChange={setResult} />}
    </main>
  );
}
