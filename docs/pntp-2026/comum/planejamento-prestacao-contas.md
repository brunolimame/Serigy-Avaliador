# 11. Planejamento e Prestação de Contas

 

| Dimensão | Atributo | Valor | 
| Planejamento e Prestação de Contas | serigySchema | https://serigy.tce.se.gov.br/comum/planejamento-prestacao-contas.html |
 

## 11.1. Prestação de Contas (Balanço Geral)

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/BalancoGeral 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.1.1 | 11.1 | Balanço Geral do exercício anterior (incluindo demonstrativos contábeis) | balancoGeralAnoAnterior | Link | 
| 11.1.2 | 11.1 | Ferramenta de pesquisa | filtroPesquisa | N/A | 
| 11.1.3 | 11.1 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 11.1.4 | 11.1 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | Ano |
 

**ℹ️ Obs.:** Todos os itens que correspondem aos critérios 11.1 não se aplicam às Estatais

 

## 11.2. Relatório de Gestão ou Atividades

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/RelatorioGestao 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.2.1 | 11.2 | Relatório de gestão ou atividades do exercício anterior | relatorioGestao | Anexo | 
| 11.2.2 | 11.2 | Ferramenta de pesquisa | filtroPesquisa | N/A | 
| 11.2.3 | 11.2 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 11.2.4 | 11.2 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | Ano |
 

**ℹ️ Obs.:** Todos os itens que correspondem aos critérios 11.2 não se aplicam às Estatais

 

## 11.3. Julgamento pelo Tribunal de Contas

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/TCE 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.3.1 | 11.3 | Integra do julgamento das contas pelo Tribunal de Contas | integraJulgamentoTCE | Anexo | 
| 11.3.2 | 11.3 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 11.3.3 | 11.3 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | Ano |
 

## 11.5. Relatório de Gestão Fiscal (RGF)

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/RGF 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.5.1 | 11.5 | Relatório de Gestão Fiscal com anexos obrigatórios | RGF | Anexo | 
| 11.5.2 | 11.5 | Ferramenta de pesquisa | filtroPesquisa | N/A | 
| 11.5.3 | 11.5 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 11.5.4 | 11.5 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | Ano |
 

**ℹ️ Obs.:** Todos os itens que correspondem aos critérios 11.5 não se aplicam às Estatais

 

## 11.7. Plano Estratégico

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/PlanoEstrategico 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.7.1 | 11.7 | Plano estratégico institucional com metas e indicadores | planoEstrategico | Anexo |
 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/gestao-fiscal-planejamento.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
     <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="submit" serigyExecuteWaitSection="gestaoTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição da pesquisa do **Balanço Geral**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/planejamento-prestacao-contas.html" serigyLoadSection="gestaoTabela">
    <a serigyItem="balancoGeralAnoAnterior" href="/anexos/balanco-geral-2025.pdf">
        Balanço Geral 2025 (PDF pesquisável)
    </a>
</div>
```

### Código HTML para exibição da pesquisa do **Relatório de Gestão**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/planejamento-prestacao-contas.html" serigyLoadSection="gestaoTabela">
    <a serigyItem="relatorioGestao" href="/anexos/relatorio-gestao-2025.pdf">
        Relatório de Gestão 2025
    </a>
</div>
```

### Código HTML para exibição da pesquisa do **Julgamento pelo TCE**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/planejamento-prestacao-contas.html" serigyLoadSection="gestaoTabela">
    <a serigyItem="integraJulgamentoTCE" href="/anexos/acordao-tce-2025.pdf">
        Acórdão do Tribunal de Contas - Exercício 2025
    </a>
</div>
```

### Código HTML para exibição da pesquisa do **RGF (com lista por exercício)**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/planejamento-prestacao-contas.html" serigyLoadSection="gestaoTabela">
    <thead>
        <tr>
            <th>Exercício</th>
            <th>Documento</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>2025</td>
            <td serigyItem="RGF">
                <a href="/anexos/rgf-3-quadrimestre-2025.pdf">RGF 3º Quadrimestre</a>
            </td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição da pesquisa do **Plano Estratégico**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/planejamento-prestacao-contas.html">
    <a serigyItem="planoEstrategico" href="/anexos/plano-estrategico-2024-2027.pdf">
        Plano Estratégico Institucional 2024–2027
    </a>
</div>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/gestao-fiscal-planejamento.html" serigyItem="dataUltimaAtualizacao">
  Conjunto de informações atualizado em <b>24/04/2026</b> com dados até <b>23/04/2026</b>
</div>
```
