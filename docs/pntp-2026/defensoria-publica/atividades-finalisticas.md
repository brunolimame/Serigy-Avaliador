# 24. Atividades Finalísticas

| Dimensão | Atributo | Valor |
| Atividades Finalísticas | serigySchema | https://serigy.tce.se.gov.br/defensoria-publica/atividades-finalisticas.html |

## 24.1. Composição da Casa

**Caminho URL: **[Portal da Transparencia]/Atividades/ComposicaoCasa

| Item | Critério(s) | Descrição | Atributo | Valor |
| 24.1.1 | 24.1 | Nome do membro | nomeMembro | Nome |
| 24.1.2 | 24.1 | Indicação de onde cada membro atua | atuacaoMembro | Texto |

## 24.2. Material Informativo

**Caminho URL: **[Portal da Transparencia]/Atividades/Informativo

| Item | Critério(s) | Descrição | Atributo | Valor |
| 24.2.1 | 24.2 | Informações técnicas (Cartilhas/boletins informativos a respeito dos direitos dos cidadãos nas mais diversas áreas; Identificação dos requisitos necessários para atendimento pela Defensoria; Documentos exigidos para o atendimento pelo Órgão; ...) | informativo | Texto \| Anexo |
| 24.2.2 | 24.2 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
| 24.2.3 | 24.2 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 24.2.4 | 24.2 | Histórico (dos últimos 3 anos) das Informações | historicoExercicio | N/A |
| 24.2.5 | 24.2 | Gravação de relatórios em diferentes formatos | salvarRelatorio | N/A |

## 24.3. Informações de Atendimento

**Caminho URL: **[Portal da Transparencia]/Atividades/Atendimento

| Item | Critério(s) | Descrição | Atributo | Valor |
| 24.3.1 | 24.3 | Serviços disponíveis no atendimento | servicoAtendimento | Texto |
| 24.3.2 | 24.3 | Endereço presencial para atendimento | enderecoAtendimento | Texto |
| 24.3.3 | 24.3 | Horário em que o atendimento está disponível | horarioAtendimento | Hora |
| 24.3.4 | 24.3 | Contatos (e-mail e/ou telefone) para atendimento não presencial | contatoAtendimento | Texto |

## Exemplos

### Código HTML de exemplo para componente de pesquisa:

```
<div serigySchema="https://serigy.tce.se.gov.br/defensoria-publica/atividades-finalisticas.html" serigyItem="filtroPesquisa">
  <!-- Outras seções HTML podem existir internamente -->
  <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
    <option serigyValue="2026">2026</option>
    <option serigyValue="2025">2025</option>
    <option serigyValue="2024">2024</option>
  </select>
  <button type="submit" serigyExecuteWaitSection="defensoriaPublicaTabela">Pesquisar</button>
</div>

```

### Código HTML para exibição da **Composição da Casa**:

```
<table serigySchema="https://serigy.tce.se.gov.br/defensoria-publica/atividades-finalisticas.html">
  <thead>
    <tr>
      <th>Membro</th>
      <th>Atuação</th>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <td serigyItem="nomeMembro">Nilton Leonel Arnecke Maria</td>
      <td serigyItem="atuacaoMembro">Defensor Público-Geral do Estado</td>
      <!-- Outras seções HTML podem existir internamente -->
    </tr>
  </tbody>
</table>

```

### Código HTML para exibição dos **Materiais Informativos**:

```
<div serigySchema="https://serigy.tce.se.gov.br/defensoria-publica/atividades-finalisticas.html">
  <a serigyItem="informativo">Documentos exigidos para o atendimento pelo Órgão</a>
</div>

```

### Código HTML para exibição dos **Serviços de Atendimento**:

```
<div serigySchema="https://serigy.tce.se.gov.br/defensoria-publica/atividades-finalisticas.html">
  <p serigyItem="servicoAtendimento">Cível - Compreende o ajuizamento de ações que discutem em geral direitos patrimoniais,...</p>
  <p serigyItem="servicoAtendimento">Saúde - A Defensoria Pública tem destacada atuação também na defesa do direito social ...</p>
  <p serigyItem="servicoAtendimento">...</p>
</div>

```

### Código HTML para exibição das **Informações sobre Atendimento**:

```
<div serigySchema="https://serigy.tce.se.gov.br/defensoria-publica/atividades-finalisticas.html">
  <p serigyItem="enderecoAtendimento">
    Logadouro: Avenida Governador Jorge Teixeira N° 1722
    Bairro: EMBRATEL
    CEP: 76820-846
  </p>
  <p serigyItem="horarioAtendimento">
    Horário de Atendimento: Das 07h30min às 13h30min
  </p>
  <p serigyItem="contatoAtendimento">
    Telefone: (69) 9994-64291
    Email: balcaovirtual@defensoria.ro.def.br
  </p>
  <!-- Outras seções HTML podem existir internamente -->
</div>

```

### Seção para informação de data de atualização das informações apresentadas:

```
<div serigySchema="https://serigy.tce.se.gov.br/defensoria-publica/atividades-finalisticas.html" serigyItem="dataUltimaAtualizacao">
  Conjunto de informações atualizado em <b>27/04/2026</b> com dados até <b>27/04/2026</b>
</div>

```
