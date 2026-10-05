# 19. Educação e Assistência Social

 

| Dimensão | Atributo | Valor | 
| Educação e Assistência Social | serigySchema | https://serigy.tce.se.gov.br/executivo/educacao.html |
 

## 19.1. Plano

 **Caminho URL:**[Portal da Transparencia]/Educacao/Plano 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 19.1.1 | 19.1 | Plano de educação | planoEducacao | Anexo | 
| 19.1.2 | 19.1 | Relatório de resultados | resultadoPlanoEducacao | Anexo | 
| 19.1.3 | 19.1 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 19.1.4 | 19.1 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 19.1.5 | 19.1 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |
 

## 19.2. Lista de Espera das Creches

 **Caminho URL:**[Portal da Transparencia]/Educacao/ListaEspera 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 19.2.1 | 19.2 | Identificação da criança | identificaCrianca | Nome \| CPF | 
| 19.2.2 | 19.2 | Nome da creche pública | nomeCreche | Nome | 
| 19.2.3 | 19.2 | Posição da prioridade na lista de espera da creche pública | posicaoListaEspera | Numérico | 
| 19.2.4 | 19.2 | Informações atualizadas | dataUltimaAtualizacao | Data |
 

## 19.3. Conselho da Fundeb

 **Caminho URL:**[Portal da Transparencia]/Educacao/Fundeb/Conselho 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 19.3.1 | 19.3 | Nomes dos atuais conselheiros da Fundeb | nomeConselheiro | Texto | 
| 19.3.2 | 19.3 | Respectivas unidades ou segmentos que representam | segmentoConselheiro | Texto | 
| 19.3.3 | 19.3 | Correio eletrônico ou outro canal de contato direto com o Conselho da Fundeb | contatoConselho | Texto |
 

## 19.4. Atas da Fundeb

 **Caminho URL:**[Portal da Transparencia]/Educacao/Fundeb/Atas 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 19.4.1 | 19.3 | Atas das reuniões realizadas pela Fundeb | ataReuniaoFundeb | Anexo |
 

## 19.5. Relatórios da Fundeb

 **Caminho URL:**[Portal da Transparencia]/Educacao/Fundeb/Relatorios 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 19.5.1 | 19.3 | Relatórios e pareceres emitidos da Fundeb | relatorioFundeb | Anexo |
 

## 19.6. Conselho de Assistência Social

 **Caminho URL:**[Portal da Transparencia]/Educacao/AssistenciaSocial/Conselho 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 19.6.1 | 19.4 | Nomes dos atuais conselheiros da Assistência Social | nomeConselheiro | Texto | 
| 19.6.2 | 19.4 | Respectivas unidades ou segmentos que representam | segmentoConselheiro | Texto | 
| 19.6.3 | 19.4 | Correio eletrônico ou outro canal de contato direto com o Conselho da Assistência Social | contatoConselho | Texto |
 

## 19.7. Atas da Assistência Social

 **Caminho URL:**[Portal da Transparencia]/Educacao/AssistenciaSocial/Atas 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 19.7.1 | 19.4 | Atas das reuniões realizadas pela Assistência Social | ataReuniaoAssistenciaSocial | Anexo |
 

## 19.8. Relatórios da Assistência Social

 **Caminho URL:**[Portal da Transparencia]/Educacao/AssistenciaSocial/Relatorios 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 19.8.1 | 19.4 | Relatórios e pareceres emitidos da Assistência Social | relatorioAssistenciaSocial | Anexo |
 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/educacao.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="reset" serigyClearForm>Limpar Filtros</button>
    <button type="submit" serigyExecuteWaitSection="educacaoTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição do **Plano de Educação**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/educacao.html" serigyLoadSection="educacaoTabela">
    <thead>
        <tr>
            <th>Plano</th>
            <th>Resultados</th>
        </tr>
    </thead>
    <tbody>
        <!-- Dados referentes a certa linha da tabela -->
        <tr>
            <td serigyItem="planoEducacao">
                Lei do Plano Estadual de Educação do Tocantins PEE/TO (2015-2025)
            </td>
            <td serigyItem="resultadoPlanoEducacao">
                <ul>
                    <li>
                        <a href="link/para/documento">
                            Relatório do 1º Ciclo de Monitoramento e Avaliação
                        </a>
                    </li>
                    <li>
                        <a href="link/para/documento">
                            Relatório do 2º Ciclo de Monitoramento e Avaliação
                        </a>
                    </li>
                    <li>
                        <a href="link/para/documento">
                            Relatório do 3º Ciclo de Monitoramento e Avaliação
                        </a>
                    </li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição do **Plano de Educação sem registros**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/educacao.html" serigyLoadSection="educacaoTabela">
    <thead>
        <tr>
            <th>Plano</th>
            <th>Resultados</th>
        </tr>
    </thead>
    <tbody>
        <!-- Dados referentes a certa linha da tabela -->
        <tr>
            <td serigyEmpty="Motivo de não existir conteúdo" serigyItem="planoEducacao">-</td>
            <td serigyEmpty="Motivo de não existir conteúdo" serigyItem="resultadoPlanoEducacao">-</td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição da **Lista de Espera da Creche Pública**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/educacao.html" serigyLoadSection="listaEsperaTabela">
    <thead>
        <tr>
            <th>Classificação</th>
            <th>Criança</th>
            <th>Cheche</th>
        </tr>
    </thead>
    <tbody>
        <!-- Dados referentes a certa linha da tabela -->
        <tr>
            <td serigyItem="posicaoListaEspera">10ª</td>
            <td serigyItem="identificaCrianca">JOÃO C. M. C.</td>
            <td serigyItem="nomeCreche">ASSOCIAÇÃO E CRECHE PRIMEIRO IMPÉRIO</td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição de informações do **Conselho da Fundeb**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/executivo/educacao.html" serigyLoadSection="conselhoTabela">
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

<div serigySchema="https://serigy.tce.se.gov.br/executivo/educacao.html" serigyItem="contatoConselho">
    Contato: conselho@prefeitura.com
</div>
```

### Código HTML para exibição das **Atas da Fundeb**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/executivo/educacao.html" serigyItem="ataReuniaoFundeb" href="anexo/ata">
    ATA DA SEXTA SESSÃO ORDINÁRIA DO CACS FUNDEB-SE DE 2023
</a>
```

### Código HTML para exibição dos **Relatórios da Fundeb**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/executivo/educacao.html" serigyItem="relatorioFundeb" href="anexo/relatorio">
    RELATÓRIO DE VISITA TÉCNICA AO COLÉGIO ESTADUAL ALMIRANTE BARROSO EM MURIBECA
</a>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/executivo/educacao.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>22/04/2026</b> com dados até <b>21/04/2026</b>
</div>
```
