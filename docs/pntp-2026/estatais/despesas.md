# 4. Despesas

| Dimensão | Atributo | Valor |
| Despesas | serigySchema | https://serigy.tce.se.gov.br/estatais/despesas.html |

## 4.2. Aquisições

**Caminho URL: **[Portal da Transparencia]/Despesas/Aquisicoes

| Item | Critério(s) | Descrição | Atributo | Valor |
| 4.2.1 | 4.4 | Identificação do bem | identificacaoBem | Texto \| Numérico |
| 4.2.2 | 4.4 | Preço unitário | precoUnitario | Monetário |
| 4.2.3 | 4.4 | Quantidade | quantidade | Numérico |
| 4.2.4 | 4.4 | Nome do fornecedor | nomeFornecedor | Texto |
| 4.2.5 | 4.4 | Valor total de cada aquisição | valorTotal | Monetário |
| 4.2.6 | 4.4 | Ferramenta de pesquisa específica | filtroPesquisa | N/A |
| 4.2.7 | 4.4 | Gravação de relatórios em diversos formatos | salvarRelatorio | N/A |
| 4.2.8 | 4.4 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 4.2.9 | 4.4 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |

## 4.3. Patrocínio

**Caminho URL: **[Portal da Transparencia]/Despesas/Patrocinio

| Item | Critério(s) | Descrição | Atributo | Valor |
| 4.3.1 | 4.5 | Identificação do projeto ou iniciativa patrocinada | identificaPatrocinio | Texto \| Numérico |
| 4.3.2 | 4.5 | Nome do beneficiado | nomeBeneficiado | Texto |
| 4.3.3 | 4.5 | CNPJ do beneficiado | cnpjBeneficiado | Numérico |
| 4.3.4 | 4.5 | Valor total do patrocínio concedido | valorTotalPatrocinio | Monetário |
| 4.3.5 | 4.5 | Inteiro teor do instrumento jurídico que formaliza o patrocínio (contrato, convênio, acordo, termo etc.) | anexoPatrocinio | Anexo |
| 4.3.6 | 4.5 | Ferramenta de pesquisa específica | filtroPesquisa | N/A |
| 4.3.7 | 4.5 | Gravação de relatórios em diversos formatos | salvarRelatorio | N/A |
| 4.3.8 | 4.5 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 4.3.9 | 4.5 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |

## 4.4. Publicidade

**Caminho URL: **[Portal da Transparencia]/Despesas/Publicidade

| Item | Critério(s) | Descrição | Atributo | Valor |
| 4.4.1 | 4.6 | Nome do fornecedor de serviço especializado | nomeFornecedor | Texto |
| 4.4.2 | 4.6 | Nome do meio/veículo de divulgação | nomeVeiculo | Texto |
| 4.4.3 | 4.6 | Total de valor pago para cada tipo de serviço | valorTotal | Monetário |
| 4.4.4 | 4.6 | Ferramenta de pesquisa específica | filtroPesquisa | N/A |
| 4.4.5 | 4.6 | Gravação de relatórios em diversos formatos | salvarRelatorio | N/A |
| 4.4.6 | 4.6 | Informações atualizadas | dataUltimaAtualizacao | Data |
| 4.4.7 | 4.6 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |

## Exemplos

### Código HTML para pesquisa de despesas:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais/despesas.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="submit" serigyExecuteWaitSection="despesasTabela">Pesquisar</button>
</div>

```

### Código HTML para exibição de componente de formatos para exportação:

```
<div serigySchema="https://serigy.tce.se.gov.br/estatais/despesas.html">
    Salvar em:
    <a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>
    <a serigyItem="salvarRelatorio" serigyValue="xls">XLS</a>
    <a serigyItem="salvarRelatorio" serigyValue="xlsx">XLSX</a>
    <!-- Outras seções HTML podem existir internamente -->
</div>

```

### Código HTML para exibição da pesquisa de **Aquisições**:

```
<table serigySchema="https://serigy.tce.se.gov.br/estatais/despesas.html" serigyLoadSection="aquisicaoTabela">
    <thead>
        <tr>
            <th>Id</th>
            <th>Fornecedor</th>
            <th>Quantidade</th>
            <th>Preço Unitário</th>
            <th>Valor Total</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="identificacaoBem">202200031001370</td>
            <td serigyItem="nomeFornecedor">FACILLITA SOLUÇÕES CORPORATIVAS LTDA</td>
            <td serigyItem="quantidade">10</td>
            <td serigyItem="precoUnitario">R$ 1.369</td>
            <td serigyItem="valorTotal">R$ 13.690</td>
        </tr>
    </tbody>
</table>

```

### Código HTML para exibição da pesquisa de **Patrocínio**:

```
<table serigySchema="https://serigy.tce.se.gov.br/estatais/despesas.html" serigyLoadSection="patrocinioTabela">
    <thead>
        <tr>
            <th>Id</th>
            <th>Beneficiário</th>
            <th>CNPJ</th>
            <th>Valor Total</th>
            <th>Anexo</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="identificaPatrocinio">2022/152</td>
            <td serigyItem="nomeBeneficiado">Associação Brasileira do Biogás e do Biometano - ABIOGÁS</td>
            <td serigyItem="cnpjBeneficiado">01.234.567/0001-89</td>
            <td serigyItem="valorTotalPatrocinio">R$ 10.000</td>
            <td serigyItem="anexoPatrocinio">
                <a href="caminho/arquivo">Anexo Patrocínio 2022/152</a>
            </td>
        </tr>
    </tbody>
</table>

```

### Código HTML para exibição da pesquisa de **Publicidade**:

```
<table serigySchema="https://serigy.tce.se.gov.br/estatais/despesas.html" serigyLoadSection="publicidadeTabela">
    <thead>
        <tr>
            <th>Fornecedor</th>
            <th>Meio/Veículo</th>
            <th>Valor Total</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="nomeFornecedor">ZIAD A. FARES PUBLICIDADE</td>
            <td serigyItem="nomeVeiculo">TV BAND - GOIANA</td>
            <td serigyItem="valorTotal">r$ 38.027,99</td>
        </tr>
    </tbody>
</table>

```

### Seção para informação de data de atualização das informações apresentadas:

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/licitacoes.html" serigyItem="dataUltimaAtualizacao">
  Conjunto de informações atualizado em <b>04/05/2026</b> com dados até <b>03/05/2026</b>.
</div>

```
