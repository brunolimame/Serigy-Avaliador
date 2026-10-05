# 1. Informações Prioritárias

 

| Dimensão | Atributo | Valor | 
| Informações | serigySchema | https://serigy.tce.se.gov.br/comum/informacoes.html |
 **Caminho URL:**[Portal da Transparencia] 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 1.1 | 1.1, 1.2 | Sítio Oficial | sitioOficial | Texto | 
| 1.2 | 1.3 | Acesso ao Portal | acessoPortal | Texto | 
| 1.3 | 1.4 | Pesquisa de Conteúdo | pesquisaConteudo | Variável |
 

## Exemplos

 

### Código HTML para exibição do sítio oficial:

 

```
<meta serigySchema="https://serigy.tce.se.gov.br/comum/informacoes.html" serigyItem="sitioOficial" serigyLink="https://www.sergipe.se.gov.br">
```

### Código HTML para exibição do acesso ao portal da transparência no portal do órgão:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/informacoes.html" serigyItem="acessoPortal">  
    <!-- Esta código HTML deve estar no site oficial do órgão -->
    <a href="https://www.sergipe.se.gov.br/transparencia/index.html">Portal da Transparência</a>
</div>
```

### Código HTML para exibição da pesquisa de conteúdo:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/informacoes.html" serigyItem="pesquisaConteudo">  
    <input type="text"/>
    <button>Pesquisar<button/>
</div>
```
