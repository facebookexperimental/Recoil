---
title: Sélecteurs
---

Un **sélecteur** représente une partie d'un **état dérivé**. Vous pouvez considérer un état dérivé comme la sortie d'un état passant à une fonction pure qui modifie l'état donné d'une manière ou d'une autre.

Un état dérivé est un concept puissant car il nous permet de créer des données dynamiques qui dépendent d'autres données. Dans le contexte de notre application de liste de tâches, les éléments suivants sont considérés comme des états dérivés:

- **Liste de tâches filtrée**: dérivée de la liste de tâches complète en créant une nouvelle liste dans laquelle certains éléments sont filtrés en fonction de certains critères (tels que le filtrage des éléments déjà terminés).
- **Statistiques de la liste**: dérivée de la liste complète des tâches en calculant les attributs utiles de la liste, tels que le nombre total d'éléments dans la liste, le nombre d'éléments terminés et le pourcentage d'éléments terminés.

Pour implémenter une liste de tâches filtrée, nous devons choisir un ensemble de critères de filtrage dont la valeur peut être enregistrée dans un atome. Les options de filtrage que nous utiliserons sont: "Afficher tout", "Afficher terminés" et "Afficher non terminés". La valeur par défaut sera "Afficher tout":

```javascript
const todoListFilterState = atom({
  key: 'todoListFilterState',
  default: 'Show All',
});
```

En utilisant `todoListFilterState` et `todoListState`, nous pouvons construire un sélecteur `filteredTodoListState` qui dérive une liste filtrée:

```javascript
const filteredTodoListState = selector({
  key: 'filteredTodoListState',
  get: ({get}) => {
    const filter = get(todoListFilterState);
    const list = get(todoListState);

    switch (filter) {
      case 'Show Completed':
        return list.filter((item) => item.isComplete);
      case 'Show Uncompleted':
        return list.filter((item) => !item.isComplete);
      default:
        return list;
    }
  },
});
```

Le `filteredTodoListState` garde en interne la trace de deux dépendances:` todoListFilterState` et `todoListState` afin qu'il se réexécute si l'une de ces modifications change.

> Du point de vue d'un composant, les sélecteurs peuvent être lus à l'aide des mêmes crochets que ceux utilisés pour lire les atomes. Cependant, il est important de noter que certains hooks ne fonctionnent qu'avec **l'état inscriptible** (c'est-à-dire `useRecoilState()`). Tous les atomes sont à l'état inscriptible, mais seuls certains sélecteurs sont considérés comme un état inscriptible (sélecteurs qui ont à la fois une propriété `get` et` set`). Consultez la page [Concepts principaux](/docs_FR/introduction/core-concepts) pour plus d'informations sur ce sujet.

Afficher notre todoList filtrée est aussi simple que de changer une ligne dans le composant `TodoList`:

```jsx
function TodoList() {
  // changée fr todoListState vers filteredTodoListState
  const todoList = useRecoilValue(filteredTodoListState);

  return (
    <>
      <TodoListStats />
      <TodoListFilters />
      <TodoItemCreator />

      {todoList.map((todoItem) => (
        <TodoItem item={todoItem} key={todoItem.id} />
      ))}
    </>
  );
}
```

Notez que l'interface utilisateur affiche chaque tâche car `todoListFilterState` a reçu la valeur par défaut `"Afficher tout"`. Afin de changer le filtre, nous devons implémenter le composant `TodoListFilters`:

```jsx
function TodoListFilters() {
  const [filter, setFilter] = useRecoilState(todoListFilterState);

  const updateFilter = ({target: {value}}) => {
    setFilter(value);
  };

  return (
    <>
      Filter:
      <select value={filter} onChange={updateFilter}>
        <option value="Afficher tout">Tout</option>
        <option value="Afficher Terminés">Terminés</option>
        <option value="Afficher Non-terminés">Non-terminés</option>
      </select>
    </>
  );
}
```

Avec quelques lignes de code, nous avons réussi à implémenter le filtrage! Nous utiliserons les mêmes concepts pour implémenter le composant `TodoListStats`.

Nous voulons afficher les statistiques suivantes:

- Nombre total de tâches à faire
- Nombre total de tâches terminées
- Nombre total de tâches non terminées
- Pourcentage de tâches terminées

Bien que nous puissions créer un sélecteur pour chacune des statistiques, une approche plus simple serait de créer un sélecteur qui renvoie un objet contenant les données dont nous avons besoin. Nous appellerons ce sélecteur `todoListStatsState`:

```javascript
const todoListStatsState = selector({
  key: 'todoListStatsState',
  get: ({get}) => {
    const todoList = get(todoListState);
    const totalNum = todoList.length;
    const totalCompletedNum = todoList.filter((item) => item.isComplete).length;
    const totalUncompletedNum = totalNum - totalCompletedNum;
    const percentCompleted = totalNum === 0 ? 0 : totalCompletedNum / totalNum * 100;

    return {
      totalNum,
      totalCompletedNum,
      totalUncompletedNum,
      percentCompleted,
    };
  },
});
```

Pour lire la valeur de `todoListStatsState`, nous utilisons à nouveau `useRecoilValue()`:

```jsx
function TodoListStats() {
  const {
    totalNum,
    totalCompletedNum,
    totalUncompletedNum,
    percentCompleted,
  } = useRecoilValue(todoListStatsState);

  const formattedPercentCompleted = Math.round(percentCompleted);

  return (
    <ul>
      <li>Total items: {totalNum}</li>
      <li>Items completed: {totalCompletedNum}</li>
      <li>Items not completed: {totalUncompletedNum}</li>
      <li>Percent completed: {formattedPercentCompleted}</li>
    </ul>
  );
}
```

Pour résumer, nous avons créé une application de liste de tâches qui répond à toutes nos exigences:

- Ajouter des tâches à faire
- Modifier les tâches à faire
- Supprimer les tâches à faire
- Filtrer les tâches à faire
- Afficher des statistiques utiles 
