---
title: 'Bonus: Rendimiento'
---

Nuestra implementación actual es perfectamente valida, pero hay algunos puntos importantes a considerar relacionados con el rendimiento. Desde que nuestra aplicación evolucionará desde ser un proyecto pequeño hasta convertirse en un programa corporativo de millones de líneas de código.

Pensemos en que causará que cada uno de nuestro componentes se renderice:

### `<TodoList />`

Este componente esta suscrito a `filteredTodoListState`, que es un selector que tiene dependencia con `todoListState` y `todoListFilterState`. Esto significa que `TodoList` volverá a renderizar cuando los siguientes estados cambien:

- `todoListState`
- `todoListFilterState`

### `<TodoItem />`

Este componente esta suscrito a `todoListState`, entonces se volverá a renderizar cada vez que `todoListState` cambie, y también cuando el componente padre, `TodoList`, renderice.

### `<TodoItemCreator />`

Este componente no esta suscrito al estado de Recoil (`useSetRecoilState()` no crea alguna subscripción), por lo tanto, solo renderizará cuando su componente padre lo haga.

### `<TodoListFilters />`

Este componente esta suscrito a `todoListFilterState`, entonces se volverá a renderizar cada vez que ese estado cambie, y también cuando el componente padre, `TodoList`, renderice.


### `<TodoListStats />`

Este componente esta suscrito a `filteredTodoListState`, entonces se volverá a renderizar cada vez que ese estado cambie, y también cuando el componente padre, `TodoList`, renderice.

## Oportunidad de mejoras

La implementación actual tiene algunos inconvenientes, principalmente por el hecho que estamos renderizando el árbol entero cada vez que hacemos cambios al `todoListState`. Y debido a que `<TodoList />` es el padre de todos nuestros componentes, cuando éste vuelva a renderizar, también todos sus hijos lo harán.

Idealmente, los components deberían de renderizar solo cuando es absolutamente necesario (cuando los datos que los componentes despliegan ha cambiado).

## Optimización #1: `React.memo()`

Para mitigar el problema de que los componentes hijos rendericen innecesariamente, podemos hacer uso de [`React.memo()`](https://reactjs.org/docs/react-api.html#reactmemo), el cual memoriza a un componente basado en las **props** pasadas al componente.

```js
const TodoItem = React.memo(({item}) => ...);

const TodoItemCreator = React.memo(() => ...);

const TodoListFilters = React.memo(() => ...);

const TodoListStats = React.memo(() => ...);
```

Eso ayuda con las renderizaciones de `<TodoItemCreator />` y `<TodoListFilters />`, ya que no tienen que volver a renderizar si su componente padre, `<TodoList />`, renderiza. Pero todavía tenemos el problema de renderizado de `<TodoItem />` y `<TodoListStats />` cuando el texto de las tareas individuales cambia, ya que los cambios de texto resultan en un nuevo `todoListFilterState`, y ambos `<TodoItem />` y `<TodoListStats />` están suscrito el.

## Optimización #2: `atomFamily()`

### Reconsiderar la estructura del Estado

Es complicado si planeamos la lista de "tareas por hacer" como un arreglo de objetos, porque crea un vínculo estrecho entre cada tarea individual y toda la lista de "tareas por hacer".

Para arreglar este problema tenemos que reconsiderar la estructura de nuestro estado, pensando en un estado **normalizado**. En el contexto de nuestra aplicación de "tareas por hacer", significa guardar los IDs de cada tarea en una lista separada de los **datos** de cada tarea individual.

> Para más detalles de cómo pensar en un estado normalizado, mira [esta página de la documentación de Redux](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape).

Esto al final significa que tendremos que dividir nuestro `todoListState` en dos partes:

- Un arreglo de IDs de tareas
- Un mapa del ID de la tarea con los datos de la tarea

El arreglo de IDs de tareas puede ser implementado usando un átomo así:

```javascript
const todoListItemIdsState = atom({
  key: 'todoListItemIdsState',
  default: [],
});
```

Para implementar el mapa del ID de la tarea con los datos de la tarea, Recoil proporciona un método de utilidad que nos permite crear dinámicamente el mapa de un ID a átomo. Ésta utilidad es [`atomFamily()`](/docs/api-reference/utils/atomFamily).

### `atomFamily()`

Usamos la función `atomFamily()`.