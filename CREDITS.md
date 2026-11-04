# Créditos

## Autoria

- **Bruno Lima** — desenvolvimento e manutenção do Avaliador Serigy (PNTP 2026). GitHub: <https://github.com/brunolimame>

O histórico completo de contribuições está nos commits do repositório. Quem contribuir por meio de pull request
aparece ali, e a forma de contribuir está descrita em [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Origem da matriz de requisitos

A pasta [`docs/pntp-2026`](docs/pntp-2026/README.md) reproduz a **matriz de requisitos PNTP 2026**, publicada no
portal Serigy do **TCE-SE** (<https://serigy.tce.se.gov.br/>) e de responsabilidade do **TCE-SE** e da **ATRICON**.
Os direitos sobre esse conteúdo pertencem a essas instituições. A licença MIT deste projeto cobre o código, não a matriz.

Erros encontrados na documentação oficial devem ser comunicados ao TCE-SE; este projeto não os corrige.

## Bibliotecas e ferramentas principais

Backend (`apps/api`):

- [Express](https://expressjs.com/), [cheerio](https://cheerio.js.org/), [zod](https://zod.dev/),
  [playwright-core](https://playwright.dev/) e [extract-zip](https://github.com/maxogden/extract-zip)
- Navegador headless: Chrome for Testing (`chrome-headless-shell`), usado pelo `playwright-core`
- Testes com [vitest](https://vitest.dev/) e execução de TypeScript com [tsx](https://tsx.is/)

Interface (`apps/web`):

- [React](https://react.dev/), [Vite](https://vite.dev/) e [Tailwind CSS](https://tailwindcss.com/)
- Componentes [shadcn/ui](https://ui.shadcn.com/) (estilo `base-nova`, com [Base UI](https://base-ui.com/)) e ícones [lucide](https://lucide.dev/)

Agradecemos a todos os mantenedores desses projetos.

## Licença

O código deste projeto é distribuído sob a [licença MIT](LICENSE).
