---
title: Conceitos Principais
---

## Visão Geral

Recoil permite criar um gráfico de fluxo de dados que flui de _átomos_ (estado comparilhado) por meio de _seletores_ (funções puras) e alcançando os componentes React. Os átomos são unidades de estado que os componentes podem assinar. Os seletores transformam este estado de forma síncrona ou assíncrona.

## Átomos

Os átomos são unidades de estado. Eles são atualizáveis e assináveis: quando um átomo é atualizado, cada componente inscrito é renderizado novamente com o novo valor. Eles também podem ser criados em tempo de execução. Os átomos podem ser usados no lugar do estado do componente local React. Se o mesmo átomo é usado por vários componentes, todos esses componentes compartilham seu estado.

Os átomos são criados usando a função `atom`:

```javascript
const fontSizeState = atom({
  key: 'fontSizeState',
  default: 14,
});
```

Os átomos precisam de uma chave exclusiva, que é usada para depuração, persistência e para certas APIs avançadas que permitem ver um mapa de todos os átomos. É um erro dois átomos terem a mesma chave, então certifique-se de que eles sejam globalmente únicos. Assim como o estado do componente React, eles também têm um valor padrão.

Para ler e escrever um átomo de um componente, usamos um hook chamado `useRecoilState`. É como o `useState` do React, mas agora o estado pode ser compartilhado entre os componentes:

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return (
    <button onClick={() => setFontSize((size) => size + 1)} style={{fontSize}}>
      Click to Enlarge
    </button>
  );
}
```

Clicar no botão aumentará o tamanho da fonte do botão em um. Mas agora algum outro componente também pode usar o mesmo tamanho de fonte:

```jsx
function Text() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return <p style={{fontSize}}>This text will increase in size too.</p>;
}
```

## Seletores

Um **seletor** é uma função pura que aceita átomos ou outros seletores como entrada. Quando esses átomos ou seletores são atualizados, a função do seletor é reavaliada. Os componentes podem se inscrever em seletores exatamente como átomos e, então, serão renderizados novamente quando os seletores forem alterados.

Os seletores são usados para calcular dados derivados com base no estado. Isso nos permite evitar o estado redundante, geralmente eliminando a necessidade de redutores para manter o estado em sincronia e válido. Em vez disso, um conjunto mínimo de estados são armazenado em átomos, enquanto todo o resto é calculado de forma eficiente como uma função desse estado mínimo. Uma vez que os seletores controlam quais componentes precisam deles e de que estado dependente, tornam essa abordagem funcional mais eficiente. em átomos

Do ponto de vista dos componentes, os seletores e os átomos têm a mesma interface e podem, portanto, ser substituídos.

Os seletores são definidos usando a função `selector`:

```javascript
const fontSizeLabelState = selector({
  key: 'fontSizeLabelState',
  get: ({get}) => {
    const fontSize = get(fontSizeState);
    const unit = 'px';

    return `${fontSize}${unit}`;
  },
});
```

A propriedade `get` é a função que deve ser calculada. Ele pode acessar o valor de átomos e outros seletores usando o argumento `get` passado a ele. Sempre que ele acessa outro átomo ou seletor, um relacionamento de dependência é criado de forma que a atualização do outro átomo ou seletor fará com que este seja recalculado.

Neste exemplo `fontSizeLabelState`, o seletor tem uma dependência: o átomo` fontSizeState`. Conceitualmente, o seletor `fontSizeLabelState` se comporta como uma função pura que recebe um` fontSizeState` como entrada e retorna um rótulo de tamanho de fonte formatado como saída.

Os seletores podem ser lidos usando `useRecoilValue ()`, que recebe um átomo ou seletor como argumento e retorna o valor correspondente. Não usamos `useRecoilState ()` porque o seletor `fontSizeLabelState` não é gravável (veja a [referência da API do seletor](/docs/api-reference/core/selector) para obter mais informações sobre seletores graváveis):

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  const fontSizeLabel = useRecoilValue(fontSizeLabelState);

  return (
    <>
      <div>Current font size: ${fontSizeLabel}</div>

      <button onClick={() => setFontSize(fontSize + 1)} style={{fontSize}}>
        Click to Enlarge
      </button>
    </>
  );
}
```

Clicar no botão agora faz duas coisas: aumenta o tamanho da fonte do botão enquanto também atualiza o rótulo do tamanho da fonte para refletir o tamanho da fonte atual.