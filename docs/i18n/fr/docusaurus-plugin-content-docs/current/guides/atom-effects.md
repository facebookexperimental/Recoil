---
title: Effets Atomiques
sidebar_label: Effets Atomiques
---

Effets Atomiques est une nouvelle API expérimentale pour la gestion des effets secondaires et l'initialisation des atomes Recoil. Ils ont une variété d'applications utiles telles que la persistance d'état, la synchronisation d'état, la gestion de l'historique, la journalisation, etc. Ils sont définis dans le cadre de la définition de l'atome, de sorte que chaque atome peut spécifier et composer ses propres politiques. Cette API est toujours en évolution, et donc marquée comme `_UNSTABLE`.

----
## *NOTE IMPORTANTE*
***Cette API est actuellement en cours de développement et changera. Merci de rester à l'écoute...***

----

Une *effet atomique* est une *function* avec la définition suivante.

```jsx
type AtomEffect<T> = ({
  node: RecoilState<T>, // Une référence à l'atome lui même
  trigger: 'get' | 'set', // L'action qui à déclancher l'initialisation de l'atome

  // Fonction de rappel pour assigner ou réinitialiser la valeur de l'atome.
  // Ceci peut être appelé directement depuis la fonction d'effet atomique pour initialiser 
  // la valeur initiale de l'atome, ou appelé ultérieurement de façon asynchrone pour la changer
  setSelf: (
    | T
    | DefaultValue
    | Promise<T | DefaultValue> // Seulement autoriser pour initialiser pour le moment
    | ((T | DefaultValue) => T | DefaultValue),
  ) => void,
  resetSelf: () => void,

  // Souscription aux changements de la valeur de l'atome.
  // La fonction de rappel n'est pas appeler suite à un changement suvenu du propre setSelf() de l'effet.
  onSet: (
    (newValue: T | DefaultValue, oldValue: T | DefaultValue) => void,
  ) => void,

}) => void | () => void; // Optionellement retourne une fonction de rappel de nettoyage
```

Les effets atomiques sont attachés aux [atomes](/docs/api-reference/core/atom) via l'option `effects_UNSTABLE`. Chaque atome peut référencer un tableau de ces fonctions d'effet d'atome qui sont appelées par ordre de priorité lorsque l'atome est initialisé. Les atomes sont initialisés lorsqu'ils sont utilisés pour la première fois dans un `<RecoilRoot>`, mais peuvent être réinitialisés à nouveau s'ils n'étaient pas utilisés et nettoyés. La fonction d'effet d'atome peut renvoyer un gestionnaire de nettoyage facultatif pour gérer les effets secondaires du nettoyage. 

```jsx
const myState = atom({
  key: 'MyKey',
  default: null,
  effects_UNSTABLE: [
    () => {
      ...effect 1...
      return () => ...cleanup effect 1...;
    },
    () => { ...effect 2... },
  ],
});
```

[Les familles d'atomes](/docs/api-reference/utils/atomFamily) supportent aussi les effects parametrés ou non-parametrés:

```jsx
const myStateFamily = atomFamily({
  key: 'MyKey',
  default: null,
  effects_UNSTABLE: param => [
    () => {
      ...effect 1 using param...
      return () => ...cleanup effect 1...;
    },
    () => { ...effect 2 using param... },
  ],
});
```

### Comparaison aux Effets React

Les Effets Actomiques pourraient généralement être implémentés via React `useEffect()`. Cependant, l'ensemble d'atomes est créé en dehors d'un contexte React, et il peut être difficile de gérer les effets à partir des composants React, en particulier pour les atomes créés dynamiquement. Ils ne peuvent pas non plus être utilisés pour initialiser la valeur de l'atome initiale ou être utilisés avec le rendu côté serveur. Utiliser des effets atomiques co-localise également les effets avec les définitions d'atome.

```jsx
const myState = atom({key: 'Key', default: null});

function MyStateEffect(): React.Node {
  const [value, setValue] = useRecoilState(myState);
  useEffect(() => {
    // Appelé quand la valeur de l'atome change
    store.set(value);
    store.onChange(setValue);
    return () => { store.onChange(null); }; // Effet de nettoyage
  }, [value]);
  return null;
}

function MyApp(): React.Node {
  return (
    <div>
      <MyStateEffect />
      ...
    </div>
  );
}
```

### Comparaison aux Instantanés

Les [`Snapshot hooks`](/docs/api-reference/core/Snapshot#hooks) peut également surveiller les changements d'état des atomes et la prop `initializeState` dans [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) peut initialiser les valeurs pour le rendu initial. Cependant, ces API surveillent tous les changements d'état et peuvent être gênantes pour gérer les atomes dynamiques, en particulier les familles d'atomes. Avec les effets atomiques, l'effet secondaire peut être défini par atome parallèlement à la définition de l'atome et plusieurs règles peuvent être facilement composées. 

## Exemple de la journalisation

Un exemple simple d'utilisation des effets atomiques est la journalisation des changements d'état d'un atome spécifique.

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: null,
  effects_UNSTABLE: [
    ({onSet}) => {
      onSet(newID => {
        console.debug("Current user ID:", newID);
      });
    },
  ],
});
```

## Exemple de l'historique

Un exemple plus complexe de journalisation pourrait conserver un historique des modifications. Cet exemple fournit un effet qui maintient une file d'attente d'historique des changements d'état avec des gestionnaires de rappel qui annulent cette modification particulière:

```jsx
const history: Array<{
  label: string,
  undo: () => void,
}> = [];

const historyEffect = name => ({setSelf, onSet}) => {
  onSet((newValue, oldValue) => {
    history.push({
      label: `${name}: ${JSON.serialize(oldValue)} -> ${JSON.serialize(newValue)}`,
      undo: () => {
        setSelf(oldValue);
      },
    });
  });
};

const userInfoState = atomFamily({
  key: 'UserInfo',
  default: null,
  effects_UNSTABLE: userID => [
    historyEffect(`${userID} user info`),
  ],
});
```

## Exemple de synchronisation d'état

Il peut être utile d'utiliser des atomes comme valeur locale en cache d'un autre état tel qu'une base de données distante, un stockage local, etc. Vous pouvez définir la valeur par défaut d'un atome en utilisant la propriété `default` avec un sélecteur pour obtenir la valeur dans l'objet d'état. Cependant, ce n'est qu'une recherche ponctuelle; si la valeur objet d'état change, la valeur de l'atome ne changera pas. Avec les effets, nous pouvons nous abonner à l'objet d'état et mettre à jour la valeur de l'atome chaque fois que le l'objet d'état change. L'appel de `setSelf()` à partir de l'effet initialisera l'atome à cette valeur et sera utilisé pour le rendu initial. Si l'atome est réinitialisé, il reviendra à la valeur par défaut, pas à la valeur initialisée. 

```jsx
const syncStorageEffect = userID => ({setSelf, trigger}) => {
  // Initialize atom value to the remote storage state
  if (trigger === 'get') { // Avoid expensive initialization
    setSelf(myRemoteStorage.get(userID)); // Call synchronously to initialize
  }

  // Subscribe to remote storage changes and update the atom value
  myRemoteStorage.onChange(userID, userInfo => {
    setSelf(userInfo); // Call asynchronously to change value
  });

  // Cleanup remote storage subscription
  return () => {
    myRemoteStorage.onChange(userID, null);
  };
};

const userInfoState = atomFamily({
  key: 'UserInfo',
  default: null,
  effects_UNSTABLE: userID => [
    historyEffect(`${userID} user info`),
    syncStorageEffect(userID),
  ],
});
```

## Exemple de Cache avec Écriture Immédiate

Nous pouvons également synchroniser de manière bidirectionnelle les valeurs d'atome avec un stockage distant afin que les modifications sur le serveur mettent à jour la valeur de l'atome et les modifications de l'atome local soient réécrites sur le serveur. L'effet n'appellera pas le gestionnaire `onSet()` lorsqu'il est modifié via `setSelf()` ceci pour éviter les boucles infinies.

```jsx
const syncStorageEffect = userID => ({setSelf, onSet, trigger}) => {
  // Initialiser la valeur de l'atome avec la valeur distante
  if (trigger === 'get') { // Éviter une initalisation couteuse
    setSelf(myRemoteStorage.get(userID)); // Appel sychrone pour initialiser
  }

  // Souscription aux changements distants et mise à jour de la valeur de l'atome
  myRemoteStorage.onChange(userID, userInfo => {
    setSelf(userInfo); // Appel asychrone pour changer la valeur
  });

  // Souscription aux changements locaux et mise à jour de la valeur distante
  onSet(userInfo => {
    myRemoteStorage.set(userID, userInfo);
  });

  // Nettoyer les souscriptions
  return () => {
    myRemoteStorage.onChange(userID, null);
  };
};
```

## Persistance locale

Les Effets Atomiques peuvent être utilisés pour conserver l'état de l'atome avec le [stockage local du navigateur](https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage). `localStorage` est synchrone, nous pouvons donc récupérer les données directement sans `async` `await` ou `Promise`.

Notez que les exemples suivants sont simplifiés à des fins d'illustration et ne couvrent pas tous les cas.

```jsx
const localStorageEffect = key => ({setSelf, onSet}) => {
  const savedValue = localStorage.getItem(key)
  if (savedValue != null) {
    setSelf(JSON.parse(savedValue));
  }

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localStorageEffect('current_user'),
  ]
});
```

## Persistance Asynchrone

Si vos données persistantes doivent être récupérées de manière asynchrone, vous pouvez soit [utiliser une `Promise`](#initialize-with-promise) dans la fonction `setSelf() `ou l'appeler [de façon asynchrone](#asynchronous-setself).

Ci-dessous, nous utiliserons `AsyncLocalStorage` ou` localForage` comme exemple de conteneur d'état asynchrone.

### Initialiser avec une `Promise`

En appelant de manière synchrone `setSelf()` avec une `Promise`, vous pourrez envelopper les composants à l'intérieur de `<RecoilRoot /> `avec un composant `<Suspense /> `pour afficher un repli en attendant que `Recoil` charge les valeurs persistées. `<Suspense>` affichera un repli jusqu'à ce que la `Promise` fournie àv`setSelf()` résolve. Si l'atome est défini avant la résolution de la `Promise`, la valeur initialisée sera ignorée.

Notez que si les `atomes` sont "réinitialisés" ultérieurement, ils reviendront à leur valeur par défaut, et non à la valeur initialisée. 

```jsx
const localForageEffect = key => ({setSelf, onSet}) => {
  setSelf(localForage.getItem(key).then(savedValue =>
    savedValue != null
      ? JSON.parse(savedValue)
      : new DefaultValue() // Abort initialization if no value was stored
  ));

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localForageEffect('current_user'),
  ]
});
```


### setSelf() asynchrone

Avec cette approche, vous pouvez appeler de manière asynchrone `setSelf()` lorsque la valeur est disponible. Contrairement à l'initialisation à une `Promise`, la valeur par défaut de l'atome sera utilisée initialement, donc `<Suspense>` n'affichera pas de repli, sauf si la valeur par défaut de l'atome est un sélecteur basé sur une `Promise` ou autrement asynchrone. Si l'atome à une valeur avant l'appel de `setSelf()`, alors celle-ci sera écrasée par `setSelf()`. Cette approche ne se limite pas seulement à `await`, mais à toute utilisation asynchrone de `setSelf()`, comme avec `setTimeout()`. 

```jsx
const localForageEffect = key => ({setSelf, onSet}) => {
  /** If there's a persisted value - set it on load  */
  const loadPersisted = async () => {
    const savedValue = await localForage.getItem(key);

    if (savedValue != null) {
      setSelf(JSON.parse(savedValue));
    }
  };

  // Load the persisted data
  loadPersisted();

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localForage.removeItem(key);
    } else {
      localForage.setItem(key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localForageEffect('current_user'),
  ]
});
```

## Rétrocompatibilité

Que ce passe-t-il si vous changez le format d'un atome? Le chargement d'une page avec le nouveau format avec un `localStorage` basé sur l'ancien format peut poser un problème. Vous pouvez créer des effets pour gérer la restauration et la validation des valeurs d'une manière à conserver la sûreté du typage: 

```jsx
type PersistenceOptions<T>: {
  key: string,
  restorer: (mixed, DefaultValue) => T | DefaultValue,
};

const localStorageEffect = <T>(options: PersistenceOptions<T>) => ({setSelf, onSet}) => {
  const savedValue = localStorage.getItem(options.key)
  if (savedValue != null) {
    setSelf(options.restorer(JSON.parse(savedValue), new DefaultValue()));
  }

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(options.key);
    } else {
      localStorage.setItem(options.key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom<number>({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localStorageEffect({
      key: 'current_user',
      restorer: (value, defaultValue) =>
        // Les valeurs sont couremment stocké en tant que nombres
        typeof value === 'number'
          ? value
          // Si la valeur était précédemment une chaîne de charactères, parser en nombre
          : typeof value === 'string'
          ? parseInt(value, 10)
          // sinon utiliser la valeur par défaut.
          : defaultValue
    }),
  ],
});
```

Que faire si la clé utilisée pour conserver la valeur change? Ou ce qui était conservé en utilisant une clé en utilise maintenant plusieurs? Ou vice versa? Cela peut également être géré de manière préservant la sûreté du typage:

```jsx
type PersistenceOptions<T>: {
  key: string,
  restorer: (mixed, DefaultValue, Map<string, mixed>) => T | DefaultValue,
};

const localStorageEffect = <T>(options: PersistenceOptions<T>) => ({setSelf, onSet}) => {
  const savedValues = parseValuesFromStorage(localStorage);
  const savedValue = savedValues.get(options.key);
  setSelf(
    options.restorer(savedValue ?? new DefaultValue(), new DefaultValue(), savedValues),
  );

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(options.key);
    } else {
      localStorage.setItem(options.key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom<number>({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localStorageEffect({
      key: 'current_user',
      restorer: (value, defaultValue, values) => {
        if (typeof value === 'number') {
          return value;
        }

        const oldValue = values.get('old_key');
        if (typeof oldValue === 'number') {
          return oldValue;
        }

        return defaultValue;
      },
    }),
  ],
});
```

## Persistance de l'historique des URL du navigateur

L'état de l'atome peut également être conservé et synchronisé avec l'historique des URL du navigateur. Cela peut être utile pour que les changements d'état mettent à jour l'URL actuelle afin qu'elle puisse être enregistrée ou partagée avec d'autres pour restaurer cet état. Il peut également être intégré à l'historique du navigateur pour exploiter les boutons avant / arrière du navigateur. *Des exemples ou une bibliothèque pour fournir ce type de persistance sont à venir ...* 
