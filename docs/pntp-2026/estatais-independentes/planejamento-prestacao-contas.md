# 11. Planejamento e Prestação de Contas

| Dimensão | Atributo | Valor |
| Planejamento e Prestação de Contas | serigySchema | https://serigy.tce.se.gov.br/estatais-independentes/planejamento-prestacao-contas.html |

## 11.14. Orçamento de Investimentos

**Caminho URL: **[Portal da Transparencia]/PlanejamentoPrestacaoContas/Investimentos

| Item | Critério(s) | Descrição | Atributo | Valor |
| 11.14.1 | 11.14 | Orçamento de Investimentos da instituição que compõe a Lei Orçamentária Anual | orcamentoInvestimento | Anexo |
| 11.14.2 | 11.14 | Gravação de relatórios em diferentes formatos do resultados dos contratos | salvarRelatorio | N/A |
| 11.14.3 | 11.14 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 11.14.4 | 11.14 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | Ano |

## Exemplos

### Código HTML de exemplo para componente de pesquisa:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais-independentes/gestao-fiscal-planejamento.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="submit" serigyExecuteWaitSection="orcamentoTabela">Pesquisar</button>
    <a serigyItem="salvarRelatorio" serigyValue="pdf">Salvar em PDF</a>
</div>

```

### Código HTML para exibição da pesquisa do **Orçamento de Investimentos**:

```
<a serigySchema="https://serigy.tce.se.gov.br/estatais-independentes/planejamento-prestacao-contas.html"
    serigyItem="orcamentoInvestimento" href="/anexo.pdf">
        Orçamento de Investimentos 2025
</a>

```

### Código HTML para exibição da pesquisa do **Orçamento de Investimentos sem dados**:

```
<a serigySchema="https://serigy.tce.se.gov.br/estatais-independentes/planejamento-prestacao-contas.html"
    serigyItem="orcamentoInvestimento" serigyEmpty="Justificativa da ausência de dados">
        -
</a>

```

### Seção para informação de data de atualização das informações apresentadas:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais-independentes/gestao-fiscal-planejamento.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>28/04/2026</b> com dados até <b>27/04/2026</b>
</div>

```
