# 9. Contratos

 

| Dimensão | Atributo | Valor | 
| Contratos | serigySchema | https://serigy.tce.se.gov.br/comum/contratos.html |
 

## 9.1. Contratos

 **Caminho URL:**[Portal da Transparencia]/Contratos 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 9.1.1 | 9.1 | Número do Contrato | numeroContrato | Texto | 
| 9.1.2 | 9.1 | Contratado | contratado | Texto | 
| 9.1.3 | 9.1 | Valor | valorContrato | Monetário | 
| 9.1.4 | 9.1 | Objeto | objeto | Texto | 
| 9.1.5 | 9.1 | Início da vigência do contrato | inicioContrato | Data | 
| 9.1.6 | 9.1 | Fim da vigência do contrato | fimContrato | Data | 
| 9.1.7 | 9.1, 9.2 | Link para o Termo Aditivo | termoAditivo | Link \| Arquivo | 
| 9.1.8 | 9.2 | Link para a Íntegra do contrato | linkContrato | Texto | 
| 9.1.9 | 9.1, 9.2 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A | 
| 9.1.10 | 9.1 | Gravação de relatórios em diferentes formatos do resultados dos contratos | salvarRelatorio | N/A | 
| 9.1.11 | 9.1, 9.2 | Informações atualizadas em relação aos critérios dos contratos | dataUltimaAtualizacao | Data | 
| 9.1.12 | 9.1, 9.2 | Histórico (dos últimos 3 anos) das Informações atualizadas em relação aos critérios dos contratos | historicoExercicio | N/A |
 

## 9.2. Gestores

 **Caminho URL:**[Portal da Transparencia]/Contratos/GestoresFiscais 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 9.2.1 | 9.3 | Nome do fiscal/gestor de contrato | fiscalGestor | Texto | 
| 9.2.2 | 9.3 | Indicação dos contratos pelos quais são responsáveis | contratoFiscal | N/A | 
| 9.2.3 | 9.3 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A | 
| 9.2.4 | 9.3 | Gravação de relatórios em diferentes formatos do resultados dos contratos | salvarRelatorio | N/A | 
| 9.2.5 | 9.3 | Informações atualizadas em relação aos critérios dos contratos | dataUltimaAtualizacao | Data | 
| 9.2.6 | 9.3 | Histórico (dos últimos 3 anos) das Informações atualizadas em relação aos critérios dos contratos | historicoExercicio | N/A |
 

## 9.3. Ordem Cronológica

 **Caminho URL:**[Portal da Transparencia]/Contratos/OrdemCronologica 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 9.3.1 | 9.4 | Data de vencimento | dataVencimento | Data | 
| 9.3.2 | 9.4 | Data de pagamento | dataPagamento | Data | 
| 9.3.3 | 9.4 | Nome do credor | credor | Texto | 
| 9.3.4 | 9.4 | Valor do pagamento | valorPagamento | Monetário | 
| 9.3.5 | 9.4 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A | 
| 9.3.6 | 9.4 | Gravação de relatórios em diferentes formatos do resultados dos contratos | salvarRelatorio | N/A | 
| 9.3.7 | 9.4 | Informações atualizadas em relação aos critérios dos contratos | dataUltimaAtualizacao | Data | 
| 9.3.8 | 9.4 | Histórico (dos últimos 3 anos) das Informações atualizadas em relação aos critérios dos contratos | historicoExercicio | N/A |
 

**ℹ️ Obs.:** Todos os itens que correspondem ao critério 9.4 não se aplicam às Estatais

 

## Exemplos

 

### Código HTML para exibição da pesquisa de contratos:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/contratos.html" serigyItem="filtroPesquisa">  
    <!-- Outras seções HTML podem existir internamente -->
    <button type="submit" serigyExecuteWaitSection="contratosTabela">Pesquisar</button>
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <a serigyItem="salvarRelatorio" serigyValue="pdf">Salvar em PDF</a>
</div>
```

### Código HTML para exibição da pesquisa de contratos:

 

```
<table serigyLoadSection="contratosTabela" serigySchema="https://serigy.tce.se.gov.br/comum/contratos.html">
    <thead>
        <tr>
            <th>Número do Contrato</th>
            <th>Contratado</th>
            <th>Valor</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Detalhe</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <!-- Dados referentes a certa linha da tabela -->
            <td serigyItem="numeroContrato">065/2023</td>
            <td serigyItem="contratado">AGC CONSTRUÇÕES E EMPREENDIMENTOS LTDA</td>
            <td serigyItem="valorContrato">535.985,92</td>
            <td serigyItem="inicioContrato">06/03/2023</td>
            <td serigyItem="fimContrato">06/03/2024</td>
            <td serigyExecuteWaitSection="detalhesItem_065_2023">
                <button>Ver Detalhes</button>
            </td>
        </tr>
    </tbody>
</table>
```

### Código para seção de Detalhes do Contrato:

 

```
<table serigyLoadSection="detalhesItem_065_2023" serigySchema="https://serigy.tce.se.gov.br/comum/contratos.html">
    <thead> 
        <tr>
            <th>Objeto</th>
            <th>Íntegra do Contrato</th>
            <th>Termo Aditivo</th>
        </tr>
    </thead>
    <tbody>
        <!-- Dados referentes a certa linha da tabela -->
        <tr>
            <td serigyItem="objeto">O presente instrumento tem por objeto a contratação de empresa especializada em engenharia para executar serviç...</td>
            <td serigyItem="linkContrato">
                <a href="/contrato_102930_2022.pdf">Baixar Contrato</a>
            </td>
            <td serigyItem="termoAditivo">
                <a href="/termoAditivo_102930_2022.pdf">Baixar Termo Aditivo</a>
            </td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição da pesquisa de **Gestores de Contratos**:

 

```
<table serigyLoadSection="fiscaisTabela" serigySchema="https://serigy.tce.se.gov.br/comum/contratos.html">
    <thead>
        <tr>
            <th>Fiscal</th>
            <th>Contrato</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <!-- Dados referentes a certa linha da tabela -->
            <td serigyItem="fiscalGestor">GREGORIO SEBASTIAO MENDES NETO</td>
            <td serigyItem="contratoFiscal">162022/2022</td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição da pesquisa de **Contratos em Ordem Cronológica**:

 

```
<table serigyLoadSection="ordemCronologicaTabela" serigySchema="https://serigy.tce.se.gov.br/comum/contratos.html">
    <thead>
        <tr>
            <th>Credor</th>
            <th>Data do Vencimento</th>
            <th>Data do Pagamento</th>
            <th>Valor Pago</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <!-- Dados referentes a certa linha da tabela -->
            <td serigyItem="credor">Câmara Municipal de Ananás</td>
            <td serigyItem="dataVencimento">04/01/2022</td>
            <td serigyItem="dataPagamento">21/01/2022</td>
            <td serigyItem="valorPagamento">R$ 667,26</td>
        </tr>
    </tbody>
</table>
```

### Em caso de carregamento de informações via iframe:

 

```
<iframe serigySchema="https://serigy.tce.se.gov.br/comum/contratos.html" serigyLink="[url_alvo]" src="[url_alvo]">
</iframe>
```

### Código para seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/contratos.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizadas em <b>17/04/2026</b> com dados até <b>16/04/2026</b>.
</div>
```
