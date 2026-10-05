# 23. Atividades Finalísticas

| Dimensão | Atributo | Valor |
| Atividades Finalísticas | serigySchema | https://serigy.tce.se.gov.br/ministerio-publico/atividades-finalisticas.html |

## 23.1. Composição da Casa

**Caminho URL: **[Portal da Transparencia]/Atividades/ComposicaoCasa

| Item | Critério(s) | Descrição | Atributo | Valor |
| 23.1.1 | 23.1 | Nome do Membro | nomeMembro | Nome |
| 23.1.2 | 23.1 | Indicação de onde cada membro atua | atuacaoMembro | Texto |

## 23.2. Procedimentos Preparatórios (PP)

**Caminho URL: **[Portal da Transparencia]/Atividades/ProcedimentosPreparatorios

| Item | Critério(s) | Descrição | Atributo | Valor |
| 23.2.1 | 23.2 | Título/identificação | identificaPP | Texto |
| 23.2.2 | 23.2 | Andamento/movimentação | andamentoPP | Texto \| Link |
| 23.2.3 | 23.2 | Anexo | anexoPP | Link |
| 23.2.4 | 23.2 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
| 23.2.5 | 23.2 | Gravação de relatórios em diferentes formatos | salvarRelatorio | N/A |
| 23.2.6 | 23.2 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 23.2.7 | 23.2 | Histórico (dos últimos 3 anos) das Informações | historicoExercicio | N/A |

## 23.3. Procedimentos de Investigação (PI)

**Caminho URL: **[Portal da Transparencia]/Atividades/ProcedimentoInvestigacao

| Item | Critério(s) | Descrição | Atributo | Valor |
| 23.3.1 | 23.3 | Título/identificação | identificaPI | Texto |
| 23.3.2 | 23.3 | Andamento/movimentação | andamentoPI | Texto \| Link |
| 23.3.3 | 23.3 | Anexo | anexoPI | Link |
| 23.3.4 | 23.3 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
| 23.3.5 | 23.3 | Gravação de relatórios em diferentes formatos | salvarRelatorio | N/A |
| 23.3.6 | 23.3 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 23.3.7 | 23.3 | Histórico (dos últimos 3 anos) das Informações | historicoExercicio | N/A |

## 23.4. Inquéritos Civís (IC)

**Caminho URL: **[Portal da Transparencia]/Atividades/InqueritoCivil

| Item | Critério(s) | Descrição | Atributo | Valor |
| 23.4.1 | 23.4 | Título/identificação | identificaIC | Texto |
| 23.4.2 | 23.4 | Andamento/movimentação | andamentoIC | Texto \| Link |
| 23.4.3 | 23.4 | Anexo | anexoIC | Link |
| 23.4.4 | 23.4 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
| 23.4.5 | 23.4 | Gravação de relatórios em diferentes formatos | salvarRelatorio | N/A |
| 23.4.6 | 23.4 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 23.4.7 | 23.4 | Histórico (dos últimos 3 anos) das Informações | historicoExercicio | N/A |

## Exemplos

### Código HTML de exemplo para componente de pesquisa:

```
<div serigySchema="https://serigy.tce.se.gov.br/ministerio-publico/atividades-finalisticas.html" serigyItem="filtroPesquisa">
  <!-- Outras seções HTML podem existir internamente -->
  <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
    <option serigyValue="2026">2026</option>
    <option serigyValue="2025">2025</option>
    <option serigyValue="2024">2024</option>
  </select>
  <button type="submit" serigyExecuteWaitSection="ministerioPublicoTabela">Pesquisar</button>
</div>

```

### Código HTML para exibição de componente de formatos para exportação:

```
<div serigySchema="https://serigy.tce.se.gov.br/ministerio-publico/atividades-finalisticas.html">
  Salvar em:
  <a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>
  <a serigyItem="salvarRelatorio" serigyValue="xls">XLS</a>
  <a serigyItem="salvarRelatorio" serigyValue="xlsx">XLSX</a>
  <a serigyItem="salvarRelatorio" serigyValue="ods">ODS</a>
  <a serigyItem="salvarRelatorio" serigyValue="csv">CSV</a>
  <a serigyItem="salvarRelatorio" serigyValue="json">JSON</a>
</div>

```

### Código HTML para exibição da **Composição da Casa**:

```
<table serigySchema="https://serigy.tce.se.gov.br/ministerio-publico/atividades-finalisticas.html">
  <thead>
    <tr>
      <th>Membro</th>
      <th>Atuação</th>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="nomeMembro">ADEMILTON DE OLIVEIRA SANTOS</td>
      <td serigyItem="atuacaoMembro">PROMOTOR DE JUSTIÇA DE ENTR.</td>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </tbody>
</table>

```

### Código HTML para exibição dos **Procedimentos Preparatórios**:

```
<table serigySchema="https://serigy.tce.se.gov.br/ministerio-publico/atividades-finalisticas.html">
  <thead>
    <tr>
      <th>Nº Processo</th>
      <th>Movimentações</th>
      <th>Anexo</th>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="identificaPP">1.30.020.000264/2024-16</td>
      <td serigyItem="andamentoPP">
        23/09/2024   12:08:27 - Recebido pelo(a) SETOR DE ACOMPANHAMENTO PROCESSUAL DA PRM/SAO GONCALO
        20/09/2024   14:06:41 - Movimentado para SETOR DE ACOMPANHAMENTO PROCESSUAL DA PRM/SAO GONCALO
        19/09/2024   16:09:24 - Expedição de Recomendação
        ...
      </td>
      <td serigyItem="anexoPP"><a href="link/para/PP">Ver anexo PP</a></td>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </tbody>
</table>

```

### Código HTML para exibição dos **Procedimentos de Investigação**:

```
<table serigySchema="https://serigy.tce.se.gov.br/ministerio-publico/atividades-finalisticas.html">
  <thead>
    <tr>
      <th>Nº Processo</th>
      <th>Movimentações</th>
      <th>Anexo</th>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="identificaPI">1.29.000.006622/2024-53</td>
      <td serigyItem="andamentoPI">
        16/09/2024   14:11:20 - Instauração de Procedimento Investigatório Criminal
        10/09/2024   13:28:03 - Recebido pelo(a) GABINETE DE PROCURADOR DA REPÚBLICA
        10/09/2024   10:23:00 - Movimentado para GABINETE DE PROCURADOR DA REPÚBLICA
        ...
      </td>
      <td serigyItem="anexoPI"><a href="link/para/PI">Ver anexo PI</a></td>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </tbody>
</table>

```

### Código HTML para exibição dos **Inquérito Civil**:

```
<table serigySchema="https://serigy.tce.se.gov.br/ministerio-publico/atividades-finalisticas.html">
  <thead>
    <tr>
      <th>Nº Processo</th>
      <th>Movimentações</th>
      <th>Anexo</th>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="identificaIC">(1.30.001.004903/2024-41</td>
      <td serigyItem="andamentoIC">
        20/09/2024   14:52:11 - Instauração do Inquérito Civil
        19/09/2024   15:50:26 - Recebido pelo(a) GABINETE DO PROCURADOR REGIONAL DOS DIREITOS DO CIDADAO PR/R
        19/09/2024   14:55:59 - Movimentado para GABINETE DO PROCURADOR REGIONAL DOS DIREITOS DO CIDADAO PR/R
        ...
      </td>
      <td serigyItem="anexoIC"><a href="link/para/IC">Ver anexo IC</a></td>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </tbody>
</table>

```

### Seção para informação de data de atualização das informações apresentadas:

```
<div serigySchema="https://serigy.tce.se.gov.br/ministerio-publico/atividades-finalisticas.html" serigyItem="dataUltimaAtualizacao">
  Conjunto de informações atualizado em <b>27/04/2026</b> com dados até <b>27/04/2026</b>
</div>

```
