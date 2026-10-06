import { AMBIENTES, compareIds, groupPagesByNumber, summarize, type EvaluationResult, type FetchOrigin, type ItemResult, type ItemStatus, type Summary } from '@serigy/shared';

const ICON: Record<ItemStatus, string> = { ok: '✅', warning: '⚠️', empty: '➖', missing: '❌' };
const LABEL: Record<ItemStatus, string> = {
  ok: 'Atendido',
  warning: 'Atenção',
  empty: 'serigyEmpty declarado',
  missing: 'Não encontrado',
};

/** Escapa conteúdo para uso dentro de uma célula de tabela markdown. */
const cell = (text: string): string =>
  text
    .split(String.fromCharCode(124))
    .join(String.fromCharCode(92, 124))
    .replace(/\s*\r?\n\s*/g, ' ');

/** URLs analisadas como links curtos (host + caminho) para caber na tabela. */
function urlLinks(urls: string[]): string {
  return urls
    .map((u) => {
      try {
        const { host, pathname, search } = new URL(u);
        return `[${cell(host + (pathname === '/' ? '' : pathname) + search)}](${u})`;
      } catch {
        return cell(u);
      }
    })
    .join('<br>');
}

const code = (text: string): string => '`' + text.split('`').join("'") + '`';

const ORIGIN: Record<FetchOrigin, string> = {
  inicial: 'URL informada',
  documentacao: 'Caminho da documentação',
  iframe: 'iframe (serigyLink)',
  serigyLink: 'serigyLink',
};

/** Célula "URL analisada" de um item, identificando quando o conteúdo vem de iframe/serigyLink. */
function analyzedCell(i: ItemResult): string {
  const via = i.loadedVia?.some((v) => v.kind === 'iframe') ? '<br>_via iframe (serigyLink)_' : i.loadedVia?.length ? '<br>_via serigyLink_' : '';
  return urlLinks(i.analyzedUrls) + via;
}

function summaryTable(s: Summary): string[] {
  return [
    '| Total | ✅ Atendidos | ⚠️ Atenção | ➖ serigyEmpty declarados | ❌ Não encontrados | Atendimento |',
    '|---:|---:|---:|---:|---:|---:|',
    `| ${s.total} | ${s.ok} | ${s.warning} | ${s.empty} | ${s.missing} | **${s.score}%** |`,
  ];
}

const fmtDate = (iso: string): string => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Maceio' });

/** Gera o relatório de uma avaliação em Markdown. */
export function renderMarkdown(r: EvaluationResult): string {
  const out: string[] = [];
  out.push(`# Relatório de avaliação Serigy — PNTP 2026`, '');
  out.push(`- **Portal avaliado:** ${r.portalNome ? `${r.portalNome} — ` : ''}${r.url}`);
  if (r.portalAmbiente) out.push(`- **Ambiente:** ${AMBIENTES.find((a) => a.id === r.portalAmbiente)?.label ?? r.portalAmbiente}`);
  out.push(`- **Poder/esfera:** ${r.poderLabel} (requisitos comuns + específicos)`);
  out.push(`- **Avaliado em:** ${fmtDate(r.finishedAt)}`);
  out.push(
    `- **Escopo:** ${r.scope.mode === 'todos' ? 'todos os itens' : 'parcial'} — ${r.scope.items} itens em ${r.scope.pages} páginas da matriz`,
  );
  out.push(`- **Páginas analisadas:** ${r.fetched.length}`);
  out.push(`- **Invoker:** ${r.invoker.found ? '✅' : '❌'} ${r.invoker.message}`, '');

  out.push('## Resumo geral', '', ...summaryTable(r.summary), '');
  out.push(
    '> Atendimento = (atendidos + serigyEmpty declarados) / total. "serigyEmpty declarado" (motivo informado, válido e único) atende parcialmente e conta no percentual; motivo em branco, inválido ou repetido não atende.',
    '',
  );

  if (r.warnings.length) {
    out.push('## Avisos', '', ...r.warnings.map((w) => `- ${w}`), '');
  }

  out.push('## Resumo por página', '');
  out.push('| Página | Schema encontrado | Total | ✅ | ⚠️ | ➖ | ❌ | Atendimento |');
  out.push('|---|:---:|---:|---:|---:|---:|---:|---:|');
  // Um item da matriz = um número, mesmo que ele exista em mais de uma pasta da documentação.
  const groups = groupPagesByNumber(r.pages);
  for (const g of groups) {
    const s = summarize(g.sections.flatMap((x) => x.items));
    const links = g.pages.map((p) => `[${cell(p.id)}](${p.docUrl})`).join(' + ');
    const schema = g.pages.every((p) => p.schemaFound) ? 'sim' : g.pages.some((p) => p.schemaFound) ? 'parcial' : 'não';
    out.push(
      `| ${cell(g.number + '. ' + g.title)} — ${links} | ${schema} | ${s.total} | ${s.ok} | ${s.warning} | ${s.empty} | ${s.missing} | ${s.score}% |`,
    );
  }
  out.push('');

  const pending = r.pages
    .flatMap((p) =>
      p.sections.flatMap((s) => s.items.filter((i) => i.status === 'missing' || i.status === 'warning').map((i) => ({ p, s, i }))),
    )
    .sort((a, b) => compareIds(a.i.id, b.i.id));
  out.push('## Pendências', '');
  if (pending.length === 0) out.push('Nenhuma pendência. 🎉', '');
  else {
    out.push('| Item | Página | Atributo | Situação | Detalhe | URL analisada |', '|---|---|---|---|---|---|');
    for (const { p, i } of pending) {
      out.push(`| ${i.id} | ${cell(p.id)} | ${code(i.atributo)} | ${ICON[i.status]} ${LABEL[i.status]} | ${cell(i.message)} | ${analyzedCell(i)} |`);
    }
    out.push('');

    out.push('### Detalhes das pendências', '');
    for (const { p, s, i } of pending) {
      out.push(`#### ${i.id} — ${i.descricao}`, '');
      out.push(`- **Situação:** ${ICON[i.status]} ${LABEL[i.status]} — ${i.message}`);
      out.push(`- **Página/seção:** ${p.number}. ${p.title} (${p.id}) › ${s.id}. ${s.title}`);
      out.push(`- **Critério(s):** ${i.criterios.join(', ') || '—'}`);
      if (s.caminhoUrl) out.push(`- **Caminho sugerido:** ${code(s.caminhoUrl)}`);
      out.push(`- **Esperado:** ${i.expected}`);
      for (const c of i.serigyEmpty ?? []) {
        out.push(
          `- **serigyEmpty:** ${c.valido ? `declarado — motivo ${code(c.motivo)} (atende parcialmente)` : c.motivo ? `motivo ${code(c.motivo)} inválido — ${c.problema}` : 'declarado mas motivo não informado'}`,
        );
      }
      out.push(
        `- **Schema:** ${i.schema.confere ? '✅ confere' : '❌ não confere'} — esperado ${code(i.schema.esperado)}; encontrado ${i.schema.encontrado ? code(i.schema.encontrado) : 'nenhum'}`,
      );
      out.push(`- **URL analisada:** ${urlLinks(i.analyzedUrls).split('<br>').join(', ')}`);
      for (const v of i.loadedVia ?? []) {
        out.push(`- **${v.kind === 'iframe' ? 'Carregado via iframe' : `Via serigyLink${v.tag ? ` (${code(`<${v.tag}>`)})` : ''}`}:** serigyLink avaliado ${v.url}`);
      }
      out.push(`- **Documentação:** ${p.docUrl}`);
      if (i.evidence.length) {
        out.push('- **Encontrado:**');
        for (const e of i.evidence) out.push(`  - ${code(e.snippet)} em ${e.pageUrl}`);
      }
      for (const ex of i.examples ?? []) {
        out.push('', `Exemplo da documentação — ${ex.title}:`, '', '```html', ex.html, '```');
      }
      out.push('');
    }
  }

  out.push('## Detalhamento', '');
  for (const g of groups) {
    out.push(`### ${g.number}. ${g.title}`, '');
    for (const p of g.pages) {
      const prefix = g.pages.length > 1 ? `\`${p.id}\` — ` : '';
      out.push(`- ${prefix}Schema esperado: ${code(p.schemaUrl)} (${p.schemaFound ? 'encontrado' : 'não encontrado'})`);
      out.push(`- ${prefix}Documentação: ${p.docUrl}`);
      out.push(`- ${prefix}URLs onde o schema foi encontrado: ${p.analyzedUrls.length ? urlLinks(p.analyzedUrls).split('<br>').join(', ') : '—'}`);
      for (const f of p.iframes) {
        out.push(`- ${prefix}**iframe com serigyLink** em ${f.pageUrl}: conteúdo avaliado em ${f.target}`);
      }
    }
    out.push('');
    for (const s of g.sections) {
      out.push(`#### ${s.id}. ${s.title}`, '');
      if (s.caminhoUrl) out.push(`Caminho sugerido: ${code(s.caminhoUrl)}`, '');
      for (const n of s.notes) out.push(`> ${n}`);
      if (s.notes.length) out.push('');
      out.push('| Item | Descrição | Atributo | Tipo | Situação | Detalhe | URL analisada |', '|---|---|---|---|---|---|---|');
      for (const i of s.items) {
        out.push(
          `| ${i.id} | ${cell(i.descricao)} | ${code(i.atributo)} | ${cell(i.tipos.join(' / '))} | ${ICON[i.status]} ${LABEL[i.status]} | ${cell(i.message)} | ${analyzedCell(i)} |`,
        );
      }
      out.push('');
    }
  }

  out.push('## Páginas analisadas', '', '| URL | Origem | Status | Elementos Serigy |', '|---|---|---|---:|');
  for (const f of r.fetched) {
    out.push(`| ${cell(f.url)} | ${ORIGIN[f.origin]} | ${f.error ? cell(f.error) : (f.status ?? '-')} | ${f.serigyElements} |`);
  }
  out.push('', '---', '_Gerado por serigy-avaliador (verificação estática da marcação Serigy)._', '');
  return out.join('\n');
}
