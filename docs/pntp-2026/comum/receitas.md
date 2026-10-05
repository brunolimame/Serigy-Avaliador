# 3. Receitas

 

| Dimensão | Atributo | Valor | 
| Receitas | serigySchema | https://serigy.tce.se.gov.br/comum/receitas.html |
 

## 3.1. Prevista e Arrecadada

 **Caminho URL:**[Portal da Transparencia]/Receitas/PrevistaArrecada 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 3.1.1 | 3.1 | Órgão da receita respectiva | orgaoReceita | Texto | 
| 3.1.2 | 3.1 | Valor previsto da receita | valorPrevistoReceita | Monetário | 
| 3.1.3 | 3.1 | Valor arrecadado da receita | valorArrecadadoReceita | Monetário | 
| 3.1.4 | 3.1 | Data prevista para realização do lançamento da arrecadação/repasse de receita | dataPrevistaReceita | Data | 
| 3.1.5 | 3.1 | Data da realização do lançamento da arrecadação/repasse de receita | dataLancamentoReceita | Data | 
| 3.1.6 | 3.1, 3.2 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A | 
| 3.1.7 | 3.1, 3.2 | Gravação de relatórios em diferentes formatos do resultados da receita | salvarRelatorio | N/A | 
| 3.1.8 | 3.1, 3.2 | Informações atualizadas em relação aos critérios da receita | dataUltimaAtualizacao | Data | 
| 3.1.9 | 3.1, 3.2 | Histórico (dos últimos 3 anos) das Informações atualizadas em relação aos critérios da receita | historicoExercicio | N/A |
 

**ℹ️ Obs.:** Todos os itens que correspondem aos critérios 3.1 e 3.2 não se aplicam às Estatais Independentes

 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa de receita:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/receitas.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <!-- Demais itens, se houverem, dos Específicos -->
    <button type="submit" serigyExecuteWaitSection="receitaTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição de componente de formatos para exportação:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/receitas.html">
    Salvar em:
    <a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>
    <a serigyItem="salvarRelatorio" serigyValue="xls">XLS</a>
    <a serigyItem="salvarRelatorio" serigyValue="xlsx">XLSX</a>
    <a serigyItem="salvarRelatorio" serigyValue="ods">ODS</a>
    <a serigyItem="salvarRelatorio" serigyValue="csv">CSV</a>
    <a serigyItem="salvarRelatorio" serigyValue="json">JSON</a>
</div>
```

### Código HTML para exibição da pesquisa de **Receita**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/receitas.html" serigyLoadSection="receitaTabela">
    <thead>
        <tr>
            <th>Orgão</th>
            <th>Data Prevista de Lançamento</th>
            <th>Montante Previsto</th>
            <th>Data de Lançamento</th>
            <th>Montante Arrecadado</th>
            <!-- Demais itens, se houverem, dos específicos -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="orgaoReceita">Secretaria de Educação</td>
            <td serigyItem="dataPrevistaReceita">04/03/2025</td>
            <td serigyItem="valorPrevistoReceita">R$3.000,00</td>
            <td serigyItem="dataLancamentoReceita">03/03/2025</td>
            <td serigyItem="valorArrecadadoReceita">R$2.701,86</td>
            <!-- Demais itens, se houverem, dos específicos -->
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição da pesquisa de **Receita** em caso de ausência de informação:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/receitas.html" serigyLoadSection="receitaTabela">
    <thead>
        <tr>
            <th>Orgão</th>
            <th>Data Prevista de Lançamento</th>
            <th>Montante Previsto</th>
            <th>Data de Lançamento</th>
            <th>Montante Arrecadado</th>
            <!-- Demais itens, se houverem, dos específicos -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="orgaoReceita">Secretaria de Educação</td>
            <td serigyItem="dataPrevistaReceita">04/03/2050</td>
            <td serigyItem="valorPrevistoReceita">R$3.000,00</td>
            <td serigyItem="dataLancamentoReceita" serigyEmpty="Ainda não foi lançado">-</td>
            <td serigyItem="valorArrecadadoReceita" serigyEmpty="Ainda não foi lançado">-</td>
            <!-- Demais itens, se houverem, dos específicos -->
        </tr>
    </tbody>
</table>
```

### Em caso de carregamento de informações via iframe:

 

```
<iframe serigySchema="https://serigy.tce.se.gov.br/comum/receitas.html" serigyLink="[url_alvo]" src="[url_alvo]">
</iframe>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/receitas.html" serigyItem="dataUltimaAtualizacao">
     Conjunto de informações atualizado em <b>31/03/2026</b> com dados até <b>30/03/2026</b>
</div>
```
