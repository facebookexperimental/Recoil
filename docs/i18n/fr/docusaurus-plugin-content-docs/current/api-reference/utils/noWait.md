---
title: noWait(state)
sidebar_label: noWait()
---

Un assistant de sélection qui renverra un [`Loadable`](/docs/api-reference/core/Loadable) pour l'état actuel de l'[`atome`](/docs/api-reference/core/atom)) ou [ `sélecteur`](/docs/api-reference/core/selector).

```jsx
function noWait<T>(state: RecoilValue<T>): RecoilValueReadOnly<Loadable<T>>
```

---

Cet assistant peut être utilisé pour obtenir l'état actuel d'une dépendance potentiellement asynchrone sans lever d'exception s'il y a une erreur ou si la dépendance est toujours en attente. Il est similaire à [`useRecoilValueLoadable()`](/docs/api-reference/core/useRecoilValueLoadable) sauf qu'il s'agit d'un sélecteur au lieu d'un hook. Puisque `noWait ()` renvoie un sélecteur, il peut à son tour être utilisé par d'autres sélecteurs Recoil ainsi que par des hooks.

### Exemple

```jsx
const myQuery = selector({
  key: 'MaRequête',
  get: ({get}) => {
    const loadable = get(noWait(dbQuerySelector));

    return {
      hasValue: {data: loadable.contents},
      hasError: {error: loadable.contents},
      loading: {data: 'substituant pendant chargement'},
    }[loadable.state];
  }
})

```
