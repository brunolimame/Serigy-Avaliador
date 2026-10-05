# 10. Obras

 

| Dimensão | Atributo | Valor | 
| Obras | serigySchema | https://serigy.tce.se.gov.br/comum/obras.html |
 **Caminho URL:** [Portal da Transparencia]/Obras 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 10.1 | 10.1 | Descrição objetivo da obra | objetivoObra | Texto | 
| 10.2 | 10.1 | Status atual da obra (em andamento, paralisada, concluída, entre outras) | statusObra | Texto | 
| 10.3 | 10.1 | Data de início | inicioObra | Data | 
| 10.4 | 10.1 | Previsão de Conclusão | previsaoTermino | Data | 
| 10.5 | 10.1 | Nome da empresa que está executando a obra (em caso de execução direta, informar essa situação) | empresaContratada | Texto | 
| 10.6 | 10.1 | Progresso da obra em relação ao total planejado | percentualConclusao | Numérico | 
| 10.7 | 10.2 | Quantidades específicas de cada item ou serviço contratado, que compõe a obra | quantitativoContratado | Numérico | 
| 10.8 | 10.2 | Valores de cada unidade desses itens ou serviços | valorUnitarioContratado | Monetário | 
| 10.9 | 10.2 | Valor total licitado ou contratado | valorTotalContratado | Monetário | 
| 10.10 | 10.3 | Quantitativo executado | quantitativoReal | Numérico | 
| 10.11 | 10.3 | Valores unitários praticados, efetivamente pagos | valorUnitarioReal | Monetário | 
| 10.12 | 10.4 | Motivo da paralisação | motivoParada | Texto | 
| 10.13 | 10.4 | Responsável pela inexecução temporária | responsavelParada | Texto | 
| 10.14 | 10.4 | Data prevista para o reinício da sua execução | previsaoReinicio | Data | 
| 10.15 | 10.1, 10.4 | Pesquisa de informações | filtroPesquisa | N/A | 
| 10.16 | 10.1, 10.2, 10.3, 10.4 | Gravação de relatórios em diferentes formatos | salvarRelatorio | N/A | 
| 10.17 | 10.1, 10.2, 10.3, 10.4 | Informações atualizadas | dataUltimaAtualizacao | Data |
 

**ℹ️ Obs.:** Todos os itens que correspondem aos critérios 10.1, 10.3 e 10.4 não se aplicam às Estatais

 

## Exemplos

 

### Código HTML para exibição de componente de formatos para exportação:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/obras.html">
     Salvar em:
     <a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>
     <a serigyItem="salvarRelatorio" serigyValue="xls">XLS</a>
     <a serigyItem="salvarRelatorio" serigyValue="xlsx">XLSX</a>
     <a serigyItem="salvarRelatorio" serigyValue="ods">ODS</a>
     <a serigyItem="salvarRelatorio" serigyValue="csv">CSV</a>
     <a serigyItem="salvarRelatorio" serigyValue="json">JSON</a>
</div>
```

### Código HTML para pesquisa de **Obras**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/obras.html" serigyItem="filtroPesquisa">
  <!-- Outras seções HTML podem existir internamente -->
  <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
    <option serigyValue="2026">2026</option>
    <option serigyValue="2025">2025</option>
    <option serigyValue="2024">2024</option>
  </select>
  <button type="submit" serigyExecuteWaitSection="obrasTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição da pesquisa de **Obras**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/obras.html" serigyLoadSection="obrasTabela">
  <thead>
    <tr>
      <th>Objetivo</th>
      <th>Status</th>
      <th>Data de início</th>
      <th>Termino/previsão</th>
      <th>Empresa</th>
      <th>% de conclusão</th>
      <th>Detalhes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="objetivoObra">Revitalização da entrada do Maracanã</td>
      <td serigyItem="statusObra">Em Andamento</td>
      <td serigyItem="inicioObra">04/07/2024</td>
      <td serigyItem="previsaoTermino">04/03/2025</td>
      <td serigyItem="empresaContratada">Empresa A</td>
      <td serigyItem="percentualConclusao">65.32%</td>    
      <th serigyExecuteWaitSection="detalhe_obra_7612"> + </th>
    </tr>
  </tbody>
</div>
```

### Código HTML para exibição de detalhes de uma **Obra em andamento**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/obras.html" serigyLoadSection="detalhe_obra_7612">
  <thead>
    <tr>
      <th>Quantitativo contratado</th>
      <th>Valor unitário contratado</th>
      <th>Valor total contratado</th>
      <th>Quantitativo real</th>
      <th>Valor unitario real</th>
      <th>Motivo da paralisação</th>
      <th>Responsável da parada</th>
      <th>Previsão para reinício</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="quantitativoContratado">800</td>
      <td serigyItem="valorUnitarioContratado">R$ -</td>
      <td serigyItem="valorTotalContratado">R$ 45.675.552,54</td>
      <td serigyItem="quantitativoReal">522</td>
      <td serigyItem="valorUnitarioReal">R$ -</td>
      <td serigyItem="motivoParada" serigyEmpty="Não está paralisado">-</td>
      <td serigyItem="responsavelParada" serigyEmpty="Não está paralisado">-</td>
      <td serigyItem="previsaoReinicio" serigyEmpty="Não está paralisado">-</td>
    </tr>
  </tbody>
</div>
```

### Código HTML para exibição de detalhes de uma **Obra paralisada**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/obras.html" serigyLoadSection="detalhe_obra_7613">
  <thead>
    <tr>
      <th>Quantitativo contratado</th>
      <th>Valor unitário contratado</th>
      <th>Valor total contratado</th>
      <th>Quantitativo real</th>
      <th>Valor unitario real</th>
      <th>Motivo da paralisação</th>
      <th>Responsável da parada</th>
      <th>Previsão para reinício</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="quantitativoContratado">800</td>
      <td serigyItem="valorUnitarioContratado">R$ </td>
      <td serigyItem="valorTotalContratado">R$ 45.675.552,54</td>
      <td serigyItem="quantitativoReal">522</td>
      <td serigyItem="valorUnitarioReal">R$ </td>
      <td serigyItem="motivoParada">Mudança de local</td>
      <td serigyItem="responsavelParada">Edson Arantes do Nascimento</td>
      <td serigyItem="previsaoReinicio">29/12/2022</td>
    </tr>
  </tbody>
</div>
```

### Em caso de carregamento de informações via iframe:

 

```
<iframe serigySchema="https://serigy.tce.se.gov.br/comum/obras.html" serigyLink="[url]" src="[url]">
</iframe>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/obras.html" serigyItem="dataUltimaAtualizacao">
  Conjunto de informações atualizado em <b>17/04/2026</b> com dados até <b>16/04/2026</b>
</div>
```
