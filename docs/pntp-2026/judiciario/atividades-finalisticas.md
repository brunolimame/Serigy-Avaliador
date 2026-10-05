# 21. Atividades Finalísticas

| Dimensão | Atributo | Valor |
| Atividades Finalísticas | serigySchema | https://serigy.tce.se.gov.br/judiciario/atividades-finalisticas.html |

## 21.1. Composição da Casa

**Caminho URL: **[Portal da Transparencia]/Atividades/ComposicaoCasa

| Item | Critério(s) | Descrição | Atributo | Valor |
| 21.1.1 | 21.1 | Nome do Magistrado | nomeMagistrado | Nome |
| 21.1.2 | 21.1 | Atuação de cada magistrado | atuacaoMagistrado | Texto |

## 21.2. Pautas das Sessões

**Caminho URL: **[Portal da Transparencia]/Atividades/Sessoes

| Item | Critério(s) | Descrição | Atributo | Valor |
| 21.2.1 | 21.2 | Identificação da sessão | identificaSessao | Texto |
| 21.2.2 | 21.2 | Conteúdo da pauta da sessão | pautaSessao | Link \| Texto |
| 21.2.3 | 21.2 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
| 21.2.4 | 21.2 | Gravação de relatórios em diferentes formatos | salvarRelatorio | N/A |
| 21.2.5 | 21.2 | Informações atualizadas | dataUltimaAtualizacao | Data |

## 21.3. Atas das Sessões

**Caminho URL: **[Portal da Transparencia]/Atividades/AtasSessoes

| Item | Critério(s) | Descrição | Atributo | Valor |
| 21.3.1 | 21.3 | Identificação da sessão | identificaSessao | Texto |
| 21.3.2 | 21.3 | Conteúdo da ata, com lista de presença dos parlamentares | conteudoAta | Texto \| Link |
| 21.3.3 | 21.3 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
| 21.3.4 | 21.3 | Gravação de relatórios em diferentes formatos | salvarRelatorio | N/A |
| 21.3.5 | 21.3 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 21.3.6 | 21.3 | Histórico (dos últimos 3 anos) das Informações | historicoExercicio | N/A |

## 21.4. Decisões/Julgamentos

**Caminho URL: **[Portal da Transparencia]/Atividades/Decisoes

| Item | Critério(s) | Descrição | Atributo | Valor |
| 21.4.1 | 21.4 | Identificação da decisão/julgamento | identificaDecisao | Texto |
| 21.4.2 | 21.4 | Conteúdo da decisão/julgamento | conteudoDecisao | Texto \| Link |
| 21.4.3 | 21.4 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
| 21.4.4 | 21.4 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 21.4.5 | 21.4 | Histórico (dos últimos 3 anos) das Informações | historicoExercicio | N/A |

## 21.5. Informativo de Jurisprudência

**Caminho URL: **[Portal da Transparencia]/Atividades/Informativo

| Item | Critério(s) | Descrição | Atributo | Valor |
| 21.5.1 | 21.5 | Coletânea das decisões mais relevantes do Tribunal | conteudoInformativo | Texto \| Link |
| 21.5.2 | 21.5 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
| 21.5.3 | 21.5 | Gravação de relatórios em diferentes formatos | salvarRelatorio | N/A |
| 21.5.4 | 21.5 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 21.5.5 | 21.5 | Histórico (dos últimos 3 anos) das Informações | historicoExercicio | N/A |

## 21.6 Transmissões

**Caminho URL: **[Portal da Transparencia]/Atividades

| Item | Critério(s) | Descrição | Atributo | Valor |
| 21.6.1 | 21.6 | Indicação da transmissão de julgamentos | transmissaoJulgamento | Texto \| Link |

## Exemplos

### Código HTML de exemplo para componente de pesquisa:

```
<div serigySchema="https://serigy.tce.se.gov.br/judiciario/atividades-finalisticas.html" serigyItem="filtroPesquisa">
  <!-- Outras seções HTML podem existir internamente -->
  <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
    <option serigyValue="2026">2026</option>
    <option serigyValue="2025">2025</option>
    <option serigyValue="2024">2024</option>
  </select>
  <button type="submit" serigyExecuteWaitSection="judiciarioTabela">Pesquisar</button>
</div>

```

### Código HTML para exibição de componente de formatos para exportação:

```
<div serigySchema="https://serigy.tce.se.gov.br/judiciario/atividades-finalisticas.html">
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
<table serigySchema="https://serigy.tce.se.gov.br/judiciario/atividades-finalisticas.html">
  <thead>
    <tr>
      <th>Magistrado</th>
      <th>Atuação</th>
    </tr>
    <!-- Outras seções HTML podem existir internamente -->
  </thead>
  <tbody>
    <tr>
      <td serigyItem="nomeMagistrado">Aline Kelly Ribeiro Marcovicz Lins</td>
      <td serigyItem="atuacaoMagistrado">
        Juiz(a) respondendo cumulativamente em 4ª Vara Criminal
        Juiz(a) titular em 6ª Vara Criminal
        Juiz(a) respondendo cumulativamente em NOVO AIRÃO / Vara Única
      </td>
    </tr>
    <!-- Outras seções HTML podem existir internamente -->
  </tbody>
</table>

```

### Código HTML para exibição das **Pautas das Sessões**:

```
<table serigySchema="https://serigy.tce.se.gov.br/judiciario/atividades-finalisticas.html">
  <thead>
    <tr>
      <th>Sessão</th>
      <th>Pauta(s)</th>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="identificaSessao">01/10/2024 - 5ª Câmara de Direito Público</td>
      <td serigyItem="pautaSessao"><a href="link/para/pautas">Acesso a(s) pauta(s)</a></td>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </tbody>
</table>

```

### Código HTML para exibição das **Atas das Sessões**:

```
<table serigySchema="https://serigy.tce.se.gov.br/judiciario/atividades-finalisticas.html">
  <thead>
    <tr>
      <th>Sessão</th>
      <th>Ata(s)/Presença em Plenário</th>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="identificaSessao">2ª Câmara de Direito Público (19/09/2024)</td>
      <td serigyItem="conteudoAta"><a href="link/para/atas">Acesso a(s) ata(s)</a></td>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </tbody>
</table>

```

### Código HTML para exibição das **Decisões/Julgamentos**:

```
<table serigySchema="https://serigy.tce.se.gov.br/judiciario/atividades-finalisticas.html">
  <thead>
    <tr>
      <th>Decisão/Julgamento</th>
      <th>Conteúdo</th>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="identificaDecisao">0811461-37.2021.8.14.0000 - ALTEMAR DA SILVA PAES - Seção de Direito Penal</td>
      <td serigyItem="conteudoDecisao"><a href="link/para/decisao/julgamento">Ver Detalhes</a></td>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </tbody>
</table>

```

### Código HTML para exibição dos **Informativos**:

```
<table serigySchema="https://serigy.tce.se.gov.br/judiciario/atividades-finalisticas.html">
  <thead>
    <tr>
      <th>Conteúdo</th>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="conteudoInformativo">
        <a href="link/para/informativos">Ver Detalhes</a>
      </td>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </tbody>
</table>

```

### Código HTML para exibição dos **Indicativos de Transmissões**:

```
<div serigySchema="https://serigy.tce.se.gov.br/judiciario/atividades-finalisticas.html">
  <p serigyItem="transmissaoJulgamento"><a href="youtube.com.br/transmissao">
    YouTube - Transmissão</a>
  </p>
  <p serigyItem="transmissaoJulgamento">
    Rádio - 103.1 FM
  </p>
  <!-- Outras seções HTML podem existir internamente -->
</div>

```

### Seção para informação de data de atualização das informações apresentadas:

```
<div serigySchema="https://serigy.tce.se.gov.br/judiciario/atividades-finalisticas.html" serigyItem="dataUltimaAtualizacao">
  Conjunto de informações atualizado em <b>27/04/2026</b> com dados até <b>26/04/2026</b>
</div>

```
