---
title: waitForAny(dependencies)
sidebar_label: waitForAny()
---

Un assistant de concurrence qui renvoie un ensemble de [`Loadable`s](/docs/api-reference/core/Loadable) pour l'état actuel des dépendances demandées. Il attend qu'au moins une des dépendances soit disponible.

Les dépendances peuvent être fournies sous forme de tableau de tuples ou de dépendances nommées dans un objet.

---

```jsx
function waitForAny(dependencies: Array<RecoilValue<>>):
  RecoilValueReadOnly<UnwrappedArrayOfLoadables>
```

```jsx
function waitForAny(dependencies: {[string]: RecoilValue<>}):
  RecoilValueReadOnly<UnwrappedObjectOfLoadables>
```
---

`waitForAny()` est similaire à [`waitForNone()`](/docs/api-reference/utils/waitForNone), sauf qu'il attend qu'au moins une dépendance ait une valeur (ou une erreur) disponible au lieu de retourner immédiatement. 