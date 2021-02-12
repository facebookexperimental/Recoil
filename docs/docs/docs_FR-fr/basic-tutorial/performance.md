---
title: 'Bonus: Performance'
---

Notre implémentation existante est parfaitement valide, mais il y a des implications importantes sur les performances à prendre en compte à mesure que notre application évolue d'un petit projet à un programme d'entreprise d'un million de lignes.

Pensons à ce qui provoquera le nouveau rendu de chacun de nos composants:

### `<TodoList />`

Ce composant est abonné à `filteredTodoListState`, qui est un sélecteur qui a une dépendance sur` todoListState` et `todoListFilterState`. Cela signifie que `TodoList` sera de nouveau rendu lorsque l'état suivant change:

- `todoListState`
- `todoListFilterState`

### `<TodoItem />`

Ce composant est abonné à `todoListState`, il sera donc à nouveau rendu chaque fois que `todoListState` change et chaque fois que son composant parent, `TodoList`, est à nouveau rendu.

### `<TodoItemCreator />`

Ce composant n'est pas abonné à l'état Recoil (`useSetRecoilState()` ne crée pas d'abonnement), il ne sera donc de nouveau rendu que lorsque son composant parent, `TodoList`, sera de nouveau rendu.

### `<TodoListFilters />`

Ce composant est souscrit à `todoListFilterState`, il sera donc à nouveau rendu lorsque cet état change ou lorsque son composant parent,`TodoList`, est à nouveau rendu.

### `<TodoListStats />`

Ce composant est abonné à `filteredTodoListState`, il sera donc à nouveau rendu chaque fois que cet état change ou lorsque son composant parent,`TodoList`, est à nouveau rendu.

## Marge d'amélioration

L'implémentation existante a quelques inconvénients, principalement le fait que nous sommes en train de refaire le rendu de l'arbre entier chaque fois que nous apportons une modification à `todoListState` en raison du fait que `<TodoList />` est le parent de tous nos composants, donc quand il re-rendra, tous ses enfants le seront aussi.

Dans l'idéal, les composants ne seraient re-rendu que lorsqu'ils doivent absolument le faire (lorsque les données qu'ils affichent à l'écran auront changées).

## Optimisation # 1: `React.memo ()`

Pour atténuer le problème du ré-rendu des composants enfants inutilement, nous pouvons utiliser [`React.memo()`] (https://reactjs.org/docs/react-api.html#reactmemo), qui mémorise un composant basé sur les **props** passés à ce composant:

```js
const TodoItem = React.memo(({item}) => ...);

const TodoItemCreator = React.memo(() => ...);

const TodoListFilters = React.memo(() => ...);

const TodoListStats = React.memo(() => ...);
```

Cela aide avec les ré-rendus de `<TodoItemCreator />` et `<TodoListFilters />` car ils ne sont plus re-rendu en réponse aux re-rendu de leur composant parent, `<TodoList />`, mais nous avons toujours le problème du re-rendu de `<TodoItem />` et `<TodoListStats />` lorsque des tâches individuelles voient leur texte changé car les modifications de texte entraîneront un nouveau `todoListFilterState`, qui à la fois `<TodoItem />` et `< TodoListStats />`sont abonnés.

## Optimisation # 2: `atomFamily()`

### Repenser la forme de l'état

Voir une liste de tâches comme un tableau d'objets est problématique car elle forme un couplage étroit entre chaque élément de tâche individuelle et la liste de toutes les tâches.

Pour résoudre ce problème, nous devons repenser la forme de notre état en pensant à **l'état normalisé**. Dans le contexte de notre application, cela signifie stocker la **liste** des identifiants d'élément séparément des **données** pour chaque élément individuel.

> Pour une discussion plus détaillée sur la façon de penser l'état normalisé, voir [`cette page de la documentation Redux`](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape).

Cela signifie finalement que nous allons diviser notre `todoListState` en deux:

- Un tableau d'ID de tâche
- Un mappage de l'ID de tâche aux données de ces tâches

Le tableau des ID des tâches peut être implémenté en utilisant un atome comme ceci:

```javascript
const todoListItemIdsState = atom({
  key: 'todoListItemIdsState',
  default: [],
});
```

Pour implémenter un mappage de l'ID d'élément aux données de cet élément, Recoil fournit une méthode utilitaire qui nous permet de créer dynamiquement un mappage de l'ID à l'atome. Cet utilitaire est [`atomFamily()`](/docs_FR-fr/api-reference/utils/atomFamily).

### `atomFamily ()`

Nous utilisons la fonction `atomFamily()`