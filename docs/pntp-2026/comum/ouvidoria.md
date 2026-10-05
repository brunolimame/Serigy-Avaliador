# 14 Ouvidoria

 

| Dimensão | Atributo | Valor | 
| Ouvidoria | serigySchema | https://serigy.tce.se.gov.br/comum/ouvidoria.html |
 **Caminho URL:**[Portal da Transparencia]/Ouvidoria 

| Item | Critério(s) | Descrição | Atributo | Valor | 
| 14.1 | 14.1 | Endereço físico do setor responsável | enderecoSetor | Texto | 
| 14.2 | 14.1 | Telefone do setor responsável | telefoneSetor | Telefone | 
| 14.3 | 14.1 | Horário de funcionamento do setor responsável | horarioFuncionamentoSetor | Texto | 
| 14.4 | 14.2 | Fale Conosco | faleConosco | Texto | 
| 14.5 | 14.3 | Carta de Serviços ao Usuário | servicoUsuario | Link |
 

## Exemplos

 

### Código HTML para exibição da **Carta de Serviço ao Usuário**

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/ouvidoria.html" serigyItem="servicoUsuario">
    <a href="local/arquivo">Carta de Serviço</a>
</div>
```

### Código HTML para exibição de **Atendimento Presencial**

 

```
<div serigySchema="https://serigy.tce.se.gov.br/comum/ouvidoria.html">
    <!-- Outras seções HTML podem existir internamente -->
    <p serigyItem="enderecoSetor">Praça dom Jose Thomas, s/n</p>
    <p serigyItem="telefoneSetor">(79) 9821-8711</p>
    <p serigyItem="horarioFuncionamentoSetor">08hs às 17hs.</p>
</div>
```
