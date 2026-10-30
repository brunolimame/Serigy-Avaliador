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
| API (`apps/api`) | Node 22, Express 5, TypeScript (executado com `tsx`), cheerio, zod, playwright-core + navegador headless embutido |
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
  src/evaluator/           loader.ts, browser-loader.ts, loader-factory.ts, collector.ts, paths.ts, markup.ts, checks.ts, evaluate.ts
  src/db/                  SQLite: database.ts (migrações), portais.ts (cadastro), index.ts
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
   O limite `maxPages` (padrão **40**, máx. 200; configurável em Configurações › Comportamento) vale **só para páginas seguidas por `serigyLink`**; a URL inicial e as
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
  ícone conforme o status (verde = atendido, âmbar = atenção, azul-claro = serigyEmpty declarado, rosa = não encontrado).
- Comportamento: ao terminar a análise, **páginas e detalhes dos itens ficam fechados** (só as páginas em análise
  abrem sozinhas durante o stream). O botão "Detalhes" de cada item não atendido mostra descrição, esperado,
  encontrado e exemplos. O alerta "usa iframe com serigyLink" aparece **dentro do item** que depende dele.
  Largura máxima da página: 1700px. A página rola normalmente; a **lista de itens** tem altura limitada
  (mín. 28rem, máx. 80vh) e rola por dentro, com cabeçalho, estatísticas, avisos recolhidos e filtros acima dela. O **Invoker** é o
  primeiro item da lista e tem "Reavaliar"; "Detalhes" existe em todos os itens, inclusive os atendidos. "Selecionar itens" abre uma
  janela; o formulário mostra o total de grupos e itens marcados.
- Layout em **2 colunas** (estilo CRM): à esquerda, abas "Nova avaliação" e "Histórico"; à direita, o resultado, com
  a barra de estatísticas/progresso fixa no topo. Em telas estreitas vira coluna única.
- Rolagem: a lista de avisos/falhas usa `ScrollArea` (altura máxima 12rem) e os exemplos HTML da documentação usam
  `<pre>` com `max-h-64 overflow-auto` (rolagem vertical e horizontal). O `ScrollArea` foi ajustado com
  `max-h-[inherit]` no viewport para funcionar com altura máxima.

## Portais cadastrados (SQLite)

Os portais a avaliar ficam cadastrados em um banco **SQLite**, cada um com **nome, URL, poder e ambiente**
(produção ou desenvolvimento). Na tela basta selecionar o portal; há também a opção "URL avulsa".

- **Banco:** `apps/api/data/avaliador.sqlite` (criado sozinho; fora do Git). `DATABASE_PATH` troca o arquivo.
  Usa o SQLite embutido do Node (`node:sqlite`, **Node ≥ 22.13**, imprime um `ExperimentalWarning` inofensivo):
  nada nativo para instalar. Modo WAL (junto do arquivo aparecem `-wal` e `-shm`; copie os três ou pare a API antes
  de copiar o banco).
- **Código:** `apps/api/src/db/` — `database.ts` (abre o arquivo e aplica as migrações), `portais.ts` (`PortaisRepo`:
  `list/get/create/update/remove`, validações e `PortalError`), `index.ts` (`defaultPortais()`, aberto na 1ª utilização).
- **Esquema:** tabela `portais(id, nome, url, url_chave UNIQUE, poder, ambiente, criado_em, atualizado_em)`.
  A unicidade usa a URL normalizada (host e caminho em minúsculas, sem barra final e sem âncora): `https://X.gov.br/` e
  `https://x.gov.br` são o mesmo portal (HTTP 409 ao repetir).
- **Migrações** por `PRAGMA user_version`: acrescente um item em `MIGRATIONS` (`database.ts`) e nunca altere os já
  publicados. v1 cria a tabela; v2 acrescenta `ambiente` (os portais antigos viram "produção").
- **Ambiente** (`producao` | `desenvolvimento`; omitido = produção) identifica o endereço, e a interface o mostra em
  todo lugar: selo verde "Produção" (ícone de servidor) ou âmbar "Desenvolvimento" (ícone de frasco) na lista, no
  seletor e na avaliação; faixa colorida "AMBIENTE DE PRODUÇÃO/DESENVOLVIMENTO" com o nome e a URL no topo do resultado;
  e linha "Ambiente" no relatório Markdown. O avaliador em si não muda de comportamento por ambiente.
- **API:** `GET /api/portais`, `POST /api/portais`, `PUT /api/portais/:id`, `DELETE /api/portais/:id` (204).
  Corpo: `{ "nome", "url", "poder", "ambiente" }`. Erros: 400 (nome, URL ou poder inválidos), 404, 409 (URL repetida).
  `POST /api/evaluate*` aceita `portalNome` e `portalAmbiente` (só identificam a avaliação no resultado e no relatório).
- **Interface:** o cadastro fica em Configurações › Portais (novo/editar/excluir com confirmação); o último portal
  escolhido é lembrado no navegador (`localStorage`).

## Configurações gerais (SQLite)

Janela estilo VS Code (botão "Configurações" ou **Ctrl+,** / **Cmd+,**; Esc fecha) com categorias **Portais**,
**Comportamento** e **Histórico**. Valem para toda a aplicação (não por portal).

- **Catálogo:** `SETTINGS` em `packages/shared/src/index.ts` (chave `<categoria>.<nome>`, tipo, padrão, faixa). Para criar
  uma configuração, acrescente uma entrada: a API valida pelo tipo/faixa e o painel desenha o controle sozinho.
- **Configurações atuais:** `comportamento.navegador` (padrão ligado), `comportamento.maxPaginasSerigyLink` (padrão
  **40**, 1–200) e `comportamento.testarGrafiaDocumentacao` (padrão desligado).
- **Persistência:** tabela `configuracoes(chave PK, valor, atualizado_em)`; só valores diferentes do padrão são gravados
  (restaurar = apagar a linha). `SettingsRepo` em `apps/api/src/db/settings.ts`.
- **Aplicação:** `POST /api/evaluate*` usa o valor configurado para o que a requisição não informa (`renderer`,
  `maxPages`, `tryDocumentedCase`); o valor explícito do corpo prevalece. No formulário, "Extras desta avaliação"
  mostra o máx. de páginas começando no valor das configurações, valendo só para aquela execução.
- **API:** `GET /api/configuracoes` (definições, valores, `modificadas`), `PUT /api/configuracoes/:chave` (`{valor}`),
  `DELETE /api/configuracoes/:chave` (restaura uma), `DELETE /api/configuracoes` (restaura todas **e apaga os portais
  cadastrados**; o histórico é mantido). Erros: 400 (valor inválido), 404 (chave inexistente).

## Histórico, exportação e importação

Só **avaliações completas** (`scope.mode === 'todos'`) são salvas, por ação manual ("Salvar avaliação", habilitado após
o fim da análise; reavaliar item/grupo invalida o "salvo"). Sem limite de quantidade: o usuário apaga um item ou
todo o histórico (Configurações › Histórico, com confirmação).

- **Tabela `avaliacoes`** (migração v4): colunas de resumo para a lista, `hash` UNIQUE (SHA-256 do JSON canônico do
  resultado) e `payload` (resultado em gzip). A mesma avaliação não é guardada duas vezes: **409** com o `id` da existente
  (a UI avisa e oferece abrir). Código: `apps/api/src/db/avaliacoes.ts` e `apps/api/src/history/`.
- **Abrir:** a avaliação aberta do histórico mostra data/hora e todos os detalhes, mas é **somente leitura** (sem
  Reavaliar item/grupo). Para reavaliar, faz-se uma nova avaliação.
- **Exportar:** JSON importável (envelope abaixo) e relatório Markdown (o mesmo de `/api/report`).
- **Envelope JSON** (`formato: "serigy-avaliacao"`, `versao: 2`): `exportadoEm`, `app {nome, versao}`,
  `catalogo {geradoEm}`, `hash`, `resultado` e, se houver, `serigyOficial` (fora do hash; ver "Veredito Serigy"). A versão 1 continua importável. Mudança incompatível = nova `versao` (EXPORT_VERSION no shared); arquivos de
  versão mais nova são recusados.
- **Importar (somente JSON):** a API valida, nesta ordem, (1) estrutura do envelope sem chaves desconhecidas, (2) formato,
  (3) versão, (4) o resultado inteiro com **zod estrito** (tipos, enums, limites de tamanho, URLs http(s), ids de item) e
  **consistência** (escopo completo, datas, contagens, ids únicos, `summary` recalculado), (5) o **hash**. Falha = 400 com
  `{error, problemas[]}`. O conteúdo importado nunca é interpretado como HTML (a UI só exibe texto). Entra com
  `origem: "importada"`. Se o portal da URL não está cadastrado, a UI oferece cadastrá-lo.
- **Limite do hash:** detecta arquivo corrompido ou editado à mão, **não prova autoria** (quem edita pode recalcular o
  hash). Assinatura digital é uma opção futura (ver `DISTRIBUICAO.md`).
- **API:** `PUT|GET|DELETE /api/avaliacoes/:id/serigy` (anexar/substituir, baixar, remover o JSON do Serigy), `GET /api/avaliacoes`, `GET /api/avaliacoes/:id`, `POST /api/avaliacoes` (salvar o resultado atual),
  `DELETE /api/avaliacoes/:id`, `DELETE /api/avaliacoes?confirmar=sim`, `GET /api/avaliacoes/:id/exportar?formato=json|md`,
  `POST /api/avaliacoes/exportar` (envelope do resultado atual, salvo ou não), `POST /api/avaliacoes/importar`.
  O corpo JSON aceita até 30 MB.

## Marcação de tempo

O resultado traz `startedAt` e `finishedAt`. A UI mostra, abaixo do título "Resultado", quando a avaliação **iniciou**, quando
**terminou** e a **duração** (durante a análise, só o início e "em andamento"); o relatório Markdown traz as mesmas três
linhas (fuso America/Maceio). Código: `formatDuration`/`evaluationDuration` em `packages/shared`.

## Veredito Serigy (estimado e oficial)

O `status` do avaliador (`ok`, `warning`, `empty`, `missing`) e todos os detalhes seguem a matriz. Ao lado dele, cada
item traz `serigy: { ponto, codigo?, detalhe? }` — o veredito **estimado** de como o validador oficial do TCE-SE
pontuaria o item (`ponto` = pontua ou não; `codigo` = `URL_NOT_ACCESSIBLE`, `SCHEMA_NOT_FOUND`, `SERIGYITEM_NOT_FOUND`,
`SERIGYITEM_NOT_VALID` ou `WAITSECTION_NOT_FOUND`). Código: `veredito()` em `evaluator/evaluate.ts`. Regras:

- `ok` e `empty` pontuam; `missing` não (código conforme a causa: página/iframe inacessível, schema ou item ausente).
- `warning` por **valor fora do tipo** ou **só `<th>`** pontua (o validador oficial não reprova por isso); `warning` por
  schema que não confere ou `serigyEmpty` inválido não pontua.
- **`historicoExercicio`** só pontua com `serigyItem="historicoExercicio"` e um `serigyExecuteWaitSection` no filtro
  (`serigyItem="filtroPesquisa"`) que o contém; o atalho "select de anos" do avaliador **não** pontua
  (`WAITSECTION_NOT_FOUND`). Sem `serigyLoadSection` de mesmo valor no HTML carregado, pontua com aviso (ele pode surgir
  após o clique).
- **Desvios do validador oficial** (`SERIGY_SCHEMA_QUIRKS` em `packages/shared`): hoje, a seção 25 (Atividades
  Finalísticas dos consórcios) é procurada como `consorcio/…` (singular), e a matriz publica `consorcios/…`. Com a
  configuração `comportamento.compatibilidadeSerigy` ligada (padrão), o item não pontua (`SCHEMA_NOT_FOUND`); desligada,
  só ganha um aviso no `detalhe`. O `status` não muda e a matriz não é alterada.
- Ficaram **fora** (hipóteses a confirmar com o TCE-SE): `Link` com o `href` só no `<a>` filho (2.2.1), `Texto` vazio em
  uma das ocorrências (1.2) e a avaliação de Acessibilidade na página do `/erro` (13.x).

Na UI, o resultado mostra "Serigy estimado" (percentual e n/total) no topo e no selo de página, grupo e seção, e um
selo por item. Em avaliações **antigas** do histórico (sem o campo) nada é mostrado.

**Serigy oficial no histórico.** Na lista do histórico, "Anexar Serigy" aceita o JSON baixado do Serigy (lista de
`{dimensao, itemId, serigyItem, serigySchema, ponto, detalhe}`), validado com zod estrito (`history/serigy.ts`). Fica na
própria avaliação (migração v5: `serigy_payload` em gzip + `serigy_total`/`serigy_atendidos`), fora do hash do resultado.
Os itens são pareados por número + `serigyItem`; na falta, por dimensão (caminho da seção) + `serigyItem`, porque o
Serigy omite alguns itens e a numeração se desloca (ex.: Receitas). Ao abrir a avaliação, cada item mostra o veredito
oficial junto do estimado (com aviso quando divergem), e o resumo ganha "Serigy oficial". A lista mostra o percentual do
Serigy ou "Sem Serigy", com botões para baixar (mesmo formato do Serigy), substituir e remover. O JSON exportado
(`versao: 2`) e o relatório Markdown incluem o Serigy anexado.

## Navegador embutido (renderização de páginas reativas)

Por padrão (`renderer: "browser"`) cada página é aberta em um **navegador real headless** (Chromium via
`playwright-core`) e a análise usa o DOM **já renderizado**. Assim páginas reativas, que só mostram os resultados
depois de carregar JavaScript, são avaliadas como o usuário as vê. `renderer: "http"` (checkbox desmarcado na UI)
só baixa o HTML: é mais rápido, mas não vê conteúdo montado por script.

**Sem programa instalado na máquina.** O navegador faz parte da API (ordem em `browser-loader.ts`):
1. `BROWSER_EXECUTABLE_PATH`, se definido;
2. **navegador embutido** em `apps/api/.browser/`, extraído do `chrome-headless-shell-win64.zip` (≈ 115 MiB, ≈ 271 MB
   extraído) que fica na raiz do projeto — sem rede;
3. Chromium baixado pelo Playwright para `node_modules/playwright-core/.local-browsers` (`PLAYWRIGHT_BROWSERS_PATH=0`);
4. só como reserva: Chrome ou Edge instalados no sistema;
5. se nada abrir, cai para `http` e o resultado traz um aviso.

O `pnpm install` roda `scripts/install-browser.mjs` (`postinstall`): extrai o zip local, ou, não havendo zip, baixa o
Chromium (com repasse por espelho local usando o `fetch` do Node, pois o downloader do Playwright estoura o tempo em
algumas redes). Falhar nesse passo não quebra a instalação. Para refazer: `pnpm --filter @serigy/api browser:install`.
`SERIGY_SKIP_BROWSER_DOWNLOAD=1` pula a preparação; `SERIGY_BROWSER_ZIP=<caminho>` aponta outro zip. O zip e a pasta
`.browser` estão no `.gitignore` (passam do limite de 100 MB do Git). Para outro sistema operacional, use o
`chrome-headless-shell-<plataforma>.zip` correspondente (Chrome for Testing, versão 153) ou deixe o instalador baixar.

**O que o navegador faz** (`apps/api/src/evaluator/browser-loader.ts`):
- espera o carregamento e a rede ficar ociosa (até 8 s) antes de ler o DOM;
- **dispara os `serigyExecuteWaitSection`**: clica no elemento e espera o `serigyLoadSection` correspondente (até 20
  por página, 5 s cada), como o `definicoes.md` descreve; **nunca clica em itens de exportação** (`salvarRelatorio`) e
  não aceita downloads, então nada é exportado;
- imagens, mídia e fontes não são baixadas (não mudam a marcação; menos tráfego no portal).

**Acesso sem ser tratado como robô** (o objetivo é analisar o portal sem bloqueios indevidos):
- User-Agent de um Chrome comum (o modo headless acrescenta "HeadlessChrome", que denuncia automação), sem a flag
  `navigator.webdriver`, idioma `pt-BR`, fuso `America/Maceio`, viewport de desktop, cabeçalho `Accept-Language`;
- poucas abas simultâneas (3 seções por vez) e **nova tentativa com espera em 429/503**;
- `BROWSER_USER_AGENT` troca o User-Agent.
- **Limite honesto:** isso não burla CAPTCHA nem desafios de WAF. Quando o portal bloqueia (HTTP 403/429 com página
  "Access Denied", "Just a moment", CAPTCHA…), o item sai com a mensagem "o portal parece bloquear acessos
  automatizados"; a solução correta é **liberar o IP/UA do avaliador** com o responsável pelo portal.
- Certificados HTTPS incompletos são aceitos (`ignoreHTTPSErrors`), para que portais públicos mal configurados continuem
  analisáveis.

Os testes (`test/browser.test.ts`) sobem um portal falso local e provam: conteúdo montado por JS é visto (e o modo
`http` não o vê), o clique de `serigyExecuteWaitSection` carrega a seção, itens de exportação não são clicados, o UA não
tem "Headless", 403 e 429 são tratados e o navegador usado é o embutido. Sem navegador no ambiente o grupo é ignorado.

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
| `warning` | encontrado, mas o valor não parece do tipo esperado, o schema não confere, ou o `serigyEmpty` declarado não vale (sem motivo, motivo inválido ou repetido): **não atende** |
| `empty` | rótulo "serigyEmpty declarado": `serigyEmpty` com motivo válido e único e sem conteúdo no item — **atende parcialmente** e conta no percentual |
| `missing` | atributo não encontrado sob o schema, ou o próprio schema não existe na página do caminho da seção |

- **Schema e URLs** são comparados sem diferenciar maiúsculas/minúsculas, ignorando host (no schema), prefixo
  `/2026` e barra final (`normalizeSchema` em `markup.ts` e `urlKey` em `collector.ts`). A documentação grafa
  caminhos como `/Despesas`, mas o site pode usar `/despesas`.
- O valor de `serigyItem` é comparado **exatamente** (caixa importa); se só a caixa difere, a mensagem avisa.
- **Atendimento (%)** = (`ok` + `empty`) / total de itens avaliados. `warning` não conta como atendido.
  O selo de grupo/seção mostra `93.8% · 30/32` e, quando existirem, dois contadores separados, só com ícone e
  número: parcialmente atendidos (`empty`, azul-claro) e não atendidos (`warning` + `missing`, rosa).
- **Cabeçalho `<th>`**: elemento `<th>` com `serigyItem` é o cabeçalho do item (o primeiro da lista); só os demais
  (`<td>`) têm o valor validado. Se existir apenas o `<th>`, sem nenhum `<td>` para validar, o item **não atende** (`warning`).
- **Tipos** (`checks.ts`, tabela `TYPES`): Numérico, Número, Monetário, Ano, Data, Hora, Telefone, CPF, E-mail,
  Link, Anexo, Arquivo e Imagem têm validação heurística (caixa e acentos são ignorados; `Número/Ano` vale
  qualquer um dos dois). Texto, Nome, Endereço, Variável, N/A, Dataset etc. só exigem a presença do item. Se o
  item aceita vários tipos e um deles não tem validador, qualquer valor passa.
- **Invoker**: verifica `<meta serigyItem="invoker" serigyValue="hash">` na página inicial. É reportado à parte
  e não entra no percentual.
- **Ordem**: páginas pelo número da página na matriz (o número do `# N. Título`; ex.: Ouvidoria = 14), seções e
  itens numericamente por segmento (`4.1.2` antes de `4.1.10`), no catálogo/UI, no resultado e nas pendências do
  relatório (`compareIds` em `packages/shared`). Empates de número mantêm a ordem comum → pasta do poder.
- **Um item da matriz = um número (agrupamento)**: o mesmo número pode existir em mais de uma pasta da documentação
  (3 Receitas, 4 Despesas, 8 Licitações e 11 Planejamento e Prestação de Contas: `comum` + a pasta do poder). Para o
  usuário é **um item só**: a seleção de itens, o resultado e o relatório agrupam as páginas pelo número
  (`groupPagesByNumber` em `packages/shared`), mesclando as seções em ordem numérica (ex.: consórcios, item 11:
  11.1, 11.2, 11.3, 11.5, 11.6, 11.7, 11.11), com o percentual do grupo todo. Nada muda na avaliação: cada seção continua
  avaliada contra o schema da sua pasta, e o resultado da API segue com uma página por pasta (`PageResult`); o
  agrupamento é feito na apresentação.
- **`serigyEmpty`** (`apps/api/src/evaluator/serigy-empty.ts`): é avaliado **sempre que declarado** (em qualquer
  ocorrência do item, mesmo havendo outras com conteúdo). O motivo é **sanitizado** (remove tags HTML e caracteres de
  controle, junta espaços, limita a 200 caracteres) e só então validado. Resultado por ocorrência
  (`ItemResult.serigyEmpty`, com `motivo`, `valido` e `problema`):
  - motivo preenchido, válido e único → **"serigyEmpty declarado — motivo: …"**, atende parcialmente (status `empty`);
    havendo também conteúdo preenchido, o item segue o resultado do conteúdo e a mensagem informa o motivo;
  - motivo em branco → **"serigyEmpty declarado mas motivo não informado"**: o item **não atende** (`warning`), mesmo que
    outra ocorrência tenha conteúdo;
  - motivo sem conteúdo válido (menos de 3 letras, repete um caractere ou é texto genérico como `n/a`, `-`, `teste`,
    `nada`, `vazio`, `null`) → não atende, com a explicação;
  - motivo **repetido** em outro `serigyEmpty` da mesma página (comparado sem caixa, acentos e pontuação) → não atende
    nenhum dos repetidos: a documentação exige motivo único e distinto para cada `serigyEmpty`;
  - **schema incorreto**: a mensagem traz primeiro a informação do schema que não confere e depois o resultado do
    `serigyEmpty` acima; o item não é atendido.
  O percentual não muda: `empty` conta como atendido e `warning` não conta. O `serigyEmpty` só é lido em elementos que
  também têm `serigyItem`.
- **Validação do schema (esperado x encontrado)**: achar o `serigyItem` sob um schema de mesmo caminho não basta; o
  **endereço completo** de `serigySchema` precisa corresponder ao da documentação (`canonicalSchema` em `markup.ts`:
  ignora caixa, espaços, barra final e o prefixo `/2026`, mas confere protocolo e host). Cada item traz
  `schema: { esperado, encontrado?, confere }`:
  - confere → segue a avaliação normal; havendo ocorrências com schema exato e outras com schema errado, vale a exata;
  - mesmo caminho, mas outro host ou protocolo (ex.: `https://outro.gov.br/comum/despesas.html`) → **Atenção**, com
    "o schema não confere: encontrado X; esperado Y" (o item deixa de contar como atendido);
  - item achado só sob schema de outro caminho → **Não encontrado**, informando o schema encontrado.
  A UI mostra "Schema: ✓ confere / ✗ não confere" em cada item (e no painel Detalhes); o relatório traz a linha
  "Schema" nas pendências.
- **Cor do percentual de atendimento** (`apps/web/src/score.ts`, `scoreTone`): páginas, seções e o total usam
  **vermelho abaixo de 40%**, **amarelo de 40% a menos de 100%** e **verde com 100%** (40% exato é amarelo). Aparece na
  borda lateral e no selo da página, no selo da seção e no número do "Atendimento". Os itens individuais mantêm a cor
  do próprio resultado (atendido, atenção, serigyEmpty declarado, não encontrado), pois cada item é atendido ou não.
- **Histórico (`historicoExercicio`)**: o avaliador não verifica os 3 anos; se o schema da página tem um filtro por
  ano (um `<select>` dentro do schema com opções `20xx`), o item é dado como **atendido**, mesmo sem
  `serigyItem="historicoExercicio"` próprio (`YearFilter` em `markup.ts`, regra em `evaluate.ts`). Já o **veredito
  Serigy** do item é mais rígido (ver abaixo).
- **`serigyLink`** vale em **qualquer tag** (`iframe`, `a`, `div`, `section`, `span`, `button`, `meta`, `link`…): sempre que o
  atributo é informado numa página analisada, a URL é baixada e avaliada (`markup.ts` captura `[serigylink]` sem filtrar
  por elemento). Segue `definicoes.md`:
  - elemento **com** `serigyItem` → só esse item é buscado na URL (casos de "redirecionamento");
  - elemento **sem** `serigyItem` (ex.: `<iframe serigySchema serigyLink>`) → o schema inteiro é buscado na URL;
  - elemento **fora de qualquer `serigySchema`** → vale para o schema do item avaliado (o schema indefinido funciona
    como curinga em `delegationsFor`/`shouldFollow`, em `evaluate.ts`);
  - **encadeado**: a página de destino pode ter outros `serigyLink`; toda a cadeia é baixada e avaliada (ciclos são
    ignorados);
  - não há exceções por tag: p. ex. `<meta serigyItem="sitioOficial" serigyLink=…>` exige o `serigyItem` no destino. O
    próprio elemento que aponta não conta como evidência. Não achado no destino (ou destino inacessível) = `missing`.
  - **Identificação:** `ItemResult.loadedVia` lista cada URL avaliada com o `kind` (`iframe` ou `serigyLink`) e a `tag`
    do elemento que a declarou; a UI e o relatório mostram "Carregado via iframe" ou "Via serigyLink (`<a>`)".
    `PageResult.iframes` lista só os iframes. `<iframe serigySchema>` **sem** `serigyLink` gera aviso (o `src` não é avaliado).
  - Só são baixados serigyLink de itens/schemas que estão sendo avaliados, e **nunca** os de itens de exportação
    (`salvarRelatorio`); o destino aparece em "Páginas analisadas" com a origem (`iframe` ou `serigyLink`) e conta no
    limite `maxPages`.
- **URL analisada**: cada item traz `analyzedUrls`: a página do caminho da sua seção (onde foi ou deveria ser
  encontrado) ou, havendo `serigyLink`, o(s) destino(s). Aparece na UI e no relatório (coluna "URL analisada").
  Antes dela vai a **URL esperada** (`expectedUrl`: o caminho da seção na documentação, em minúsculas; com a grafia da documentação só quando
  "Testar também a grafia da documentação" está ativa) e um selo indica se a
  analisada é a esperada ou outra (ex.: destino de `serigyLink`), via `analyzedMatchesExpected` em `packages/shared`.
  `expectedUrl` é opcional no formato exportado (avaliações antigas continuam importáveis; sem ela não há selo).
- **Exportação de dados (`salvarRelatorio`)**: apenas se verifica se o `serigyItem` está mapeado (`MAPPING_ONLY`
  em `evaluate.ts`); nenhum download/exportação é executado e links desses elementos (inclusive `serigyLink`)
  não são seguidos. A mensagem lista os formatos declarados em `serigyValue`.
- **Itens não atendidos** (`missing`/`warning`) trazem `expected` (marcação esperada: schema, `serigyItem` e dica
  do tipo de valor), `evidence` (o que foi encontrado) e `examples` (blocos HTML da documentação que usam o
  `serigyItem`, extraídos por `parse-docs.ts`; também anexados aos itens atendidos). A UI mostra tudo num painel sob o item e o relatório, na seção
  "Detalhes das pendências".
- **Reavaliar**: o botão em cada item chama `POST /api/evaluate` com `items: [id]` e os mesmos parâmetros de
  rastreio (`result.crawl`); a UI troca só aquele item e recalcula os resumos (`apps/web/src/merge.ts`).
- **Reavaliar grupo**: o botão no cabeçalho de cada grupo (um número da matriz, que pode reunir mais de uma pasta)
  reavalia **todos os itens do grupo** com os mesmos parâmetros, em **uma única chamada** `POST /api/evaluate` com
  `items: [todos os ids do grupo]` (cada página é baixada uma vez). A UI mescla os itens de todas as pastas do grupo e
  recalcula os resumos (`mergeReevaluatedMany`). Durante a reavaliação o botão mostra "Reavaliando N itens…" e os
  demais botões de reavaliar ficam desabilitados; um erro aparece abaixo do cabeçalho do grupo.
- **Estado durante a reavaliação** (botão "Reavaliar" do item ou do grupo): o item reavaliado — ou **todos** os itens do
  grupo — passa a aparecer como "analisando" (tema azul, ícone de loader e selo "Analisando…"), em vez de ficar com a cor e
  o ícone do último resultado; ao terminar, volta a mostrar o novo resultado. No grupo, o ícone do cabeçalho vira loader, a
  faixa lateral fica azul e o texto passa a "Reavaliando N itens…"; o selo de percentual da seção some até concluir. O
  botão que foi clicado mantém a animação ("Reavaliando…"); os demais ficam desabilitados. A regra é `displayWait` em
  `apps/web/src/status-icons.ts`.
- **Ícone do estado atual (itens e grupos)** — `apps/web/src/status-icons.ts`, visível durante e depois da análise:
  - **item sem resultado**: com a análise em execução mostra o **loader** (azul = sendo analisado agora; cinza = na
    fila); se a análise é interrompida, "não analisado". Ao concluir, passa ao ícone do resultado (atendido, atenção,
    serigyEmpty declarado, não encontrado);
  - **grupo**: sem nenhum item concluído mostra o loader; assim que há itens concluídos mostra o ícone do nível de
    atendimento **parcial** (`CircleCheck` verde = 100%, `TriangleAlert` amarelo = 40% a menos de 100%, `CircleX`
    vermelho = abaixo de 40%), com um loader ao lado enquanto ainda houver itens na fila/em análise; sem nada em
    andamento, só o ícone do nível (ou "não analisado", se interrompida antes de qualquer item concluir).
- **Navegador x HTTP**: com `renderer: "browser"` (padrão) o JavaScript é executado e os `serigyExecuteWaitSection` são
  clicados. Com `renderer: "http"` o HTML é baixado sem executar JavaScript, e o relatório avisa quando há conteúdo
  que dependia de clique. Conteúdo que exige login, CAPTCHA ou interação além do `serigyExecuteWaitSection` não é visto.
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
  "maxPages": 40,
  "tryDocumentedCase": false,
  "renderer": "browser"
}
```

`pages`, `items`, `maxPages`, `tryDocumentedCase` e `renderer` são opcionais: os três últimos, se ausentes, vêm das
configurações gerais. Sem `pages`/`items` = todos os itens do poder. Se ambos vierem, vale a interseção.
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

### Trocar o carregador de páginas
O avaliador só depende da interface `PageLoader` (`loader.ts`: `load(url)` e `close()` opcional). `loader-factory.ts`
escolhe `BrowserLoader` ou `HttpLoader`; para outro mecanismo, implemente `PageLoader` e injete-o em
`evaluate(req, { loader })` ou `createApp({ loader })` (é assim que os testes usam um loader falso).

## Testes

`apps/api/test/` cobre o parser (inclusive contra os docs reais), o avaliador com um `PageLoader` falso
(ok/warning/empty/missing, escopo isolado, poder) e a API HTTP. Para testar novos casos, monte o HTML
com base nos exemplos de `docs/pntp-2026`.
