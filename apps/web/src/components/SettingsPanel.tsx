import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, X } from 'lucide-react';
import {
  SETTING_CATEGORIES,
  type PoderInfo,
  type Portal,
  type SettingCategory,
  type SettingDef,
  type SettingsResponse,
  type SettingValue,
} from '@serigy/shared';
import { api } from '../api';
import { PortalManager } from './PortalManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: SettingsResponse | null;
  onSettingsChange: (next: SettingsResponse) => void;
  portais: Portal[];
  poderes: PoderInfo[];
  onPortaisChanged: (savedId?: number) => void;
  /** Quantidade de avaliações no histórico (para o texto do botão de apagar). */
  historyCount: number;
  onHistoryCleared: () => void;
}

/** Controle de uma configuração (checkbox ou número), com indicador de "modificada" e restauração individual. */
function SettingRow({
  def,
  value,
  modified,
  onSave,
  onReset,
}: {
  def: SettingDef;
  value: SettingValue;
  modified: boolean;
  onSave: (v: SettingValue) => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setDraft(String(value)), [value]);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDraft(String(value));
    }
  }

  function commitNumber() {
    const n = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(n)) {
      setError('Informe um número');
      setDraft(String(value));
      return;
    }
    if (n !== value) void run(() => onSave(n));
  }

  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-b-0">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={def.chave} className="font-medium">
            {def.rotulo}
          </Label>
          {modified && <Badge variant="secondary">modificada</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{def.descricao}</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {def.tipo === 'boolean' ? (
          <Checkbox id={def.chave} checked={value === true} onCheckedChange={(c) => void run(() => onSave(c === true))} />
        ) : (
          <Input
            id={def.chave}
            type="number"
            min={def.min}
            max={def.max}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitNumber}
            onKeyDown={(e) => e.key === 'Enter' && commitNumber()}
            className="w-24"
          />
        )}
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          title={`Restaurar o padrão (${String(def.padrao)})`}
          aria-label={`Restaurar o padrão de ${def.rotulo}`}
          disabled={!modified}
          onClick={() => void run(onReset)}
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  );
}

/**
 * Configurações gerais da aplicação, em uma janela estilo VS Code (atalho Ctrl+, / Cmd+,): categorias à esquerda e
 * os ajustes da categoria à direita. As configurações valem para toda a aplicação e ficam no SQLite.
 */
export function SettingsPanel({ open, onClose, settings, onSettingsChange, portais, poderes, onPortaisChanged, historyCount, onHistoryCleared }: Props) {
  const [category, setCategory] = useState<SettingCategory>('comportamento');
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setConfirmReset(false);
      setConfirmClear(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function apply(action: () => Promise<SettingsResponse>) {
    const next = await action();
    onSettingsChange(next);
  }

  async function resetAll() {
    setError(null);
    setResetting(true);
    try {
      await apply(() => api.configuracoes.reset());
      setConfirmReset(false);
      onPortaisChanged(); // os portais cadastrados também foram apagados
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setResetting(false);
    }
  }

  async function clearHistory() {
    setError(null);
    try {
      await api.avaliacoes.removeAll();
      setConfirmClear(false);
      onHistoryCleared();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const defs = settings?.definicoes.filter((d) => d.categoria === category) ?? [];
  const current = SETTING_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-3 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Configurações" className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Configurações</h2>
          <span className="hidden text-xs text-muted-foreground sm:inline">Valem para toda a aplicação · Esc fecha</span>
          <div className="ml-auto flex items-center gap-2">
            {confirmReset ? (
              <>
                <span className="text-xs">Restaurar o padrão e apagar os portais cadastrados?</span>
                <Button type="button" size="xs" variant="destructive" disabled={resetting} onClick={() => void resetAll()}>
                  {resetting && <Loader2 className="animate-spin" />}
                  {resetting ? 'Restaurando…' : 'Restaurar'}
                </Button>
                <Button type="button" size="xs" variant="outline" disabled={resetting} onClick={() => setConfirmReset(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button type="button" size="xs" variant="outline" onClick={() => setConfirmReset(true)}>
                <RotateCcw />
                Restaurar configurações
              </Button>
            )}
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Fechar configurações" onClick={onClose}>
              <X />
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b p-2 sm:w-52 sm:flex-col sm:border-r sm:border-b-0" aria-label="Categorias">
            {SETTING_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-current={c.id === category ? 'page' : undefined}
                className={cn('rounded-md px-3 py-2 text-left text-sm whitespace-nowrap hover:bg-muted', c.id === category && 'bg-muted font-medium')}
              >
                {c.label}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {current && (
              <div className="mb-4">
                <h3 className="text-base font-semibold">{current.label}</h3>
                <p className="text-sm text-muted-foreground">{current.descricao}</p>
              </div>
            )}
            {error && (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {category === 'portais' && <PortalManager portais={portais} poderes={poderes} onChanged={onPortaisChanged} />}

            {category !== 'portais' &&
              settings &&
              defs.map((d) => (
                <SettingRow
                  key={d.chave}
                  def={d}
                  value={settings.valores[d.chave] ?? d.padrao}
                  modified={settings.modificadas.includes(d.chave)}
                  onSave={(v) => apply(() => api.configuracoes.set(d.chave, v))}
                  onReset={() => apply(() => api.configuracoes.reset(d.chave))}
                />
              ))}

            {category === 'historico' && (
              <div className="mt-2 space-y-2 rounded-lg border p-3">
                <div className="text-sm font-medium">Apagar todo o histórico</div>
                <p className="text-xs text-muted-foreground">
                  Remove as {historyCount} avaliação(ões) salvas (locais e importadas). Os portais e as configurações não são afetados. Não há como desfazer.
                </p>
                {confirmClear ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm">Apagar definitivamente?</span>
                    <Button type="button" size="sm" variant="destructive" onClick={() => void clearHistory()}>
                      Sim, apagar tudo
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setConfirmClear(false)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button type="button" size="sm" variant="outline" disabled={historyCount === 0} onClick={() => setConfirmClear(true)}>
                    Apagar todo o histórico
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
