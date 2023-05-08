---
title: 'Bonus: Rendimiento'
---

La implementación actual es perfectamente válida, pero debemos considerar algunos conceptos importantes sobre rendimiento. Nuestra aplicación evolucionará desde un proyecto pequeño hasta un programa corporativo con millones de líneas de código.

Pensemos en que causará que cada uno de nuestro componentes, re-renderice:

### `<TodoList />`

Este componente está suscrito a `filteredTodoListState`, un selector que depende de `todoListState` y `todoListFilterState`. Esto significa que `TodoList` volverá a renderizar cuando los siguientes estados cambien:

- `todoListState`
- `todoListFilterState`

### `<TodoItem />`

Este componente está suscrito a `todoListState`. Por tanto se volverá a renderizar cada vez que `todoListState` cambie, y ó cuando el componente padre, `TodoList`, renderice.

### `<TodoItemCreator />`

Este componente no está suscrito al estado de Recoil (`useSetRecoilState()` no crea ninguna subscripción), y por ello solo renderizará cuando su componente padre lo haga.

### `<TodoListFilters />`

Este componente está suscrito a `todoListFilterState`, y por ello renderizará cada vez que ese estado cambie, y ó cuando el componente padre, `TodoList`, renderice.


### `<TodoListStats />`

Este componente esta suscrito a `filteredTodoListState`, y por ello renderizará cada vez que ese estado cambie, y ó cuando el componente padre, `TodoList`, renderice.

## Oportunidad de mejoras

La implementación actual tiene algunos inconvenientes, el principal de ellos es que estamos re-renderizando el árbol entero cada vez que hacemos cambios al `todoListState`. Y debido a que `<TodoList />` es el padre de los componentes, cuando éste vuelva a ser renderizado, todos sus hijos lo harán también.

Idealmente, los components deberían de renderizar solo cuando es absolutamente necesario (cuando los datos que los componentes utilizan han cambiado).

## Optimización #1: `React.memo()`

Para mitigar el problema de que los componentes hijos rendericen innecesariamente, podemos utilizar [`React.memo()`](https://reactjs.org/docs/react-api.html#reactmemo), el cual memoriza un componente basado en las **props** pasadas al mismo.

```js
const TodoItem = React.memo(({item}) => ...);

const TodoItemCreator = React.memo(() => ...);

const TodoListFilters = React.memo(() => ...);

const TodoListStats = React.memo(() => ...);
```

Eso ayuda con las renderizaciones de `<TodoItemCreator />` y `<TodoListFilters />`, ya que no tienen que volver a renderizar si su componente padre, `<TodoList />`, renderiza. Pero todavía tenemos el problema de renderizado de `<TodoItem />` y `<TodoListStats />` cuando el texto de las tareas individuales cambia, ya que los cambios de texto resultan en un nuevo `todoListFilterState`, y ambos `<TodoItem />` y `<TodoListStats />` están suscritos a él.

## Optimización #2: `atomFamily()`

### Reconsiderar la estructura del estado

Plantear la lista de "tareas por hacer" como un conjunto de objetos complica nuestra aplicación, ya que crea un vínculo estrecho entre cada tarea individual y toda la lista de "tareas por hacer".

Para arreglar este problema tenemos que reconsiderar la estructura de nuestro estado, pensando en un estado **normalizado**. En el contexto de nuestra aplicación de "tareas por hacer", esto significa guardar los IDs de cada tarea en una lista separada de los **datos** de cada tarea individual.

> Para más detalles sobre cómo pensar en la normalización estado, mira [esta página de la documentación de Redux](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape).

En conclusión, esto significa que tendremos que dividir nuestro `todoListState` en dos partes:

- Un conjunto de IDs de tareas
- Un mapa del ID de la tarea a los datos de la tarea

El conjunto de IDs de tareas puede ser implementado usando un átomo así:

```javascript
const todoListItemIdsState = atom({
  key: 'todoListItemIdsState',
  default: [],
});
```

Para implementar el mapa del ID de la tarea a los datos de la tarea, Recoil proporciona un método que permite crear dinámicamente el mapa de un ID a átomo. Esta utilidad es [`atomFamily()`](/docs/api-reference/utils/atomFamily).

### `atomFamily()`

Usamos la función `atomFamily()`.