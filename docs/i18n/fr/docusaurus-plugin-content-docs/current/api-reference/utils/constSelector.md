---
title: constSelector(constante)
sidebar_label: constSelector()
---

Un [sélecteur](/docs/api-reference/core/selector) qui fournit toujours une valeur constante.

```jsx
function constSelector<T: Parameter>(constant: T): RecoilValueReadOnly<T>
```

Un `constSelector` peut être utile si vous avez une interface qui utilise un type tel que `RecoilValue<T>` ou `RecoilValueReadOnly<T> `qui peut être fournie par différentes implémentations de sélecteur.

Ces sélecteurs mémoriseront en fonction de l'égalité des valeurs de référence. Ainsi, `constSelector()` peut être appelé plusieurs fois avec la même valeur et le même sélecteur sera fourni. Pour cette raison, la valeur utilisée comme constante est limitée aux types qui peuvent être sérialisés à l'aide de la sérialisation Recoil. Veuillez consulter la documentation dans [`selectorFamily`](/docs/api-reference/utils/selectorFamily) décrivant les limitations.

### Exemple

```jsx
type MyInterface = {
  queryForStuff: RecoilValue<Thing>,
  ...
};

const myInterfaceInstance1: MyInterface = {
  queryForStuff: selectorThatDoesQuery,
};

const myInterfaceInstance2: MyInterface = {
  queryForStuff: constSelector(thing),
};
```
