---
title: selectorFamily(options)
sidebar_label: selectorFamily()
---

Renvoie une fonction qui renvoie un sélecteur en lecture seule `RecoilValueReadOnly` ou en écriture `RecoilState`.

Un `selectorFamily` est un modèle puissant qui est similaire à un [`sélecteur`](/docs/api-reference/core/selector), mais vous permet de passer des paramètres aux callbacks `get` et` set` d'un ` sélecteur ». L'utilitaire `selectorFamily ()` retourne une fonction qui peut être appelée avec des paramètres définis par l'utilisateur et renvoie un sélecteur. Chaque valeur de paramètre unique renverra la même instance de sélecteur mémorisée.

---

```jsx
function selectorFamily<T, Parameter>({
  key: string,

  get: Parameter => ({get: GetRecoilValue}) => Promise<T> | RecoilValue<T> | T,

  dangerouslyAllowMutability?: boolean,
}): Parameter => RecoilValueReadOnly<T>
```

```jsx
function selectorFamily<T, Parameter>({
  key: string,

  get: Parameter => ({get: GetRecoilValue}) => Promise<T> | RecoilValue<T> | T,

  set: Parameter => (
    {
      get: GetRecoilValue,
      set: SetRecoilValue,
      reset: ResetRecoilValue,
    },
    newValue: T | DefaultValue,
  ) => void,

  dangerouslyAllowMutability?: boolean,
}): Parameter => RecoilState<T>
```

Où

```jsx
type ValueOrUpdater<T> =  T | DefaultValue | ((prevValue: T) => T | DefaultValue);
type GetRecoilValue = <T>(RecoilValue<T>) => T;
type SetRecoilValue = <T>(RecoilState<T>, ValueOrUpdater<T>) => void;
type ResetRecoilValue = <T>(RecoilState<T>) => void;
```

- `key` - Une chaîne unique utilisée pour identifier l'atome en interne. Cette chaîne doit être unique par rapport aux autres atomes et sélecteurs dans l'ensemble de l'application.
- `get` - Une fonction qui reçoit un objet de callbacks nommés qui retourne la valeur du sélecteur, identique à l'interface `selector()`. Ceci est encapsulé par une fonction qui reçoit le paramètre de l'appel de la fonction de famille de sélecteur.
- `set?` - Une fonction optionnelle qui produira des sélecteurs inscriptibles lorsqu'ils sont fournis. Ce devrait être une fonction qui prend un objet de callbacks nommés, comme l'interface `selector()`. Ceci est à nouveau encapsulé par une autre fonction avec obtient les paramètres de l'appel de la fonction de famille de sélecteur.

---

Le `selectorFamily` fournit essentiellement une carte du paramètre à un sélecteur. Étant donné que les paramètres sont souvent générés sur les sites d'appel à l'aide de la famille, et que nous voulons que les paramètres équivalents réutilisent le même sélecteur sous-jacent, il utilise l'égalité des valeurs par défaut au lieu de l'égalité des références. (Il existe une API instable `cacheImplementationForParams` pour ajuster ce comportement). Cela impose des restrictions sur les types qui peuvent être utilisés pour le paramètre. Veuillez utiliser un type primitif ou un objet qui peut être sérialisé. Recoil utilise un sérialiseur personnalisé qui peut prendre en charge les objets et les tableaux, certains conteneurs (tels que les ensembles et les cartes ES6), est invariant de l'ordre des clés d'objet, prend en charge les symboles, les itérables et utilise les propriétés `toJSON` pour la sérialisation personnalisée (comme celles fournies avec les bibliothèques comme les conteneurs immuables). L'utilisation de fonctions ou d'objets modifiables, tels que les promesses, dans les paramètres est problématique.

## Exemple

```jsx
const myNumberState = atom({
  key: 'MonNumero',
  default: 2,
});

const myMultipliedState = selectorFamily({
  key: 'MonNumeroMultiplié',
  get: (multiplier) => ({get}) => {
    return get(myNumberState) * multiplier;
  },

  // set optionel
  set: (multiplier) => ({set}, newValue) => {
    set(myNumberState, newValue / multiplier);
  },
});

function MonComposant() {
  // 2 par défaut
  const number = useRecoilValue(myNumberState);

  // 200 par défaut
  const multipliedNumber = useRecoilValue(myMultipliedState(100));

  return <div>...</div>;
}
```

## Exemple de requête asynchrone

Les familles de sélecteurs sont également utiles pour passer des paramètres aux requêtes. Notez que l'utilisation d'un sélecteur pour abstraire des requêtes comme celle-ci doit toujours être des fonctions «pures» qui renvoient toujours le même résultat pour un ensemble donné d'entrées et de valeurs de dépendance. Voir [ce guide](/docs_FR-fr/guides/asynchronous-data-queries) pour plus d'exemples.

```jsx
const myDataQuery = selectorFamily({
  key: 'MaRequêteDeDonnées',
  get: (queryParameters) => async ({get}) => {
    const response = await asyncDataRequest(queryParameters);
    if (response.error) {
      throw response.error;
    }
    return response.data;
  },
});

function MonComposant() {
  const data = useRecoilValue(myDataQuery({userID: 132}));
  return <div>...</div>;
}
```

## Exemple de destruction

```jsx
const formState = atom({
  key: 'formState',
  default: {
    field1: "1",
    field2: "2",
    field3: "3",
  },
});

const formFieldState = selectorFamily({
  key: 'FormField',
  get: field => ({get}) => get(formState)[field],
  set: field => ({set}, newValue) =>
    set(formState, prevState => {...prevState, [field]: newValue}),
});

const Component1 = () => {
  const [value, onChange] = useRecoilState(formFieldState('field1'));
  return (
    <>
      <input value={value} onChange={onChange} />
      <Component2 />
    </>
  );
}

const Component2 = () => {
  const [value, onChange] = useRecoilState(formFieldState('field2'));
  return (
    <input value={value} onChange={onChange} />
  );
}
```
