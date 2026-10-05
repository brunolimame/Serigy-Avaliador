# 17. Emendas Parlamentares

 

| Dimensão | Atributo | Valor | 
| Emendas Parlamentares | serigySchema | https://serigy.tce.se.gov.br/executivo/emendas-parlamentares.html |
 **Caminho URL:**[Portal da Transparencia]/EmendasParlamentares 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 17.1 | 17.1, 17.2 | A origem dos recursos da emenda (federal, estadual ou municipal) | origem | Texto | 
| 17.2 | 17.1, 17.2 | A forma de repasse (transferência especial, fundo a fundo, convênio etc) | formaRepasse | Texto | 
| 17.3 | 17.1, 17.2 | O tipo da emenda (individual, bancada, comissão etc) | tipoEmenda | Texto | 
| 17.4 | 17.1, 17.2 | Número de identificação da emenda | numeroEmenda | Numérico | 
| 17.5 | 17.1, 17.2 | Autoria da emenda (parlamentar, bancada ou comissão) | autorEmenda | Texto | 
| 17.6 | 17.1, 17.2 | Valor previsto do repasse | valorPrevisto | Monetário | 
| 17.7 | 17.1, 17.2 | Valor efetivamente repassado | valorRealizado | Monetário | 
| 17.8 | 17.1, 17.2 | Objeto ou finalidade da emenda | objetoEmenda | Texto | 
| 17.9 | 17.1, 17.2 | Função de governo relacionada | funcaoEmenda | Texto | 
| 17.10 | 17.1, 17.2 | Número do convênio, contrato de repasse ou instrumento equivalente | numeroInstrumento | Texto | 
| 17.11 | 17.1, 17.2 | Plano de trabalho ou cronograma de execução da emenda | cronogramaExecucao | Texto/Link | 
| 17.12 | 17.3 | Beneficiário ou credor do pagamento | beneficiarioDespesa | Texto | 
| 17.13 | 17.3 | Descrição da despesa realizada | descricaoDespesa | Texto | 
| 17.14 | 17.3 | Número do empenho | numeroEmpenho | Texto | 
| 17.15 | 17.3 | Valor empenhado | valorEmpenhado | Monetário | 
| 17.16 | 17.3 | Valor liquidado | valorLiquidado | Monetário | 
| 17.17 | 17.3 | Valor pago | valorPago | Monetário | 
| 17.18 | 17.1, 17.2, 17.3 | Ferramenta de pesquisa | filtroPesquisa | N/A | 
| 17.19 | 17.1, 17.2, 17.3 | Gravação de relatórios em diversos formatos | salvarRelatorio | N/A | 
| 17.20 | 17.1, 17.2, 17.3 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 17.21 | 17.1, 17.2, 17.3 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | Ano |
 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa de **Emendas Parlamentares**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/emendas-parlamentares.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="reset" serigyClearForm>Limpar Filtros</button>
    <button type="submit" serigyExecuteWaitSection="emendaTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição de componente de formatos para exportação:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/emendas-parlamentares.html">
    Salvar em:
    <a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>
    <a serigyItem="salvarRelatorio" serigyValue="xls">XLS</a>
    <a serigyItem="salvarRelatorio" serigyValue="xlsx">XLSX</a>
    <a serigyItem="salvarRelatorio" serigyValue="ods">ODS</a>
    <a serigyItem="salvarRelatorio" serigyValue="csv">CSV</a>
    <a serigyItem="salvarRelatorio" serigyValue="json">JSON</a>
</div>
```

### Código HTML para exibição da pesquisa de **Emendas Parlamentares**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/emendas-parlamentares.html" serigyLoadSection="emendaTabela">
    <thead>
        <tr>
            <th>Origem</th>
            <th>Tipo</th>
            <th>Autor</th>
            <th>Nº Emenda</th>
            <th>Função</th>
            <th>Detalhes</th>
        </tr>
    </thead>
    <tbody>
        <tr>~
            <!-- Outras seções HTML podem existir internamente -->
            <td serigyItem="origem">Federal</td>
            <td serigyItem="tipoEmenda">Individual</td>
            <td serigyItem="autorEmenda">Fábio Reis</td>
            <td serigyItem="numeroEmenda">40950003</td>
            <td serigyItem="funcaoEmenda">Saúde</td>
            <td serigyExecuteWaitSection="detalhe_123">+</td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição de detalhe das **Emendas Parlamentares**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/emendas-parlamentares.html" serigyLoadSection="detalhe_123">
    <thead>
        <tr>
            <th>Forma de repasse</th>
            <th>Objeto</th>
            <th>Valor Previsto</th>
            <th>Valor Repassado</th>
            <th>Instrumento</th>
            <th>Cronograma</th>
            <th>Execução</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <!-- Outras seções HTML podem existir internamente -->
            <td serigyItem="formaRepasse">Transferência especial</td>
            <td serigyItem="objetoEmenda">Construção de unidade de saúde</td>
            <td serigyItem="valorPrevisto">R$ 1.000.000,00</td>
            <td serigyItem="valorRealizado">R$ 800.000,00</td>
            <td serigyItem="numeroInstrumento">Convênio 123/2026</td>
            <td serigyItem="cronogramaExecucao">Jan/2026 a Dez/2026</td>
            <td serigyExecuteWaitSection="execucao_40950003">Ver Execução</td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição da **Execução da Emenda**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/emendas-parlamentares.html" serigyLoadSection="execucao_40950003">
    <thead>
        <tr>
            <th>Beneficiário</th>
            <th>Descrição</th>
            <th>Empenho</th>
            <th>Empenhado</th>
            <th>Liquidado</th>
            <th>Pago</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <!-- Outras seções HTML podem existir internamente -->
            <td serigyItem="beneficiarioDespesa">Empresa XYZ Ltda</td>
            <td serigyItem="descricaoDespesa">Construção de ala hospitalar</td>
            <td serigyItem="numeroEmpenho">2026NE000123</td>
            <td serigyItem="valorEmpenhado">R$ 500.000,00</td>
            <td serigyItem="valorLiquidado">R$ 400.000,00</td>
            <td serigyItem="valorPago">R$ 350.000,00</td>
        </tr>
    </tbody>
</table>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/emendas-parlamentares.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>24/04/2026</b> com dados até <b>23/04/2026</b>
</div>
```
