---
title: errorSelector(message)
sidebar_label: errorSelector()
---

Un [sélecteur](/docs_FR-fr/api-reference/core/selector) qui renvoie toujours l'erreur fournie

```jsx
function errorSelector(message: string): RecoilValueReadOnly
```

### Exemple

```jsx
const myAtom = atom({
  key: 'Mon Atome',
  default: errorSelector(`L'atome à été utilisé avant d'être initialisé`),
});
```
