---
title: useRecoilCallback()
sidebar_label: useRecoilCallback()
---

NOTA: Se esperan cambios menores en esta API pronto.

---

Este hook es similar a `useCallback()`, pero también proporcionará una API para que sus funciones callbacks funcionen con el estado Recoil. Este hook se puede usar para construir una función callback que tenga acceso a una _instantánea_ de solo lectura del estado Recoil y la capacidad de actualizar de forma asincrónica el estado Recoil.

Algunas motivaciones para usar este hook pueden incluir:

- Lea asincrónicamente el estado Recoil sin suscribir un componente React para volver a renderizar si se actualiza el átomo o el selector.
- Aplazar búsquedas costosas a una acción asíncrona que no desea realizar en el momento del renderizado.
- Actualizar dinámicamente un átomo o selector donde no podamos saber en el momento del renderizado qué átomo o selector queremos actualizar, por lo que no podemos usar `useSetRecoilState()`.

```
type CallbackInterface = {
  getPromise: <T>(RecoilValue<T>) => Promise<T>,
  getLoadable: <T>(RecoilValue<T>) => Loadable<T>,
  set: <T>(RecoilState<T>, (T => T) | T) => void,
  reset: <T>(RecoilState<T>) => void,
};

declare function useRecoilCallback<Args, ReturnValue>(
  fn: (CallbackInterface, ...Args) => ReturnValue,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => ReturnValue
```

- `fn`: la función callback del usuario con interacción de callback agregada. Las funciones callbacks de acceso acceden a una instantánea de solo lectura del estado del átomo de Recoil creado cuando se llama la función callback. Si bien los valores de los átomos son estáticos, los selectores asíncronos pueden estar pendientes o resolverse. Las funciones callbacks para establecer el estado actualizarán asincrónicamente el estado Recoil actual.
- `deps`: un conjunto opcional de dependencias para memorizar la función callback. Al igual que `useCallback()`, la función callback producida no se memorizará de manera predeterminada y producirá una nueva función cada vez. Puede pasar un array vacía para devolver siempre la misma instancia de función. Si pasa valores en el deps array, se utilizará una nueva función si cambia la igualdad de referencia de cualquier dep. Esos valores se pueden usar desde dentro del cuerpo de su función callback sin quedar obsoleto. (Ver [`useCallBack`](https://reactjs.org/docs/hooks-reference.html#usecallback))

Interfaz de función Callback:

- `getPromise`: obtenga un `Promise` para el átomo o el valor del selector. Como la función callback puede ser `asíncrona`, puede `await` para obtener el valor real del estado Recoil.
- `getLoadable`: proporciona un objeto `Loadable` para inspeccionar sincrónicamente el estado y el valor del átomo o selector.
- `set` - Actualiza el valor de un átomo o selector
- `reset`: restablece el valor de un átomo o selector a su valor predeterminado.

### Ejemplo

```javascript
import {atom, useRecoilCallback} from 'recoil';

const itemsInCart = atom({
  key: 'itemsInCart',
  default: 0,
});

function CartInfoDebug() {
  const logCartItems = useRecoilCallback(async ({getPromise}) => {
    const numItemsInCart = await getPromise(itemsInCart);

    console.log('Items in cart: ', numItemsInCart);
  });

  return (
    <div>
      <button onClick={logCartItems}>Log Cart Items</button>
    </div>
  );
}
```
