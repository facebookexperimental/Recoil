---
title: Conceptos Principales
---

## Visión General

Recoil te permite crear flujos de datos con grafos que fluyen desde los _átomos_ (el estado compartido), pasando por los _selectores_ (funciones puras) y finalmente llegando a tus componentes de React. Los átomos son unidades de estado, a los cuales los componentes se pueden subscribir. Y los selectores transforman este estado de manera síncrona o asíncrona

## Átomos

Los Átomos son unidades de estado actualizables y subscribibles: cuando un átomo es actualizado, cada componente suscrito a este átomo es renderizado con el nuevo valor. Los átomos también pueden ser creados en tiempo de ejecución. Pueden ser utilizados en lugar del estado local en los componentes de React. Si un átomo es utilizado en varios componentes, todos esos componentes compartirán éste mismo estado.

Los átomos son creados usando la función `atom`:

```javascript
const fontSizeState = atom({
  key: 'fontSizeState',
  default: 14,
});
```

Los átomos requieren un identificador único (key), que es utilizado para tareas de depuración, persistencia y para algunas APIs avanzadas que te permiten ver un mapa con todos los átomos. No se pueden tener dos átomos con el mismo identificador, así que asegúrate que sean globalmente únicos. Y al igual que el estado de los componentes de React, también pueden tener valores predeterminados.

Para leer y escribir valores en un átomo desde un componente, usamos un hook llamado `useRecoilState`. Es como el `useState` de React, pero ahora éste estado puede ser compartido entre varios componentes:

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

Al hacer click sobre le botón, se incrementará el tamaño de letra en uno. Y ahora otros componentes también pueden utilizar el mismo tamaño de letra:

```jsx
function Text() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return <p style={{fontSize}}>This text will increase in size too.</p>;
}
```

## Selectores

Un **selector** es una función pura, que acepta átomos y otros selectores como entradas. Cuando éstos átomos o selectores son actualizados, la función del selector volverá a ser evaluada. Los componentes se pueden subscribir a los selectores de la misma forma que a los átomos, y son renderizados cuando los selectores cambian.

Los selectores son usados para calcular datos derivados basados en el estado. Esto nos permite evitar estados redundantes, usualmente para evitar reductores que mantienen el estado válido y sincronizado. En cambio, una parte mínima del estado es guardado en los átomos, mientras que todo lo demás es calculado eficientemente como una función de ese estado mínimo. Ya que los selectores saben que componentes los ocupan, de que estados estos selectores dependen, y así hacer este enfoque funcional mas eficiente.

Desde el punto de vista de un componente, los selectores y átomos tiene la misma interfaz y por lo tanto pueden sustituirse mutuamente.

Los selectores son declarados usando la función `selector`:

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

La propiedad `get` es la función a ejecutar. Ésta función tiene acceso a otros selectores y a los valores de los átomos, a través del `get` que es pasado como argumento. Cada vez que el selector accede a otro átomo o selector, se crea una relación de dependencia, de tal forma que, al actualizar los otros átomos o selectores, se vuelve a calcular el selector actual.

En este ejemplo `fontSizeLabelState`, el selector tiene una sola dependencia: el átomo `fontSizeState`. Conceptualmente, el selector `fontSizeLabelState` se comporta como una función pura, que toma como argumento el átomo `fontSizeState`, y regresa un tamaño de letra como resultado.

Los selectores pueden leer valores con `useRecoilValue()`, la cual toma un átomo o un selector como argumento y regresa el valor correspondiente. No estamos usando el `useRecoilState()`, ya que el selector `fontSizeLabelState` no es editable. (Para más información sobre selectores editables visita la [referencia de la API para selectores](/docs/api-reference/core/selector)


```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  const fontSizeLabel = useRecoilValue(fontSizeLabelState);

  return (
    <>
      <div>Current font size: ${fontSizeLabel}</div>

      <button onClick={setFontSize(fontSize + 1)} style={{fontSize}}>
        Click to Enlarge
      </button>
    </>
  );
}
```

Al hacer click sobre el botón, dos cosas suceden: se incrementa el tamaño de letra del botón, y se actualiza la etiqueta del tamaño de letra actual.

