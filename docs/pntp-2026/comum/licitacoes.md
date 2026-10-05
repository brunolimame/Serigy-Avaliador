# 8. Licitações

 

| Dimensão | Atributo | Valor | 
| Licitações | serigySchema | https://serigy.tce.se.gov.br/comum/licitacoes.html |
 

## 8.1. Licitações

 **Caminho URL:**[Portal da Transparencia]/Licitacoes 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 8.1.1 | 8.1 | Modalidade licitatória | modalidadeLicitacao | Texto | 
| 8.1.2 | 8.1 | Descrição do objeto | objetoLicitacao | Texto | 
| 8.1.3 | 8.1 | Data da sessão de abertura da licitação | dataLicitacao | Texto | 
| 8.1.4 | 8.1 | Valor estimado ou homologado | valorLicitacao | Número | 
| 8.1.5 | 8.1 | Informação acerca da situação do certame | faseLicitacao | Texto | 
| 8.1.6 | 8.2 | Editais de licitação | editalLicitacao | Anexo | 
| 8.1.7 | 8.3 | Demais documentos das fases interna e externa das licitações (termo de referência/projeto básico, justificativa da licitação, pareceres técnicos/jurídicos, ...) | docFasesLicitacao | Anexo | 
| 8.1.8 | 8.4 | Principais documentos dos processos de dispensa e inexigibilidade de licitação (justificativa da escolha do fornecedor e preço, ato de homologação/ratificação da autoridade superior, ...) | docDispensaLicitacao | Anexo | 
| 8.1.9 | 8.5 | Atas de Adesão – SRP | atasLicitacao | - | 
| 8.1.10 | 8.1, 8.2, 8.3, 8.4, 8.5 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 8.1.11 | 8.1 | Gravação de relatórios em diversos formatos | salvarRelatorio | N/A | 
| 8.1.12 | 8.1, 8.2, 8.3, 8.4, 8.5 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 8.1.13 | 8.1, 8.2, 8.3, 8.4, 8.5 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |
 

## 8.2. Plano de Contratações Anual

 **Caminho URL:**[Portal da Transparencia]/Licitacoes/PlanoAnualContratacoes 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 8.2.1 | 8.6 | Plano de contratações anual (art. 12, VII, da Lei n. 14.133) | contratacoesAnual | - | 
| 8.2.2 | 8.6 | Informações atualizadas | dataUltimaAtualizacao | Data |
 

**ℹ️ Obs.:** Todos os itens que correspondem ao critério 8.6 não se aplicam às Estatais

 

## 8.3. Sanções

 **Caminho URL:**[Portal da Transparencia]/Licitacoes/Sancoes 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 8.3.1 | 8.7 | Nome dos licitante e/ou contratado sancionado administrativamente pela Unidade | nomeSancionado | Texto | 
| 8.3.2 | 8.7 | CNPJ/CPF do licitante e/ou contratado sancionado administrativamente pela Unidade | idSancionado | Texto | 
| 8.3.3 | 8.7 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 8.3.4 | 8.7 | Gravação de relatórios em diversos formatos | salvarRelatorio | N/A | 
| 8.3.5 | 8.7 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 8.3.6 | 8.7 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |
 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa de processo licitatório:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/licitacoes.html" serigyItem="filtroPesquisa">
  <!-- Outras seções HTML podem existir internamente -->
  <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
    <option serigyValue="2026">2026</option>
    <option serigyValue="2025">2025</option>
    <option serigyValue="2024">2024</option>
  </select>
  <button type="reset" serigyClearForm>Limpar Filtros</button>
  <button type="submit" serigyExecuteWaitSection="processoLicitatorioTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição de componente de formatos para exportação:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/licitacoes.html">
  Salvar em:
  <a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>
  <a serigyItem="salvarRelatorio" serigyValue="xls">XLS</a>
  <a serigyItem="salvarRelatorio" serigyValue="xlsx">XLSX</a>
  <a serigyItem="salvarRelatorio" serigyValue="ods">ODS</a>
  <a serigyItem="salvarRelatorio" serigyValue="csv">CSV</a>
  <a serigyItem="salvarRelatorio" serigyValue="json">JSON</a>
</div>
```

### Código HTML para exibição da pesquisa de **Processo Licitatório**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/licitacoes.html" serigyLoadSection="processoLicitatorioTabela">
  <thead>
    <tr>
      <th>Modalidade</th>
      <th>Objeto</th>
      <th>Abertura</th>
      <th>Valor do Processo Licitatório</th>
      <th>Fase do Processo Licitatório</th>
      <th >-</th>
    </tr>
  </thead>
  <!-- Dados referentes a certa linha da tabela -->
  <tbody>
    <tr>
      <td serigyItem="modalidadeLicitacao">Pregão Eletrônico</td>
      <td serigyItem="objetoLicitacao">Contratação de empresa ...</td>
      <td serigyItem="dataLicitacao">05/05/2025</td>
      <td serigyItem="valorLicitacao">R$84.033.234,00</td>
      <td serigyItem="faseLicitacao">Em Andamento</td>
      <td serigyExecuteWaitSection="detalhesLicitacao_102930_2022">
        <button>Ver Detalhes</button>
      </td>
    </tr>
  </tbody>
</table>
```

### Código HTML para exibição de **detalhes da licitacao**:

 

```
<span serigySchema="https://serigy.tce.se.gov.br/comum/licitacoes.html" serigyLoadSection="detalhesLicitacao_102930_2022">
  <ul>
    <li serigyItem="editalLicitacao">
      <a href="arquivos/edital_licitacao.pdf">Edital</a>
    </li>
    <li serigyItem="docFasesLicitacao">
      <a href="arquivos/fases_licitacao.pdf">Fases interna e externa</a>
    </li>
    <li serigyItem="docDispensaLicitacao">
      <a href="arquivos/dispensa_licitacao.pdf">Processos de dispensa e inexigibilidade</a>
    </li>
    <li serigyItem="atasLicitacao">
      <a href="arquivos/atas_licitacao.pdf">Atas de adesão</a>
    </li>
  </ul>
</span>
```

### Código HTML para exibição da pesquisa de **Plano de Contratações**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/licitacoes.html" serigyLoadSection="planoContratacoesTabela">
  <thead>
    <tr>
      <th>Ano</th>
      <th>Anexo</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <!-- Dados referentes a certa linha da tabela -->
      <td>2026</td>
      <td serigyItem="contratacoesAnual">
        <a href="arquivos/contratacoes_anual.pdf">Plano de contratações 2026</a>
      </td>
    </tr>
  </tbody>
</table>
```

### Código HTML para exibição da pesquisa de **Processo Licitatório** sem registros:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/licitacoes.html" serigyLoadSection="processoLicitatorioTabela">
  <thead>
    <tr>
      <th>Valor do Processo Licitatório</th>
      <th>Fase do Processo Licitatório</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <!-- Dados referentes a certa linha da tabela -->
      <td serigyEmpty="Motivo de não existir conteúdo" serigyItem="valorLicitacao">-</td>
      <td serigyEmpty="Motivo de não existir conteúdo" serigyItem="faseLicitacao">-</td>
    </tr>
  </tbody>
</table>
```

### Código HTML para exibição da pesquisa de **Sanções**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/licitacoes.html" serigyLoadSection="sancoesTabela">
  <thead>
    <tr>
      <th>Nome</th>
      <th>CNPJ/CPF</th>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="nomeSancionado">Empresa C</td>
      <td serigyItem="idSancionado">123.456.0001-78</td>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </tbody>
</table>
```

### Em caso de carregamento de informações via iframe:

 

```
<iframe serigySchema="https://serigy.tce.se.gov.br/comum/licitacoes.html" serigyLink="[url_alvo]" src="[url_alvo]">
</iframe>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/licitacoes.html" serigyItem="dataUltimaAtualizacao">
  Conjunto de informações atualizado em <b>16/04/2026</b> com dados até <b>16/04/2026</b>.
</div>
```
