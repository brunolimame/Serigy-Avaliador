# 18. Saúde

 

| Dimensão | Atributo | Valor | 
| Saúde | serigySchema | https://serigy.tce.se.gov.br/executivo/saude.html |
 

## 18.1. Plano

 **Caminho URL:**[Portal da Transparencia]/Saude/Plano 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 18.1.1 | 18.1 | Plano de Saúde Estadual/Municipal | planoSaude | Anexo | 
| 18.1.2 | 18.1 | Programação Anual Estadual/Municipal de Saúde | programacaoAnual | Anexo | 
| 18.1.3 | 18.1 | Relatório de Gestão Estadual/Municipal de Saúde | relatorioGestao | Anexo | 
| 18.1.4 | 18.1 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 18.1.5 | 18.1 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 18.1.6 | 18.1 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |
 

## 18.2. Serviço

 **Caminho URL:**[Portal da Transparencia]/Saude/Servico 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 18.2.1 | 18.2 | Local em que o profissional atua | nomeHospital | Texto | 
| 18.2.2 | 18.2 | Horários de atendimento | horarioAtendimento | Texto | 
| 18.2.3 | 18.2 | Nome do profissional prestador de serviço | nomeProfissional | Texto | 
| 18.2.4 | 18.2 | Especialidade(s) | especialidade | Texto | 
| 18.2.5 | 18.2 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 18.2.6 | 18.2 | Informações atualizadas | dataUltimaAtualizacao | Data |
 

## 18.3. Lista de Espera

 **Caminho URL:**[Portal da Transparencia]/Saude/ListaEspera 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 18.3.1 | 18.3 | Lista de espera de regulação para acesso às consultas, exames e serviços médicos | listaEspera | Anexo |
 

## 18.4. Medicamentos Fornecidos pelo SUS e de Alto Custo

 **Caminho URL:**[Portal da Transparencia]/Saude/Medicamento/AltoCusto 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 18.4.1 | 18.4 | Lista dos medicamentos a serem fornecidos pelo SUS | listaMedicamentoSus | Anexo | 
| 18.4.2 | 18.4 | Documentação necessária para obtenção dos medicamentos de alto custo | documentacaoAltoCusto | Texto | 
| 18.4.3 | 18.4 | Locais de solicitação dos medicamentos de alto custo | localAltoCusto | Texto | 
| 18.4.4 | 18.4 | Passo-a-passo do processo para obtenção dos medicamentos de alto custo | passoAltoCusto | Texto | 
| 18.4.5 | 18.4 | Canais de suporte para esclarecimentos sobre o andamento das solicitações | canalAltoCusto | Texto | 
| 18.4.6 | 18.4 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 18.4.7 | 18.4 | Informações atualizadas | dataUltimaAtualizacao | Data |
 

## 18.5. Estoques de Medicamentos das Farmácias Públicas

 **Caminho URL:**[Portal da Transparencia]/Saude/Medicamento/Estoque 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 18.5.1 | 18.5 | Nome do medicamento | medicamento | Texto | 
| 18.5.2 | 18.5 | Quantidade total disponível do medicamento | quantidadeMedicamentoTotal | Numérico | 
| 18.5.3 | 18.5 | Quantidade disponível em cada unidade ou ponto de dispensação | quantidadeMedicamentoUnidade | Numérico | 
| 18.5.4 | 18.5 | Unidade de saúde ou ponto de dispensação | unidade | Texto | 
| 18.5.5 | 18.5 | Endereço da unidade de saúde ou ponto de dispensação | enderecoUnidade | Texto | 
| 18.5.6 | 18.5 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 18.5.7 | 18.5 | Informações atualizadas | dataUltimaAtualizacao | Data |
 

## 18.6. Conselho de Saúde

 **Caminho URL:**[Portal da Transparencia]/Saude/Conselho 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 18.6.1 | 18.6 | Nomes dos atuais conselheiros de Saúde | nomeConselheiro | Texto | 
| 18.6.2 | 18.6 | Respectivas unidades ou segmentos que representam | segmentoConselheiro | Texto | 
| 18.6.3 | 18.6 | Correio eletrônico ou outro canal de contato direto com o Conselho da Saúde | contatoConselho | Texto |
 

## 18.7. Atas do Conselho de Saúde

 **Caminho URL:**[Portal da Transparencia]/Saude/Atas 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 18.7.1 | 18.6 | Atas das reuniões realizadas pelo Conselho de Saúde | ataReuniaoSaude | Anexo |
 

## 18.8. Relatórios do Conselho de Saúde

 **Caminho URL:**[Portal da Transparencia]/Saude/Relatorios 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 18.8.1 | 18.6 | Relatórios e pareceres emitidos do Conselho de Saúde | relatorioSaude | Anexo |
 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="reset" serigyClearForm>Limpar Filtros</button>
    <button type="submit" serigyExecuteWaitSection="saudeTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição do **Plano Estadual/Municipal de Saúde**:

 

```
<ul serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html">
    <li serigyItem="planoSaude">
        <a href="link/para/documento">
            PLANO MUNICIPAL DE SAÚDE, 2022-2025
        </a>
    </li>
    <li serigyItem="programacaoAnual">
        <a href="link/para/documento">
            PROGRAMAÇÃO ANUAL DE SAÚDE - 2023
        </a>
    </li>
    <li serigyItem="relatorioGestao">
        <a href="link/para/documento">
            RELATÓRIO DE GESTÃO - 2023
        </a>
    </li>
</ul>
```

### Código HTML para exibição do **Plano Estadual/Municipal de Saúde** sem registros:

 

```
<ul serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html">
    <li serigyItem="planoSaude" serigyEmpty="motivo de não existir">
        <a>-</a>
    </li>
    <li serigyItem="programacaoAnual" serigyEmpty="motivo de não existir">
        <a>-</a>
    </li>
    <li serigyItem="relatorioGestao" serigyEmpty="motivo de não existir">
        <a>-</a>
    </li>
</ul>
```

### Código HTML para exibição de **Prestadores de Serviço**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html" serigyLoadSection="profissionaisTabela">
    <thead>
        <tr>
            <th>Especialidade(s)</th>
            <th>Profissional</th>
            <th>Local</th>
            <th>Horários</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="especialidade">FISIOTERAPIA</td>
            <td serigyItem="nomeProfissional">Bruna Capobiango Fernandes</td>
            <td serigyItem="nomeHospital">US III SÃO JOSÉ AGUIA BRANCA</td>
            <td serigyItem="horarioAtendimento">
                <ul>
                    <li>
                        Segunda à quinta - 09:00 às 14:00
                    </li>
                    <li>
                        Sexta - 09:00 às 12:00
                    </li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição da **Lista de Espera**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html" serigyItem="listaEspera" href="link/para/arquivo">
    Lista de espera de Regulação Municipal
</a>
```

### Código HTML para exibição de **Medicamentos Fornecidos pelo SUS e de Alto Custo**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html">
    <a serigyItem="listaMedicamentoSus" href="link/para/arquivo">
        Lista de Medicamentos Fornecida pelo SUS.pdf
    </a>

    <div serigyItem="passoAltoCusto">
        <span>Como obter medicamentos de alto custo disponibilizados pelo SUS:</span>
        <ol>
            <li serigyItem="documentacaoAltoCusto">
                A documentação exigida geralmente inclui:
                    - Laudo de Solicitação, Avaliação e Autorização de Medicamentos (LME), ...
            </li>
            <li serigyItem="localAltoCusto">
                Rua Coronel João Augusto, 49 - Centro, Antônio Cardoso, 44180-000
            </li>
            <li serigyItem="canalAltoCusto">
                (12) 3456-7890
            </li>
        </ol>
    </div>
</div>
```

### Código HTML para exibição de **Estoque**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html" serigyLoadSection="estoqueTabela">
    <thead>
        <tr>
            <th>Medicamento</th>
            <th>Estoque</th>
            <th>Detalhes</th>
        </tr>
    </thead>
    <tbody>
        <!-- Dados referentes a certa linha da tabela -->
        <tr>
            <td serigyItem="medicamento">ACICLOVIR COMPRIMIDO 200 MG</td>
            <td serigyItem="quantidadeMedicamentoTotal">260.377</td>
            <td serigyExecuteWaitSection="detalhe_123">+</td>
        </tr>
        <tr>
            <td serigyItem="medicamento">AGULHA DE IRRIGAÇÃO ENDODÔNTICA</td>
            <td serigyItem="quantidadeMedicamentoTotal">0</td>
            <td serigyExecuteWaitSection="detalhe_124">+</td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição de detalhes do **Estoque**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html" serigyLoadSection="detalhe_123">
    <thead>
        <tr>
            <th>Unidade</th>
            <th>Endereço</th>
            <th>Quantidade</th>
        </tr>
    </thead>
    <tbody>
        <!-- Dados referentes a certa linha da tabela -->
        <tr>
            <td serigyItem="unidade">FARMÁCIA - UBS 13 CASA GRANDE (RURAL) - GAMA</td>
            <td serigyItem="enderecoUnidade">Rua Maria Jose, 123</td>
            <td serigyItem="quantidadeMedicamentoUnidade">1.093</td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição de informações do **Conselho de Saúde**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html" serigyLoadSection="conselhoTabela">
    <thead>
        <tr>
            <th>Conselheiro(a)</th>
            <th>Segmento</th>
        </tr>
    </thead>
    <tbody>
        <!-- Dados referentes a certa linha da tabela -->
        <tr>
            <td serigyItem="nomeConselheiro">José Francisco dos Santos</td>
            <td serigyItem="segmentoConselheiro">Representante Suplente do Poder Executivo Estadual</td>
        </tr>
    </tbody>
</table>

<div serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html" serigyItem="contatoConselho">
    Contato: conselho@prefeitura.com
</div>
```

### Código HTML para exibição das **Atas do Conselho de Saúde**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html" serigyItem="ataReuniaoSaude" href="anexo/ata">
    ATA DA SEXTA SESSÃO ORDINÁRIA DE 2023
</a>
```

### Código HTML para exibição dos **Relatórios da Fundeb**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html" serigyItem="relatorioSaude" href="anexo/relatorio">
    RELATÓRIO DE VISITA TÉCNICA AO HOSPITAL ESTADUAL ALMIRANTE BARROSO EM MURIBECA
</a>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/saude.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>23/04/2026</b> com dados até <b>22/04/2026</b>.
</div>
```
