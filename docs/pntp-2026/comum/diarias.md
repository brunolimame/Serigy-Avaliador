# 7. Diárias

 

| Dimensão | Atributo | Valor | 
| Diárias | serigySchema | https://serigy.tce.se.gov.br/comum/diarias.html |
 

## 7.1. Relação de Diárias

 **Caminho URL:**[Portal da Transparencia]/Diarias/Relacao 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 7.1.1 | 7.1 | Nome do beneficiário | nomeBeneficiario | Texto | 
| 7.1.2 | 7.1 | Cargo do beneficiário | cargoBeneficiario | Texto | 
| 7.1.3 | 7.1 | Número de diárias usufruídas por afastamento | numeroDiaria | Numérico | 
| 7.1.4 | 7.1 | Período Inicial de afastamento | dataInicioAfastamento | Data | 
| 7.1.5 | 7.1 | Período Final de afastamento | dataFimAfastamento | Data | 
| 7.1.6 | 7.1 | Motivo do afastamento | motivoAfastamento | Texto | 
| 7.1.7 | 7.1 | Local de destino | localDestino | Texto | 
| 7.1.8 | 7.1 | Valor Total | valorTotal | Monetário | 
| 7.1.9 | 7.1 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 7.1.10 | 7.1 | Histórico (dos últimos 3 anos) das Informações atualizadas | historicoExercicio | N/A | 
| 7.1.11 | 7.1 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A | 
| 7.1.12 | 7.1 | Gravação de relatórios em diferentes formatos do resultados da Diária | salvarRelatorio | N/A |
 

## 7.2. Valores Diária

 **Caminho URL:**[Portal da Transparencia]/Diarias/TabelaValores 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 7.2.1 | 7.2 | Valores das diárias dentro do Estado | valorEstadual | Numérico | 
| 7.2.2 | 7.2 | Valores das diárias nacionalmente | valorNacional | Numérico | 
| 7.2.3 | 7.2 | Valores das diárias internacionalmente | valorInternacional | Numérico | 
| 7.2.4 | 7.2 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 7.2.5 | 7.2 | Histórico (dos últimos 3 anos) das Informações atualizadas | historicoExercicio | N/A | 
| 7.2.6 | 7.2 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
 

## Exemplos

 

### Código HTML para exibição da pesquisa de diárias:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/diarias.html" serigyItem="filtroPesquisa">  
    <!-- Outras seções HTML podem existir internamente -->
    <button type="submit" serigyExecuteWaitSection="diariasTabela">Pesquisar</button>
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <a serigyItem="salvarRelatorio" serigyValue="pdf">Salvar em PDF</a>
</div>
```

### Código HTML para exibição da pesquisa de diárias:

 

```
<table serigyLoadSection="diariasTabela" serigySchema="https://serigy.tce.se.gov.br/comum/diarias.html">
    <thead>
        <tr>
            <th>Nome do beneficiário</th>      
            <th>Cargo do beneficiário</th>      
            <th>Número de diárias usufruídas por afastamento</th>      
            <th>Período Inicial de afastamento</th>      
            <th>Período Final de afastamento</th>      
            <th>Motivo do afastamento</th>      
            <th>Local de destino</th>      
            <th>Valor Total</th>      
            <th>Detalhes</th>      
        </tr>
    </thead>
    <tbody>
        <!-- Dados referentes a certa linha da tabela -->
        <tr>
            <td serigyItem="nomeBeneficiario">José Mário Silva Mascarenhas</td>
            <td serigyItem="cargoBeneficiario">Secretário Municipal da Fazenda</td>
            <td serigyItem="numeroDiaria">4</td>
            <td serigyItem="dataInicioAfastamento">12/03/2023</td>
            <td serigyItem="dataFimAfastamento">15/03/2023</td>
            <td serigyItem="motivoAfastamento">Acompanhamento do prefeito em realização de audiências.</td>
            <td serigyItem="localDestino">Brasília</td>
            <td serigyItem="valorTotal">R$ 4.800,00</td>
            <td serigyExecuteWaitSection="detalhesItem_102930_2022">
                <button>Ver Detalhes</button>
            </td>
        </tr>
    </tbody>
</table>
```

### Código para seção de exemplo de tablea que explicite os valores das diárias:

 

```
<table serigyLoadSection="tabelaValores" serigySchema="https://serigy.tce.se.gov.br/comum/diarias.html">
    <thead>
        <tr>       
            <th>ESTADUAL</th>
            <th>NACIONAL</th>
            <th>INTERNACIONAL</th>
        </tr>
    </thead>
    <tbody>
        <tr>       
            <td serigyItem="valorEstadual">R$ 444,75</td>
            <td serigyItem="valorNacional">R$ 562,49</td>
            <td serigyItem="valorInternacional">US$ 400,00</td>
        </tr>       
    </tbody>
</table>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/diarias.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>16/04/2026</b> com dados até <b>15/04/2026</b>
</div>
```
