---
title: waitForNone(dependencies)
sidebar_label: waitForNone()
---

Un assistant de concurrence qui renvoie un ensemble de [`Loadable`s] (/docs/api-reference/core/Loadable) pour l'état actuel des dépendances demandées.

Les dépendances peuvent être fournies sous forme de tableau de tuples ou de dépendances nommées dans un objet.

---

```jsx
function waitForNone(dependencies: Array<RecoilValue<>>):
  RecoilValueReadOnly<UnwrappedArrayOfLoadables>
```

```jsx
function waitForNone(dependencies: {[string]: RecoilValue<>}):
  RecoilValueReadOnly<UnwrappedObjectOfLoadables>
```
---

`waitForNone()` est similaire à [`waitForAll()`](/docs_FR-fr/api-reference/utils/waitForAll), sauf qu'il retourne immédiatement et renvoie un [`Loadable`](/docs_FR-fr/api-reference/core/Loadable) pour chaque dépendance au lieu des valeurs directement. Il est similaire à [`noWait()`](/docs_FR-fr/api-reference/utils/noWait), sauf qu'il permet de demander plusieurs dépendances à la fois.

Cet assistant est utile pour travailler avec des données partielles ou mettre à jour de manière incrémentielle l'interface utilisateur lorsque différentes données deviennent disponibles.

### Exemple de chargement incrémentiel
Cet exemple rend un graphique avec plusieurs couches. Chaque couche a une requête de données potentiellement coûteuse. Il rendra le graphique immédiatement en utilisant des flèches pour chaque couche qui est toujours en attente et mettra à jour le graphique pour ajouter chaque nouvelle couche au fur et à mesure que les données de cette couche arrivent. Si l'une des couches a une erreur avec la requête, seule cette couche sera afficher un message d'erreur et le reste continuera à s'afficher.

```jsx
function MyChart({layerQueries}: {layerQueries: Array<RecoilValue<Layer>>}) {
  const layerLoadables = useRecoilValue(waitForNone(layerQueries));

  return (
    <Chart>
      {layerLoadables.map((layerLoadable, i) => {
        switch (layerLoadable.state) {
          case 'hasValue':
            return <Layer key={i} data={layerLoadable.contents} />;
          case 'hasError':
            return <LayerErrorBadge key={i} error={layerLoadable.contents} />;
          case 'loading':
            return <LayerWithSpinner key={i} />;
        }
      })}
    </Chart>
  );
}

```
