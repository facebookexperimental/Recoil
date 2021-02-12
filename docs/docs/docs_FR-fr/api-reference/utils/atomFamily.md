---
title: atomFamily(options)
sidebar_label: atomFamily()
---

Renvoie une fonction qui renvoie un `RecoilState` [atom](/docs_FR-fr/api-reference/core/atom) inscriptible.

---

```jsx
function atomFamily<T, Parameter>({
  key: string,

  default:
    | RecoilValue<T>
    | Promise<T>
    | T
    | (Parameter => T | RecoilValue<T> | Promise<T>),

  effects_UNSTABLE?:
    | $ReadOnlyArray<AtomEffect<T>>
    | (P => $ReadOnlyArray<AtomEffect<T>>),

  dangerouslyAllowMutability?: boolean,
}): Parameter => RecoilState<T>
```

- `key` - Une chaîne unique utilisée pour identifier l'atome en interne. Cette chaîne doit être unique par rapport aux autres atomes et sélecteurs dans l'ensemble de l'application.
- `default` - La valeur initiale de l'atome. Il peut s'agir soit directement d'une valeur, d'une `RecoilValue` ou d'une` Promise` qui représente la valeur par défaut, ou d'une fonction pour obtenir la valeur par défaut. La fonction de rappel reçoit une copie du paramètre utilisé lorsque la fonction `atomFamily` est appelée.
- `effects_UNSTABLE` - Un tableau facultatif, ou une fonction de rappel pour obtenir le tableau basé sur le paramètre de famille, de [Atom Effects](/docs_FR-fr/guides/atom-effects).
- `dangerouslyAllowMutability` - Recoil dépend des changements d'état de l'atome pour savoir quand notifier les composants qui utilisent les atomes pour effectuer un nouveau rendu. Si la valeur d'un atome a été mutée, il peut contourner cela et provoquer un changement d'état sans notifier correctement les composants abonnés. Pour vous protéger contre cela, toutes les valeurs stockées sont gelées. Dans certains cas, il peut être souhaitable de remplacer cette option en utilisant cette option.

---

Un `atome` représente un morceau d'état avec _Recoil_. Un atome est créé et enregistré par `<RecoilRoot>` par votre application. Mais que se passe-t-il si votre état n’est pas mondial? Que faire si votre état est associé à une instance particulière d'un contrôle ou à un élément particulier? Par exemple, votre application est peut-être un outil de prototypage d'interface utilisateur dans lequel l'utilisateur peut ajouter dynamiquement des éléments et chaque élément a un état, tel que sa position. Idéalement, chaque élément aurait son propre atome d'état. Vous pouvez l'implémenter vous-même via un modèle de mémorisation. Mais, _Recoil_ fournit ce modèle pour vous avec l'utilitaire `atomFamily`. Une famille d'atomes représente une collection d'atomes. Lorsque vous appelez `atomFamily`, il retournera une fonction qui fournit l'atome` RecoilState` en fonction des paramètres que vous passez.

`AtomFamily` fournit essentiellement une carte du paramètre à un atome. Il vous suffit de fournir une clé unique pour `atomFamily` et elle générera une clé unique pour chaque atome sous-jacent. Ces clés atom peuvent être utilisées pour la persistance et doivent donc être stables entre les exécutions d'application. Les paramètres peuvent également être générés sur différents sites d'appel et nous voulons que des paramètres équivalents utilisent le même atome sous-jacent. Par conséquent, l'égalité des valeurs est utilisée à la place de l'égalité des références pour les paramètres `atomFamily`. Cela impose des restrictions sur les types qui peuvent être utilisés pour le paramètre. `atomFamily` accepte des types primitifs, ou des tableaux ou des objets qui peuvent contenir des tableaux, des objets ou des types primitifs.

## Exemple

```jsx
const elementPositionStateFamily = atomFamily({
  key: 'ElementPosition',
  default: [0, 0],
});

function ElementListItem({elementID}) {
  const position = useRecoilValue(elementPositionStateFamily(elementID));
  return (
    <div>
      Element: {elementID}
      Position: {position}
    </div>
  );
}
```

Un `atomFamily()` prend presque les mêmes options qu'un simple [`atom()`](/docs_FR-fr/api-reference/ core/atom). Cependant, la valeur par défaut peut également être paramétrée. Cela signifie que vous pouvez fournir une fonction qui prend la valeur du paramètre et renvoie la valeur par défaut réelle. Par exemple:

```jsx
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: param => defaultBasedOnParam(param),
});
```

ou en utilisant [`selectorFamily`](/docs_FR-fr/api-reference/utils/selectorFamily) au lieu de `selector`, vous pouvez également accéder à la valeur du paramètre dans un sélecteur `default`.

```jsx
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: selectorFamily({
    key: 'MyAtom/Default',
    get: param => ({get}) => {
      return computeDefaultUsingParam(param);
    },
  }),
});
```

## Abonnements

Un avantage de l'utilisation de ce modèle pour des atomes séparés pour chaque élément par rapport à essayer de stocker un seul atome avec une carte d'état pour tous les éléments est qu'ils maintiennent tous leurs propres abonnements individuels. Ainsi, la mise à jour de la valeur d'un élément entraînera uniquement la mise à jour des composants React qui se sont abonnés uniquement à cet atome.

## Persistance

Les observateurs de persistance conserveront l'état de chaque valeur de paramètre en tant qu'atome distinct avec une clé unique basée sur la sérialisation de la valeur de paramètre utilisée. Par conséquent, il est important de n'utiliser que des paramètres qui sont des primitives ou de simples objets composés contenant des primitives. Les classes ou fonctions personnalisées ne sont pas autorisées.

Il est permis de "promouvoir" un simple `atom` pour en faire un `atomFamily` dans une version plus récente de votre application basée sur la même clé. Si vous faites cela, alors toutes les valeurs persistantes avec l'ancienne clé simple peuvent toujours être lues et toutes les valeurs de paramètres de la nouvelle `atomFamily` seront par défaut à l'état persistant de l'atome simple. Si vous modifiez le format du paramètre dans une `atomFamily`, cependant, il ne lira pas automatiquement les valeurs précédentes qui étaient conservées avant la modification. Cependant, vous pouvez ajouter une logique dans un sélecteur ou un validateur par défaut pour rechercher des valeurs basées sur les formats de paramètres précédents. Nous espérons aider à automatiser ce modèle à l'avenir. 
