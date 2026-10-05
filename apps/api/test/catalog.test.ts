import { describe, expect, it } from 'vitest';
import { PODERES } from '@serigy/shared';
import { loadCatalog, pagesForPoder } from '../src/catalog/load';
import { parsePage, splitRow } from '../src/catalog/parse-docs';

describe('splitRow', () => {
  it('respeita pipe escapado', () => {
    const bs = String.fromCharCode(92);
    expect(splitRow(`| 1.1 | a | Texto ${bs}| Numérico |`)).toEqual(['1.1', 'a', 'Texto | Numérico']);
  });
});

describe('parsePage', () => {
  const md = [
    '# 4. Despesas',
    '| Dimensão | Atributo | Valor |',
    '| Despesas | serigySchema | https://serigy.tce.se.gov.br/comum/despesas.html |',
    '## 4.1. Despesas Comum',
    '**Caminho URL:** [Portal]/Despesas',
    '| Item | Critério(s) | Descrição | Atributo | Valor |',
    '| 4.1.1 | 4.1, 4.3 | Total empenhado | valorEmpenhado | Monetário |',
    '**ℹ️ Obs.:** não se aplica às Estatais',
    '## Exemplos',
    '```',
    '| 9.9.9 | x | y | z | Texto |',
    '```',
  ].join('\n');

  it('extrai schema, seções, itens, caminho e observações', () => {
    const { page, warnings } = parsePage('comum/despesas', md);
    expect(warnings).toEqual([]);
    expect(page.schemaUrl).toBe('https://serigy.tce.se.gov.br/comum/despesas.html');
    expect(page.sections).toHaveLength(1);
    const s = page.sections[0]!;
    expect(s.id).toBe('4.1');
    expect(s.caminhoUrl).toBe('[Portal]/Despesas');
    expect(s.notes[0]).toContain('não se aplica às Estatais');
    expect(s.items).toEqual([
      { id: '4.1.1', criterios: ['4.1', '4.3'], descricao: 'Total empenhado', atributo: 'valorEmpenhado', tipos: ['Monetário'] },
    ]);
  });
});

describe('catálogo gerado a partir de docs/pntp-2026', () => {
  const catalog = loadCatalog();
  it('tem todas as páginas e nenhum id de item duplicado por página', () => {
    expect(catalog.pages.length).toBe(33);
    for (const p of catalog.pages) {
      const ids = p.sections.flatMap((s) => s.items.map((i) => i.id));
      expect(new Set(ids).size, p.id).toBe(ids.length);
      expect(p.schemaUrl, p.id).toMatch(/^https:\/\/serigy\.tce\.se\.gov\.br\//);
    }
  });

  it('todo poder inclui os requisitos comuns', () => {
    const comum = catalog.pages.filter((p) => p.folder === 'comum').length;
    expect(comum).toBeGreaterThan(0);
    for (const poder of PODERES) {
      const pages = pagesForPoder(poder.id);
      expect(pages.filter((p) => p.folder === 'comum').length, poder.id).toBe(comum);
      expect(pages.length, poder.id).toBeGreaterThan(comum);
    }
  });
});
