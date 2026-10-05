import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, Play } from 'lucide-react';
import type { CatalogPage, EvaluationResult, PoderId, PoderInfo } from '@serigy/shared';
import { api } from './api';
import { ItemSelector } from './components/ItemSelector';
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

export function App() {
  const [poderes, setPoderes] = useState<PoderInfo[]>([]);
  const [url, setUrl] = useState('');
  const [poder, setPoder] = useState<PoderId>('executivo');
  const [mode, setMode] = useState<Mode>('todos');
  const [pages, setPages] = useState<CatalogPage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [maxPages, setMaxPages] = useState(200);
  // Por padrão os caminhos da documentação são testados só em minúsculas.
  const [tryDocumentedCase, setTryDocumentedCase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  // Avaliação em andamento (ou interrompida): itens vão chegando pelo stream.
  const [live, setLive] = useState<Live | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const view = useMemo(() => (live ? buildView(live) : null), [live]);

  useEffect(() => {
    api.poderes().then(setPoderes).catch((e: Error) => setError(e.message));
  }, []);

  // O catálogo (comum + poder) muda com o poder; a seleção é reiniciada.
  useEffect(() => {
    setSelected(new Set());
    api.catalog(poder).then((c) => setPages(c.pages)).catch((e: Error) => setError(e.message));
  }, [poder]);

  const canRun = url.trim() !== '' && !loading && (mode === 'todos' || selected.size > 0);
  const poderLabel = poderes.find((p) => p.id === poder)?.label;

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
        { url: url.trim(), poder, items: mode === 'selecionar' ? [...selected] : undefined, maxPages, tryDocumentedCase },
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
      <header className="rounded-xl border-b-4 border-blue-400 bg-blue-950 px-6 py-5 text-white shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-blue-200">PNTP 2026 · Serigy</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Avaliador de Portais da Transparência</h1>
        <p className="mt-1 text-sm text-blue-100/90">
          Verifica a marcação Serigy do portal contra a matriz de requisitos (comuns + do poder) e gera o relatório da avaliação.
        </p>
      </header>

      <form onSubmit={run}>
        <Card>
          <CardHeader>
            <CardTitle>Nova avaliação</CardTitle>
            <CardDescription>Informe o portal e o poder; os requisitos comuns valem para todos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
                  value={poder}
                  onValueChange={(v) => v && setPoder(v as PoderId)}
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
