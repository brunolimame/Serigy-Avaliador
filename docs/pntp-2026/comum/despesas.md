# 4. Despesas

 

| Dimensão | Atributo | Valor | 
| Despesas | serigySchema | https://serigy.tce.se.gov.br/comum/despesas.html |
 

## 4.1. Despesas Comum

 **Caminho URL:** [Portal da Transparencia]/Despesas 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 4.1.1 | 4.1, 4.3 | Total da despesa empenhada | valorEmpenhado | Monetário | 
| 4.1.2 | 4.1 | Total da despesa liquidada | valorLiquidado | Monetário | 
| 4.1.3 | 4.1 | Total da despesa paga | valorPago | Monetário | 
| 4.1.4 | 4.2 | Unidade orçamentária da Classificação orçamentária | unidadeDespesa | Texto | 
| 4.1.5 | 4.2 | Função da Classificação orçamentária | funcaoDespesa | Texto \| Numérico | 
| 4.1.6 | 4.2 | Subfunção da Classificação orçamentária | subFuncaoDespesa | Texto \| Numérico | 
| 4.1.7 | 4.2 | Categoria econômica da Classificação orçamentária | categoriaDespesa | Texto \| Numérico | 
| 4.1.8 | 4.2 | Grupo da Classificação orçamentária | grupoDespesa | Texto \| Numérico | 
| 4.1.9 | 4.2 | Elemento de despesa da Classificação orçamentária | elementoDespesa | Texto \| Numérico | 
| 4.1.10 | 4.2 | Fonte dos recursos da Classificação orçamentária | fonteRecursosDespesa | Texto \| Numérico | 
| 4.1.11 | 4.3 | Pessoa física ou jurídica beneficiária dos pagamentos ou credor | credorEmpenho | Nome | 
| 4.1.12 | 4.3 | Bem fornecido ou serviço prestado | objetoEmpenho | Texto | 
| 4.1.13 | 4.3 | Modalidade | modalidadeEmpenho | Texto | 
| 4.1.14 | 4.3 | Número do procedimento licitatório (ou dispensa e inexigibilidade, ou a fundamentação no caso de despesas de pequena monta) | numeroProcedimento | Numérico | 
| 4.1.15 | 4.1, 4.2, 4.3 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A | 
| 4.1.16 | 4.1, 4.2, 4.3 | Gravação de relatórios em diferentes formatos do resultados da despesa | salvarRelatorio | N/A | 
| 4.1.17 | 4.1, 4.2, 4.3 | Informações atualizadas em relação aos critérios da despesa | dataUltimaAtualizacao | Data | 
| 4.1.18 | 4.1, 4.2, 4.3 | Histórico (dos últimos 3 anos) das Informações atualizadas em relação aos critérios da despesa | historicoExercicio | N/A |
 

**ℹ️ Obs.:** Todos os itens que correspondem aos critérios 4.1, 4.2 e 4.3 não se aplicam às Estatais Independentes

 

## Exemplos

 

### Código HTML para pesquisa de despesas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/despesas.html" serigyItem="filtroPesquisa">  
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="submit" serigyExecuteWaitSection="despesasTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição de componente de formatos para exportação:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/despesas.html">
    Salvar em:
    <a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>
    <a serigyItem="salvarRelatorio" serigyValue="xls">XLS</a>
    <a serigyItem="salvarRelatorio" serigyValue="xlsx">XLSX</a>
    <a serigyItem="salvarRelatorio" serigyValue="ods">ODS</a>
    <a serigyItem="salvarRelatorio" serigyValue="csv">CSV</a>
    <a serigyItem="salvarRelatorio" serigyValue="json">JSON</a>
</div>
```

### Código HTML para exibição da pesquisa de despesas:

 

```
<table serigyLoadSection="despesasTabela" serigySchema="https://serigy.tce.se.gov.br/comum/despesas.html">
    <thead>
        <tr>
            <!-- Outras linhas da tabela poderão existir -->
            <th>Empenhado (R$)</th>
            <th>Liquidado (R$)</th>
            <th>Pago (R$)</th>
            <th>Detalhes</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <!-- Outras linhas da tabela poderão existir -->
            <td serigyItem="valorEmpenhado">38.000.000,00</td>
            <td serigyItem="valorLiquidado">34.000.000,00</td>
            <td serigyItem="valorPago">25.000.000,00</td>
            <td>
                <button serigyExecuteWaitSection="detalhes_102930_2022">Ver Detalhes</button>
            </td>
        </tr>
    </tbody>
</table>
```

### Seção de Detalhes da Despesa:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/despesas.html" serigyLoadSection="detalhes_102930_2022">
    <thead>
        <tr>
            <th>Unidade Orçamentária</th>
            <th>Função</th>
            <th>Subfunção</th>
            <th>Categoria Econômica</th>
            <th>Grupo</th>
            <th>Elemento de Despesa</th>
            <th>Fonte dos Recursos</th>
            <!-- Outras linhas da tabela poderão existir -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="unidadeDespesa">Secretaria de Estado da Saúde</td>
            <td serigyItem="funcaoDespesa">10 - Saúde</td>
            <td serigyItem="subFuncaoDespesa">122 - Atenção Básica</td>
            <td serigyItem="categoriaDespesa">3 - Despesa Corrente</td>
            <td serigyItem="grupoDespesa">1 - Pessoal e Encargos Sociais</td>
            <td serigyItem="elementoDespesa">319011 - Vencimentos e Vantagens Fixas</td>
            <td serigyItem="fonteRecursosDespesa">100 - Recursos Ordinários</td>
            <!-- Outras linhas da tabela poderão existir -->
        </tr>
    </tbody>
</table>
```

### Seção de mais Detalhes da Despesa:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/despesas.html" serigyLoadSection="detalhes_102930_2022">
    <thead>
        <tr>
            <th>Credor</th>
            <th>Objeto do Contrato</th>
            <th>Modalidade</th>
            <th>Procedimento</th>
            <!-- Outras linhas da tabela poderão existir -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="credorEmpenho">Empresa A</td>
            <td serigyItem="objetoEmpenho">CONTRATAÇÃO DE EMPRESA ESPECIALIZADA ...</td>
            <td serigyItem="modalidadeEmpenho">Concorrência</td>
            <td serigyItem="numeroProcedimento">10/2025</td>
            <!-- Outras linhas da tabela poderão existir -->
        </tr>
    </tbody>
</table>
```

### Em caso de carregamento de informações via iframe:

 

```
<iframe serigySchema="https://serigy.tce.se.gov.br/comum/despesas.html" serigyLink="[url_alvo]" src="[url_alvo]">
</iframe>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/despesas.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizadas em <b>31/03/2026</b> com dados até <b>30/03/2026</b>
</div>
```
