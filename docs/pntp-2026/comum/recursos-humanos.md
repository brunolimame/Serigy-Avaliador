# 6. Recursos Humanos

 

| Dimensão | Atributo | Valor | 
| Recursos Humanos | serigySchema | https://serigy.tce.se.gov.br/comum/recursos-humanos.html |
 

## 6.1. Folha de Pagamento / Remuneração Nominal

 **Caminho URL:**[Portal da Transparencia]/RecursosHumanos/FolhaPagamento 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 6.1.1 | 6.1, 6.2 | Nome completo dos servidores/autoridades/membros | nomeServidor | Texto | 
| 6.1.2 | 6.1, 6.2 | Cargo e/ou função ocupada/desempenhada | cargoServidor | Texto | 
| 6.1.3 | 6.2 | Salário | salarioServidor | Monetário | 
| 6.1.4 | 6.1 | Lotação (local de trabalho) | lotacaoServidor | Texto | 
| 6.1.5 | 6.1 | Data de admissão do servidor | admissaoServidor | Data | 
| 6.1.6 | 6.1 | Data de exoneração ou inativação (quando aplicável) | exoneracaoServidor | Data | 
| 6.1.7 | 6.1 | Carga horária prevista para o cargo e/ou função correspondente | cargaHoraria | Numérico | 
| 6.1.8 | 6.1, 6.2 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 6.1.9 | 6.1, 6.2 | Histórico, dos últimos 3 anos, de informações | historicoExercicio | Ano | 
| 6.1.10 | 6.1, 6.2 | Gravação de relatórios em diferentes formatos dos resultados da pesquisa | salvarRelatorio | N/A | 
| 6.1.11 | 6.1, 6.2 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
 

## 6.2. Padrão Remuneratório para Cargos e Funções

 **Caminho URL:**[Portal da Transparencia]/RecursosHumanos/PadraoRemuneratorio 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 6.2.1 | 6.3 | Cargos e/ou funções | cargo | Texto | 
| 6.2.2 | 6.3 | Valores de remuneração ou salário correspondentes | salario | Monetário | 
| 6.2.3 | 6.3 | Níveis, classes e/ou padrões salariais | descricao | Texto | 
| 6.2.4 | 6.3 | Informações atualizadas | dataUltimaAtualizacao | Data |
 

## 6.3. Estagiários

 **Caminho URL:** [Portal da Transparencia]/RecursosHumanos/Estagiarios 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 6.3.1 | 6.4 | Nome completo dos estudantes que mantêm contrato de estágio com a Unidade | nomeEstagiario | Texto | 
| 6.3.2 | 6.4 | Data de contratação do estagiário | admissaoEstagiario | Texto | 
| 6.3.3 | 6.4 | Data do término do contrato do estagiário | terminoEstagiario | Texto | 
| 6.3.4 | 6.4 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 6.3.5 | 6.4 | Histórico, dos últimos 3 anos, de informações | historicoExercicio | Ano | 
| 6.3.6 | 6.4 | Gravação de relatórios em diferentes formatos dos resultados da pesquisa | salvarRelatorio | N/A | 
| 6.3.7 | 6.4 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
 

## 6.4. Terceirizados

 **Caminho URL:** [Portal da Transparencia]/RecursosHumanos/Terceirizados 

| Item | Critério | Descrição | Atributo | Valor | 
| 6.4.1 | 6.5 | Nome completo do trabalhador de empresa terceirizada que presta serviço para a Unidade | nomeTerceirizado | Texto | 
| 6.4.2 | 6.5 | Função e/ou atividade exercida pelo terceirizado | funcaoTerceirizado | Texto | 
| 6.4.3 | 6.5 | Nome/razão social da empresa empregadora | empresaTerceirizado | Texto | 
| 6.4.4 | 6.5 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 6.4.5 | 6.5 | Histórico, dos últimos 3 anos, de informações | historicoExercicio | Ano | 
| 6.4.6 | 6.5 | Gravação de relatórios em diferentes formatos dos resultados da pesquisa | salvarRelatorio | N/A | 
| 6.4.7 | 6.5 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
 

## 6.5. Concurso

 **Caminho URL:** [Portal da Transparencia]/RecursosHumanos/Concurso 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 6.5.1 | 6.6 | Edital do concurso | editalConcurso | Link | 
| 6.5.2 | 6.7 | Lista ranqueada dos aprovados | aprovadosConcurso | Link \| Numérico | 
| 6.5.3 | 6.6, 6.7 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 6.5.4 | 6.6 | Histórico, dos últimos 3 anos, de informações | historicoExercicio | Ano | 
| 6.5.5 | 6.6, 6.7 | Pesquisa de informações com utilização de filtros | filtroPesquisa | N/A |
 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa de Recursos Humanos:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/recursos-humanos.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
     <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <span>
        <a serigyItem="salvarRelatorio" serigyValue="pdf">Salvar em PDF</a>
        <a serigyItem="salvarRelatorio" serigyValue="xls">Salvar em XLS</a>
        <a serigyItem="salvarRelatorio" serigyValue="xlsx">Salvar em XLSX</a>
        <a serigyItem="salvarRelatorio" serigyValue="ods">Salvar em ODS</a>
        <a serigyItem="salvarRelatorio" serigyValue="csv">Salvar em CSV</a>
        <a serigyItem="salvarRelatorio" serigyValue="json">Salvar em JSON</a>
    </span>
    <button type="submit" serigyExecuteWaitSection="folhaPagamentoTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição da pesquisa de **Folha de Pagamento**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/recursos-humanos.html" serigyLoadSection="folhaPagamentoTabela">
    <thead>
        <tr>
            <th>Nome</th>
            <th>Cargo</th>
            <th>Lotação</th>
            <th>Data de admissão</th>
            <th>Detalhes</th>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="nomeServidor">Maria</td>
            <td serigyItem="cargoServidor">Profª. Pedagoga</td>
            <td serigyItem="lotacaoServidor">EMEF Presidente Tancredo Neves</td>
            <td serigyItem="admissaoServidor">08/09/2023</td>
            <td serigyExecuteWaitSection="detalhe_1234">Ver detalhes</td>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição de detalhes da folha de pagamento do servidor:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/recursos-humanos.html" serigyLoadSection="detalhe_1234">
    <thead>
        <tr>
            <th>Carga Horária</th>
            <th>Salário</th>
            <th>Data de exoneração</th>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="cargaHoraria">30 hrs</td>
            <td serigyItem="salarioServidor">R$7.688,85</td>
            <td serigyItem="exoneracaoServidor" serigyEmpty="Servidor não exonerado">-</td>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição da pesquisa da **Tabela de Padrão Remuneratório para Cargos e Funções**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/recursos-humanos.html" serigyLoadSection="padraoRemuneratorio">
    <thead>
        <tr>
            <th>Cargo/Função</th>
            <th>Remuneração/Salário</th>
            <th>Nível/Classe/Padrão</th>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="cargo">Chefe de Gabinete</td>
            <td serigyItem="salario">R$ 14.201,76</td>
            <td serigyItem="descricao">Padrão I</td>
        </tr>
        <tr>
            <td serigyItem="cargo">Secretário Geral</td>
            <td serigyItem="salario">R$ 22.991,61</td>
            <td serigyItem="descricao">Nível 2</td>
        </tr>
        <tr>
            <td serigyItem="cargo">Analista Contábil</td>
            <td serigyItem="salario">R$ 9.875,00</td>
            <td serigyItem="descricao">Classe A</td>
        </tr>
        <!-- Outras seções HTML podem existir internamente -->
    </tbody>
</table>
```

### Código HTML para exibição de **Estagiários**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/recursos-humanos.html" serigyLoadSection="estagiarioTabela">
    <thead>
        <tr>
            <th>Nome</th>
            <th>Início do Contrato</th>
            <th>Termino do Contrato</th>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="nomeEstagiario">Maria José de Jesus</td>
            <td serigyItem="admissaoEstagiario">15/02/2023</td>
            <td serigyItem="terminoEstagiario">14/02/2024</td>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição de **Terceirizados**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/recursos-humanos.html" serigyLoadSection="terceirizadoTabela">
    <thead>
        <tr>
            <th>Nome</th>
            <th>Função</th>
            <th>Empresa</th>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="nomeTerceirizado">Maria</td>
            <td serigyItem="funcaoTerceirizado">Auxiliar de Secretaria</td>
            <td serigyItem="empresaTerceirizado">WS Soluções Corporativas Ltda</td>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição de **Concursos**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/recursos-humanos.html" serigyLoadSection="concursoTabela">
    <thead>
        <tr>
            <th>Edital</th>
            <th>Aprovados</th>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="editalConcurso">
                <a href="arquivos/edital.pdf">Concurso TCE</a>
            </td>
            <td serigyItem="aprovadosConcurso">
                <a href="arquivos/aprovados.pdf">Lista Ranqueada dos Aprovados</a>
            </td>
            <!-- Outras seções HTML podem existir internamente -->
        </tr>
    </tbody>
</table>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/recursos-humanos.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>15/04/2026</b> com dados até <b>14/04/2026</b>
</div>
```
