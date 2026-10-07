# DISTRIBUICAO.md — decisões, escopo e plano de distribuição

Registro das decisões tomadas com o responsável pelo projeto e do plano para distribuir o **Avaliador Serigy (PNTP 2026)**
como aplicativo de desktop. Atualizado em 07/10/2026.

> **Estado atual: o projeto roda apenas localmente** (`pnpm dev` / `pnpm start`, API em `127.0.0.1`). As adaptações para
> o Electron ficam para uma **etapa futura** (seção 6); nada de Electron foi implementado.

## 1. Decisões

| Tema | Decisão |
| --- | --- |
| Plataformas-alvo | Windows, Linux e macOS. |
| Configurações | Gerais para a aplicação (não por portal). Ficam no SQLite. |
| Salvar avaliação | Botão manual; salva o resultado atual; **só avaliação completa** (`scope.mode === 'todos'`). |
| Histórico | Sem limite de quantidade. Ações: apagar uma, apagar todo o histórico, restaurar configurações. |
| Importação | **Somente JSON** (Markdown não é importado), com validação estrita do arquivo. |
| Avaliação importada | Abre com data/hora e todos os detalhes como uma normal, mas **sem Reavaliar item/grupo** (somente leitura). |
| Duplicata (mesmo hash) | A UI avisa e oferece abrir a existente (API: HTTP 409 com `id`). |
| Portal importado não cadastrado | A UI oferece cadastrar. |
| Autenticidade/assinatura | O hash só detecta corrupção/edição acidental, **não prova autoria**. Assinatura digital: opção futura. |
| Máx. de páginas `serigyLink` | Padrão **40**; configurável em Configurações › Comportamento; no formulário aparece em "Extras" (valor inicial = configuração; vale só para aquela avaliação). |
| "Abrir as páginas em um navegador" | Foi para Configurações › Comportamento (junto da grafia da documentação). |
| Cadastro de portais | Foi para Configurações › Portais. |
| API em Go | Descartada (reescrever avaliador/parser/Playwright não compensa). |
| Distribuição desktop | Electron — futura; só documentada aqui. |
| Proteção do código/créditos | Estratégia realista na seção 7; implementar junto do Electron. |

## 2. Escopo já implementado (itens 1 a 4)

1. **Layout em 2 colunas (estilo CRM):** esquerda com abas "Nova avaliação" e "Histórico"; direita com o resultado e a barra de
   estatísticas/progresso fixa no topo. Coluna única em telas estreitas.
2. **Configurações estilo VS Code:** janela com categorias (Portais, Comportamento, Histórico), atalho **Ctrl+,** / **Cmd+,**,
   indicador "modificada", restaurar por item e "Restaurar configurações" (todas).
3. **Histórico + exportação:** salvar, listar, abrir (somente leitura), exportar JSON (importável) e relatório Markdown, apagar.
4. **Importação de JSON** com validação (seção 4).

Detalhes técnicos: `docs/avaliador.md` (seções "Configurações gerais", "Histórico, exportação e importação").

## 3. Modelo de dados e API

SQLite (`node:sqlite`, `PRAGMA user_version`). Migrações publicadas nunca são alteradas; acrescenta-se uma nova.

- v1 `portais` · v2 coluna `ambiente` · **v3 `configuracoes(chave PK, valor, atualizado_em)`** ·
  **v4 `avaliacoes`** (resumo em colunas, `hash` UNIQUE, `payload` gzip do resultado, `catalogo_gerado_em`, `origem` local/importada).
- Rotas novas: `/api/configuracoes` (GET/PUT/DELETE), `/api/avaliacoes` (GET/POST/DELETE), `/api/avaliacoes/:id` (GET/DELETE),
  `/api/avaliacoes/:id/exportar?formato=json|md`, `POST /api/avaliacoes/exportar`, `POST /api/avaliacoes/importar`.
- Erros HTTP tipados por `HttpError` (`apps/api/src/errors.ts`): corpo `{ error, ...extra }` (ex.: `id` da duplicata, `problemas`).
- Testes usam banco em memória (`apps/api/vitest.config.ts`); nunca tocam `apps/api/data/avaliador.sqlite`.

## 4. Formato de exportação e validação da importação

Envelope `serigy-avaliacao`, versão 1: `{ formato, versao, exportadoEm, app{nome,versao}, catalogo{geradoEm}, hash, resultado }`.
O `hash` é o SHA-256 do **JSON canônico** (chaves ordenadas) do `resultado`.

Ordem de validação na importação (falhou = 400 com `problemas[]`):

1. estrutura do envelope, sem chaves desconhecidas; 2. `formato`; 3. `versao` (arquivo mais novo que o app é recusado);
4. `resultado` com zod estrito (tipos, enums, tamanhos, URLs http(s), ids) e consistência (escopo completo, datas, contagens,
ids únicos, `summary` recalculado); 5. conferência do `hash`.

O conteúdo importado nunca é interpretado como HTML ou código. Corpo JSON aceito: até 30 MB.

## 5. Pesquisa sobre Electron (documentação oficial, out/2026)

Itens que o responsável pediu para verificar:

- **Chromium do Electron** (ponto 8): o Electron traz seu próprio Chromium e Node. Playwright com `_electron` é
  **experimental** e o CDP expõe só parte do Playwright (baixa fidelidade). A alternativa é controlar páginas pelo
  `webContents.debugger` (CDP) do próprio Electron. **Decisão provisória:** manter o `chrome-headless-shell` em
  `extraResources` por sistema operacional (como hoje em `apps/api/.browser`), pois o avaliador já funciona com ele.
  Fazer um **spike** antes de decidir trocar.
- **`node:sqlite`** (ponto 9): disponível no Node embutido do Electron a partir da **versão 35**; a versão atual atende.
- **Política de suporte:** o Electron mantém as **3 últimas versões principais**. Hoje a atual é a 44; a 45 sai em 20/10/2026.
  Planejar atualização periódica.
- **Fuses e ASAR:** fuses permitem desligar recursos (ex.: `RunAsNode`, inspeção) no binário. A validação de integridade do
  ASAR existe só no macOS e no Windows (Linux não).
- **Instaladores:** Windows (NSIS/MSI), Linux (AppImage/deb/rpm), macOS (dmg/zip), via Electron Forge ou electron-builder.
- **Assinatura de código:** necessária para evitar avisos (Windows SmartScreen; macOS exige assinatura e notarização).
  **Atualização automática:** só com binário assinado e canal de distribuição definido.

## 6. Etapa futura: adaptações para o Electron

Ordem sugerida:

1. **Spike do navegador:** comparar `chrome-headless-shell` em `extraResources` × `webContents.debugger`.
2. **Processo principal:** subir a API (`createApp`) no mesmo processo, em `127.0.0.1` e **porta livre aleatória**, e abrir uma
   `BrowserWindow` com a UI; sem expor a porta fora da máquina.
3. **Dados:** banco em `app.getPath('userData')` (via `DATABASE_PATH`), nunca dentro do pacote.
4. **Empacotamento:** UI compilada (`apps/web/dist`) e API no pacote; navegador em `extraResources` por SO.
5. **Instaladores** para Windows, Linux e macOS; assinatura e (macOS) notarização.
6. **Auto-update** (depende de certificado e canal).
7. **Proteção** (seção 7).

Pendências abertas: nome definitivo deste arquivo (este é `DISTRIBUICAO.md`), certificado de assinatura, canal de atualização e
resultado do spike do Chromium.

## 7. Proteção do código e dos créditos

Objetivo do responsável: dificultar ao máximo que o software seja replicado e modificado, mantendo os créditos do desenvolvimento.
**Não existe imunidade:** código que roda na máquina do usuário pode, com esforço, ser analisado. Só mantendo o código no servidor ele
fica fora da máquina (o que contraria a natureza local do aplicativo). O que se faz é **aumentar o custo** e **documentar a autoria**:

- Empacotar e **minificar** (UI e API); sem source maps no pacote; **bytecode** opcional (ex.: V8 snapshot) para a API.
- **ASAR** com validação de integridade (macOS/Windows) e **fuses** (desligar `RunAsNode`, inspeção/devtools em produção).
- **Assinatura de código** dos instaladores e binários (detecta binário alterado).
- **Licença e copyright** claros (titular, termos de uso); aviso de direitos no pacote.
- Tela **"Sobre"** com créditos e versão; marca (nome/versão) nos arquivos exportados (já em `app` do envelope).
- **Aviso de adulteração**: verificar a integridade ao iniciar e avisar.
- Limite honesto: nada disso impede um engenheiro reverso determinado; serve de barreira e de prova de autoria.

## 8. Opções futuras

Assinatura digital das avaliações exportadas · importação de Markdown (hoje não) · Docker/servidor · comparação entre avaliações do
histórico · tela "Sobre" e verificação de integridade.
