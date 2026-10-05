# 5. Convênios e Transferências

 

| Dimensão | Atributo | Valor | 
| Convênios e Transferências | serigySchema | https://serigy.tce.se.gov.br/comum/convenios-transferencias.html |
 

## 5.1. Transferências Recebidas

 **Caminho URL:** [Portal da Transparencia]/Convenios/Recebidas 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 5.1.1 | 5.1 | Número/ano do convênio/termo ou ajuste (ou instrumento equivalente) | identificaTransferencia | Número/Ano | 
| 5.1.2 | 5.1 | Órgão ou Poder repassador dos recursos | orgaoRepassador | Texto | 
| 5.1.3 | 5.1 | Vigência do convênio | vigenciaConvenio | Ano | 
| 5.1.4 | 5.1 | Objeto do convênio | objetoConvenio | Texto | 
| 5.1.5 | 5.1 | Valor total do convênio | valorTotalPrevisto | Monetário | 
| 5.1.6 | 5.1 | Valores já repassados | valorRepassado | Monetário | 
| 5.1.7 | 5.1 | Inteiro teor do instrumento de convênio/transferência | anexoConvenio | Anexo | 
| 5.1.8 | 5.1 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A | 
| 5.1.9 | 5.1 | Gravação de relatórios em diferentes formatos do resultados dos contratos | salvarRelatorio | N/A | 
| 5.1.10 | 5.1 | Informações atualizadas em relação aos critérios dos convênios | dataUltimaAtualizacao | Data | 
| 5.1.11 | 5.1 | Histórico (dos últimos 3 anos) das Informações atualizadas em relação aos critérios dos convênios | historicoExercicio | N/A |
 

## 5.2. Transferências Realizadas

 **Caminho URL:** [Portal da Transparencia]/Convenios/Realizadas 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 5.2.1 | 5.2 | Número/ano do convênio/termo ou ajuste (ou instrumento equivalente) | identificaTransferencia | Número/Ano | 
| 5.2.2 | 5.2 | Nome do beneficiário do objeto | orgaoBeneficiario | Texto | 
| 5.2.3 | 5.2 | Vigência do convênio | vigenciaConvenio | Ano | 
| 5.2.4 | 5.2 | Objeto do convênio/repasse | objetoConvenio | Texto | 
| 5.2.5 | 5.2 | Valor total previsto para repasse | valorTotalRepasse | Monetário | 
| 5.2.6 | 5.2 | Valores já repassados | valorRepassado | Monetário | 
| 5.2.7 | 5.2 | Inteiro teor do instrumento de convênio/transferência | anexoConvenio | Anexo | 
| 5.2.8 | 5.2 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A | 
| 5.2.9 | 5.2 | Gravação de relatórios em diferentes formatos do resultados dos contratos | salvarRelatorio | N/A | 
| 5.2.10 | 5.2 | Informações atualizadas em relação aos critérios dos convênios | dataUltimaAtualizacao | Data | 
| 5.2.11 | 5.2 | Histórico (dos últimos 3 anos) das Informações atualizadas em relação aos critérios dos convênios | historicoExercicio | N/A |
 

## 5.3. Acordos Sem Transferência

 **Caminho URL:** [Portal da Transparencia]/Convenios/SemTransferencia 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 5.3.1 | 5.3 | Número/ano do convênio/termo ou ajuste (ou instrumento equivalente) | identificaAcordo | Número/Ano | 
| 5.3.2 | 5.3 | Entidades ou indivíduos que estão participando do acordo | participante | Texto | 
| 5.3.3 | 5.3 | Vigência do convênio | vigenciaConvenio | Ano | 
| 5.3.4 | 5.3 | Objeto do convênio/repasse | objetoConvenio | Texto | 
| 5.3.5 | 5.3 | Obrigações ajustadas | obrigacoes | Texto | 
| 5.3.6 | 5.3 | Inteiro teor do instrumento de convênio/transferência | anexoConvenio | Anexo | 
| 5.3.7 | 5.3 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A | 
| 5.3.8 | 5.3 | Gravação de relatórios em diferentes formatos do resultados dos contratos | salvarRelatorio | N/A | 
| 5.3.9 | 5.3 | Informações atualizadas em relação aos critérios dos convênios | dataUltimaAtualizacao | Data | 
| 5.3.10 | 5.3 | Histórico (dos últimos 3 anos) das Informações atualizadas em relação aos critérios dos convênios | historicoExercicio | N/A |
 

## Exemplos

 

### Código HTML para pesquisa de Convênios:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/convenios-transferencias.html" serigyItem="filtroPesquisa">  
    <!-- Outras seções HTML podem existir internamente -->
    <button type="submit" serigyExecuteWaitSection="convenioTabela">Pesquisar</button>
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
      <option serigyValue="2026">2026</option>
      <option serigyValue="2025">2025</option>
      <option serigyValue="2024">2024</option>
    </select>
    <a serigyItem="salvarRelatorio" serigyValue="pdf">Salvar em PDF</a>
</div>
```

### Código HTML para exibição da pesquisa de **Transferências Recebidas**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/convenios-transferencias.html" serigyLoadSection="convenioTabela">
  <thead>
    <tr>
      <th>Número</th>
      <th>Órgão Repassador</th>
      <th>Vigência</th>
      <th>Objeto</th>
      <th>Valor Total do Repasse</th>
      <th>Valor Repassado</th>
      <th>Anexo</th>
    </tr>
  </thead>
  <!-- Dados referentes a certa linha da tabela -->
  <tbody>
    <tr>
      <td serigyItem="identificaTransferencia">957610/2024</td>
      <td serigyItem="orgaoRepassador">54000 - MINISTERIO DO TURISMO</td>
      <td serigyItem="vigenciaConvenio">20/09/2024</td>
      <td serigyItem="objetoConvenio">Custeio de propagandas</td>
      <td serigyItem="valorTotalPrevisto">R$ 1.912.356,00</td>
      <td serigyItem="valorRepassado">R$ 1.351.448,16</td>
      <td serigyItem="anexoConvenio">
        <a>Anexo 957610/2024</a>
      </td>
    </tr>
  </tbody>
</div>
```

### Código HTML para exibição da pesquisa de **Transferências Realizadas**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/convenios-transferencias.html" serigyLoadSection="realizadaTabela">
  <thead>
    <tr>
      <th>Número</th>
      <th>Órgão Beneficiário</th>
      <th>Objeto</th>
      <th>Valor Total do Repasse</th>
      <th>Valor Repassado</th>
    </tr>
  </thead>
  <!-- Dados referentes a certa linha da tabela -->
  <tbody>
    <tr>
      <td serigyItem="identificaTransferencia">0156/2023</td>
      <td serigyItem="orgaoBeneficiario">Hospital Nosso Senhor dos Passos</td>
      <td serigyItem="objetoConvenio">Custeio do Hospital</td>
      <td serigyItem="valorTotalRepasse">R$ 400.000,00</td>
      <td serigyItem="valorRepassado">R$ 120.000,00</td>
    </tr>
  </tbody>
</div>
```

### Código HTML para exibição da pesquisa de **Acordos Sem Transferência**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/convenios-transferencias.html" serigyLoadSection="semTransferenciaTabela">
  <thead>
    <tr>
      <th>Entidade Participante</th>
      <th>Objeto</th>
      <th>Obrigações</th>
      <th>Anexo</th>
    </tr>
  </thead>
  <!-- Dados referentes a certa linha da tabela -->
  <tbody>
    <tr>
      <td serigyItem="participante">
        CONFEDERAÇÃO NACIONAL DOS AGRICULTORES FAMILIARES E EMPREENDEDORES FAMILIARES RURAIS DO BRASIL - CONAFER-BR
      </td>
      <td serigyItem="objetoConvenio">
        ACORDO DE COOPERAÇÃO TÉCNICA TEM POR OBJETO A INTEGRAÇÃO DE ESFORÇOS ENTRE AS PARTES A EXECUÇÃO, DO ...
      </td>
      <td serigyItem="obrigacoes">
        <a href="local/arquivo">Obrigações</a>
      </td>
      <td serigyItem="anexoConvenio">
        <a>Anexo 957610/2024</a>
      </td>
    </tr>
  </tbody>
</div>
```

### Código HTML para exibição da pesquisa de **qualquer tipo de Convênio**, sem informações:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/convenios-transferencias.html" serigyLoadSection="convenioTabela">
  <thead>
    <tr>
      <th>Número</th>
      <th>Órgão Repassador</th>
      <th>Valor Total do Repasse</th>
      <th>Valor Repassado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <!-- Dados referentes a certa linha da tabela -->
      <td serigyItem="identificaTransferencia">957610/2024</td>
      <td serigyItem="orgaoRepassador">54000 - MINISTERIO DO TURISMO</td>
      <td serigyItem="valorTotalPrevisto">R$ 1.912.356,00</td>
      <td serigyItem="valorRepassado" serigyEmpty="Transferência 957610/2024 ainda não realizada">-</td>
    </tr>
  </tbody>
</div>
```

### Em caso de carregamento de informações via iframe:

 

```
<iframe serigySchema="https://serigy.tce.se.gov.br/comum/convenios-transferencias.html" serigyLink="[url_alvo]" src="[url_alvo]">
</iframe>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/convenios-transferencias.html" serigyItem="dataUltimaAtualizacao">
  Conjunto de informações atualizado em <b>01/04/2026</b> com dados até <b>31/03/2026</b>
</div>
```
