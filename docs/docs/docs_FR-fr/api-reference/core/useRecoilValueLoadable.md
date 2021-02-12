---
title: useRecoilValueLoadable(state)
sidebar_label: useRecoilValueLoadable()
---

Ce hook est destiné à être utilisé pour lire la valeur des sélecteurs asynchrones. Ce hook abonnera implicitement le composant à l'état donné.

Contrairement à [`useRecoilValue()`](/docs_FR-fr/api-reference/core/useRecoilValue), ce hook ne lancera pas une `Error` ou une `Promise` lors de la lecture à partir d'un sélecteur asynchrone (dans le but de travailler avec [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html)). Au lieu de cela, ce hook renvoie un objet [`Loadable`](/docs_FR-fr/api-reference/core/Loadable).

---


```jsx
function useRecoilValueLoadable<T>(state: RecoilValue<T>): Loadable<T>
```
- `state`: un [`atome`](/docs_FR-fr/api-reference/core/atom) ou [`sélecteur`](/docs_FR-fr/api-reference/core/selector) qui _peut_ avoir des opérations asynchrones. L'état du chargeable retourné dépendra de l'état du sélecteur d'état fourni.

Renvoie un [`Loadable`](/docs_FR-fr/api-reference/core/Loadable) pour l'état actuel avec l'interface:

- `state`: indique l'état du sélecteur. Les valeurs possibles sont `'hasValue'`, `'hasError'`, `'loading'`.
- `contents`: La valeur représentée par ce` Loadable`. Si l'état est `'hasValue'`, c'est la valeur réelle, si l'état est `'hasError'`, c'est l'objet `Error` qui a été lancé, et si l'état est `loading`, alors c'est une `Promise` du évaluer.

---

### Exemple

```jsx
function UserInfo({userID}) {
  const userNameLoadable = useRecoilValueLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Chargement...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
