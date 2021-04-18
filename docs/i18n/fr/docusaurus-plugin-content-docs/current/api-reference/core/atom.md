---
title: atome(options)
sidebar_label: atom()
---

Un *atome* représente l'état dans Recoil. La fonction `atom()` renvoie un objet `RecoilState` inscriptible.

---

```jsx
function atom<T>({
  key: string,
  default: T | Promise<T> | RecoilValue<T>,

  effects_UNSTABLE?: $ReadOnlyArray<AtomEffect<T>>,

  dangerouslyAllowMutability?: boolean,
}): RecoilState<T>
```

  - `key` - Une chaîne unique utilisée pour identifier l'atome en interne. Cette chaîne doit être unique par rapport aux autres atomes et sélecteurs dans l'ensemble de l'application.
  - `default` - La valeur initiale de l'atome ou d'une` Promise` ou d'un autre atome ou sélecteur représentant une valeur du même type.
  - `effects_UNSTABLE` - Un tableau optionnel d'[Effets Atomiques](/docs/guides/atom-effects) pour l'atome.
  - `dangerouslyAllowMutability` - Dans certains cas, il peut être souhaitable d'autoriser la mutation d'objets stockés dans des atomes qui ne représentent pas des changements d'état. Utilisez cette option pour remplacer le gel des objets en mode développement.

---

Recoil gère les changements d'état de l'atome pour savoir quand notifier les composants souscrivant à cet atome pour un nouveau rendu, vous devez donc utiliser les hooks répertoriés ci-dessous pour changer l'état de l'atome. Si un objet stocké dans un atome a été muté directement, il peut le contourner et provoquer des changements d'état sans notifier correctement les composants abonnés. Pour aider à détecter les bogues, Recoil gèlera les objets stockés dans les atomes en mode développement.

Le plus souvent, vous utiliserez les crochets suivants pour interagir avec les atomes:

- [`useRecoilState()`](/docs/api-reference/core/useRecoilState): Utilisez ce hook lorsque vous avez l'intention de lire et d'écrire sur l'atome. Ce hook abonne le composant à l'atome.
- [`useRecoilValue()`](/docs/api-reference/core/useRecoilValue): utilisez ce hook lorsque vous avez l'intention de lire uniquement l'atome. Ce hook abonne le composant à l'atome.
- [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState): utilisez ce hook lorsque vous avez l'intention d'écrire uniquement sur l'atome.
- [`useResetRecoilState()`](/docs/api-reference/core/useResetRecoilState): utilisez ce hook pour réinitialiser un atome à sa valeur par défaut.

Pour les rares cas où vous devez lire la valeur d'un atome sans vous abonner au composant, consultez [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback).

Vous pouvez initialiser un atome soit avec une valeur statique, soit avec une `Promise` ou une` RecoilValue` représentant une valeur du même type. Parce que la `Promise` peut être en attente ou que le sélecteur par défaut peut être asynchrone, cela signifie que la valeur de l'atome peut également être en attente ou générer une erreur lors de la lecture. Notez que vous ne pouvez pas actuellement attribuer de `Promise` lors de la définition d'un atome. Veuillez utiliser des [sélecteurs](/docs/api-reference/core/selector) pour les fonctions asynchrones.

Les atomes ne peuvent pas être utilisés pour stocker directement les «Promise» ou «RecoilValue», mais ils peuvent être enveloppés dans un objet. Notez que les promesses peuvent être mutables. Les atomes peuvent être définis sur une `fonction`, tant qu'ils sont purs, mais pour ce faire, vous devrez peut-être utiliser la forme de mise à jour des setters. (par exemple `set (myAtom, () => myFunc);`).

### Exemple

```jsx
import {atom, useRecoilState} from 'recoil';

const counter = atom({
  key: 'myCounter',
  default: 0,
});

function Counter() {
  const [count, setCount] = useRecoilState(counter);
  const incrementByOne = () => setCount(count + 1);

  return (
    <div>
      Count: {count}
      <br />
      <button onClick={incrementByOne}>Increment</button>
    </div>
  );
}
```
