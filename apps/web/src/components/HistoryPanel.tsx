import { useRef, useState } from 'react';
import { FileJson, FileText, ShieldCheck, ShieldOff, Trash2, Upload } from 'lucide-react';
import type { AvaliacaoResumo, Portal } from '@serigy/shared';
import { api, ApiError } from '../api';
import { AmbienteBadge } from './AmbienteBadge';
import { SCORE_STYLE, scoreTone } from '../score';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  items: AvaliacaoResumo[];
  portais: Portal[];
  openId: number | null;
  onOpen: (id: number) => void;
  /** Depois de qualquer mudança no histórico (importar, apagar). */
  onChanged: () => void;
  /** Uma avaliação apagada que estava aberta. */
  onRemoved: (id: number) => void;
  onPortaisChanged: (savedId?: number) => void;
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

const sameUrl = (a: string, b: string) => a.replace(/\/+$/, '').toLowerCase() === b.replace(/\/+$/, '').toLowerCase();

/** Lista das avaliações salvas (locais e importadas), com abrir, exportar, apagar e importar arquivo JSON. */
export function HistoryPanel({ items, portais, openId, onOpen, onChanged, onRemoved, onPortaisChanged }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const serigyRef = useRef<HTMLInputElement>(null);
  // Avaliação que vai receber o arquivo do Serigy escolhido
  const serigyTarget = useRef<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmSerigyId, setConfirmSerigyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [problemas, setProblemas] = useState<string[]>([]);
  const [duplicateId, setDuplicateId] = useState<number | null>(null);
  const [offer, setOffer] = useState<AvaliacaoResumo | null>(null);
  const [busy, setBusy] = useState(false);

  function clearMessages() {
    setError(null);
    setProblemas([]);
    setDuplicateId(null);
    setOffer(null);
  }

  async function importFile(file: File) {
    clearMessages();
    setBusy(true);
    try {
      let content: unknown;
      try {
        content = JSON.parse(await file.text());
      } catch {
        setError('O arquivo não é um JSON válido.');
        return;
      }
      const saved = await api.avaliacoes.import(content);
      onChanged();
      onOpen(saved.id);
      // Portal do arquivo ainda não cadastrado: oferece cadastrar
      if (!portais.some((p) => sameUrl(p.url, saved.portalUrl))) setOffer(saved);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.extra.id) {
        setDuplicateId(e.extra.id);
        setError('Esta avaliação já está no histórico.');
      } else if (e instanceof ApiError) {
        setError(e.message);
        setProblemas(e.extra.problemas ?? []);
      } else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  /** Anexa à avaliação o JSON baixado do Serigy (validação toda no servidor). */
  async function attachSerigy(file: File) {
    const id = serigyTarget.current;
    clearMessages();
    if (id === null) return;
    setBusy(true);
    try {
      let content: unknown;
      try {
        content = JSON.parse(await file.text());
      } catch {
        setError('O arquivo do Serigy não é um JSON válido.');
        return;
      }
      await api.avaliacoes.setSerigy(id, content);
      onChanged();
      // Reabre a avaliação para mostrar o Serigy junto de cada item
      if (openId === id) onOpen(id);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setProblemas(e.extra.problemas ?? []);
      } else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      serigyTarget.current = null;
      if (serigyRef.current) serigyRef.current.value = '';
    }
  }

  function pickSerigy(id: number) {
    serigyTarget.current = id;
    serigyRef.current?.click();
  }

  async function removeSerigy(id: number) {
    try {
      await api.avaliacoes.clearSerigy(id);
      setConfirmSerigyId(null);
      onChanged();
      if (openId === id) onOpen(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function exportSerigy(id: number) {
    try {
      await api.avaliacoes.exportSerigy(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function registerPortal(a: AvaliacaoResumo) {
    setBusy(true);
    try {
      const saved = await api.portais.create({
        nome: a.portalNome || new URL(a.portalUrl).hostname,
        url: a.portalUrl,
        poder: a.poder,
        ambiente: a.portalAmbiente ?? 'producao',
      });
      setOffer(null);
      onPortaisChanged(saved.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await api.avaliacoes.remove(id);
      setConfirmId(null);
      onRemoved(id);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function exportSaved(id: number, formato: 'json' | 'md') {
    try {
      await api.avaliacoes.exportSaved(id, formato);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">{items.length} avaliação(ões) salva(s)</p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Arquivo de avaliação (JSON)"
          onChange={(e) => e.target.files?.[0] && void importFile(e.target.files[0])}
        />
        <input
          ref={serigyRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Arquivo de avaliação do Serigy (JSON)"
          onChange={(e) => e.target.files?.[0] && void attachSerigy(e.target.files[0])}
        />
        <Button type="button" size="xs" variant="outline" className="ml-auto" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload />
          Importar JSON
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{error}</AlertTitle>
          {(problemas.length > 0 || duplicateId) && (
            <AlertDescription>
              {problemas.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-4 text-xs">
                  {problemas.map((p) => (
                    <li key={p} className="break-words">
                      {p}
                    </li>
                  ))}
                </ul>
              )}
              {duplicateId && (
                <Button type="button" size="xs" variant="outline" className="mt-1 bg-white dark:bg-white/10" onClick={() => onOpen(duplicateId)}>
                  Abrir a avaliação existente
                </Button>
              )}
            </AlertDescription>
          )}
        </Alert>
      )}

      {offer && (
        <Alert className="border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/40">
          <AlertTitle>Portal não cadastrado</AlertTitle>
          <AlertDescription>
            <span className="break-all">{offer.portalUrl}</span> não está na lista de portais. Cadastrar para poder avaliá-lo de novo?
            <span className="mt-1 flex gap-2">
              <Button type="button" size="xs" disabled={busy} onClick={() => void registerPortal(offer)}>
                Cadastrar portal
              </Button>
              <Button type="button" size="xs" variant="outline" className="bg-white dark:bg-white/10" onClick={() => setOffer(null)}>
                Agora não
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Nenhuma avaliação salva. Conclua uma avaliação completa e use “Salvar avaliação”, ou importe um arquivo JSON.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => {
            const tone = SCORE_STYLE[scoreTone(a.summary.score)];
            return (
              <li key={a.id} className={cn('rounded-lg border border-l-4 bg-card p-2.5 text-sm', tone.stripe, openId === a.id && 'ring-2 ring-primary/40')}>
                <button type="button" className="block w-full text-left" onClick={() => onOpen(a.id)} aria-label={`Abrir avaliação de ${a.portalNome ?? a.portalUrl} em ${formatDateTime(a.avaliadaEm)}`}>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{a.portalNome ?? new URL(a.portalUrl).hostname}</span>
                    {a.portalAmbiente && <AmbienteBadge ambiente={a.portalAmbiente} />}
                    {a.origem === 'importada' && <Badge variant="secondary">Importada</Badge>}
                    <span className={cn('ml-auto font-semibold', tone.text)}>{a.summary.score.toFixed(1)}%</span>
                    {a.serigy && (
                      <span
                        className={cn('inline-flex items-center gap-1 text-xs font-semibold', SCORE_STYLE[scoreTone(a.serigy.score)].text)}
                        title={`Serigy oficial: ${a.serigy.atendidos} de ${a.serigy.total} item(ns) pontuam`}
                      >
                        <ShieldCheck className="size-3.5" aria-hidden />
                        Serigy {a.serigy.score.toFixed(1)}%
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDateTime(a.avaliadaEm)} · {a.poderLabel} · {a.summary.total} itens
                  </span>
                </button>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Button type="button" size="xs" variant="ghost" onClick={() => void exportSaved(a.id, 'json')} title="Exportar JSON (importável)">
                    <FileJson />
                    JSON
                  </Button>
                  <Button type="button" size="xs" variant="ghost" onClick={() => void exportSaved(a.id, 'md')} title="Exportar relatório Markdown">
                    <FileText />
                    MD
                  </Button>
                  {a.serigy ? (
                    <>
                      <Button type="button" size="xs" variant="ghost" onClick={() => void exportSerigy(a.id)} title="Baixar o JSON do Serigy anexado a esta avaliação">
                        <ShieldCheck />
                        Serigy
                      </Button>
                      <Button type="button" size="icon-xs" variant="ghost" aria-label="Substituir a avaliação do Serigy" title="Substituir o JSON do Serigy" disabled={busy} onClick={() => pickSerigy(a.id)}>
                        <Upload />
                      </Button>
                      {confirmSerigyId === a.id ? (
                        <>
                          <span className="text-xs">Remover Serigy?</span>
                          <Button type="button" size="xs" variant="destructive" onClick={() => void removeSerigy(a.id)}>
                            Sim
                          </Button>
                          <Button type="button" size="xs" variant="outline" onClick={() => setConfirmSerigyId(null)}>
                            Não
                          </Button>
                        </>
                      ) : (
                        <Button type="button" size="icon-xs" variant="ghost" aria-label="Remover a avaliação do Serigy" title="Remover o JSON do Serigy anexado" onClick={() => setConfirmSerigyId(a.id)}>
                          <ShieldOff />
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-muted-foreground" title="Nenhuma avaliação do Serigy foi anexada a esta avaliação">
                        <ShieldOff />
                        Sem Serigy
                      </Badge>
                      <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={() => pickSerigy(a.id)} title="Anexar o JSON baixado do Serigy a esta avaliação">
                        <Upload />
                        Anexar Serigy
                      </Button>
                    </>
                  )}
                  <span className="ml-auto flex items-center gap-1.5">
                    {confirmId === a.id ? (
                      <>
                        <span className="text-xs">Apagar?</span>
                        <Button type="button" size="xs" variant="destructive" onClick={() => void remove(a.id)}>
                          Sim
                        </Button>
                        <Button type="button" size="xs" variant="outline" onClick={() => setConfirmId(null)}>
                          Não
                        </Button>
                      </>
                    ) : (
                      <Button type="button" size="icon-xs" variant="ghost" aria-label="Apagar avaliação" onClick={() => setConfirmId(a.id)}>
                        <Trash2 />
                      </Button>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
