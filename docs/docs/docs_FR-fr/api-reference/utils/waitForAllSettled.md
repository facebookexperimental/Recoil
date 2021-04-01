---
title: waitForAllSettled(dependencies)
sidebar_label: waitForAllSettled()
---

Un assistant de concurrence qui renvoie un ensemble de [`Loadable`s](/docs_FR-fr/api-reference/core/Loadable) pour l'état actuel des dépendances demandées. Il attend que toutes les dépendances soient soit une valeur ou une erreur.

Les dépendances peuvent être fournies sous forme de tableau de tuples ou de dépendances nommées dans un objet.

---

```jsx
function waitForAllSettled(dependencies: Array<RecoilValue<>>):
  RecoilValueReadOnly<UnwrappedArrayOfLoadables>
```

```jsx
function waitForAllSettled(dependencies: {[string]: RecoilValue<>}):
  RecoilValueReadOnly<UnwrappedObjectOfLoadables>
```
---

`waitForAllSettled()` est similaire à [`waitForNone()`](/docs_FR-fr/api-reference/utils/waitForNone), sauf qu'il attend qu'au moins une dépendance ait une valeur (ou une erreur) disponible au lieu de retourner immédiatement. 