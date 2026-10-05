# 3. Receitas

 

| Dimensão | Atributo | Valor | 
| Receitas | serigySchema | https://serigy.tce.se.gov.br/executivo/receitas.html |
 

## 3.1. Prevista e Arrecadada

 **Caminho URL:**[Portal da Transparencia]/Receitas/PrevistaArrecada 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 3.1.10 | 3.2 | Código da natureza de receita | naturezaReceita | Número |
 

## 3.2. Dívida Ativa

 **Caminho URL:**[Portal da Transparencia]/Receitas/DividaAtiva 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 3.2.1 | 3.3 | Identificação do inscrito (CPF ou CNPJ) | identificaInscrito | Número | 
| 3.2.2 | 3.3 | Nome do inscrito | nomeInscrito | Texto | 
| 3.2.3 | 3.3 | Valor total da dívida | valorDivida | Monetário | 
| 3.2.4 | 3.3 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A | 
| 3.2.5 | 3.3 | Gravação de relatórios em diferentes formatos do resultados da receita | salvarRelatorio | N/A | 
| 3.2.6 | 3.3 | Informações atualizadas em relação aos critérios da receita | dataUltimaAtualizacao | Data | 
| 3.2.7 | 3.3 | Histórico (dos últimos 3 anos) das Informações atualizadas em relação aos critérios da receita | historicoExercicio | N/A |
 

## Exemplos

 

### Código HTML para exibição da pesquisa de **Receita**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/receitas.html" serigyLoadSection="dividaAtivaTabela">
    <thead>
        <tr>
            <th>Código da Natureza de Receita</th>
            <!-- Demais serigyItem em Comum/Receitas -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigySchema="https://serigy.tce.se.gov.br/executivo/receitas.html" serigyItem="naturezaReceita">
                13210101 - Remuneração de Depósitos Bancários - Principal
            </td>
            <!-- Demais serigyItem em Comum/Receitas -->
        </tr>
    </tbody>
</table>
```

### Código HTML de exemplo para componente de pesquisa de **Dívida Ativa**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/receitas.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
     <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="submit" serigyExecuteWaitSection="dividaAtivaTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição da pesquisa de **Dívida Ativa**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/receitas.html" serigyLoadSection="dividaAtivaTabela">
  <!-- Cabeçalho da tabela -->
  <thead>
    <th>CPF/CNPJ:</th>
    <th>Nome:</th>
    <th>Valor:</th>
  </thead>
  <!-- Dados referentes a certa linha da tabela -->
  <tbody>
    <td serigyItem="identificaInscrito">123.456.789-00</td>
    <td serigyItem="nomeInscrito">Luiz Gonzaga do Nascimento</td>
    <td serigyItem="valorDivida">R$ 1.000,00</td>
  </tbody>
</table>
```

### Em caso de carregamento de informações via iframe:

 

```
<iframe serigySchema="https://serigy.tce.se.gov.br/executivo/receitas.html" serigyLink="[url_alvo]" src="[url_alvo]">
</iframe>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/receitas.html" serigyItem="dataUltimaAtualizacao">
     Conjunto de informações atualizado em <b>31/03/2026</b> com dados até <b>30/03/2026</b>
</div>
```
