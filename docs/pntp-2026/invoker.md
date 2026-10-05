# Invoker

 

O **Invoker** é uma aplicação auxiliar desenvolvida pela **Diretoria de Modernização e Tecnologia (DMT)** do **Tribunal de Contas do Estado de Sergipe (TCE/SE)**, criada com o propósito de **agilizar e otimizar** as solicitações de execução do robô **Serigy**. Essa ferramenta foi projetada para atuar como um **intermediário inteligente** entre o solicitante e o mecanismo de avaliação, garantindo que os resultados sejam apresentados **de forma clara, organizada e tecnicamente precisa**.

 

A função principal do Invoker é **interpretar e exibir os dados coletados pelo robô**, classificando-os em **módulos** e **itens** conforme os critérios definidos pela **matriz de verificação** especificada nesta documentação.

 

Cada resultado de uma requisição gerado pelo Invoker apresenta, com precisão:

 

- Aspectos analisados. 
- Pontos atendidos. 
- Onde há **necessidade de ajustes ou melhorias**.
 

Cada **unidade gestora** pode ter o seu **portal da transparência** avaliado de forma:

 

- **Periódica** (execuções programadas como já acontece na atualização do Observatório TCE/SE). 
- **Sob demanda** (execuções solicitadas manualmente através do Invoker).
 

O sistema permite que os testes e verificações sejam realizados **em qualquer dia e horário**, sem depender de intervenção manual no momento da execução.

 

Com essa abordagem, o Invoker se consolida como uma **ferramenta estratégica** para a **fiscalização digital**, pois:

 

- **Fortalece** o controle externo. 
- **Garante** que a execução do robô Serigy seja segura e rastreável. 
- **Personaliza** a análise para cada unidade gestora cadastrada. 
- **Automatiza** a coleta e a apresentação de informações.
 

### Regras de Utilização:

 

Para garantir a segurança e a padronização no uso do Invoker, foram estabelecidas as seguintes diretrizes:

 

- **Cadastro de usuário**
 

- Cada usuário deverá enviar um e-mail para [integracao.jurisdicionado@tce.se.gov.br](mailto:integracao.jurisdicionado@tce.se.gov.br) informando: 

  - CPF 
  - E-mail 
  - Nome completo 
  - UGs que acessará 
- Após a aprovação do cadastro, será enviado um e-mail contendo a senha de primeiro acesso para o site [https://portal-hml.tcese.tc.br  (opens new window)](https://portal-hml.tcese.tc.br)
 

- **Geração do hash**
 

- Após o login no [Portal do TCE  (opens new window)](https://portal-hml.tcese.tc.br/), no menu à esquerda, acesse: `Serigy -> Invoker`. O **código hash**, exclusivo para a unidade gestora, poderá ser gerado no botão "Gerar Hash", localizado na parte superior direita da tela.
 

- **Inserção do hash no portal**
 

- O código hash deve ser incluído na **página principal** do portal da transparência, seguindo o exemplo abaixo:
 

```
<meta serigyItem="invoker" serigyValue="hash-gerado-no-portal-do-tce">
```

- Este hash garante que o robô seja executado apenas para a URL vinculada à unidade gestora cadastrada, impedindo que outra unidade utilize o robô em um portal diferente daquele ao qual seu usuário está vinculado no momento da requisição.
  

O acesso ao sistema, a execução e a visualização dos resultados do robô estão disponíveis no portal oficial:

 

🔗 [https://portal-hml.tcese.tc.br  (opens new window)](https://portal-hml.tcese.tc.br)
