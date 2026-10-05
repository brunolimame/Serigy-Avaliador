# 11. Planejamento e Prestação de Contas

 

| Dimensão | Atributo | Valor | 
| Planejamento e Prestação de Contas | serigySchema | https://serigy.tce.se.gov.br/executivo/planejamento-prestacao-contas.html |
 

## 11.4. Julgamento pelo Poder Legislativo

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/Legislativo 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.4.1 | 11.4 | Integra do julgamento das contas pelo Poder Legislativo | julgamentoLegislativo | Anexo | 
| 11.4.2 | 11.4 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 11.4.3 | 11.4 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | Ano |
 

## 11.6. Relatório Resumido da Execução Orçamentária (RREO)

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/RREO 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.6.1 | 11.6 | Relatório Resumido da Execução Orçamentária com anexos | RREO | Anexo | 
| 11.6.2 | 11.6 | Ferramenta de pesquisa | filtroPesquisa | N/A | 
| 11.6.3 | 11.6 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 11.6.4 | 11.6 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | Ano |
 

## 11.8. Plano Plurianual (PPA)

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/PPA 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.8.1 | 11.8 | Lei do Plano Plurianual (PPA) | PPA | Anexo | 
| 11.8.2 | 11.8 | Anexos do PPA | anexoPPA | Anexo |
 

## 11.9. Lei de Diretrizes Orçamentárias (LDO)

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/LDO 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.9.1 | 11.9 | Lei de Diretrizes Orçamentárias (LDO) | LDO | Anexo | 
| 11.9.2 | 11.9 | Anexos da LDO | anexoLDO | Anexo |
 

## 11.10. Lei Orçamentária Anual (LOA)

 **Caminho URL:**[Portal da Transparencia]/PlanejamentoPrestacaoContas/LOA 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 11.10.1 | 11.10 | Lei Orçamentária Anual (LOA) | LOA | Anexo | 
| 11.10.2 | 11.10 | Anexos da LOA | anexoLOA | Anexo |
 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/gestao-fiscal-planejamento.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
     <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="submit" serigyExecuteWaitSection="gestaoTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição da pesquisa do **Julgamento pelo Legislativo**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/planejamento-prestacao-contas.html">
    <a serigyItem="julgamentoLegislativo" href="/anexos/decreto-legislativo-2025.pdf">
        Decreto Legislativo de Aprovação das Contas 2025
    </a>
</div>
```

### Código HTML para exibição da pesquisa do **RREO**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/planejamento-prestacao-contas.html" serigyLoadSection="rreoTabela">
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

### Código HTML para exibição da pesquisa do **PPA**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/planejamento-prestacao-contas.html">
    <p>
        <a serigyItem="PPA" href="/anexos/lei-ppa-2024-2027.pdf">
            Lei do Plano Plurianual 2024–2027
        </a>
    </p>
    <p>
        <a serigyItem="anexoPPA" href="/anexos/anexos-ppa.pdf">
            Anexos do PPA
        </a>
    </p>
</div>
```

### Código HTML para exibição da pesquisa do **LDO**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/planejamento-prestacao-contas.html">
    <p>
        <a serigyItem="LDO" href="/anexos/lei-ldo-2026.pdf">
            Lei de Diretrizes Orçamentárias 2026
        </a>
    </p>
    <p>
        <a serigyItem="anexoLDO" href="/anexos/anexos-ldo.pdf">
            Anexos da LDO
        </a>
    </p>
</div>
```

### Código HTML para exibição da pesquisa do **LOA**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/planejamento-prestacao-contas.html">
    <p>
        <a serigyItem="LOA" href="/anexos/lei-orcamentaria-2026.pdf">
            Lei Orçamentária Anual 2026
        </a>
    </p>
    <p>
        <a serigyItem="anexoLOA" href="/anexos/anexos-loa.pdf">
            Anexos da LOA
        </a>
    </p>
</div>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/gestao-fiscal-planejamento.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>24/04/2026</b> com dados até <b>23/04/2026</b>
</div>
```
