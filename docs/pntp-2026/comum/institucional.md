# 2. Institucional

 

| Dimensão | Atributo | Valor | 
| Institucional | serigySchema | https://serigy.tce.se.gov.br/comum/institucional.html |
 

## 2.1. Informações

 **Caminho URL:**[Portal da Transparencia]/Institucional/Informacoes 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 2.1.1 | 2.1 | Estrutura Organizacional | estruturaOrganizacional | Variável |
| 2.1.2 | 2.1 | Norma que instui/altera a estrutura organizacional | normaEstruturaOrganizacional | Variável |
| 2.1.3 | 2.2 | Competências | competencias | Texto |
| 2.1.4 | 2.3 | Nome dos atuais responsáveis pela gestão da Unidade | responsaveis | Texto | 
| 2.1.5 | 2.4 | Endereços atuais da Unidade | enderecos | Texto | 
| 2.1.6 | 2.4 | Telefones atuais da Unidade | telefones | Texto | 
| 2.1.7 | 2.4 | E-mails institucionais | emails | Texto | 
| 2.1.8 | 2.5 | Horários de atendimento | horariosAtendimento | Texto | 
| 2.1.9 | 2.7 | Perguntas e respostas mais frequentes relacionadas às atividades desenvolvidas pela Unidade | perguntasRespostasFrequentes | Texto | 
| 2.1.10 | 2.8 | Link de acesso ao perfil, em rede social, da Unidade | redeSocial | Link | 
| 2.1.11 | 2.9 | Link para Radar da Transparência Pública (https://radardatransparencia.atricon.org.br) | radarTransparencia | Texto |
 

## 2.2. Atos Normativos

 **Caminho URL:**[Portal da Transparencia]/Institucional/AtosNormativos 

| Item | Critério | Descrição | Atributo | Valor | 
| 2.2.1 | 2.6 | Ato(s) normativo(s) | atoNormativo | Link | 
| 2.2.2 | 2.6 | Ferramenta de pesquisa específica | filtroPesquisa | N/A | 
| 2.2.3 | 2.6 | Informações atualizadas | dataUltimaAtualizacao | Data | 
| 2.2.4 | 2.6 | Existência de histórico (dos últimos 3 anos) das informações | historicoExercicio | N/A |
 

## Exemplos

 

### Código HTML para exibição da estrutura organizacional:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="estruturaOrganizacional">  
    <!-- Outras seções HTML podem existir internamente -->
    <img src="estrutura-organizacional.png" />
</div>
```

#### Para o caso de redirecionamento:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="estruturaOrganizacional" serigyLink="https://url_alvo.com">
    Estrutura Organizacional
</div>
```

### Código HTML para exibição da norma da estrutura organizacional:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html">
    <!-- Outras seções HTML podem existir internamente -->
    <span serigyItem="normaEstruturaOrganizacional">Lei complementar n.° 119 de 06 de fevereiro de 2013 Prefeitura</span>
</div>
```

### Código HTML para exibição de competências:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="competencias">  
    COMPETÊNCIAS
    - DA COMPETÊNCIA DO MUNICÍPIO
    
    Art. 1° - Compete privativamente ao Município:
    I – legislar sobre assuntos de interesse local e suplementar as legislações federal e estadual no que couber;
    II – instituir e arrecadar de sua competência, aplicar as suas rendas, sem prejuízo da obrigatoriedade de prestar contas e publicar balancetes, nos prazos fixados em lei;
    III – criar, organizar e suprimir distritos, observada a legislação esta Lei Orgânica;
    ...
</div>
```

#### Para o caso de redirecionamento:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="competencias" serigyLink="https://transparencia.sergipe.se.gov.br/institucional/competencias.html">
    Competências
</div>
```

### Código HTML para exibição dos responsáveis:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="responsaveis">  
    <!-- Outras seções HTML podem existir internamente -->       
    <span>Prefeito: Mauro Cezar Lima</span>
    <span>Vice-Prefeito: Caio Marcos Alvarenga</span>
    <span>Secretário de Educação: Bruno Nascimento Gallo</span>
    <span>Secretário de Saúde: Marcielle Rafaela Dantas</span>
    <span>Secretário da Fazenda: Julia Rabello Messias</span>
    ...
</div>
```

### Código HTML para exibição dos endereços:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="enderecos">  
    <!-- Outras seções HTML podem existir internamente -->
    <span>Avenida Castelo Branco, 100, Santa Bárbara do Oeste - Sâo Paulo</span>
</div>
```

### Código HTML para exibição dos telefones:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="telefones">  
    <!-- Outras seções HTML podem existir internamente -->
    <span>(79) 3123-0000</span>
    <span>(79) 3124-0000</span>
    <span>(79) 3125-0000</span>
</div>
```

### Código HTML para exibição dos horáros de atendimento:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="horariosAtendimento">  
    <!-- Outras seções HTML podem existir internamente -->
    <span>Horário de Atendimento: Das 08:00 às 18:00</span>
</div>
```

### Código HTML para exibição para perguntas e respostas frequentes:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html">  
    <!-- Outras seções HTML podem existir internamente -->
    <div serigyItem="perguntasRespostasFrequentes">
        P: Como consigo encontrar as perguntas frequentes?
    <div>
    <div serigyItem="perguntasRespostasFrequentes">
       R: Acessando a seção de Perguntas e Respostas Frequentes.
    <div>
</div>
```

### Código HTML para exibição de **Rede Social** :

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html">  
    <!-- Outras seções HTML podem existir internamente -->
    <a href="https://youtube.com/@orgao" serigyItem="redeSocial">YouTube - Órgão</a>
</div>
```

### Código HTML para exibição de **Radar da Transparência Pública** :

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html">  
    <!-- Outras seções HTML podem existir internamente -->
    <a href="https://radardatransparencia.atricon.org.br" serigyItem="radarTransparencia">
        Radar da Transparência Pública
    </a>
</div>
```

#### Para o caso de redirecionamento:

 

```
<!-- Outras seções HTML podem existir internamente -->
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="perguntasRespostasFrequentes" serigyLink="https://transparencia.se.gov.br/institucional/perguntas-frequentes.html">
    Perguntas Frequentes
</div>
```

### Código HTML de exemplo para componente de pesquisa de **Ato Normativo**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="filtroPesquisa">
  <!-- Outras seções HTML podem existir internamente -->
  <select serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="historicoExercicio"> <!-- Componente obrigatório -->
    <option serigyValue="2026">2026</option>
    <option serigyValue="2025">2025</option>
    <option serigyValue="2024">2024</option>
  </select>
  <button type="reset" serigyClearForm>Limpar Filtros</button>
  <button type="submit" serigyExecuteWaitSection="processoLicitatorioTabela">Pesquisar</button>
</div>
```

### Código HTML para exibição de **Ato Normativo** :

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html">
    <!-- Outras seções HTML podem existir internamente -->
    <a href="local/ato/normativo" serigyItem="atoNormativo">Arquivo do Ato</a>
</div>
```

### Seção para informação de data de atualização das informações apresentadas:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/institucional.html" serigyItem="dataUltimaAtualizacao">
  Conjunto de informações atualizado em <b>31/03/2026</b> com dados até <b>30/03/2026</b>
</div>
```
