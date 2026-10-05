# 16. Renúncia de Receitas

 

| Dimensão | Atributo | Valor | 
| Renúncia de Receita | serigySchema | https://serigy.tce.se.gov.br/executivo/renuncia-receita.html |
 **Caminho URL:**[Portal da Transparencia]/RenunciaReceita 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 16.1 | 16.1 | Desonerações tributárias concedidas | desoneracao | Texto | 
| 16.2 | 16.1 | Fundamentação legal de cada desoneração | fundamentoLegal | Texto | 
| 16.3 | 16.2 | Espécie | especie | Texto | 
| 16.4 | 16.2 | Previsão do montante a ser renunciado | previsaoRenuncia | Monetário | 
| 16.5 | 16.2, 16.4 | Valor renunciado | valorRenunciado | Monetário | 
| 16.6 | 16.3 | CNPJ dos beneficiários | cnpjBeneficiario | Numérico | 
| 16.7 | 16.3, 16.4 | Nome dos beneficiários | nomeBeneficiario | Texto | 
| 16.8 | 16.4 | Descrição do objeto aprovado | descricao | Texto | 
| 16.9 | 16.2, 16.3, 16.4 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 16.10 | 16.2, 16.3, 16.4 | Gravação de relatórios em diversos formatos | salvarRelatorio | N/A | 
| 16.11 | 16.2, 16.3, 16.4 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 16.12 | 16.2, 16.3, 16.4 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |
 

## Exemplos

 

### Código HTML para exibição de componente de formatos para exportação:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/renuncia-receita.html">
    Salvar em:
    <a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>
    <a serigyItem="salvarRelatorio" serigyValue="xls">XLS</a>
    <a serigyItem="salvarRelatorio" serigyValue="xlsx">XLSX</a>
    <a serigyItem="salvarRelatorio" serigyValue="ods">ODS</a>
    <a serigyItem="salvarRelatorio" serigyValue="csv">CSV</a>
    <a serigyItem="salvarRelatorio" serigyValue="json">JSON</a>
</div>
```

### Código HTML de exemplo para componente de pesquisa de **Renúncias de Receitas**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/renuncia-receita.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="submit" serigyExecuteWaitSection="renunciasTabela">Pesquisar</button>
</div>
```

### Código HTML de exibição da pesquisa de **Renúncia de Receitas**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/renuncia-receita.html" serigyExecuteWaitSection="renunciasTabela">
    <thead>
        <!-- Outras seções HTML podem existir internamente -->
        <th>Espécie</th>
        <th>Desoneração</th>
        <th>Fundamento Legal</th>
        <th>Previsão (R$)</th>
        <th>Valor</th>
        <th>Detalhes</th>
    </thead>
    <tbody>
        <!-- Outras seções HTML podem existir internamente -->
        <td serigyItem="especie">IPTU</td>
        <td serigyItem="desoneracao">Isenção</td>
        <td serigyItem="fundamentoLegal">Lei Complementar 101/2000</td>
        <td serigyItem="previsaoRenuncia">20.000,00</td>
        <td serigyItem="valorRenunciado">R$ 17.000,00</td>
        <td>
            <button serigyExecuteWaitSection="detalhesRenuncia">Ver Detalhes</button>
        </td>
    </tbody>
</table>
```

### Código HTML de exibição de **Detalhes da Renúncia**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/renuncia-receita.html" serigyLoadSection="detalhesRenuncia">
    <thead>
        <!-- Outras seções HTML podem existir internamente -->
        <th>Descrição</th>
        <th>Nome</th>
        <th>CNPJ</th>
        <th>Valor Renunciado</th>
    </thead>
    <tbody>
        <!-- Outras seções HTML podem existir internamente -->
        <th serigyItem="descricao">Publicação de Cadernos</th>
        <th serigyItem="nomeBeneficiario">PETROLEO BRASILEIRO S A PETROBRAS</th>
        <th serigyItem="cnpjBeneficiario">33.000.167/0001-01</th>
        <th serigyItem="valorRenunciado">R$ 51.177,56</th>
    </tbody>
</table>
```

### Em caso de carregamento de informações via iframe:

 

```
<iframe serigySchema="https://serigy.tce.se.gov.br/executivo/renuncia-receita.html" serigyLink="[url_alvo]" src="[url_alvo]">
</iframe>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/renuncia-receita.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>23/04/2026</b> com dados até <b>22/04/2026</b>
</div>
```
