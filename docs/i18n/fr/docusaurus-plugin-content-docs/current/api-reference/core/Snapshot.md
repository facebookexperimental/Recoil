---
title: class Snapshot
sidebar_label: Snapshot
---

Un objet `Snapshot` (instané) représente un instantané immuable de l'état de Recoil [atomes](/docs/api-reference/core/atom). Il est destiné à normaliser l'API pour observer, inspecter et gérer l'état Recoil global. Il est surtout utile pour les outils de développement, la synchronisation globale de l'état, la navigation dans l'historique, etc.

```jsx
class Snapshot {
  // Accessors to inspect snapshot state
  getLoadable: <T>(RecoilValue<T>) => Loadable<T>;
  getPromise: <T>(RecoilValue<T>) => Promise<T>;

  // API to transform snapshots for transactions
  map: (MutableSnapshot => void) => Snapshot;
  asyncMap: (MutableSnapshot => Promise<void>) => Promise<Snapshot>;

  // Developer Tools API
  getID: () => SnapshotID;
  getNodes_UNSTABLE: ({
    isModified?: boolean,
  } | void) => Iterable<RecoilValue<mixed>>;
  getInfo_UNSTABLE: <T>(RecoilValue<T>) => {...};
}

function snapshot_UNSTABLE(initializeState?: (MutableSnapshot => void)): Snapshot
```

## Obtenir des instantanés

### Crochets

Recoil fournit les hooks suivants pour obtenir des instantanés en fonction de l'état actuel:

- [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) - Accès asynchrone à un snapshot
- [`useRecoilSnapshot()`](/docs/api-reference/core/useRecoilSnapshot) - Accès synchrone à un snapshot
- [`useRecoilTransactionObserver_UNSTABLE()`](/docs/api-reference/core/useRecoilTransactionObserver) - Abonnez-vous aux Snapshots pour tous les changements d'état

### Créer un instantané

Vous pouvez également créer un instantané frais en utilisant la fabrique `snapshot_UNSTABLE()`, qui accepte une fonction d'initialisation facultative. Cela peut être utilisé pour [tester](/docs/guides/testing) ou pour évaluer des sélecteurs en dehors d'un contexte React.

## Lecture des instantanés

Les instantanés sont en lecture seule par rapport à l'état de l'atome. Ils peuvent être utilisés pour lire l'état de l'atome et évaluer l'état dérivé des sélecteurs. `getLoadable()` fournit un [`Loadable`](/docs/api-reference/core/Loadable) avec l'état de l'atome ou du sélecteur dans cet instantané. La méthode `getPromise()` peut être utilisée pour attendre la valeur évaluée des sélecteurs asynchrones, afin que vous puissiez voir quelle serait la valeur basée sur l'état de l'atome statique.

### Exemple

```jsx
function MyComponent() {
  const logState = useRecoilCallback(({snapshot}) => () => {
    console.log("State: ", snapshot.getLoadable(myAtom).contents);

    const newSnapshot = snapshot.map(({set}) => set(myAtom, 42));
  });
}
```

## Transformer les instantanés

Il existe des cas où vous souhaiterez peut-être muter un instantané. Bien que les instantanés soient immuables, ils disposent de méthodes pour se mapper avec un ensemble de transformations vers un nouvel instantané immuable. Les méthodes de mappage prennent un rappel qui reçoit un MutableSnapshot, qui est muté tout au long du rappel et deviendra finalement le nouvel instantané retourné par l'opération de mappage.

```jsx
class MutableSnapshot {
  set: <T>(RecoilState<T>, T | DefaultValue | (T => T | DefaultValue)) => void;
  reset: <T>(RecoilState<T>) => void;
}
```

Notez que `set()` et `reset()` ont la même signature que les rappels fournis à la propriété `set` d'un sélecteur inscriptible, mais ils n'affectent que le nouvel instantané, pas l'état actuel.

## Accéder à un instantané

Le crochet suivant peut être utilisé pour naviguer de l'état de Recoil actuel vers le `Snapshot` fourni:
- [`useGotoRecoilSnapshot()`](/docs/api-reference/core/useGotoRecoilSnapshot) - Mettre à jour l'état actuel pour qu'il corresponde à un instantané


## Outils de développement

Les instantanés fournissent des méthodes utiles pour [créer des outils de développement](/docs/guides/dev-tools) ou pour déboguer des capacités avec Recoil. Cette API est toujours en évolution, et donc marquée comme `_UNSTABLE`, alors que nous travaillons sur les outils de développement initiaux.

### ID des instantanés

Chaque état validé ou snapshot muté a un ID de version opaque unique qui peut être obtenu via `getID()`. Cela peut être utilisé pour détecter quand nous sommes revenus à un instantané précédent via `useGotoRecoilSnapshot()`.

### Énumérer les atomes et les sélecteurs

La méthode `getNodes_UNSTABLE()` peut être utilisée pour itérer tous les atomes et sélecteurs qui étaient utilisés pour cet instantané. Des atomes, des sélecteurs et des familles peuvent être créés à tout moment. Cependant, ils n'apparaîtront dans l'instantané que s'ils sont réellement utilisés. Les atomes et les sélecteurs peuvent être supprimés des instantanés d'état suivants s'ils ne sont plus utilisés.

Un drapeau optionnel `isModified` peut être spécifié pour ne renvoyer que les atomes qui ont été modifiés depuis la dernière transaction.

### Informations de débogage

La méthode `getInfo_UNSTABLE ()` fournit des informations de débogage supplémentaires pour les atomes et les sélecteurs. Les informations de débogage fournies évoluent, mais peuvent inclure:

* `loadable` - Un chargeable avec l'état actuel. Contrairement aux méthodes comme `getLoadable()`, cette méthode ne mute pas du tout l'instantané. Il fournit l'état actuel et n'initialisera pas de nouveaux atomes/sélecteurs, n'effectuera aucune nouvelle évaluation de sélecteur ou ne mettra à jour aucune dépendance ou abonnement.
* `isSet` - Vrai s'il s'agit d'un atome avec une valeur explicite stockée dans l'état de l'instantané. Faux s'il s'agit d'un sélecteur ou qu'il s'agit d'une valeur par défaut.
* `isModified` - Vrai s'il s'agit d'un atome qui a été modifié depuis la dernière transaction.
* `type` - Soit un `atome`, soit un `sélecteur`
* `deps` - Un itérateur sur les atomes ou sélecteurs dont dépend ce nœud.
* `abonnés` - Informations sur ce qui s'abonne à ce nœud pour cet instantané. Détails en cours de développement.

Ceci est similaire au hook [`useGetRecoilValueInfo_UNSTABLE()`](/docs/api-reference/core/useGetRecoilValueInfo), mais les informations fournies sont basées sur l'état du `Snapshot` en place de l'état courant. Il n'est pas possible d'obtenir des informations non-associées à un snapshot Recoil, tel que souscrire à un composant React.

## Initialisation de l'état

Le composant [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) et l'usine `snapshot_UNSTABLE ()` prennent un accessoire optionnel `initializeState` pour initialiser l'état via un` MutableSnapshot`. Cela peut être utile pour charger l'état persistant lorsque vous connaissez tous les atomes à l'avance et est compatible avec le rendu côté serveur où l'état doit être configuré de manière synchrone avec le rendu initial. Pour l'initialisation / la persistance par atome et la facilité de travailler avec des atomes dynamiques, considérez les [Effets Atomiques](/docs/guides/atom-effects)

```jsx
function MyApp() {
  function initializeState({set}) {
    set(myAtom, 'foo');
  }

  return (
    <RecoilRoot initializeState={initializeState}>
      ...
    </RecoilRoot>
  );
}
```
