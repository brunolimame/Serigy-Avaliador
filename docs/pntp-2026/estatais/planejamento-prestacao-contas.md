# 11. Planejamento e Prestação de Contas

| Dimensão | Atributo | Valor |
| Planejamento e Prestação de Contas | serigySchema | https://serigy.tce.se.gov.br/estatais/planejamento-prestacao-contas.html |

## 11.12. Demonstrações Contábeis

**Caminho URL: **[Portal da Transparencia]/PlanejamentoPrestacaoContas/Demonstracoes

| Item | Critério(s) | Descrição | Atributo | Valor |
| 11.12.1 | 11.12 | Demonstrações financeiras trimestrais | demonstracaoTrimestral | Anexo |
| 11.12.2 | 11.13 | Parecer do Conselho Fiscal | parecerConselho | Anexo |
| 11.12.3 | 11.13 | Auditoria independente | auditoriaIndependente | Anexo |
| 11.12.4 | 11.12, 11.13, 11.15 | Gravação de relatórios em diversos formatos | salvarRelatorio | N/A |
| 11.12.5 | 11.12, 11.13, 11.15 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 11.12.6 | 11.12, 11.13, 11.15 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |

## 11.13. Comitê de Auditoria Estatutário

**Caminho URL: **[Portal da Transparencia]/PlanejamentoPrestacaoContas/ComiteAuditoria

| Item | Critério(s) | Descrição | Atributo | Valor |
| 11.13.1 | 11.16 | Relatório anual | relatorioAnual | Anexo |
| 11.13.2 | 11.17 | Atas das reuniões | ataReuniao | Anexo |
| 11.13.3 | 11.16, 11.17 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 11.13.4 | 11.16, 11.17 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |

## 11.15. Comitê de Elegibilidade Estatutário ou Comitê de Pessoas, Elegibilidade, Sucessão e Remuneração

**Caminho URL: **[Portal da Transparencia]/PlanejamentoPrestacaoContas/ComiteElegibilidade

| Item | Critério(s) | Descrição | Atributo | Valor |
| 11.15.1 | 11.18 | Atas das reuniões a partir de 2022 | ataReuniao | Anexo |
| 11.15.2 | 11.18 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 11.15.3 | 11.18 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |

## 11.16. Relatório Integrado ou de Sustentabilidade.

**Caminho URL: **[Portal da Transparencia]/PlanejamentoPrestacaoContas/Relatorio

| Item | Critério(s) | Descrição | Atributo | Valor |
| 11.16.1 | 11.19 | Relatório integrado ou de sustentabilidade anual | relatorioAnual | Anexo |
| 11.16.2 | 11.19 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 11.16.3 | 11.19 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |

## Exemplos

### Código HTML de exemplo para componente de pesquisa de processo licitatório:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais/planejamento-prestacao-contas.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="reset" serigyClearForm>Limpar Filtros</button>
    <button type="submit" serigyExecuteWaitSection="contasTabela">Pesquisar</button>
</div>

```

### Código HTML para exibição de componente de formatos para exportação:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais/planejamento-prestacao-contas.html">
    Salvar em:
    <a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>
    <a serigyItem="salvarRelatorio" serigyValue="xls">XLS</a>
    <a serigyItem="salvarRelatorio" serigyValue="xlsx">XLSX</a>
    <a serigyItem="salvarRelatorio" serigyValue="ods">ODS</a>
    <a serigyItem="salvarRelatorio" serigyValue="csv">CSV</a>
    <a serigyItem="salvarRelatorio" serigyValue="json">JSON</a>
</div>

```

### Código HTML para exibição da pesquisa de **Demonstrações Contábeis**:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais/planejamento-prestacao-contas.html">
    <a serigyItem="demonstracaoTrimestral" href="/demonstracoes/1-trimestre-2026.pdf">
        Demonstrações Financeiras - 1º Trimestre 2026
    </a>
    <a serigyItem="parecerConselho" href="/pareceres/conselho-fiscal-2026.pdf">
        Parecer do Conselho Fiscal - 2026
    </a>
    <a serigyItem="auditoriaIndependente" href="/auditorias/auditoria-independente-2026.pdf">
        Relatório de Auditoria Independente - 2026
    </a>
</div>

```

### Código HTML para exibição da pesquisa de **Comitê de Auditoria**:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais/planejamento-prestacao-contas.html">
    <a serigyItem="relatorioAnual" href="/comite-auditoria/relatorio-anual-2025.pdf">
        Relatório Anual do Comitê de Auditoria - 2025
    </a>
    <a serigyItem="ataReuniao" href="/comite-auditoria/ata-01-2026.pdf">
        Ata da Reunião - Janeiro/2026
    </a>
</div>

```

### Código HTML para exibição da pesquisa de **Comitê de Elegibilidade**:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais/planejamento-prestacao-contas.html">
    <a serigyItem="ataReuniao" href="/comite-elegibilidade/ata-2024.pdf">
        Ata da Reunião - 2024
    </a>
</div>

```

### Código HTML para exibição da pesquisa de **Relatório Integrado / Sustentabilidade**:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais/planejamento-prestacao-contas.html">
    <a serigyItem="relatorioAnual" href="/relatorios/relatorio-integrado-2025.pdf">
        Relatório Integrado / Sustentabilidade - 2025
    </a>
</div>

```

### Seção para informação de data de atualização das informações apresentadas:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais/planejamento-prestacao-contas.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>04/05/2026</b> com dados até <b>04/05/2026</b>.
</div>

```
