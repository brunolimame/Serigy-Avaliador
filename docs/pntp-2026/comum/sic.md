# 12. Serviço de Informação ao Cidadão - SIC

 

| Dimensão | Atributo | Valor | 
| SIC | serigySchema | https://serigy.tce.se.gov.br/comum/sic.html |
 

## 12.1. Informações SIC (Presencial)

 **Caminho URL:**[Portal da Transparencia]/SIC/Detalhe 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 12.1.1 | 12.1 | Unidade/setor responsável | setorResponsavel | Texto | 
| 12.1.2 | 12.2 | Endereço físico do setor responsável | enderecoSetor | Endereço | 
| 12.1.3 | 12.2 | Telefone do setor responsável | telefoneSetor | Numérico | 
| 12.1.4 | 12.2 | E-mail do setor responsável | emailSetor | E-mail | 
| 12.1.5 | 12.2 | Horário de funcionamento do setor responsável | horarioFuncionamentoSetor | Hora |
 

## 12.2.1. Redirecionamento do Formulário de Cadastro do e-SIC para Solicitação de Informação

 **Caminho URL:**[Portal da Transparencia]/SIC/eSIC 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 12.2.1.1 | 12.3, 12.4 | Campo para cadastro do e-SIC | cadastroESIC | N/A | 
| 12.2.1.2 | 12.3, 12.4 | serigyLink atribuindo como valor o link de redirecionamento para a plataforma Fala.BR, disponível em: https://falabr.cgu.gov.br | Link para cadastro | Link |
 

## 12.2.2. Formulário de Cadastro no e-SIC para Solicitação de Informação

 **Caminho URL:**[Portal da Transparencia]/SIC/eSIC/Cadastro 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 12.2.2.1 | 12.3, 12.4 | Formulário com campos básicos para cadastro do e-SIC | cadastroESIC | N/A | 
| 12.2.2.2 | 12.3, 12.4 | Campo de Nome Completo | nomeCadastro | Texto | 
| 12.2.2.3 | 12.3, 12.4 | Campo de E-mail | emailCadastro | E-mail | 
| 12.2.2.4 | 12.3, 12.4 | Conteúdo do pedido | conteudoPedido | Texto |
 

**ℹ️ NOTE¹:** Se tiver o Formulário de Cadastro no próprio portal, usar o 12.2.2 Caso redirecione para o site do gov.br, utilizar o 12.2.1

 

**ℹ️ NOTE²:** Se escolhido o 12.2.2, a identificação do solicitante não pode ser condicionada a exigências, ainda que acessórias, que possam inviabilizar o pedido, tais como: envio de documentos, assinatura reconhecida, declaração de responsabilidade ou maioridade etc.

 

## 12.3. LAI

 **Caminho URL:**[Portal da Transparencia]/SIC/LAI 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 12.3.1 | 12.5 | Instrumento normativo local que regulamente a Lei nº 12.527/2011 - LAI | lai | Texto \| Link |
 

## 12.4. Informações e-SIC

 **Caminho URL:**[Portal da Transparencia]/SIC/eSIC 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 12.4.1 | 12.6 | Prazos de resposta ao cidadão | prazoResposta | Texto | 
| 12.4.2 | 12.6 | Recursal | recursal | Texto | 
| 12.4.3 | 12.6 | Autoridades competentes para o exame dos pedidos | autoridadeExame | Texto | 
| 12.4.4 | 12.6 | Procedimento referente à realização do pedido e de eventual recurso | procedimentoPedido | Texto |
 

## 12.5. Relatório Anual Estatístico

 **Caminho URL:**[Portal da Transparencia]/SIC/RelatorioAnualEstatistico 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 12.5.1 | 12.7 | Pedidos de acesso recebidos | pedidosRecebidos | Numérico | 
| 12.5.2 | 12.7 | Pedidos atendidos | pedidosAtendidos | Numérico | 
| 12.5.3 | 12.7 | Pedidos indeferidos | pedidosIndeferidos | Numérico | 
| 12.5.4 | 12.7 | Quaisquer informações genéricas sobre os solicitantes | infoGenericas | N/A | 
| 12.5.5 | 12.7 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 12.5.6 | 12.7 | Gravação de relatórios em diversos formatos | salvarRelatorio | N/A | 
| 12.5.7 | 12.7 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 12.5.8 | 12.7 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |
 

## 12.6. Informações Classificadas e Desclassificadas

 **Caminho URL:**[Portal da Transparencia]/SIC/Classificadas 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 12.6.1 | 12.8 | Grau de sigilo | grauSigilo | Texto | 
| 12.6.2 | 12.8 | Assunto sobre o qual versa a informação | assuntoClassificado | Texto | 
| 12.6.3 | 12.8 | Categoria na qual se encontra (ultrassecreto, secreto, reservado) | categoriaClassificado | Texto | 
| 12.6.4 | 12.8 | Dispositivo legal que fundamenta a classificação | dispositivoClassificado | Texto | 
| 12.6.5 | 12.8 | Respectivo prazo de sigilo, contado em anos, meses ou dias, ou do evento que defina o seu termo final | prazoClassificado | Texto | 
| 12.6.6 | 12.9 | Informação antes classificada como sigilosa/secreta e que passou a ficar disponível em razão do decurso do prazo | informacaoDesclassificada | Texto | 
| 12.6.7 | 12.8, 12.9 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 12.6.8 | 12.8, 12.9 | Gravação de relatórios em diversos formatos | salvarRelatorio | N/A | 
| 12.6.9 | 12.8, 12.9 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 12.6.10 | 12.8, 12.9 | Histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |
 

## Exemplo

 

### Código HTML de exemplo para componente de pesquisa de **Desclassificados**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/sic.html" serigyItem="filtroPesquisa">
    <!-- Outras seções HTML podem existir internamente -->
     <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="submit" serigyExecuteWaitSection="sicTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição de componente de formatos para exportação:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/sic.html">
     Salvar em:
     <a serigyItem="salvarRelatorio" serigyValue="pdf">PDF</a>
     <a serigyItem="salvarRelatorio" serigyValue="xls">XLS</a>
     <a serigyItem="salvarRelatorio" serigyValue="xlsx">XLSX</a>
     <a serigyItem="salvarRelatorio" serigyValue="ods">ODS</a>
     <a serigyItem="salvarRelatorio" serigyValue="csv">CSV</a>
     <a serigyItem="salvarRelatorio" serigyValue="json">JSON</a>
</div>
```

### Código HTML para exibição de **Informações do SIC (Presencial)**

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/sic.html">
    <p><b>Setor responsável:</b> 
        <span serigyItem="setorResponsavel">Ouvidoria Geral do Município</span>
    </p>
    <p><b>Endereço:</b> 
        <span serigyItem="enderecoSetor">Rua Exemplo, 123 - Centro, Aracaju/SE</span>
    </p>
    <p><b>Telefone:</b> 
        <span serigyItem="telefoneSetor">(79) 1234-5678</span>
    </p>
    <p><b>E-mail:</b> 
        <span serigyItem="emailSetor">sic@prefeitura.se.gov.br</span>
    </p>
    <p><b>Horário de funcionamento:</b> 
        <span serigyItem="horarioFuncionamentoSetor">Segunda a sexta, das 08h às 14h</span>
    </p>
</div>
```

### Código HTML para **Redirecionamento para o Fala.BR**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/sic.html">
    <a serigyItem="cadastroESIC"  serigyLink="https://falabr.cgu.gov.br" href="https://falabr.cgu.gov.br">
        Acessar sistema e-SIC (Fala.BR)
    </a>
</div>
```

### Código HTML para **Formulário próprio (quando NÃO usa Fala.BR)**:

 

```
<form serigySchema="https://serigy.tce.se.gov.br/comum/sic.html" serigyItem="cadastroESIC">
    
    <label>Nome:</label>
    <input type="text" serigyItem="nomeCadastro">

    <label>E-mail:</label>
    <input type="email" serigyItem="emailCadastro">

    <label>Pedido:</label>
    <textarea serigyItem="conteudoPedido"></textarea>

    <button type="submit">Enviar</button>

    <!-- Está aderente ao critério 12.4 (sem exigir documentos, validações abusivas etc.) -->
</form>
```

### Código HTML de exemplo para **LAI (Instrumento normativo)**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/sic.html">
    <a serigyItem="lai" href="/legislacao/decreto-lai.pdf">
        Decreto Municipal que regulamenta a Lei de Acesso à Informação
    </a>
</div>
```

### Código HTML de exemplo para **Informações sobre o e-SIC**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/sic.html">
    <p>
        <b>Prazos de resposta:</b>
        <span serigyItem="prazoResposta">
            Até 20 dias, prorrogáveis por mais 10 dias mediante justificativa
        </span>
    </p>

    <p>
        <b>Recurso:</b>
        <span serigyItem="recursal">
            Possibilidade de recurso em até 10 dias após resposta
        </span>
    </p>

    <p>
        <b>Autoridade responsável:</b>
        <span serigyItem="autoridadeExame">
            Controlador Geral do Município
        </span>
    </p>

    <p>
        <b>Procedimento:</b>
        <span serigyItem="procedimentoPedido">
            O pedido pode ser realizado via formulário eletrônico ou presencialmente no SIC
        </span>
    </p>
</div>
```

### Código HTML para exibição de dados do **Relatório Anual Estatístico**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/sic.html">
    <thead>
        <tr>
            <th>Ano</th>
            <th>Pedidos Recebidos</th>
            <th>Atendidos</th>
            <th>Indeferidos</th>
            <th>Detalhes</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>2025</td>
            <td serigyItem="pedidosRecebidos">120</td>
            <td serigyItem="pedidosAtendidos">100</td>
            <td serigyItem="pedidosIndeferidos">20</td>
            <td serigyExecuteWaitSection="detalhe_sic_2025">+</td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição de dados via evento serigyExecuteWaitSection:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/sic.html" serigyLoadSection="detalhe_sic_2025">
    <p>Perfil dos solicitantes:</p>
    <ul>
        <li serigyItem="infoGenericas">60% cidadãos</li>
        <li serigyItem="infoGenericas">25% empresas</li>
        <li serigyItem="infoGenericas">15% servidores públicos</li>
    </ul>

</div>
```

### Código HTML para exibição das **Informações Classificadas**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/sic.html">
    <thead>
        <tr>
            <th>Assunto</th>
            <th>Categoria</th>
            <th>Base Legal</th>
            <th>Prazo</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="assuntoClassificado">Plano de segurança institucional</td>
            <td serigyItem="categoriaClassificado">Reservado</td>
            <td serigyItem="dispositivoClassificado">Lei 12.527/2011, art. 23</td>
            <td serigyItem="prazoClassificado">5 anos</td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição das **Informações Desclassificadas**:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/sic.html">
    <thead>
        <tr>
            <th>Informação</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="informacaoDesclassificada">
                Relatório de auditoria interna do ano de 2018 (prazo expirado)
            </td>
        </tr>
    </tbody>
</table>
```

### Código HTML para exibição de dados inexistentes:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/sic.html" serigyItem="informacaoDesclassificada" serigyEmpty="justificativa da ausencia de dados">
    Não houve informações desclassificadas nos últimos 12 meses.
</div>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/sic.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>24/04/2026</b> com dados até <b>24/04/2026</b>
</div>
```
