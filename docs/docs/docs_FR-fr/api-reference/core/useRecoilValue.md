---
title: useRecoilValue(state)
sidebar_label: useRecoilValue()
---

Renvoie la valeur de l'état Recoil donné.

Ce hook abonnera implicitement le composant à l'état donné.

---

```jsx
function useRecoilValue<T>(state: RecoilValue<T>): T;
```

- `state`: un [`atome`](/docs_FR-fr/api-reference/core/atom) ou [`sélecteur`](/docs_FR-fr/api-reference/core/selector)

---

C'est le hook recommandé à utiliser lorsqu'un composant a l'intention de lire l'état sans y écrire, car ce hook fonctionne à la fois avec **l'état en lecture seule** et **l'état inscriptible**. Les atomes sont des états inscriptibles tandis que les sélecteurs peuvent être en lecture seule ou en écriture. Voir [`selector()`](/docs_FR-fr/api-reference/core/selector) pour plus d'informations.

L'utilisation de ce hook dans un composant React abonnera le composant à restituer lorsque l'état est mis à jour. Ce hook peut déclencher si l'état a une erreur ou est en attente de résolution asynchrone. Veuillez consulter [ce guide](/docs_FR-fr/guides/asynchronous-data-queries).

### Exemple

```jsx
import {atom, selector, useRecoilValue} from 'recoil';

const namesState = atom({
  key: 'namesState',
  default: ['', 'Ella', 'Chris', '', 'Paul'],
});

const filteredNamesState = selector({
  key: 'filteredNamesState',
  get: ({get}) => get(namesState).filter((str) => str !== ''),
});

function NameDisplay() {
  const names = useRecoilValue(namesState);
  const filteredNames = useRecoilValue(filteredNamesState);

  return (
    <>
      Original names: {names.join(',')}
      <br />
      Filtered names: {filteredNames.join(',')}
    </>
  );
}
```
