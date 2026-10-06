# AGENTS.md

Guia operacional para agentes de IA (e pessoas) que trabalham neste repositório.
Documentação de referência completa: [`docs/avaliador.md`](docs/avaliador.md). Este arquivo é o resumo
normativo — em caso de divergência, o código e `docs/avaliador.md` prevalecem; corrija o que estiver desatualizado.

## 1. Visão geral

**Avaliador Serigy (PNTP 2026)** recebe a URL de um portal da transparência e o poder/esfera do órgão, e verifica se
a marcação Serigy (`serigySchema`, `serigyItem`, `serigyValue`, `serigyLink`, …) exigida pela matriz PNTP 2026 do
TCE-SE está presente. O resultado é exibido na UI e exportável em Markdown.

- Idioma do produto, da documentação, das mensagens ao usuário e dos commits: **português do Brasil**.
- Identificadores de código (variáveis, funções, tipos) seguem o padrão já existente (mistura de PT/EN conforme o domínio, ex.: `PODERES`, `PageStore`). Não renomeie em massa.

## 2. Stack e estrutura

Monorepo **pnpm** (`pnpm@10.x`, Node ≥ 22.13), TypeScript em todos os pacotes.

```
docs/pntp-2026/        Matriz de requisitos em Markdown — FONTE ÚNICA DA VERDADE do catálogo
docs/avaliador.md      Documentação técnica da aplicação
packages/shared/       Tipos e lista de poderes (PODERES) usados por API e UI
apps/api/              Express 5, cheerio, zod, playwright-core, SQLite (node:sqlite), vitest
  scripts/build-catalog.ts   docs -> src/catalog/catalog.json
  src/catalog/               parse-docs.ts, load.ts, catalog.json (GERADO, versionado)
  src/evaluator/             collector, markup, checks, evaluate, loaders (http/browser)
  src/db/                    cadastro de portais (migrações por PRAGMA user_version)
  src/report/markdown.ts     relatório Markdown
  test/                      testes vitest
apps/web/              React 19, Tailwind 4, Vite, shadcn/ui (estilo base-nova, Base UI)
```

## 3. Comandos

```bash
pnpm install        # instala e prepara o navegador headless embutido (postinstall)
pnpm dev            # API http://127.0.0.1:3001 + UI http://localhost:5173
pnpm catalog        # regenera apps/api/src/catalog/catalog.json a partir de docs/pntp-2026
pnpm typecheck      # tsc em todos os pacotes
pnpm test           # vitest (API)
pnpm build          # compila a UI
pnpm start          # API servindo também apps/web/dist
```

Antes de concluir qualquer mudança: `pnpm typecheck` e `pnpm test` devem passar.

## 4. Regra de ouro: a matriz é a fonte da verdade

`apps/api/src/catalog/catalog.json` é **gerado**. Nunca o edite à mão.

Fluxo para qualquer correção de requisito (título, descrição, atributo, tipo, schema, caminho):

1. Edite o `.md` em `docs/pntp-2026/**`, respeitando as convenções do parser (ver `docs/avaliador.md`, "Como atualizar").
2. Rode `pnpm catalog` e confira a contagem (hoje: 33 páginas, 639 itens) e os avisos.
3. Rode `pnpm test` (o teste de catálogo fixa o número de páginas; atualize-o ao criar/remover páginas).
4. Faça commit do `.md` **e** do `catalog.json` juntos.

A matriz espelha a documentação oficial (<https://serigy.tce.se.gov.br/>). Erros na documentação oficial **não
podem ser corrigidos daqui**: registre a divergência no commit/PR e comunique o TCE-SE.

## 5. Convenções de código

- Siga o estilo do arquivo vizinho (densidade de comentários, nomes, idioma). Não introduza novos formatadores/linters sem pedido.
- TypeScript estrito; sem `any` desnecessário. Tipos compartilhados vivem em `packages/shared`.
- Validação de entrada da API com **zod**. Erros de validação respondem HTTP 400 antes de abrir streams.
- A UI só consome a API; o relatório Markdown é gerado **apenas** em `apps/api/src/report/markdown.ts` (sem templates duplicados).
- Componentes de UI em `apps/web/src/components/ui/` vêm do CLI do shadcn (`pnpm dlx shadcn@latest add <componente>` dentro de `apps/web`); o estilo `base-nova` usa **Base UI**, não Radix.
- Banco: nunca altere migrações já publicadas em `MIGRATIONS` (`db/database.ts`); acrescente uma nova.
- Novos validadores de tipo: `VALIDATORS` em `checks.ts`, com o nome exatamente igual ao da coluna "Valor" da matriz.

## 6. Invariantes do avaliador (não quebrar)

- **Sem navegação por links `<a href>`.** Só se baixa: a URL informada, o "Caminho URL" de cada seção e destinos de `serigyLink` dos itens avaliados.
- Caminhos são testados **em minúsculas**; a grafia da documentação só com `tryDocumentedCase`.
- Cada item é procurado pelo par (schema da página, `serigyItem`) **somente** na página da sua seção (ou no destino de `serigyLink`).
- Valor de `serigyItem` é comparado com diferenciação de caixa; schema ignora caixa, barra final e prefixo `/2026`, mas confere protocolo e host.
- Atendimento (%) = (`ok` + `empty`) / total; `warning` não conta. Faixas de cor: <40% vermelho, 40–<100% amarelo, 100% verde.
- Itens de exportação (`salvarRelatorio`) **nunca** são clicados nem baixados; apenas se verifica o mapeamento.
- O mesmo número de página em várias pastas (3, 4, 8, 11) é **um item** para o usuário (`groupPagesByNumber`); a avaliação continua por pasta.
- O avaliador **não burla** CAPTCHA/WAF. Não adicione evasão de bloqueios; a solução é liberar o IP/UA com o responsável pelo portal.

## 7. Testes

- Framework: vitest em `apps/api/test/`. Use um `PageLoader` falso (`test/helpers.ts`) para avaliar sem rede.
- Testes `live.test.ts` e `browser.test.ts` podem depender de rede/navegador e são ignorados quando indisponíveis.
- Todo bug corrigido ou regra nova deve ganhar teste que falhe sem a mudança. Monte HTML de teste a partir dos exemplos de `docs/pntp-2026`.

## 8. Segurança e dados

- A API baixa URLs arbitrárias a pedido do usuário (inclusive `localhost`): mantenha `HOST=127.0.0.1`. Não exponha publicamente sem autenticação e bloqueio de rede interna.
- Não versione: `apps/api/data/` (SQLite), `apps/api/.browser/`, `chrome-headless-shell-win64.zip` (>100 MB), `.env`. Nunca commite credenciais.
- Variáveis: `PORT`, `HOST`, `DATABASE_PATH`, `BROWSER_EXECUTABLE_PATH`, `BROWSER_USER_AGENT`, `SERIGY_SKIP_BROWSER_DOWNLOAD`, `SERIGY_BROWSER_ZIP`.

## 9. Git e entrega

- **Branch principal: `dev`.** Ela substitui `main` como base de trabalho e destino de PRs. Para mudanças maiores, crie branch própria a partir de `dev`.
- **Ao final de cada alteração, o agente deve gerar a mensagem de commit** seguindo o [Conventional Commits 1.0](https://www.conventionalcommits.org/pt-br/v1.0.0/), mesmo que não vá executar o commit. Apresente-a em bloco de código ao concluir a tarefa.
  - Formato: `<tipo>(<escopo opcional>): <descrição>` + corpo e rodapés opcionais.
  - Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
  - Escopos sugeridos: `api`, `web`, `shared`, `catalog`, `docs`, `db`, `evaluator`, `report`.
  - Descrição em português, no imperativo, minúscula, sem ponto final, até ~72 caracteres.
  - Mudança incompatível: `!` após o tipo/escopo e rodapé `BREAKING CHANGE: ...`.
  - Exemplos: `fix(catalog): corrige título do item 25.5 para Ata de Eleição` · `docs: adiciona AGENTS.md` · `feat(web): exibe selo de ambiente no resultado`.
  - Alterações de matriz incluem o `.md` e o `catalog.json` no mesmo commit.
- Só execute `git commit`/`git push` quando o usuário pedir; nunca use `--no-verify`, `push --force` nem reescreva histórico sem pedido explícito.
- Descreva no commit/PR o que mudou **e como foi verificado** (`pnpm typecheck`, `pnpm test`). Se algo não foi verificado, diga.

## 10. Checklist antes de finalizar

- [ ] Alteração de matriz? `.md` editado, `pnpm catalog` rodado, `catalog.json` incluído.
- [ ] `pnpm typecheck` e `pnpm test` verdes.
- [ ] `docs/avaliador.md` atualizado se o comportamento mudou.
- [ ] Mensagem de commit (Conventional Commits) gerada e apresentada.
- [ ] Nenhum arquivo gerado/binário/segredo adicionado indevidamente.
