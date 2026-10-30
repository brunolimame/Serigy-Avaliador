import { AMBIENTES, analyzedMatchesExpected, compareIds, groupPagesByNumber, MAX_EVIDENCE, parseSerigyDetalhe, serigySummarize, splitMessage, summarize, evaluationDuration, type EvaluationResult, type FetchOrigin, type ItemResult, type ItemStatus, type PageResult, type SectionResult, type SerigyOficialItem, type Summary } from '@serigy/shared';

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

/** Selo comparando a URL analisada com a esperada pela documentação. */
function urlMatchTag(i: ItemResult): string {
  const same = analyzedMatchesExpected(i);
  return same === undefined ? '' : same ? '🟢 URL esperada' : '🟠 URL diferente da esperada';
}

/** Célula "URL analisada" de um item, identificando quando o conteúdo vem de iframe/serigyLink. */
function analyzedCell(i: ItemResult): string {
  const via = i.loadedVia?.some((v) => v.kind === 'iframe') ? '<br>_via iframe (serigyLink)_' : i.loadedVia?.length ? '<br>_via serigyLink_' : '';
  const tag = urlMatchTag(i);
  const expected = i.expectedUrl ? `esperada: ${urlLinks([i.expectedUrl])}<br>` : '';
  return `${expected}${urlLinks(i.analyzedUrls)}${tag ? `<br>${tag}` : ''}${via}`;
}

function summaryTable(s: Summary): string[] {
  return [
    '| Total | ✅ Atendidos | ⚠️ Atenção | ➖ serigyEmpty declarados | ❌ Não encontrados | Atendimento |',
    '|---:|---:|---:|---:|---:|---:|',
    `| ${s.total} | ${s.ok} | ${s.warning} | ${s.empty} | ${s.missing} | **${s.score}%** |`,
  ];
}

const fmtDate = (iso: string): string => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Maceio' });

/** Bloco de detalhes de um item (situação em lista, serigyEmpty e ocorrências); serve para pendências e atendidos. */
function itemDetail(out: string[], p: PageResult, s: SectionResult, i: ItemResult): void {
  out.push(`#### ${i.id} — ${i.descricao}`, '');
  // vários motivos viram lista; o que a lista de serigyEmpty já detalha não se repete na situação
  const parts = splitMessage(i.message).filter((m) => !(i.serigyEmpty?.length && m.startsWith('serigyEmpty declarado')));
  out.push(`- **Situação:** ${ICON[i.status]} ${LABEL[i.status]}${parts.length === 1 ? ` — ${parts[0]}` : ''}`);
  if (parts.length > 1) for (const m of parts) out.push(`  - ${m}`);
  out.push(`- **Página/seção:** ${p.number}. ${p.title} (${p.id}) › ${s.id}. ${s.title}`);
  out.push(`- **Critério(s):** ${i.criterios.join(', ') || '—'}`);
  if (s.caminhoUrl) out.push(`- **Caminho sugerido:** ${code(s.caminhoUrl)}`);
  out.push(`- **Esperado:** ${i.expected}`);
  if (i.serigyEmpty?.length) {
    out.push(`- **serigyEmpty (${i.serigyEmpty.length} ocorrência(s)):**`);
    for (const c of i.serigyEmpty) {
      out.push(
        `  - ${c.valido ? `declarado — motivo ${code(c.motivo)} (atende parcialmente)` : c.motivo ? `motivo ${code(c.motivo)} inválido — ${c.problema}` : 'declarado mas motivo não informado'} em ${c.pageUrl}`,
      );
    }
  }
  out.push(
    `- **Schema:** ${i.schema.confere ? '✅ confere' : '❌ não confere'} — esperado ${code(i.schema.esperado)}; encontrado ${i.schema.encontrado ? code(i.schema.encontrado) : 'nenhum'}`,
  );
  if (i.expectedUrl) out.push(`- **URL esperada:** ${urlLinks([i.expectedUrl])}`);
  const urls = urlLinks(i.analyzedUrls).split('<br>');
  const tag = urlMatchTag(i);
  if (urls.length > 1) {
    out.push(`- **URL analisada:**${tag ? ` ${tag}` : ''}`);
    for (const u of urls) out.push(`  - ${u}`);
  } else out.push(`- **URL analisada:** ${urls.join('')}${tag ? ` — ${tag}` : ''}`);
  for (const v of i.loadedVia ?? []) {
    out.push(`- **${v.kind === 'iframe' ? 'Carregado via iframe' : `Via serigyLink${v.tag ? ` (${code(`<${v.tag}>`)})` : ''}`}:** serigyLink avaliado ${v.url}`);
  }
  out.push(`- **Documentação:** ${p.docUrl}`);
  if (i.evidence.length) {
    out.push(`- **Encontrado (${i.evidence.length} ocorrência(s)${i.evidence.length >= MAX_EVIDENCE ? `, exibindo as primeiras ${MAX_EVIDENCE}` : ''}):**`);
    for (const e of i.evidence) out.push(`  - ${code(e.snippet)} em ${e.pageUrl}`);
  }
  for (const ex of i.examples ?? []) {
    out.push('', `Exemplo da documentação — ${ex.title}:`, '', '```html', ex.html, '```');
  }
  out.push('');
}

/** Veredito Serigy de um item: estimado pelo avaliador e, se houver, o do Serigy oficial. */
function serigyCell(i: ItemResult, oficial?: Record<string, SerigyOficialItem>): string {
  const parts: string[] = [];
  if (i.serigy) parts.push(`estimado: ${i.serigy.ponto ? '✅' : '❌'}${i.serigy.codigo ? ' ' + code(i.serigy.codigo) : ''}`);
  const o = oficial?.[i.id];
  if (o) {
    const { codigo } = parseSerigyDetalhe(o.detalhe);
    parts.push(`oficial: ${o.ponto ? '✅' : '❌'}${codigo ? ' ' + code(codigo) : ''}`);
  }
  return parts.length ? parts.join('<br>') : '—';
}

/** Gera o relatório de uma avaliação em Markdown. `oficial` = itens do Serigy oficial pareados (id do avaliador -> item). */
export function renderMarkdown(r: EvaluationResult, oficial?: Record<string, SerigyOficialItem>): string {
  const out: string[] = [];
  out.push(`# Relatório de avaliação Serigy — PNTP 2026`, '');
  out.push(`- **Portal avaliado:** ${r.portalNome ? `${r.portalNome} — ` : ''}${r.url}`);
  if (r.portalAmbiente) out.push(`- **Ambiente:** ${AMBIENTES.find((a) => a.id === r.portalAmbiente)?.label ?? r.portalAmbiente}`);
  out.push(`- **Poder/esfera:** ${r.poderLabel} (requisitos comuns + específicos)`);
  out.push(`- **Iniciada em:** ${fmtDate(r.startedAt)}`);
  out.push(`- **Terminada em:** ${fmtDate(r.finishedAt)}`);
  out.push(`- **Duração:** ${evaluationDuration(r) || '—'}`);
  out.push(
    `- **Escopo:** ${r.scope.mode === 'todos' ? 'todos os itens' : 'parcial'} — ${r.scope.items} itens em ${r.scope.pages} páginas da matriz`,
  );
  out.push(`- **Páginas analisadas:** ${r.fetched.length}`);
  out.push(`- **Invoker:** ${r.invoker.found ? '✅' : '❌'} ${r.invoker.message}${r.invoker.value ? ` — chave: ${code(r.invoker.value)}` : ''}`, '');

  out.push('## Resumo geral', '', ...summaryTable(r.summary), '');
  const allItems = r.pages.flatMap((p) => p.sections.flatMap((s) => s.items));
  const estimado = serigySummarize(allItems);
  if (estimado.total > 0) {
    out.push(`- **Serigy (estimado):** ${estimado.score}% — ${estimado.atendidos}/${estimado.total} itens pontuariam no validador oficial`);
  }
  const pareados = oficial ? Object.values(oficial) : [];
  if (pareados.length > 0) {
    const ok = pareados.filter((x) => x.ponto).length;
    out.push(`- **Serigy (oficial):** ${Math.round((ok / pareados.length) * 1000) / 10}% — ${ok}/${pareados.length} itens pareados`);
  }
  if (estimado.total > 0 || pareados.length > 0) out.push('');
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
    for (const { p, s, i } of pending) itemDetail(out, p, s, i);
  }

  // Itens atendidos (atendidos e serigyEmpty declarado): mesmos detalhes, em lista
  const met = r.pages
    .flatMap((p) => p.sections.flatMap((s) => s.items.filter((i) => i.status === 'ok' || i.status === 'empty').map((i) => ({ p, s, i }))))
    .sort((a, b) => compareIds(a.i.id, b.i.id));
  if (met.length) {
    out.push('## Detalhes dos itens atendidos', '');
    for (const { p, s, i } of met) itemDetail(out, p, s, i);
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
      out.push('| Item | Descrição | Atributo | Tipo | Situação | Serigy | Detalhe | URL analisada |', '|---|---|---|---|---|---|---|---|');
      for (const i of s.items) {
        out.push(
          `| ${i.id} | ${cell(i.descricao)} | ${code(i.atributo)} | ${cell(i.tipos.join(' / '))} | ${ICON[i.status]} ${LABEL[i.status]} | ${serigyCell(i, oficial)} | ${cell(i.message)} | ${analyzedCell(i)} |`,
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
