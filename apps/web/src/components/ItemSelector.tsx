import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { CatalogPage } from '@serigy/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Props {
  pages: CatalogPage[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

const idsOf = (p: CatalogPage): string[] => p.sections.flatMap((s) => s.items.map((i) => i.id));

/** Árvore página → seção → item com checkboxes e busca. O número da página vem antes do título. */
export function ItemSelector({ pages, selected, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      pages
        .map((p) => ({
          page: p,
          sections: p.sections
            .map((s) => ({
              section: s,
              items: s.items.filter((i) => !q || `${i.id} ${i.descricao} ${i.atributo}`.toLowerCase().includes(q)),
            }))
            .filter((s) => s.items.length > 0),
        }))
        .filter((p) => p.sections.length > 0),
    [pages, q],
  );

  const toggle = (ids: string[], on: boolean) => {
    const next = new Set(selected);
    for (const id of ids) (on ? next.add(id) : next.delete(id));
    onChange(next);
  };

  const all = pages.flatMap(idsOf);

  return (
    <div className="rounded-lg border bg-card">
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

      <ScrollArea className="max-h-96">
        <div className="space-y-1 p-3">
          {visible.map(({ page, sections }) => {
            const pageIds = idsOf(page);
            const count = pageIds.filter((id) => selected.has(id)).length;
            const isOpen = open[page.id] ?? q !== '';
            return (
              <Collapsible key={page.id} open={isOpen} onOpenChange={(o) => setOpen((prev) => ({ ...prev, [page.id]: o }))}>
                <div className="flex items-center gap-2 rounded-md py-1 hover:bg-muted/50">
                  <Checkbox
                    aria-label={`Selecionar todos os itens de ${page.number}. ${page.title}`}
                    checked={count === pageIds.length}
                    indeterminate={count > 0 && count < pageIds.length}
                    onCheckedChange={(checked) => toggle(pageIds, checked)}
                  />
                  <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-left text-sm font-medium">
                    <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                    <span>
                      <span className="text-muted-foreground">{page.number}.</span> {page.title}
                    </span>
                    <code className="text-xs text-muted-foreground">{page.id}</code>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {count}/{pageIds.length}
                    </span>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="ml-6 space-y-2 border-l pb-2 pl-4">
                    {sections.map(({ section, items }) => (
                      <div key={section.id}>
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
      </ScrollArea>
    </div>
  );
}
