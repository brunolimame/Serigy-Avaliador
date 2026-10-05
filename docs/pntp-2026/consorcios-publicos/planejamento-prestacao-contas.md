# 11. Planejamento e Prestação de Contas

 

| Dimensão | Atributo | Valor | 
| Planejamento e Prestação de Contas | serigySchema | https://serigy.tce.se.gov.br/consorcios/planejamento-prestacao-contas.html |
 

## 11.6. Relatório Resumido da Execução Orçamentária (RREO)

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/RREO 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.6.1 | 11.6 | Relatório Resumido da Execução Orçamentária com anexos | RREO | Anexo | 
| 11.6.2 | 11.6 | Ferramenta de pesquisa | filtroPesquisa | N/A | 
| 11.6.3 | 11.6 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 11.6.4 | 11.6 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | Ano |
 

## 11.11. Orçamento Receita e Despesa

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/Orcamento 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.11.1 | 11.11 | Relatório do orçamento da estimativa da receita e a fixação da despesa | orcamentoReceitaDespesa | Anexo | 
| 11.11.2 | 11.11 | Gravação de relatórios em diferentes formatos do resultados dos contratos | salvarRelatorio | N/A | 
| 11.11.3 | 11.11 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 11.11.4 | 11.11 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | Ano |
 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/consorcios/gestao-fiscal-planejamento.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="submit" serigyExecuteWaitSection="gestaoTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição da pesquisa do **RREO**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/consorcios/planejamento-prestacao-contas.html" serigyLoadSection="rreoTabela">
    <thead>
        <tr>
            <th>Exercício</th>
            <th>Documento</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>2025</td>
            <td serigyItem="RREO">
                <a href="/anexos/rreo-6-bimestre-2025.pdf">RREO 6º Bimestre</a>
            </td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição da pesquisa do **RREO sem dados**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/consorcios/planejamento-prestacao-contas.html" serigyLoadSection="rreoTabela">
    <thead>
        <tr>
            <th>Exercício</th>
            <th>Documento</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>2026</td>
            <td serigyItem="RREO" serigyEmpty="Justificativa da ausência de dados">-</td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição da pesquisa do **Orçamento Receita e Despesa**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/consorcios/planejamento-prestacao-contas.html">
    <a serigyItem="orcamentoReceitaDespesa" href="/anexos/orcamento.pdf">Orçamento 855/2025</a>
</div>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/consorcios/gestao-fiscal-planejamento.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>28/04/2026</b> com dados até <b>27/04/2026</b>
</div>
```
