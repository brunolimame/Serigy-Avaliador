# Avaliador Serigy (PNTP 2026) — documentação da aplicação

Aplicação que recebe a **URL de um portal da transparência** e o **poder/esfera** do órgão e verifica se a
marcação Serigy exigida pela matriz PNTP 2026 está presente. Gera um relatório que pode ser exportado
em Markdown.

- Avalia **todos os itens** ou **itens isolados** (por item, por página ou por seleção livre).
- Os requisitos de `comum/` valem para **todos** os poderes; cada poder soma os seus próprios.
- A matriz de requisitos vem de `docs/pntp-2026/**/*.md` (fonte única da verdade).

## Stack

| Camada | Tecnologia |
|---|---|
| Gerenciador de pacotes | pnpm (workspace) |
| UI (`apps/web`) | TypeScript, React 19, Tailwind CSS 4, Vite, **shadcn/ui** (estilo `base-nova`, Base UI + lucide-react) |
| API (`apps/api`) | Node 22, Express 5, TypeScript (executado com `tsx`), cheerio, zod |
| Testes | vitest (API) |

## Como usar

```bash
pnpm install
pnpm dev          # API em :3001 e UI em http://localhost:5173
pnpm test         # testes da API
pnpm typecheck    # tsc em todos os pacotes
pnpm build        # compila a UI para apps/web/dist
pnpm start        # API servindo também apps/web/dist (http://127.0.0.1:3001)
pnpm catalog      # regenera o catálogo a partir de docs/pntp-2026
```

Variáveis da API: `PORT` (padrão 3001) e `HOST` (padrão `127.0.0.1`).

## Estrutura

```
docs/pntp-2026/            matriz de requisitos (markdown) — fonte do catálogo
packages/shared/           tipos + lista de poderes (PODERES), usados por API e UI
apps/api/
  scripts/build-catalog.ts docs -> src/catalog/catalog.json (sem rede)
  src/catalog/             parse-docs.ts (parser), load.ts, catalog.json (gerado, versionado)
  src/evaluator/           loader.ts, collector.ts, paths.ts, markup.ts, checks.ts, evaluate.ts
  src/report/markdown.ts   relatório em markdown
  src/app.ts               rotas Express
  test/                    testes
apps/web/src/              App.tsx, api.ts, components/{ItemSelector,ResultView}.tsx
```

## Fluxo de dados

```
docs/pntp-2026/*.md ──(pnpm catalog)──▶ catalog.json ──▶ API ──▶ UI
                                                          ▲
URL do portal ──▶ collector ──▶ markup (serigy*) ──▶ evaluate ──▶ resultado ──▶ relatório .md
```

1. **Catálogo.** `pnpm catalog` lê **apenas os arquivos locais** de `docs/pntp-2026` (nenhum acesso à rede;
   a URL `https://serigy.tce.se.gov.br/2026` só é usada para montar o link `docUrl` de cada página) e grava
   `apps/api/src/catalog/catalog.json`. O comando termina com erro e lista avisos se encontrar linha de
   item que não conseguiu interpretar, schema ausente ou item duplicado.
2. **Coleta (`collector.ts`, `PageStore`).** Feita seção a seção durante a avaliação. Baixa **somente o necessário; não há navegação por links `<a href>`**:
   1. a URL informada (que é o `[Portal da Transparencia]` da documentação);
   2. para cada seção avaliada, a URL do seu **"Caminho URL"** da documentação, resolvida a partir da URL
      informada (`paths.ts`: `[Portal da Transparencia]/Despesas` → `<URL>/Despesas`; sem caminho ou `/*` → a
      própria URL). **O caminho é testado SEMPRE em minúsculas** (`/Despesas` → `/despesas`). A grafia da
      documentação, com maiúsculas, **só é testada se a opção `tryDocumentedCase` estiver ligada** (checkbox
      "Testar também a grafia da documentação" na UI) e apenas quando a minúscula falhar (404 ou qualquer outro
      erro); falhando as duas, o erro cita as duas tentativas. Padrão: desligada;
   3. destinos de `serigyLink` (iframe, ou elemento com `serigyItem`) **apenas** dos schemas/itens que estão sendo
      avaliados, a partir das páginas já baixadas (`shouldFollow`).
   O limite `maxPages` (padrão 200, máx. 200) vale **só para páginas seguidas por `serigyLink`**; a URL inicial e as
   páginas dos caminhos da documentação nunca são limitadas. Avaliar um único item baixa só a URL inicial e a página
   da sua seção.
   Cada URL é baixada uma única vez, mesmo que várias seções a usem.
3. **Marcação.** Para cada elemento com `serigyItem`, registra o schema do próprio elemento ou do ancestral mais
   próximo com `serigySchema`, além de `serigyValue`, `serigyEmpty`, `serigyLink`, texto, `href`/`src`.
4. **Avaliação.** Cada item do catálogo é procurado pelo par **(schema da página, valor de `serigyItem` = atributo)**
   **somente na página do caminho da sua seção** (e no destino do `serigyLink`, se houver). Páginas de outras
   seções ou da raiz nunca contam como evidência, então cada item analisa uma única URL (exceto se houver vários
   `serigyLink` aplicáveis).
5. **Relatório.** O resultado (JSON) é renderizado em markdown por `renderMarkdown`.

## Interface (shadcn/ui)

- Componentes em `apps/web/src/components/ui/` (gerados pelo CLI do shadcn: `components.json`, alias `@/`,
  `cn` em `@/lib/utils`) e usados por `App.tsx`, `ItemSelector.tsx` e `ResultView.tsx`. Para adicionar um:
  `pnpm dlx shadcn@latest add <componente>` dentro de `apps/web`.
- O estilo `base-nova` usa **Base UI** (não Radix): `Checkbox` → `onCheckedChange(checked)`, `Select` recebe `items`
  para mostrar o rótulo, `Collapsible` aceita `open`/`onOpenChange`.
- Aparência: tema institucional (azul-marinho em superfícies claras, definido nas variáveis do `:root` em
  `apps/web/src/index.css`); as cores vivas ficam restritas ao resultado: cada item é um cartão com fundo suave e
  ícone conforme o status (verde = atendido, âmbar = atenção, azul-claro = vazio declarado, rosa = não encontrado).
- Comportamento: ao terminar a análise, **páginas e detalhes dos itens ficam fechados** (só as páginas em análise
  abrem sozinhas durante o stream). O botão "Detalhes" de cada item não atendido mostra descrição, esperado,
  encontrado e exemplos. O alerta "usa iframe com serigyLink" aparece **dentro do item** que depende dele.
  Largura máxima da página: 1600px.
- Rolagem: a lista de avisos/falhas usa `ScrollArea` (altura máxima 12rem) e os exemplos HTML da documentação usam
  `<pre>` com `max-h-64 overflow-auto` (rolagem vertical e horizontal). O `ScrollArea` foi ajustado com
  `max-h-[inherit]` no viewport para funcionar com altura máxima.

## Poderes e requisitos aplicáveis

Definidos em `packages/shared/src/index.ts` (`PODERES`). Sempre `comum` + pasta(s) do poder:

| Poder | Pastas avaliadas |
|---|---|
| executivo | comum, executivo |
| legislativo | comum, legislativo |
| judiciario / ministerio-publico / defensoria-publica / tribunal-contas | comum + a própria pasta |
| consorcios-publicos | comum, consorcios-publicos |
| estatais | comum, estatais |
| estatais-independentes | comum, estatais-independentes |

As observações da documentação (ex.: "não se aplicam às Estatais Independentes") são exibidas como
`notes` nas seções, mas **não** removem itens automaticamente.

## Regras de avaliação

Status de cada item:

| Status | Quando |
|---|---|
| `ok` | há elemento com `serigyItem` = atributo sob o `serigySchema` correto e o valor é coerente com o tipo |
| `warning` | encontrado, mas o valor não parece do tipo esperado, ou `serigyEmpty` sem motivo |
| `empty` | `serigyEmpty="motivo"` — ausência de informação declarada intencionalmente |
| `missing` | atributo não encontrado sob o schema, ou o próprio schema não existe na página do caminho da seção |

- **Schema e URLs** são comparados sem diferenciar maiúsculas/minúsculas, ignorando host (no schema), prefixo
  `/2026` e barra final (`normalizeSchema` em `markup.ts` e `urlKey` em `collector.ts`). A documentação grafa
  caminhos como `/Despesas`, mas o site pode usar `/despesas`.
- O valor de `serigyItem` é comparado **exatamente** (caixa importa); se só a caixa difere, a mensagem avisa.
- **Atendimento (%)** = (`ok` + `empty`) / total de itens avaliados. `warning` não conta como atendido.
- **Tipos** (`checks.ts`, tabela `TYPES`): Numérico, Número, Monetário, Ano, Data, Hora, Telefone, CPF, E-mail,
  Link, Anexo, Arquivo e Imagem têm validação heurística (caixa e acentos são ignorados; `Número/Ano` vale
  qualquer um dos dois). Texto, Nome, Endereço, Variável, N/A, Dataset etc. só exigem a presença do item. Se o
  item aceita vários tipos e um deles não tem validador, qualquer valor passa.
- **Invoker**: verifica `<meta serigyItem="invoker" serigyValue="hash">` na página inicial. É reportado à parte
  e não entra no percentual.
- **Ordem**: páginas pelo número da página na matriz (o número do `# N. Título`; ex.: Ouvidoria = 14), seções e
  itens numericamente por segmento (`4.1.2` antes de `4.1.10`), no catálogo/UI, no resultado e nas pendências do
  relatório (`compareIds` em `packages/shared`). Empates de número mantêm a ordem comum → pasta do poder.
- **Histórico (`historicoExercicio`)**: o avaliador não verifica os 3 anos; se o schema da página tem um filtro por
  ano (um `<select>` dentro do schema com opções `20xx`), o item é dado como **atendido**, mesmo sem
  `serigyItem="historicoExercicio"` próprio (`YearFilter` em `markup.ts`, regra em `evaluate.ts`).
- **`serigyLink`**:
  - **`<iframe serigySchema serigyLink>`** (link externo): o valor é a URL a ser analisada; o schema inteiro é
    buscado lá. Se o item não está lá, fica `missing` (a mensagem cita "O iframe aponta para …").
  - **Demais usos** seguem `definicoes.md`: elemento **com** `serigyItem` → só esse item é buscado na URL
    (casos de "redirecionamento"); elemento com `serigySchema` e sem `serigyItem` → o schema é buscado na URL.
    Não há exceções: p. ex. `<meta serigyItem="sitioOficial" serigyLink=…>` exige o `serigyItem` no destino. O
    próprio elemento que aponta não conta como evidência. Não achado no destino (ou destino inacessível) = `missing`.
  - **Iframe identificado:** `PageResult.iframes` lista os iframes com `serigyLink` da página e a URL avaliada;
    `ItemResult.loadedVia` marca os itens avaliados por esse caminho (kind `iframe` ou `serigyLink`). A UI e o
    relatório exibem "Carregado via iframe". `<iframe serigySchema>` **sem** `serigyLink` gera aviso (o `src`
    não é avaliado).
  - Só são baixados serigyLink de schemas/itens avaliados; o destino aparece em "Páginas analisadas" com a origem
    (`iframe` ou `serigyLink`).
- **URL analisada**: cada item traz `analyzedUrls`: a página do caminho da sua seção (onde foi ou deveria ser
  encontrado) ou, havendo `serigyLink`, o(s) destino(s). Aparece na UI e no relatório (coluna "URL analisada").
- **Exportação de dados (`salvarRelatorio`)**: apenas se verifica se o `serigyItem` está mapeado (`MAPPING_ONLY`
  em `evaluate.ts`); nenhum download/exportação é executado e links desses elementos (inclusive `serigyLink`)
  não são seguidos. A mensagem lista os formatos declarados em `serigyValue`.
- **Itens não atendidos** (`missing`/`warning`) trazem `expected` (marcação esperada: schema, `serigyItem` e dica
  do tipo de valor), `evidence` (o que foi encontrado) e `examples` (blocos HTML da documentação que usam o
  `serigyItem`, extraídos por `parse-docs.ts`). A UI mostra tudo num painel sob o item e o relatório, na seção
  "Detalhes das pendências".
- **Reavaliar**: o botão em cada item chama `POST /api/evaluate` com `items: [id]` e os mesmos parâmetros de
  rastreio (`result.crawl`); a UI troca só aquele item e recalcula os resumos (`apps/web/src/merge.ts`).

### Limitações conhecidas

- **Análise estática**: o HTML é obtido por HTTP e não executa JavaScript. Conteúdo que só aparece após
  `serigyExecuteWaitSection` (clique) não é visto; nesse caso o relatório avisa e os itens podem sair `missing`.
- **Caminhos da documentação**: como não há navegação por links, um item só é encontrado na URL do "Caminho URL"
  da sua seção (em minúsculas ou, com `tryDocumentedCase`, na grafia da documentação) ou no destino de um `serigyLink`. Se o portal publica a
  seção em outro endereço, o item sai `missing` com a URL tentada; use `serigyLink` (na página do caminho) para
  apontar o endereço real, como a documentação prevê.
- Não valida regras de negócio (ex.: histórico dos últimos 3 anos em `historicoExercicio`), só a marcação.
- A API baixa URLs arbitrárias a pedido do usuário (inclusive `localhost`, útil para homologação) e por isso
  escuta só em `127.0.0.1` por padrão. Não exponha publicamente sem autenticação e bloqueio de rede interna.

## API HTTP

| Método e rota | Descrição |
|---|---|
| `GET /api/health` | status e data de geração do catálogo |
| `GET /api/poderes` | lista de poderes |
| `GET /api/catalog?poder=<id>` | páginas/seções/itens aplicáveis ao poder (alimenta o seletor da UI) |
| `POST /api/evaluate` | executa a avaliação e responde com o resultado completo |
| `POST /api/evaluate/stream` | mesma avaliação, em streaming NDJSON (ver abaixo) |
| `POST /api/report` | recebe o resultado de `/api/evaluate` e devolve `text/markdown` |

Corpo de `POST /api/evaluate`:

```json
{
  "url": "https://transparencia.exemplo.gov.br/",
  "poder": "executivo",
  "pages": ["comum/despesas"],
  "items": ["4.1.1", "4.1.2"],
  "maxPages": 200,
  "tryDocumentedCase": false
}
```

`pages` e `items` são opcionais; ausentes = todos os itens do poder. Se ambos vierem, vale a interseção.
Erros: `400` (parâmetros, escopo que não se aplica ao poder), `502` (portal inacessível).
Os tipos completos estão em `packages/shared/src/index.ts`.

### Streaming (`POST /api/evaluate/stream`)

Mesmo corpo de `/api/evaluate`; a resposta é **NDJSON** (`application/x-ndjson`, um JSON por linha), enviada
conforme a análise avança. É o que a UI usa para mostrar o andamento de cada item.

| Evento (`type`) | Quando | Conteúdo |
|---|---|---|
| `plan` | primeiro evento | `plan`: todas as páginas/seções/itens que serão avaliados (a UI os mostra como "Aguardando…") |
| `fetched` | cada página baixada (ou que falhou) | `page`: URL, origem, status, erro |
| `invoker` | depois de baixar a URL inicial | `invoker` |
| `section-start` | uma seção começou a ser analisada | `pageId`, `sectionId` (seus itens passam a "Analisando…") |
| `item` | um item foi concluído | `pageId`, `sectionId`, `item` (o `ItemResult` completo, igual ao do resultado final) |
| `done` | último evento | `result`: o `EvaluationResult` final (ordenado, com avisos e resumos) |
| `error` | a análise falhou (ex.: portal inacessível, `status` 502) | `message`, `status` |

- A avaliação roda **seção a seção**, 3 seções em paralelo (`SECTION_CONCURRENCY` em `evaluate.ts`): cada seção
  baixa a página do seu caminho (e os `serigyLink` necessários) e avalia seus itens. Por isso os itens de seções
  rápidas aparecem antes dos de seções lentas, e a ordem de chegada dos eventos `item` não é a numérica; o
  resultado final (`done`) sempre vem na ordem da matriz. Páginas já baixadas não são pedidas de novo (`PageStore`).
- Erros de validação (poder/URL/escopo inválidos) respondem como HTTP 400 normal, **antes** de abrir o stream
  (`prepareEvaluation` valida de forma síncrona). Falhas durante a análise chegam como evento `error`.
- **Cancelar**: se o cliente fecha a conexão, o servidor para de iniciar novas seções (apenas o que já estava em
  andamento termina).
- Se o proxy à frente da API fizer buffer, desative-o para esta rota (a resposta já envia `X-Accel-Buffering: no`).
- `POST /api/evaluate` continua existindo (resposta única, sem eventos) e é o usado por "Reavaliar".

Na UI (`apps/web/src/live.ts`): `applyEvent` aplica cada evento ao estado e `buildView` monta um resultado parcial
para o `ResultView`; itens sem resultado aparecem como Aguardando / Analisando (spinner) / Não analisado
(se cancelado ou com erro) e só os concluídos entram nos resumos. Itens concluídos já mostram detalhes.

## Como atualizar (guia de manutenção)

### A matriz PNTP mudou (itens novos/alterados)
1. Edite/adicione os `.md` em `docs/pntp-2026/` mantendo as convenções abaixo.
2. `pnpm catalog` e confira a contagem e os avisos. 3. `pnpm test` e faça commit de `catalog.json`.

Convenções que o parser (`parse-docs.ts`) entende:

| Markdown | Significado |
|---|---|
| `# 4. Despesas` (ou `# 14 Ouvidoria`) | número e título da página |
| linha de tabela `\| x \| serigySchema \| URL \|` | schema esperado |
| `## 4.1. Título` | seção (`## Exemplos` encerra a leitura da página) |
| `**Caminho URL:** ...` | caminho sugerido no portal |
| `**ℹ️ Obs.: ...` | observação da seção |
| `\| 4.1.1 \| 4.1, 4.3 \| descrição \| atributo \| Tipo \|` | item (tipos múltiplos separados por `\|`) |
| `### Título` + bloco ``` com `serigyItem="atributo"` | exemplo de HTML associado ao item |

Blocos de código (```) são ignorados, então os exemplos HTML não geram itens. O teste em
`test/catalog.test.ts` fixa o número de páginas (33): atualize-o ao criar/remover páginas.

### Novo ano ou nova versão (ex.: PNTP 2027)
Copie a matriz para uma nova pasta de docs, ajuste `docsDir` em `scripts/build-catalog.ts`, `DOC_BASE` em
`parse-docs.ts` e o prefixo `/2026` em `normalizeSchema` (`markup.ts`). Para suportar duas versões ao mesmo
tempo, gere um catálogo por versão e receba a versão em `EvaluationRequest`.

### Novo poder
Adicione a entrada em `PODERES` (`packages/shared`) com as pastas correspondentes e crie a pasta em docs.

### Nova validação de tipo de valor
Adicione uma função em `VALIDATORS` (`checks.ts`) com o nome do tipo exatamente como aparece na coluna "Valor".

### Mudar o relatório
Edite `src/report/markdown.ts`; a UI só chama `POST /api/report`, não há template duplicado.

### Renderizar JavaScript (itens carregados por clique)
O avaliador só depende da interface `PageLoader` (`loader.ts`). Crie, por exemplo, um `PlaywrightLoader`
que abra a página, clique nos elementos `[serigyExecuteWaitSection]`, aguarde o `serigyLoadSection`
correspondente e devolva `page.content()`; injete-o em `evaluate(req, { loader })` ou em `createApp({ loader })`.

## Testes

`apps/api/test/` cobre o parser (inclusive contra os docs reais), o avaliador com um `PageLoader` falso
(ok/warning/empty/missing, escopo isolado, poder) e a API HTTP. Para testar novos casos, monte o HTML
com base nos exemplos de `docs/pntp-2026`.
