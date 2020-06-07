---
title: atomFamily()
sidebar_label: atomFamily()
---

Regresa una función que regresa un átomo escribible del `RecoilState`.

```js
function atomFamily<T, Parameter>({
  key: string,

  default:
    | RecoilValue<T>
    | Promise<T>
    | T
    | (Parameter => T | RecoilValue<T> | Promise<T>),

  dangerouslyAllowMutability?: boolean,
}): RecoilState<T>
```

---

- `opciones`
  - `key`: Una cadena de caracteres para identificar el átomo internamente. Esta cadena debe ser única con respecto a los demás átomos y selectores en la aplicación.
  - `default`: El valor inicial del átomo. Puede ser directamente un valor, un `RecoilValue` o una Promise que representa el valor inicial, o una función para obtener el valor. La función callback recibe una copia del parámetro usado cuando se ejecuta la función `atomFamily`.

Un `átomo` representa una pieza de estado con _Recoil_. Un átomo es creado y registrado por cada `<RecoilRoot>` por tu aplicación. Pero, ¿Y si tu estado no es global?, ¿Y si tu estado esta asociado a una instancia específica de un control? ¿O a un elemento en particular?. Por ejemplo, puede ser que tu aplicación es una herramienta de prototipado de interfaces de usuario, donde el usuario puede agregar elementos dinámicamente y cada elemento tiene su propio estado, tal como es su posición. Lo ideal sería que cada elemento pudiera tener su propio átomo de estado. Tu podrías implementarlo a través del patron de memoización. Pero _Recoil_ ya proporciona este patrón con la utilidad `atomFamily`. Una familia de átomos representa a un conjunto de átomos. Cuando mandas llamar a `atomFamily`, este regresa una función que proporciona el átomo de `RecoilState` basado en los parámetros que recibe.

## Ejemplo

```js
const elementPositionStateFamily = atomFamily({
  key: ElementPosition,
  default: [0, 0],
});

function ElementListItem({elementID}) {
  const position = useRecoilValue(elementPositionStateFamily(elementID));
  return (
    <div>
      Element: {elementID}
      Position: {position}
    </div>
  );
}
```

Un `atomFamily()` toma casi las mismas opciones como un simple `atom()`. Sin embargo, el valor inicial también puede ser parametrizado. Esto significa que puedes pasar una función que toma el valor del parámetro y regresa el valor inicial actual. Por ejemplo:

```js
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: param => defaultBasedOnParam(param),
});
```

O usando `selectorFamily` en lugar de `selector`, se puede acceder al valor del parámetro en un selector con `valor inicial` también.

```js
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: selectorFamily({
    key: 'MyAtom/Default',
    get: param => ({get}) => { ... },
  }),
});
```

## Suscripciones

Una de las ventajas de usar este patrón para separar los átomos de cada elemento, en lugar de intentar guardar un solo átomo con un mapa de estados para todos los elementos, es que mantienen su propia suscripción individual.

## Persistencia

Los observadores de persistencia mantendrán el estado para cada valor de parámetro como un átomo distinto, con un identificador único basado en la serialización del valor del parámetro usado.

Es permitido “actualizar” un `atom` simple para convertirlo en un `atomFamily` en cualquier versión nueva de tu aplicación, basado en el mismo identificador único. Si haces esto, entonces cualquier valor persistente con el valor del identificador único anterior aún podrá ser leído, y todos los valores de parámetro del nuevo `atomFamily` iniciarán con el estado persistente del átomo simple. Sin embargo, al cambiar el formato del parámetro de un `atomFamily`, no podrá leer automáticamente los valores anteriores que eran persistente antes del cambio.