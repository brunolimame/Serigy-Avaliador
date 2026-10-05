# Definições

 

## Introdução ao Serigy utilizando o Microdata

 

O Microdata, uma linguagem de marcação embutida no HTML5, desempenha um papel crucial na melhoria da legibilidade das páginas web para máquinas. Essa abordagem envolve a atribuição de rótulos a partes específicas do conteúdo, o que permite que mecanismos de busca e web crawlers extraiam e processem microdados de uma página da web de maneira mais eficaz. No entanto, é essencial compreender não apenas o que é o Microdata, mas também por que ele é uma ferramenta valiosa no desenvolvimento web.

 

Ao adotar o padrão Microdata para a descrição de dados, proporcionamos aos mecanismos de busca uma compreensão mais profunda dessas informações no contexto semântico definido. Além disso, facilitamos o reconhecimento e a importação desses dados por outras aplicações, ampliando as possibilidades de interoperabilidade e otimizando a experiência do usuário.

 

Em termos mais amplos, o Microdata é uma especificação que incorpora dados legíveis por máquina nos documentos HTML. Esses dados são representados por meio de pares nome/valor, conhecidos como itens, que são definidos de acordo com um vocabulário específico. Ao utilizar o Microdata, recorremos a elementos pertencentes a esse vocabulário, cuja referência é incorporada ao documento HTML. Essencialmente, o vocabulário define as propriedades e o tipo de informação que essas propriedades representam.

 

## O que é e por que utilizar o Serigy?

 

Dentro dessa abordagem, destaca-se o Serigy, um vocabulário elaborado para descrever tipos e propriedades presentes em dados disponibilizados por portais de transparência fiscal. O propósito fundamental do Serigy é servir como um esquema de marcação de dados, visando tornar os portais de transparência fiscal mais acessíveis e compreensíveis para mecanismos de busca e web crawlers. Este esquema oferece uma estrutura que permite a categorização e interpretação eficiente dos dados, facilitando a sua indexação e extração.

 

Na presente documentação, disponibilizamos informações detalhadas sobre as propriedades associadas a cada tipo definido pelo Serigy, fornecendo uma descrição minuciosa de suas finalidades e modos de utilização. Compreender esses aspectos é fundamental para uma implementação eficaz do esquema de marcação.

 

Para enriquecer o conteúdo de suas páginas web com informações pertinentes, recomenda-se a integração do vocabulário do Serigy em conjunto com o Microdata. Este guia prático tem como objetivo familiarizá-lo com os princípios básicos do Microdata e do Serigy, capacitando-o a começar a adicionar marcações significativas às suas páginas web. Ao seguir estas diretrizes, você estará não apenas aprimorando a compreensão de seus dados por parte dos mecanismos de busca, mas também contribuindo para a transparência e acessibilidade nas informações relacionadas à fiscalização e prestação de contas.

 

## Sintaxe do Microdata

 

O modelo Microdata opera por meio de agrupamentos de pares de nome/valor conhecidos como itens. Em cada par, o nome é designado como uma propriedade, podendo conter um ou vários valores. Estes valores podem variar desde strings e números (float ou inteiros) até outros tipos de dados, incluindo, notavelmente, outros grupos de pares de nome/valor, ou seja, itens adicionais.

 

Além disso, o Microdata apresenta nove atributos globais simples que estão disponíveis para serem utilizados por qualquer elemento HTML. Estes atributos desempenham o papel crucial de fornecer contexto para máquinas interpretarem os dados. A seguir, examinaremos esses atributos em detalhes, compreendendo como cada um contribui para a capacidade de compreensão e interpretação dos dados por parte dos sistemas automatizados. Este entendimento aprofundado dos atributos globais do Microdata é essencial para uma implementação eficaz e para garantir que as informações presentes nas páginas web sejam adequadamente interpretadas pelos mecanismos de busca e web crawlers.

 

| Atributo | Descrição | 
| serigySchema | Atributo contendo uma URL que define a entidade associada ao conteúdo HTML e fornece o contexto para as propriedades referentes a ele. | 
| serigyItem | Atributo utilizado para definir uma propriedade listada em um `serigySchema` para um conteúdo HTML. | 
| serigyItemType | Atributo que define o tipo dos elementos HTML destinados a formulários como botão, caixa de texto, caixa de seleção, etc. Os valores possíveis deste atributo estão listados na tabela abaixo. | 
| serigyValue | Atributo utilizado para acessar um valor de um `serigyItemType` e que pode assumir diferentes tipos de dados. | 
| serigyLink | Atributo contendo uma URL que define um contexto externo (URL) ao qual atributo está inserido. | 
| serigyLoadSection | Atributo contendo a identificação de um código HTML que é utilizado para obtenção de informações listadas pelo `serigySchema` como resultado da execução do atributo definido em `serigyExecuteWaitSection`. | 
| serigyExecuteWaitSection | Atributo que define um identificador único de um componente HTML básico, dispara um evento de clique e aguarda a renderização de um código HTML que contenha este identificador em seu atributo `serigyLoadSection`. | 
| serigyClearForm | Atributo indicando a presença de um botão que, quando clicado, limpa os campos do formulário da página já preenchidos, sem precisar recarregar a página. | 
| serigyEmpty | Atributo indicando que no campo há, de forma intencional, ausência de informação. Seja por ainda não ter sido definido, por ainda estar sendo feito, ou qualquer outro motivo. |
 

#### Para a implementação/codificação utilizando Microdata nos atributos acima especificados, deve-se atentar a algumas regras:

 

- **serigySchema** deve estar inserido no código como marcação pai ou na mesma tag HTML, de um **serigyItem**. Onde os atributos listados no schema deverão ser encontrados nela ou aninhadas na estrutura HTML que contém a marcação. 
- **serigyItem** deve estar hieraquicamente nele ou abaixo de **serigySchema** ou, quando for o caso, também de **serigyLoadSection**. Para acessar o conteúdo textual marcado deste atributo a função innerHTML nativa será utilizada. Em outros casos o acesso será dado pelo atributo **serigyValue**. 
- **serigyItemType** deve estar hieraquicamente abaixo de **serigyItem** é destinado para identificar campos em formulários, ou outra estrutura que necessitam ter um valor inserido pelo usuário. 
- **serigyValue** é utilizado para acessar valores de elementos marcados como **serigyItemType** ou valores esperados por **serigyItem**. Pode ser utilizado para definir valores padrões em formulários de busca por exemplo. 
- **serigyLink** é utilizado para informar a URL do conteúdo HTML que contém as informações requeridas em um **serigySchema**. Atualmente o Serigy busca as informações de duas maneiras distintas: 

  - Quando a tag HTML que contem a marcação **serigyLink** tambem contiver a marcação **serigyItem**, apenas este **serigyItem** será buscado na URL contida no valor da propriedade **serigyLink**. Neste caso a tag HTML que contém as informações necessárias deve conter um **serigySchema** e o **serigyItem**. 
  - Quando não houver um **serigyItem** na tag HTML que contém a marcação **serigyLink**, a busca pelas informações presentes no **serigySchema** será integralmente realizada na URL presente no valor da propriedade **serigyLink**. Neste caso a tag HTML que contém as informações necessárias deve conter um **serigySchema** e todas as marcações **serigyItem** requeridas pelo **serigySchema**. 
- **serigyLoadSection** assim como **serigySchema** deverá estar inserido no código como marcação pai de um **serigyItem**, onde os atributos listados no schema deverão ser encontrados dentro de sua estrutura HTML, podendo auxiliar como extensão da coleção de **serigyItem** definida em um **serigySchema**. 
- **serigyExecuteWaitSection** é utilizado para disparar um evento de clique num elemento HTML e irá aguardar a renderização HTML de um elemento que possua o valor deste atributo **serigyLoadSection** presente. 
- **serigyClearForm** é utilizado sem passar valor algum. Deve ser inserido na declaração do botão que limpa o formulário. 
- **serigyEmpty** é utilizado passando valor explicando o motivo de não ter conteúdo. Esse valor deve ser único e distinto para cada **serigyEmpty**. Deve ser inserido na tag HTML em que falta o conteúdo, seguido de um serigyItem.
 

No desenvolvimento Web das páginas que seguem o padrão estabelecido pelo schema Serigy, deve-se utilizar os atributos acima apenas para conteúdo relacionado a marcação específicas do schema. Outras marcações são possíveis no código HTML como classes, eventos, identificações etc, sem prejuízos à marcação

 

#### Descrição e Valores possíveis para o atributo `serigyItemType`

 

| Descrição | Valor | 
| Caixa de texto | text-input | 
| Caixa de seleção | select | 
| Botão | button | 
| Checkbox | checkbox |
 

## Exemplos

 

### Código HTML utilizando o atributo `serigySchema`:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/definicoes.html">
    ...
</div>
```

### Código HTML utilizando o atributo `serigyItem` & `serigyItemType` & `serigyValue` :

 

```
<div serigySchema="https://serigy.tce.se.gov.br/definicoes.html">
    <select serigyItem="anoExemplo" serigyItemType="select">
        <option serigyValue="2026">2026</option>
        <option serigyValue="2025">2025</option>
        <option serigyValue="2024">2024</option>
        ...
    </select>
</div>
```

### Código HTML utilizando o atributo `serigyItem` & `serigyValue` & `serigyEmpty`:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/definicoes.html">
    ...
    <a serigyItem="salvarRelatorio" serigyValue="pdf">Salvar em PDF</a>
    <a serigyItem="salvarRelatorio" serigyValue="json" serigyEmpty="Motivo de não existir conteúdo">-</a>
</div>
```

### Código HTML utilizando o atributo `serigyLink`:

 

```
...
<meta serigySchema="https://serigy.tce.se.gov.br/definicoes.html" serigyItem="itemExemplo" serigyLink="https://www.sergipe.se.gov.br">
```

### Código HTML utilizando o atributo `serigyItemType` & `serigyClearForm`:

 

```
<div serigySchema="https://serigy.tce.se.gov.br/definicoes.html" serigyItem="pesquisaExemplo">  
    ...
    <input type="text" serigyItemType="text-input" />
    <button serigyItemType="button">Pesquisar</button>
    <button serigyClearForm>Limpar</button>
</div>
```

### Código HTML utilizando o atributo `serigyLoadSection` & `serigyExecuteWaitSection`:

 

```
<table serigySchema="https://serigy.tce.se.gov.br/definicoes.html">
    ...
    <tr>
        <td>
            <button serigyExecuteWaitSection="detalhesItem_102930_2022">Ver Detalhes</button>
        </td>
    </tr>
</table>

<h4>Após o clique uma seção HTML é renderizada na tela com os dados relativos ao detalhamento do item:</h4>

<table serigyLoadSection="detalhesItem_102930_2022" serigySchema="https://serigy.tce.se.gov.br/definicoes.html">
    ...
    <tr>
        <td>
            Item do Detalhe a ser exibido
        </td>
    </tr>
</table>
```
