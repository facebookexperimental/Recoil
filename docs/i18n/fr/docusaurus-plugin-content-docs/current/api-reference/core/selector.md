---
title: selector(options)
sidebar_label: selector()
---

Les *sélecteurs* représentent une fonction, ou un **état dérivé** dans Recoil. Vous pouvez les considérer comme similaires à une "fonction idempotente" ou "pure" sans effets secondaires qui renvoie toujours la même valeur pour un ensemble donné de valeurs de dépendance. Si seule une fonction `get` est fournie, le sélecteur est en lecture seule et renvoie un objet `RecoilValueReadOnly`. Si un `set` est également fourni, il renvoie un objet` RecoilState` inscriptible.

Recoil gère les changements d'état des atomes et des sélecteurs pour savoir quand notifier les composants abonnés à ce sélecteur pour qu'ils effectuent un nouveau rendu. Si une valeur d'objet d'un sélecteur est mutée directement, il peut le contourner et éviter de notifier correctement les composants abonnés. Pour aider à détecter les bogues, Recoil gèlera les objets de valeur du sélecteur en mode développement.

---

```jsx
function selector<T>({
  key: string,

  get: ({
    get: GetRecoilValue
  }) => T | Promise<T> | RecoilValue<T>,

  set?: (
    {
      get: GetRecoilValue,
      set: SetRecoilState,
      reset: ResetRecoilState,
    },
    newValue: T | DefaultValue,
  ) => void,

  dangerouslyAllowMutability?: boolean,
})
```

```jsx
type ValueOrUpdater<T> = T | DefaultValue | ((prevValue: T) => T | DefaultValue);
type GetRecoilValue = <T>(RecoilValue<T>) => T;
type SetRecoilState = <T>(RecoilState<T>, ValueOrUpdater<T>) => void;
type ResetRecoilState = <T>(RecoilState<T>) => void;
```

- `key` - Une chaîne unique utilisée pour identifier l'atome en interne. Cette chaîne doit être unique par rapport aux autres atomes et sélecteurs dans l'ensemble de l'application. Il doit être stable entre les exécutions s'il est utilisé pour la persistance.
- `get` - Une fonction qui évalue la valeur de l'état dérivé. Il peut renvoyer soit une valeur directement, soit une `Promise` asynchrone ou un autre atome ou sélecteur représentant le même type. Il est passé un objet comme premier paramètre contenant les propriétés suivantes:
  - `get` - une fonction utilisée pour récupérer les valeurs d'autres atomes / sélecteurs. Tous les atomes / sélecteurs passés à cette fonction seront implicitement ajoutés à une liste de **dépendances** pour le sélecteur. Si l'une des dépendances du sélecteur change, le sélecteur réévaluera.
- `set?` - Si cette propriété est définie, le sélecteur retournera l'état **inscriptible**. Une fonction qui reçoit un objet de rappels en tant que premier paramètre et nouvelle valeur entrante. La valeur entrante peut être une valeur de type `T` ou peut-être un objet de type `DefaultValue` si l'utilisateur réinitialise le sélecteur. Les rappels incluent:
  - `get` - une fonction utilisée pour récupérer les valeurs d'autres atomes/sélecteurs. Cette fonction n'abonnera pas le sélecteur aux atomes/sélecteurs donnés.
  - `set` - une fonction utilisée pour définir les valeurs de l'état Recoil en amont. Le premier paramètre est l'état Recoil et le second paramètre est la nouvelle valeur. La nouvelle valeur peut être une fonction de mise à jour ou un objet `DefaultValue` pour propager les actions de réinitialisation.
- `dangerouslyAllowMutability` - Dans certains cas, il peut être souhaitable d'autoriser la mutation des objets stockés dans des sélecteurs qui ne représentent pas des changements d'état. Utilisez cette option pour remplacer le gel des objets en mode développement.

---

Un sélecteur avec une simple dépendance statique:

```jsx
const mySelector = selector({
  key: 'MySelector',
  get: ({get}) => get(myAtom) * 100,
});
```

### Dépendances dynamiques

Un sélecteur en lecture seule a une méthode `get` qui évalue la valeur du sélecteur en fonction des dépendances. Si l'une de ces dépendances est mise à jour, le sélecteur réévaluera. Les dépendances sont déterminées dynamiquement en fonction des atomes ou des sélecteurs que vous utilisez réellement lors de l'évaluation du sélecteur. En fonction des valeurs des dépendances précédentes, vous pouvez utiliser dynamiquement différentes dépendances supplémentaires. Recoil mettra automatiquement à jour le graphique de flux de données actuel afin que le sélecteur ne soit abonné qu'aux mises à jour de l'ensemble actuel de dépendances

Dans cet exemple, `mySelector` dépendra de l'atome` toggleState` ainsi que de `selectorA` ou de` selectorB` selon l'état de `toggleState`.
```jsx
const toggleState = atom({key: 'Toggle', default: false});

const mySelector = selector({
  key: 'MySelector',
  get: ({get}) => {
    const toggle = get(toggleState);
    if (toggle) {
      return get(selectorA);
    } else {
      return get(selectorB);
    }
  },
});
```

### Sélecteurs inscriptibles

Un sélecteur bidirectionnel reçoit la valeur entrante en tant que paramètre et peut l'utiliser pour propager les modifications en amont le long du graphe de flux de données. Étant donné que l'utilisateur peut définir le sélecteur avec une nouvelle valeur ou réinitialiser le sélecteur, la valeur entrante est soit du même type que le sélecteur représente, soit un objet `DefaultValue` qui représente une action de réinitialisation.

Ce sélecteur simple enveloppe essentiellement un atome pour ajouter un champ supplémentaire. Il passe simplement par les opérations de définition et de réinitialisation de l'atome en amont.
```jsx
const proxySelector = selector({
  key: 'ProxySelector',
  get: ({get}) => ({...get(myAtom), extraField: 'hi'}),
  set: ({set}, newValue) => set(myAtom, newValue),
});
```

Ce sélecteur transforme les données, il doit donc vérifier si la valeur entrante est une `DefaultValue`.
```jsx
const transformSelector = selector({
  key: 'TransformSelector',
  get: ({get}) => get(myAtom) * 100,
  set: ({set}, newValue) =>
    set(myAtom, newValue instanceof DefaultValue ? newValue : newValue / 100),
});
```

### Sélecteurs asynchrones

Les sélecteurs peuvent également avoir des fonctions d'évaluation asynchrones et renvoyer une `Promise` à la valeur de sortie. Veuillez consulter [ce guide](/docs/guides/asynchronous-data-queries) pour plus d'informations.

```jsx
const myQuery = selector({
  key: 'MyQuery',
  get: async ({get}) => {
    return await myAsyncQuery(get(queryParamState));
  }
});
```

### Exemple (synchrone)

```jsx
import {atom, selector, useRecoilState, DefaultValue} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelsius = selector({
  key: 'tempCelsius',
  get: ({get}) => ((get(tempFahrenheit) - 32) * 5) / 9,
  set: ({set}, newValue) =>
    set(
      tempFahrenheit,
      newValue instanceof DefaultValue ? newValue : (newValue * 9) / 5 + 32
    ),
});

function TempCelsius() {
  const [tempF, setTempF] = useRecoilState(tempFahrenheit);
  const [tempC, setTempC] = useRecoilState(tempCelsius);
  const resetTemp = useResetRecoilState(tempCelsius);

  const addTenCelsius = () => setTempC(tempC + 10);
  const addTenFahrenheit = () => setTempF(tempF + 10);
  const reset = () => resetTemp();

  return (
    <div>
      Temp (Celsius): {tempC}
      <br />
      Temp (Fahrenheit): {tempF}
      <br />
      <button onClick={addTenCelsius}>Add 10 Celsius</button>
      <br />
      <button onClick={addTenFahrenheit}>Add 10 Fahrenheit</button>
      <br />
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Exemple (asynchrone)

```jsx
import {selector, useRecoilValue} from 'recoil';

const myQuery = selector({
  key: 'MyDBQuery',
  get: async () => {
    const response = await fetch(getMyRequestUrl());
    return response.json();
  },
});

function QueryResults() {
  const queryResults = useRecoilValue(myQuery);

  return (
    <div>
      {queryResults.foo}
    </div>
  );
}

function ResultsSection() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <QueryResults />
    </React.Suspense>
  );
}
```

Veuillez consulter [ce guide](/docs/guides/asynchronous-data-queries) pour des exemples plus complexes.