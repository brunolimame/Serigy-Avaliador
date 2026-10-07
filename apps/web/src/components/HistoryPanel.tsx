import { useRef, useState } from 'react';
import { FileJson, FileText, Trash2, Upload } from 'lucide-react';
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
  const [confirmId, setConfirmId] = useState<number | null>(null);
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
                <Button type="button" size="xs" variant="outline" className="mt-1 bg-white" onClick={() => onOpen(duplicateId)}>
                  Abrir a avaliação existente
                </Button>
              )}
            </AlertDescription>
          )}
        </Alert>
      )}

      {offer && (
        <Alert className="border-blue-200 bg-blue-50/80">
          <AlertTitle>Portal não cadastrado</AlertTitle>
          <AlertDescription>
            <span className="break-all">{offer.portalUrl}</span> não está na lista de portais. Cadastrar para poder avaliá-lo de novo?
            <span className="mt-1 flex gap-2">
              <Button type="button" size="xs" disabled={busy} onClick={() => void registerPortal(offer)}>
                Cadastrar portal
              </Button>
              <Button type="button" size="xs" variant="outline" className="bg-white" onClick={() => setOffer(null)}>
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
