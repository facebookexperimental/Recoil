---
título: useRecoilValueLoadable()
sidebar_label: useRecoilValueLoadable()
---

```jsx
function useRecoilValueLoadable<T>(state: RecoilValue<T>): Loadable<T>
```

Devuelve un `Loadable`.

Este hook está diseñado para leer el valor de los selectores asíncronos. Este hook suscribirá implícitamente el componente al estado dado.

A diferencia de `useRecoilValue()`, este hook no arrojará un `Promise` al leer desde un selector asincrónico pendiente (con el fin de trabajar junto a Suspense). En cambio, este hook devuelve un `Loadable`, que es un objeto con la siguiente interfaz:

- `state`: indica el estado del selector. Los valores posibles son `'hasValue'`, `'hasError'`, `'loading'`.
- `contents`: el valor representado por este `Loadable`. Si el estado es `hasValue`, es el valor real, si el estado es `hasError` es el objeto `Error` que se arrojó, y si el estado se está `loading`, entonces es un `Promise` del valor.
- `getValue()`: si hay un error, esta función arroja el error. Si el selector aún se está loading, arroja un Promise. De lo contrario, devuelve el valor que resolvió el selector.
- `toPromise()`: devuelve un `Promise` que se resolverá cuando el selector se haya resuelto. Si el selector está sincronizado o ya se resolvió, devuelve un `Promise` que se resuelve de inmediato.

---

- `state`: un [`átomo`](/docs/api-reference/core/atom) o [`selector`](/docs/api-reference/core/selector) que _puede_ tener algunas operaciones asincrónicas. El estado de el loadable devuelta dependerá del estado del selector dado. 

### Ejemplo

```jsx
function UserInfo({userID}) {
  const userNameLoadable = useRecoilValueLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
```
