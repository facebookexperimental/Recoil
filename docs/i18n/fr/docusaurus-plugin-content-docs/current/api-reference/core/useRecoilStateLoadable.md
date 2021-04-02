---
title: useRecoilStateLoadable(state)
sidebar_label: useRecoilStateLoadable()
---

Ce hook est destiné à être utilisé pour lire la valeur des sélecteurs asynchrones. Ce hook abonnera implicitement le composant à l'état donné.

Contrairement à [`useRecoilState()`](/docs/api-reference/core/useRecoilState), ce hook ne lancera pas une `Error` ou une `Promise` lors de la lecture à partir d'un sélecteur asynchrone (dans le but de travailler avec [React Suspense ] (https://reactjs.org/docs/concurrent-mode-suspense.html)). Au lieu de cela, ce hook renvoie un objet [`Loadable`](/docs/api-reference/core/Loadable) pour la valeur avec le rappel du setter.

---

```jsx
function useRecoilStateLoadable<T>(state: RecoilState<T>): [Loadable<T>, (T | (T => T)) => void]
```
- `state`: un [` atom`] (/ docs/api-reference/core/atom) ou un [`selector`] (/ docs/api-reference/core/selector) inscriptible qui _peut_ avoir des opérations asynchrones. L'état du chargeable retourné dépendra de l'état du sélecteur d'état fourni.

Renvoie un [`Loadable`](/docs/api-reference/core/Loadable) pour l'état actuel avec l'interface:

- `state`: indique l'état du sélecteur. Les valeurs possibles sont `'hasValue'`, `'hasError'`, `'loading'`.
- `contents`: La valeur représentée par ce` Loadable`. Si l'état est `'hasValue'`, c'est la valeur réelle, si l'état est `'hasError'`, c'est l'objet `Error` qui a été lancé, et si l'état est `loading`, alors c'est une `Promise` du évaluer.

---

### Exemple

```jsx
function UserInfo({userID}) {
  const [userNameLoadable, setUserName] = useRecoilStateLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
