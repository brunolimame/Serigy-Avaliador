# Avaliador Serigy (PNTP 2026)

Ferramenta que verifica se um **portal da transparência** está com a marcação **Serigy** exigida pela
matriz **PNTP 2026** do TCE-SE. Você informa a URL do portal e o poder/esfera do órgão; a aplicação percorre
as páginas necessárias, confere cada item da matriz e mostra o resultado na tela, que pode ser exportado em
Markdown ou JSON.

> Documentação técnica completa (regras de avaliação, API, persistência e guia de manutenção):
> [`docs/avaliador.md`](docs/avaliador.md). A matriz de requisitos está em [`docs/pntp-2026`](docs/pntp-2026/README.md).
> O plano de distribuição como aplicativo desktop está em [`DISTRIBUICAO.md`](DISTRIBUICAO.md).

## O que é a marcação Serigy

O Serigy é o padrão do TCE-SE para que sistemas de transparência publiquem informações em um formato
verificável. As páginas trazem atributos HTML próprios:

| Atributo | Função |
|---|---|
| `serigySchema` | identifica a seção/schema da página (ex.: `https://…/comum/despesas.html`) |
| `serigyItem` | identifica um item da matriz (ex.: `empenhos`) |
| `serigyValue` | tipo do valor (ex.: `Monetário`, `Data`, `CPF`) |
| `serigyEmpty` | motivo declarado quando a seção não tem registros |
| `serigyLink` | aponta para outra página onde o item está publicado |
| `serigyExecuteWaitSection` / `serigyLoadSection` | ações (ex.: trocar o ano de um filtro) e a seção que deve recarregar |

A matriz PNTP 2026 define, para cada item, em qual página (caminho da seção), com qual schema e com qual
`serigyItem` ele deve aparecer, além do tipo de valor esperado.

## Como funciona

```
docs/pntp-2026/*.md ──(pnpm catalog)──▶ catalog.json ──▶ API ──▶ UI
                                                          ▲
URL do portal ──▶ coletor ──▶ marcação (serigy*) ──▶ avaliação ──▶ resultado ──▶ relatório .md
```

1. **Catálogo.** A matriz em `docs/pntp-2026` é a **fonte única da verdade**. O comando `pnpm catalog`
   converte os Markdown em `apps/api/src/catalog/catalog.json` (arquivo gerado e versionado; não edite à mão).
2. **Coleta.** A API baixa **somente o necessário**: a URL informada, a página do "Caminho URL" de cada seção
   avaliada e os destinos de `serigyLink` dos itens avaliados. **Não há navegação por links `<a href>`**, então
   nenhuma página é visitada por acaso. Cada URL é baixada uma única vez.
3. **Renderização.** Por padrão, cada página é aberta em um navegador headless embutido (Chromium via
   `playwright-core`), para avaliar o DOM já montado por JavaScript, como o usuário o vê. Também é possível
   baixar só o HTML (modo `http`, mais rápido, sem JavaScript).
4. **Avaliação.** Cada item do catálogo é procurado pelo par **(schema da página, `serigyItem`)** somente na
   página da sua seção. Depois confere-se o valor contra o tipo esperado (ex.: CPF, data, monetário).
5. **Resultado e relatório.** O resultado é transmitido à interface item a item (NDJSON) e, ao final, pode ser
   exportado como relatório Markdown ou como JSON reimportável.

### Status de cada item

| Status | Significado | Conta no atendimento? |
|---|---|---|
| `ok` | item encontrado sob o schema correto, com valor coerente | sim |
| `empty` | `serigyEmpty` declarado com motivo válido e único (seção sem registros) | sim (atende parcialmente) |
| `warning` | encontrado, mas com valor fora do tipo, schema que não confere ou `serigyEmpty` inválido | não |
| `missing` | item ou schema não encontrado na página da seção | não |

**Atendimento (%)** = (`ok` + `empty`) / total de itens avaliados. Faixas de cor: vermelho abaixo de 40%,
amarelo de 40% a menos de 100%, verde em 100%.

Além do resultado do avaliador, cada item traz um **veredito Serigy estimado**: uma previsão de como o
validador oficial do TCE-SE pontuaria o item. Quando uma avaliação do histórico recebe o JSON oficial do
Serigy (função "Anexar Serigy"), o veredito oficial aparece ao lado do estimado, item a item.

### Regras que valem a pena conhecer

- **Caixa:** o valor de `serigyItem` é comparado com diferenciação de maiúsculas/minúsculas. Schemas e
  caminhos são comparados sem caixa, ignorando barra final e o prefixo `/2026`, mas o host e o protocolo do
  schema são conferidos.
- **Caminhos em minúsculas:** os caminhos são testados em minúsculas (`/Despesas` → `/despesas`). A grafia
  da documentação só é testada com a opção "Testar também a grafia da documentação".
- **Um item, um número:** o mesmo número de item pode existir em mais de uma pasta (ex.: 3 Receitas, 4
  Despesas, 8 Licitações, 11 Planejamento). Para o usuário é um item só, com o percentual do grupo; a
  avaliação continua separada por pasta.
- **Poderes:** todo poder herda os requisitos de `comum/` e soma os da própria pasta (ex.: `executivo` =
  `comum` + `executivo`). Os poderes estão em `PODERES` (`packages/shared`).
- **Exportação de dados (`salvarRelatorio`):** esses itens só têm o mapeamento verificado. Nunca são clicados
  nem baixados.
- **Histórico de anos:** com o navegador, o avaliador tenta trocar o ano do filtro `historicoExercicio`
  (ano atual e anteriores, configurável) e informa se a seção mudou e se há dados. Não valida as regras de
  negócio do histórico, apenas a marcação e o comportamento do filtro.
- **Limite honesto:** o avaliador **não burla CAPTCHA nem bloqueios de WAF**. Se o portal bloquear o acesso
  automatizado, o item informa isso; a solução é liberar o IP/User-Agent do avaliador com o responsável pelo
  portal.

## Funcionalidades da interface

- **Nova avaliação:** escolha um portal cadastrado ou uma URL avulsa, o poder e o escopo (todos os itens,
  uma página, itens isolados ou seleção livre).
- **Andamento em tempo real:** cada item aparece como "Aguardando", "Analisando" ou já com o resultado.
- **Detalhes de cada item:** descrição, marcação esperada, o que foi encontrado e exemplos HTML da
  documentação.
- **Reavaliar** um item ou um grupo inteiro, sem refazer toda a análise.
- **Portais cadastrados:** nome, URL, poder e ambiente (produção ou desenvolvimento), guardados em SQLite.
- **Histórico:** avaliações completas podem ser salvas, abertas (somente leitura), exportadas, importadas
  (JSON validado) e ter o Serigy oficial anexado para comparação.
- **Configurações:** máximo de páginas seguidas por `serigyLink`, uso do navegador, grafia da documentação,
  anos do histórico e tempo de espera de cada ano. Atalho: **Ctrl+,** (ou **Cmd+,**).

## Requisitos

- **Node.js 22.13 ou superior** (a API usa o SQLite embutido do Node, `node:sqlite`).
- **pnpm 10.x** (`packageManager` do projeto fixa a versão).
- Windows, Linux ou macOS. Para o navegador embutido, o Windows usa o `chrome-headless-shell-win64.zip`
  da raiz (quando presente); nos outros sistemas o instalador baixa o Chromium.

## Instalação e execução

```bash
pnpm install     # instala as dependências e prepara o navegador headless (postinstall)
pnpm dev         # API em http://127.0.0.1:3001 e UI em http://localhost:5173
```

Outros comandos:

| Comando | O que faz |
|---|---|
| `pnpm dev` | sobe API e UI em modo de desenvolvimento |
| `pnpm start` | sobe a API servindo também a UI compilada (`apps/web/dist`), em http://127.0.0.1:3001 |
| `pnpm build` | compila a interface para `apps/web/dist` |
| `pnpm catalog` | regenera `catalog.json` a partir de `docs/pntp-2026` (sem acesso à rede) |
| `pnpm typecheck` | verificação de tipos em todos os pacotes |
| `pnpm test` | testes automatizados da API (vitest) |

### Variáveis de ambiente (API)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | porta da API |
| `HOST` | `127.0.0.1` | endereço de escuta; mantenha local (ver "Segurança") |
| `DATABASE_PATH` | `apps/api/data/avaliador.sqlite` | arquivo do banco SQLite |
| `BROWSER_EXECUTABLE_PATH` | — | navegador próprio a usar em vez do embutido |
| `BROWSER_USER_AGENT` | User-Agent de Chrome comum | troca o User-Agent do navegador |
| `SERIGY_SKIP_BROWSER_DOWNLOAD` | — | pula a preparação do navegador na instalação |
| `SERIGY_BROWSER_ZIP` | — | caminho de outro zip do navegador headless |

## Estrutura do repositório

```
docs/pntp-2026/           matriz de requisitos em Markdown (fonte do catálogo)
docs/avaliador.md         documentação técnica completa
packages/shared/          tipos, poderes (PODERES), configurações e regras compartilhadas entre API e UI
apps/api/                 API Express 5 + avaliador
  scripts/                build-catalog.ts (docs → catálogo), install-browser.mjs (navegador)
  src/catalog/            parser da matriz e catalog.json gerado
  src/evaluator/          coleta de páginas, marcação, validação de tipos e avaliação
  src/db/                 SQLite: portais, configurações e histórico (migrações)
  src/history/            validação estrita, hash canônico e envelope de exportação/importação
  src/report/markdown.ts  relatório Markdown (único lugar em que ele é gerado)
  test/                   testes vitest
apps/web/                 interface React 19 + Tailwind 4 + Vite + shadcn/ui
```

### API HTTP (resumo)

| Rota | Descrição |
|---|---|
| `GET /api/health` | status e data de geração do catálogo |
| `GET /api/poderes` · `GET /api/catalog?poder=…` | poderes e requisitos aplicáveis |
| `POST /api/evaluate` | avaliação completa (resposta única) |
| `POST /api/evaluate/stream` | mesma avaliação em NDJSON, com o andamento item a item |
| `POST /api/report` | gera o relatório Markdown a partir de um resultado |
| `/api/portais`, `/api/configuracoes`, `/api/avaliacoes` | cadastro de portais, configurações e histórico |

Exemplo de corpo para `POST /api/evaluate`:

```json
{
  "url": "https://transparencia.exemplo.gov.br/",
  "poder": "executivo",
  "pages": ["comum/despesas"],
  "items": ["4.1.1", "4.1.2"],
  "renderer": "browser"
}
```

`pages`, `items`, `maxPages`, `tryDocumentedCase` e `renderer` são opcionais; sem `pages` e `items`, avalia
todos os itens do poder. Erros de validação respondem `400` antes de abrir o stream; portal inacessível,
`502`.

## Dados e persistência

- **Banco:** SQLite em `apps/api/data/avaliador.sqlite`, criado automaticamente. Não é versionado.
- **Migrações:** controladas por `PRAGMA user_version` (`apps/api/src/db/database.ts`). Nunca altere uma
  migração já publicada; acrescente uma nova.
- **Histórico:** guarda só avaliações completas, sem duplicar a mesma (hash SHA-256 do resultado canônico).
  A importação passa por validação estrita e pelo hash; o hash detecta arquivo corrompido ou editado à mão,
  mas não prova autoria.

## Segurança

- A API **baixa URLs arbitrárias** a pedido do usuário (inclusive `localhost`). Por isso escuta apenas em
  `127.0.0.1`. **Não a exponha publicamente** sem autenticação e bloqueio de acesso à rede interna.
- Não há evasão de CAPTCHA ou WAF (ver "Limite honesto" acima).
- O conteúdo importado nunca é interpretado como HTML.
- Não versione `apps/api/data/`, `apps/api/.browser/`, `.env` nem o zip do navegador (acima de 100 MB).

## Como atualizar a matriz

1. Edite os arquivos em `docs/pntp-2026/**/*.md`, respeitando as convenções do parser (ver
   [`docs/avaliador.md`](docs/avaliador.md), seção "Como atualizar").
2. Rode `pnpm catalog` e confira a contagem de páginas e itens e os avisos.
3. Rode `pnpm test`. O teste de catálogo fixa o número de páginas; atualize-o ao criar ou remover páginas.
4. Faça commit do `.md` **e** do `catalog.json` juntos.

Erros da própria documentação oficial não podem ser corrigidos aqui: registre a divergência no commit ou PR
e comunique o TCE-SE. A matriz espelha <https://serigy.tce.se.gov.br/>.

## Contribuindo

- Branch principal de trabalho: **`dev`**. Para mudanças maiores, crie uma branch a partir dela.
- Mensagens de commit no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/), em português.
- Antes de concluir uma alteração: `pnpm typecheck` e `pnpm test` devem passar.
- Todo bug corrigido ou regra nova deve vir com teste que falhe sem a mudança.
- Para guias de manutenção (novo poder, novo tipo de validação, trocar o carregador de páginas, nova versão
  da matriz), veja [`docs/avaliador.md`](docs/avaliador.md).
