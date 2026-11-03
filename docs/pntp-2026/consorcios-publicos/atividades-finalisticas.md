# 25. Atividades Finalísticas

 

| Dimensão | Atributo | Valor | 
| Atividades Finalísticas | serigySchema | https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html |
 

## 25.1. Protocolo de Intenções

 **Caminho URL:**[Portal da Transparencia]/Atividades/ProtocoloIntencoes 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 25.1.1 | 25.1 | Protocolo de intenções que antecede a formalização do Contrato | protocoloIntencoes | Anexo |
 

## 25.2. Estatuto

 **Caminho URL:**[Portal da Transparencia]/Atividades/Estatuto 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 25.2.1 | 25.2 | Estatudo do consórcios | estatutoConsorcio | Anexo |
 

## 25.3. Contrato de Rateio

 **Caminho URL:**[Portal da Transparencia]/Atividades/ContratoRateio 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 25.3.1 | 25.3 | Contrato de Rateio | contratoRateio | Anexo | 
| 25.3.2 | 25.3 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 25.3.3 | 25.3 | Histórico (dos últimos 3 anos) das Informações | historicoExercicio | N/A |
 

## 25.4. Contrato de Programa

 **Caminho URL:**[Portal da Transparencia]/Atividades/ContratoPrograma 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 25.4.1 | 25.4 | Contrato de Programa | contratoPrograma | Anexo |
 

## 25.5. Atas das Eleições

 **Caminho URL:**[Portal da Transparencia]/Atividades/Atas/Eleicoes 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 25.5.1 | 25.5 | Ata de eleição dos atuais dirigentes | ataEleicao | Anexo |
 

## 25.6. Assembleia Geral

 **Caminho URL:**[Portal da Transparencia]/Atividades/Atas/AssembleiaGeral 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 25.6.1 | 25.6 | Atas da assembleia geral | ataAssembleia | Anexo | 
| 25.6.2 | 25.6 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 25.6.3 | 25.6 | Histórico (dos últimos 3 anos) das Informações | historicoExercicio | N/A |
 

## 25.7. Entes Associados

 **Caminho URL:**[Portal da Transparencia]/Atividades/Associados 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 25.7.1 | 25.7 | Identificação clara de cada município, estado ou ente participante, refletindo a composição vigente do consórcio | enteAssociado | Texto |
 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html">
    <!-- Outras seções HTML podem existir internamente -->
    <select serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
    </select>
    <button type="submit" serigyExecuteWaitSection="consorcioTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição do **Protocolo de Intenções**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html" serigyItem="protocoloIntencoes"
    href="/documentos/protocolo-intencoes-2026.pdf">
    Protocolo de Intenções do Consórcio Intermunicipal - 2026
</a>
```

### Código HTML para exibição do **Estatuto**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html" serigyItem="estatutoConsorcio"
    href="/documentos/estatuto-consorcio.pdf">
    Estatuto do Consórcio Público Intermunicipal
</a>
```

### Código HTML para exibição do **Contrato de Rateio**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html" serigyItem="contratoRateio"
    href="/documentos/contrato-rateio-2026.pdf">
    Contrato de Rateio - Exercício 2026
</a>
```

### Código HTML para exibição do **Contrato de Programa**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html" serigyItem="contratoPrograma"
    href="/documentos/contrato-programa.pdf">
    Contrato de Programa - Prestação de Serviços Públicos
</a>
```

### Código HTML para exibição da **Ata de Eleição**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html" serigyItem="ataEleicao"
    href="/documentos/ata-eleicao-2025.pdf">
    Ata de Eleição dos Dirigentes - Biênio 2025-2026
</a>
```

### Código HTML para exibição da **Assembleia Geral**:

 

```
<a serigySchema="https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html" serigyItem="ataAssembleia"
    href="/documentos/ata-assembleia-01-2026.pdf">
    Ata da Assembleia Geral Ordinária - Janeiro/2026
</a>
```

### Código HTML para exibição dos **Entes Associados**:

 

```
<ul serigySchema="https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html">
    <li serigyItem="enteAssociado">Município de Aracaju</li>
    <li serigyItem="enteAssociado">Município de Nossa Senhora do Socorro</li>
    <li serigyItem="enteAssociado">Município de São Cristóvão</li>
</ul>

<h3>Seção para informação de data de atualização das informações apresentadas:</h3>

```HTML
<div serigySchema="https://serigy.tce.se.gov.br/consorcio/atividades-finalisticas.html" serigyItem="dataUltimaAtualizacao">
    Conjunto de informações atualizado em <b>30/04/2026</b> com dados até <b>29/04/2026</b>
</div>
```
