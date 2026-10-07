import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { groupPagesByNumber, type CatalogPage } from '@serigy/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  pages: CatalogPage[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

/** Quantos grupos (número da matriz) e itens estão marcados, e o total disponível. */
export function selectionSummary(pages: CatalogPage[], selected: Set<string>) {
  const groups = groupPagesByNumber(pages);
  let groupsSelected = 0;
  let itemsTotal = 0;
  for (const g of groups) {
    const ids = g.sections.flatMap((s) => s.items.map((i) => i.id));
    itemsTotal += ids.length;
    if (ids.some((id) => selected.has(id))) groupsSelected++;
  }
  return { groupsSelected, groupsTotal: groups.length, itemsSelected: selected.size, itemsTotal };
}

/** Janela para escolher os itens (a árvore completa fica dentro dela). */
export function ItemSelectorModal({ open, onClose, pages, selected, onChange }: Props & { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const s = selectionSummary(pages, selected);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Selecionar itens" className="flex h-full max-h-[52rem] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Selecionar itens</h2>
          <span className="text-sm text-muted-foreground">
            {s.groupsSelected} de {s.groupsTotal} grupos · {s.itemsSelected} de {s.itemsTotal} itens
          </span>
          <Button type="button" size="icon-sm" variant="ghost" className="ml-auto" aria-label="Fechar" onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className="min-h-0 flex-1 p-3">
          <ItemSelector pages={pages} selected={selected} onChange={onChange} />
        </div>
        <div className="flex justify-end border-t px-4 py-3">
          <Button type="button" onClick={onClose}>
            Concluir
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Árvore grupo → seção → item com checkboxes e busca. O grupo é o NÚMERO da matriz: páginas de pastas
 * diferentes com o mesmo número (ex.: "11. Planejamento e Prestação de Contas" em comum + consórcios)
 * aparecem como um item só, com as seções em ordem numérica.
 */
export function ItemSelector({ pages, selected, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => groupPagesByNumber(pages), [pages]);
  const idsOf = (g: (typeof groups)[number]): string[] => g.sections.flatMap((s) => s.items.map((i) => i.id));

  const visible = useMemo(
    () =>
      groups
        .map((group) => ({
          group,
          sections: group.sections
            .map((section) => ({
              section,
              items: section.items.filter((i) => !q || `${i.id} ${i.descricao} ${i.atributo}`.toLowerCase().includes(q)),
            }))
            .filter((s) => s.items.length > 0),
        }))
        .filter((g) => g.sections.length > 0),
    [groups, q],
  );

  const toggle = (ids: string[], on: boolean) => {
    const next = new Set(selected);
    for (const id of ids) (on ? next.add(id) : next.delete(id));
    onChange(next);
  };

  const all = groups.flatMap(idsOf);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por item, descrição ou atributo…"
          className="min-w-0 flex-1"
        />
        <Button type="button" variant="ghost" size="sm" onClick={() => toggle(all, true)}>
          Marcar todos
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(new Set())}>
          Limpar
        </Button>
        <span className="text-sm text-muted-foreground">
          {selected.size} de {all.length} itens
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-1 p-3">
          {visible.map(({ group, sections }) => {
            const groupIds = idsOf(group);
            const count = groupIds.filter((id) => selected.has(id)).length;
            const isOpen = open[group.number] ?? q !== '';
            return (
              <Collapsible key={group.number} open={isOpen} onOpenChange={(o) => setOpen((prev) => ({ ...prev, [group.number]: o }))}>
                <div className="flex items-center gap-2 rounded-md py-1 hover:bg-muted/50">
                  <Checkbox
                    aria-label={`Selecionar todos os itens de ${group.number}. ${group.title}`}
                    checked={count === groupIds.length}
                    indeterminate={count > 0 && count < groupIds.length}
                    onCheckedChange={(checked) => toggle(groupIds, checked)}
                  />
                  <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-left text-sm font-medium">
                    <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                    <span>
                      <span className="text-muted-foreground">{group.number}.</span> {group.title}
                    </span>
                    {group.pages.map((p) => (
                      <code key={p.id} className="text-xs text-muted-foreground">
                        {p.id}
                      </code>
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {count}/{groupIds.length}
                    </span>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="ml-6 space-y-2 border-l pb-2 pl-4">
                    {sections.map(({ section, items }) => (
                      <div key={`${section.page.id}-${section.id}`}>
                        <div className="text-sm font-medium text-muted-foreground">
                          {section.id}. {section.title}
                        </div>
                        {items.map((i) => (
                          <label key={i.id} className="flex cursor-pointer items-start gap-2 py-0.5 text-sm">
                            <Checkbox className="mt-0.5" checked={selected.has(i.id)} onCheckedChange={(checked) => toggle([i.id], checked)} />
                            <span className="w-14 shrink-0 text-muted-foreground">{i.id}</span>
                            <span className="flex-1">{i.descricao}</span>
                            <code className="text-xs text-muted-foreground">{i.atributo}</code>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
          {visible.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>}
        </div>
      </div>
    </div>
  );
}
