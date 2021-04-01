---
title: useGetRecoilValueInfo_UNSTABLE()
sidebar_label: useGetRecoilValueInfo()
---

Ce hook permet à un composant de "jetter un œil" à l'état courant, valeur, et autres informations concernant l'atome ou sélecteur. Ceci est similaire à la méthode [`getInfo_UNSTABLE()`](/docs_FR-fr/api-reference/core/Snapshot#debug-information) de [`Snapshot`](docs_FR-fr/api-reference/core/Snapshot)


```jsx
function useGetRecoilValueInfo_UNSTABLE(): RecoilValue<T> => AtomInfo<T>;

interface AtomInfo<T> {
  loadable?: Loadable<T>;
  isActive: boolean;
  isSet: boolean;
  isModified: boolean; // TODO report modified selectors
  type: 'atom' | 'selector' | undefined; // undefined until initialized for now
  deps: Iterable<RecoilValue<T>>;
  subscribers: {
    nodes: Iterable<RecoilValue<T>>,
    components: Iterable<ComponentInfo>,
  };
}

interface ComponentInfo {
  name: string;
}
```

Il fournit une fonction qui peut recevoir un `RecoilValue<T>` et renvoie un objet qui contient des informations actuelles sur cet atome / sélecteur. Cela n'entraînera aucun changement d'état ni ne créera d'abonnement. Il est principalement destiné à être utilisé dans les outils de débogage ou de développement.

Les informations de débogage sont sujettes à changement, mais peuvent inclure:
* `loadable` - Un Loadable avec l'état actuel. Contrairement aux méthodes comme `getLoadable()`, cette méthode ne change pas l'instantané. Il fournit l'état actuel et n'initialisera pas de nouveaux atomes / sélecteurs, n'effectuera aucune nouvelle évaluation de sélecteur et ne mettra à jour aucune dépendance ou abonnement.
* `isSet` - Vrai s'il s'agit d'un atome avec une valeur explicite stockée dans l'état de l'instantané. Faux s'il s'agit d'un sélecteur ou d'une valeur d'atome par défaut.
* `isModified` - Vrai s'il s'agit d'un atome qui a été modifié depuis la dernière transaction.
* `type` - Soit un `atom`, soit un `selector`
* `deps` - Un itérateur sur les atomes ou sélecteurs dont dépend ce nœud.
* `abonnés` - Informations sur ce qui s'abonne à ce nœud pour cet instantané. Détails en cours de développement.

### Exemple

```jsx
function ButtonToShowCurrentSubscriptions() {
  const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();
  function onClick() {
    const {subscribers} = getRecoilValueInfo(myAtom);
    console.debug(
      'Inscriptions courantes:',
      Array.from(subscribers.nodes).map(({key})=>key),
    );
  }

  return <button onClick={onClick} >Voir les inscriptions courantes</button>;
}
```
