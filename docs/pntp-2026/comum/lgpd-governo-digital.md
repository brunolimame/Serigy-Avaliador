# 15. LGPD e Governo Digital

 

| Dimensão | Atributo | Valor | 
| LGPD e Governo Digital | serigySchema | https://serigy.tce.se.gov.br/comum/lgpd-governo-digital.html |
 

## 15.1. LGPD

 **Caminho URL:**[Portal da Transparencia]/LGPDeGovernoDigital 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 15.1.1 | 15.1 | Nome do encarregado/responsável pelo tratamento de dados pessoais | nomeResponsavel | Nome | 
| 15.1.2 | 15.1 | Telefone e/ou email do encarregado/responsável pelo tratamento de dados pessoais | contatoResponsavel | Telefone \| E-mail | 
| 15.1.3 | 15.2 | Política de Privacidade e Proteção de Dados | politicaPrivacidade | Link | 
| 15.1.4 | 15.5 | Normativa da Lei Federal nº 14.129/2021 | normativa | - | 
| 15.1.5 | 15.6 | Realiza e divulga resultados de pesquisas de satisfação | pesquisaSatisfacao | Link |
 

## 15.2. Serviços Públicos

 **Caminho URL:**[Portal da Transparencia]/LGPDeGovernoDigital/Servicos 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 15.2.1 | 15.3 | Serviços públicos por meio digital | servicoPublico | - |
 

## 15.3. Dados Abertos

 **Caminho URL:**[Portal da Transparencia]/LGPDeGovernoDigital/DadosAbertos 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 15.3.1 | 15.4 | Acesso automatizado por sistemas externos em dados abertos | dadosAbertos | - |
 

## Exemplos

 

### Código HTML referente ao Responsável Pelo Tratamento de Dados

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/lgpd-governo-digital.html">
    <thead>
        <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>E-mail</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="nomeResponsavel">Josenilson Silva Santos</td>
            <td serigyItem="contatoResponsavel">79 3045-4933</td>
            <td serigyItem="contatoResponsavel">josenilson.santos@saocristovao.se.gov.br</td>
        </tr>
    </tbody>
</table>
```

### Código HTML referente a Dados Externos

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/lgpd-governo-digital.html" serigyItem="dadosAbertos">
    <button>
        <!-- Outras seções HTML podem existir internamente -->
        <span>GET</span>
        <div>
            <span>
                <a href="#/servidor-resource/servidores">
                    <span>/api<wbr>/servidores</span>
                </a>
            </span>
        </div>
    </button>
    <button>
        <span>GET</span>
        <div>
            <span>
                <a href="#/repasse-resource/repasses">
                    <span>/api<wbr>/repasses</span>
                </a>
            </span>
        </div>
    </button>
</div>
```

### Código HTML referente a Serviços Públicos

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/lgpd-governo-digital.html">
    <a serigyItem="servicoPublico" href="#/contribuinte">Contribuinte</a>
    <a serigyItem="servicoPublico" href="#/protocolo">Protocolo</a>
    <a serigyItem="servicoPublico" href="#/servidor">Servidor</a>
    <a serigyItem="servicoPublico" href="#/imovel">Imóvel</a>
</div>
```

### Código HTML referente

 

```
<table serigySchema="https://serigy.tce.se.gov.br/comum/lgpd-governo-digital.html">
    <thead>
        <tr>
            <th>Política de Privacidade</th>
            <th>Relatório de Satisfação</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td serigyItem="politicaPrivacidade"><a href="local/arquivo">Baixar</a></td>
            <td serigyItem="pesquisaSatisfacao"><a href="local/arquivo">Baixar</a></td>
        </tr>
    </tbody>
</table>
```

### Código HTML referente a Lei Federal nº 14.129/2021

 

```
<span serigySchema="https://serigy.tce.se.gov.br/comum/lgpd-governo-digital.html" serigyItem="normativa">
    <a href="local/arquivo/lei">Lei federal nº 14.129, de 29 de março de 2021</a>
</span>
```
