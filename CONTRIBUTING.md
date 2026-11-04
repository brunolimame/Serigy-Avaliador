# Como contribuir

Obrigado por querer ajudar no **Avaliador Serigy (PNTP 2026)**. Este guia explica como preparar o ambiente,
onde fica cada parte do código, como propor uma mudança e o que esperamos de um bom pull request.

Para entender o que o projeto faz, leia primeiro o [`README.md`](README.md). A documentação técnica completa
está em [`docs/avaliador.md`](docs/avaliador.md), e as regras para agentes e para quem trabalha no repositório
estão em [`AGENTS.md`](AGENTS.md), que é o resumo normativo deste guia.

## Formas de contribuir

- **Reportar um problema:** um portal avaliado de forma incorreta, um item da matriz mal interpretado, um erro
  na interface ou na API.
- **Corrigir a matriz:** divergências entre `docs/pntp-2026` e a documentação oficial do TCE-SE.
- **Melhorar o avaliador:** novos validadores de tipo, casos de borda da marcação, melhorias de desempenho.
- **Melhorar a interface e a documentação.**
- **Escrever testes** para casos reais de portais.

Antes de começar um trabalho grande, abra uma issue para alinhar a abordagem. Assim evitamos retrabalho.

## Preparando o ambiente

Requisitos: **Node.js 22.13 ou superior** e **pnpm 10.x**.

```bash
pnpm install     # instala as dependências e prepara o navegador headless
pnpm dev         # API em http://127.0.0.1:3001 e UI em http://localhost:5173
```

Para testar sem interferir no uso real, use porta e banco próprios, nunca a API principal:

```bash
PORT=3101 DATABASE_PATH=./apps/api/data/teste.sqlite pnpm dev
```

Os testes da API não usam o banco real: `apps/api/vitest.config.ts` fixa `DATABASE_PATH=:memory:`.

## Onde fica cada coisa

| Caminho | Conteúdo |
|---|---|
| `docs/pntp-2026/` | matriz de requisitos em Markdown. **Fonte única da verdade** do catálogo |
| `apps/api/src/catalog/` | parser da matriz e `catalog.json` (**gerado**, não edite à mão) |
| `apps/api/src/evaluator/` | coleta de páginas, marcação, validação de tipos e avaliação |
| `apps/api/src/db/` | SQLite: portais, configurações e histórico (migrações) |
| `apps/api/src/history/` | validação estrita, hash e envelope de exportação/importação |
| `apps/api/src/report/markdown.ts` | relatório Markdown (o único lugar em que ele é gerado) |
| `apps/api/test/` | testes com vitest |
| `apps/web/src/` | interface React 19 + Tailwind 4 + shadcn/ui |
| `packages/shared/` | tipos e constantes usados pela API e pela UI (`PODERES`, `SETTINGS`) |

## Fluxo de trabalho

1. **Crie uma branch a partir de `dev`.** `dev` é a branch principal e o destino dos pull requests.
   Use nomes curtos e descritivos, como `fix/validador-cnpj` ou `docs/guia-matriz`.
2. **Faça a mudança** seguindo as convenções abaixo.
3. **Verifique localmente:**
   ```bash
   pnpm typecheck   # tipos em todos os pacotes
   pnpm test        # testes da API
   ```
   Ambos precisam passar antes do pull request.
4. **Abra o pull request contra `dev`** e descreva o que mudou e como foi verificado. Se algo não foi testado,
   diga explicitamente.

## Convenções

### Idioma

Produto, documentação, mensagens ao usuário e commits são em **português do Brasil**. Identificadores de código
seguem o padrão já existente (mistura de português e inglês conforme o domínio, como `PODERES` e `PageStore`).
Não renomeie identificadores em massa.

### Código

- Siga o estilo do arquivo vizinho: densidade de comentários, nomes e idioma.
- TypeScript estrito. Evite `any` sem necessidade. Tipos compartilhados ficam em `packages/shared`.
- Validação de entrada da API com **zod**. Erros de validação respondem HTTP 400 antes de abrir streams.
- A interface só consome a API. Não duplique templates de relatório.
- Não introduza novos formatadores ou linters sem combinar antes.
- Componentes de `apps/web/src/components/ui/` são gerados pelo CLI do shadcn, dentro de `apps/web`:
  `pnpm dlx shadcn@latest add <componente>`. O estilo `base-nova` usa **Base UI**, não Radix.

### Matriz de requisitos

Qualquer correção de requisito (título, descrição, atributo, tipo, schema ou caminho) segue este fluxo:

1. Edite o `.md` em `docs/pntp-2026/**`, respeitando as convenções do parser (ver `docs/avaliador.md`, "Como atualizar").
2. Rode `pnpm catalog` e confira a contagem de páginas e itens e os avisos.
3. Rode `pnpm test`. O teste de catálogo fixa o número de páginas; atualize-o ao criar ou remover páginas.
4. Faça commit do `.md` **e** do `catalog.json` juntos.

A matriz espelha a documentação oficial (<https://serigy.tce.se.gov.br/>). **Erros na documentação oficial não
podem ser corrigidos aqui.** Registre a divergência no PR e comunique o TCE-SE.

### Banco de dados e exportação

- **Migrações:** nunca altere uma migração já publicada em `MIGRATIONS` (`apps/api/src/db/database.ts`).
  Acrescente uma nova.
- **Configurações:** novas entradas vão em `SETTINGS` (`packages/shared`). A API valida pelo tipo e pela faixa,
  e a interface desenha o controle sozinha.
- **Formato exportado:** se mudar o envelope de exportação, suba `EXPORT_VERSION`.
- **Validadores de tipo:** novos validadores vão em `VALIDATORS` (`checks.ts`), com o nome exatamente igual ao da
  coluna "Valor" da matriz.

### Invariantes do avaliador (não quebrar)

Esses pontos definem o comportamento correto da avaliação. Uma mudança que os afete precisa de discussão prévia.

- **Sem navegação por `<a href>`.** Só se baixa a URL informada, o "Caminho URL" de cada seção e os destinos de
  `serigyLink` dos itens avaliados.
- Caminhos são testados em **minúsculas**. A grafia da documentação só é testada com `tryDocumentedCase`.
- Cada item é procurado somente na página da sua seção (ou no destino de `serigyLink`).
- Itens de exportação (`salvarRelatorio`) **nunca** são clicados nem baixados.
- O avaliador **não burla CAPTCHA nem WAF**. Não adicione mecanismos de evasão de bloqueios.

## Testes

- Os testes ficam em `apps/api/test/`, com vitest.
- Use o `PageLoader` falso de `test/helpers.ts` para avaliar sem rede.
- `live.test.ts` e `browser.test.ts` dependem de rede ou navegador e são ignorados quando indisponíveis.
- **Todo bug corrigido ou regra nova deve vir com um teste que falhe sem a mudança.** Monte o HTML de teste a
  partir dos exemplos de `docs/pntp-2026`.

## Mensagens de commit

Usamos o [Conventional Commits 1.0](https://www.conventionalcommits.org/pt-br/v1.0.0/), em português:

```
<tipo>(<escopo opcional>): <descrição>
```

- **Tipos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Escopos sugeridos:** `api`, `web`, `shared`, `catalog`, `docs`, `db`, `evaluator`, `report`.
- Descrição no imperativo, em minúsculas, sem ponto final, com até ~72 caracteres.
- Mudança incompatível: `!` após o tipo/escopo e rodapé `BREAKING CHANGE: …`.
- No corpo, descreva o que mudou e **como foi verificado**.

Exemplos:

```
fix(catalog): corrige título do item 25.5 para Ata de Eleição
feat(web): exibe selo de ambiente no resultado
docs: adiciona guia de contribuição
```

## Checklist antes do pull request

- [ ] Alteração de matriz? O `.md` foi editado, `pnpm catalog` foi rodado e o `catalog.json` foi incluído.
- [ ] `pnpm typecheck` e `pnpm test` passam.
- [ ] `docs/avaliador.md` foi atualizado, se o comportamento mudou.
- [ ] Há teste novo para bug corrigido ou regra nova.
- [ ] Nenhum arquivo gerado, binário ou segredo foi adicionado sem necessidade (`.env`, `apps/api/data/`,
      `apps/api/.browser/`, o zip do navegador).
- [ ] A mensagem de commit segue o padrão acima.

## Segurança

Não publique credenciais, dados pessoais de portais ou o banco SQLite nas issues e nos pull requests. Para
relatar uma vulnerabilidade, descreva a classe do problema e entre em contato com o responsável pelo projeto
antes de divulgá-la publicamente.

## Conduta

Trate as pessoas com respeito nas issues, nos pull requests e nas revisões. O repositório ainda não tem um arquivo
de licença; antes de uma distribuição aberta, o responsável pelo projeto deve defini-la.
