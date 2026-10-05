import { useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { AMBIENTES, type Ambiente, type PoderId, type PoderInfo, type Portal } from '@serigy/shared';
import { api } from '../api';
import { AmbienteBadge, AMBIENTE_TONE } from './AmbienteBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  portais: Portal[];
  poderes: PoderInfo[];
  /** Chamado depois de cadastrar/editar/excluir; recebe o id do portal salvo (se houver). */
  onChanged: (savedId?: number) => void;
}

interface Draft {
  nome: string;
  url: string;
  poder: PoderId;
  ambiente: Ambiente;
}

const EMPTY: Draft = { nome: '', url: '', poder: 'executivo', ambiente: 'producao' };

/** Cadastro dos portais da transparência (salvos no SQLite da API): nome, URL, poder e ambiente. */
export function PortalManager({ portais, poderes, onChanged }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const poderLabel = (id: PoderId) => poderes.find((p) => p.id === id)?.label ?? id;
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function reset() {
    setDraft(EMPTY);
    setEditingId(null);
    setError(null);
  }

  function edit(p: Portal) {
    setDraft({ nome: p.nome, url: p.url, poder: p.poder, ambiente: p.ambiente });
    setEditingId(p.id);
    setConfirmDelete(null);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = editingId === null ? await api.portais.create(draft) : await api.portais.update(editingId, draft);
      reset();
      onChanged(saved.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setError(null);
    try {
      await api.portais.remove(id);
      setConfirmDelete(null);
      if (editingId === id) reset();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portais cadastrados</CardTitle>
        <CardDescription>
          Cadastre a URL de cada portal com o poder e o ambiente. Depois basta selecionar o portal para avaliar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={save} className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <div className="text-sm font-medium">{editingId === null ? 'Novo portal' : 'Editar portal'}</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="portal-nome">Nome</Label>
              <Input id="portal-nome" value={draft.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Prefeitura de Exemplo" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="portal-url">URL do portal</Label>
              <Input
                id="portal-url"
                type="url"
                value={draft.url}
                onChange={(e) => set('url', e.target.value)}
                placeholder="https://transparencia.exemplo.gov.br/"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Poder / esfera</Label>
              <Select
                value={draft.poder}
                onValueChange={(v) => v && set('poder', v as PoderId)}
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
            <div className="space-y-1.5">
              <Label>Ambiente do endereço</Label>
              <RadioGroup value={draft.ambiente} onValueChange={(v) => set('ambiente', v as Ambiente)} className="flex flex-wrap gap-3">
                {AMBIENTES.map((a) => {
                  const tone = AMBIENTE_TONE[a.id];
                  const Icon = tone.icon;
                  return (
                    <label
                      key={a.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                        draft.ambiente === a.id ? tone.banner : 'bg-background hover:bg-muted',
                      )}
                    >
                      <RadioGroupItem value={a.id} />
                      <Icon className="size-4" />
                      {a.label}
                    </label>
                  );
                })}
              </RadioGroup>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {editingId === null ? <Plus /> : <Save />}
              {editingId === null ? 'Cadastrar' : 'Salvar alterações'}
            </Button>
            {editingId !== null && (
              <Button type="button" size="sm" variant="outline" onClick={reset}>
                <X />
                Cancelar edição
              </Button>
            )}
          </div>
        </form>

        {portais.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum portal cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">URL</th>
                  <th className="px-3 py-2 font-medium">Poder</th>
                  <th className="px-3 py-2 font-medium">Ambiente</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {portais.map((p) => (
                  <tr key={p.id} className={cn('border-t border-l-4', AMBIENTE_TONE[p.ambiente].stripe, editingId === p.id && 'bg-accent/50')}>
                    <td className="px-3 py-2 font-medium">{p.nome}</td>
                    <td className="break-all px-3 py-2">
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {p.url}
                      </a>
                    </td>
                    <td className="px-3 py-2">{poderLabel(p.poder)}</td>
                    <td className="px-3 py-2">
                      <AmbienteBadge ambiente={p.ambiente} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <Button type="button" size="xs" variant="outline" onClick={() => edit(p)}>
                        <Pencil />
                        Editar
                      </Button>{' '}
                      {confirmDelete === p.id ? (
                        <>
                          <Button type="button" size="xs" variant="destructive" onClick={() => remove(p.id)}>
                            Confirmar exclusão
                          </Button>{' '}
                          <Button type="button" size="xs" variant="ghost" onClick={() => setConfirmDelete(null)}>
                            Não
                          </Button>
                        </>
                      ) : (
                        <Button type="button" size="xs" variant="outline" onClick={() => setConfirmDelete(p.id)}>
                          <Trash2 />
                          Excluir
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
