# 13. Acessibilidade

 

| Dimensão | Atributo | Valor | 
| Acessibilidade | serigySchema | https://serigy.tce.se.gov.br/comum/acessibilidade.html |
 **Caminho URL:**[Portal da Transparencia]/* 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 13.1 | 13.1 | Contém símbolo de acessibilidade em destaque | acessibilidadeSimbolo | Imagem | 
| 13.2 | 13.2 | Exibição do caminho de páginas percorridas pelo usuário - Componente "migalha de pão" | acessibilidadeCaminhoPaginas | N/A | 
| 13.3 | 13.3 | Opção de alto contraste | acessibilidadeAltoContraste | N/A | 
| 13.4 | 13.4 | Ferramenta de redimensionamento de texto | acessibilidadeRedimensionamentoTexto | N/A | 
| 13.5 | 13.5 | Mapa do Site | acessibilidadeMapaSite | link |
 

## Exemplos

 

### Código HTML de exemplo para componente de pesquisa de **Acessibilidade - Componente 'caminho de páginas' (migalha de pão)**:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/acessibilidade.html" serigyitem="acessibilidadeCaminhoPaginas">
  <nav>
    <a href="javascript:void(0)">Página Inicial</a>
    <b>&nbsp;&gt;&nbsp;</b>
    <a href="javascript:void(0)">Página Ancestral 01</a>
    <b>&nbsp;&gt;&nbsp;</b>
    <a href="javascript:void(0)">Página Ancestral 02</a>
    <b>&nbsp;&gt;&nbsp;</b>
    <a href="javascript:void(0)">Página Ancestral 03</a>
    <b>&nbsp;&gt;&nbsp;</b>
    <span>Página atual</span>
  </nav>
</div>
```
