---
title: Selectors
sidebar_label: Selectors
---

Un **selector** representa una porción del **estado derivado** (**derived state**). Puede pensar de el estado derivado como el resultado de pasar el estado actual a una función pura que modifica ese estado de alguna manera.

El estado derivado es un concepto poderoso porque nos permite construir datos dinámicos que dependen de otros datos. En el contexto de nuestra lista de tareas, la siguiente parte es considerada como estado derivado:

- **Lista de tareas filtrada**: derivada de nuestra lista de tareas completa cuando creamos una lista nueva, la cual tiene ciertas tareas filtradas por cierto criterio (como filtrar las tareas que han sido terminadas).
- **Estadisticas de la lista de tareas**: derivada de nuestra lista de tareas completa cuando calculamos los atributos de la lista. Atributos como el numero total de la lista, el numero de tareas completas, y el porcentaje de tareas que han sido completadas.

Para poder implementar el filtro a nuestra lista de tareas, necesitamos escoger el criterio con el que iremos a filtrar. El valor cual podemos guardar en un átomo. Las opciones de filtros que usaremos son: "Show All", "Show Completed", and "Show Uncompleted". El valor predeterminado será "Show All":

```javascript
const todoListFilterState = atom({
  key: 'todoListFilterState',
  default: 'Show All',
});
```

Utilizando `todoListFilterState` y `todoListState`, podemos construir el selector `filteredTodoListState` el cual derivara una lista filtrada

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

`filteredTodoListState` mantiene registro de dos dependencias: `todoListFilterState` y `todoListState`. De esta manera puede actualizarse si alguna de las dependencias cambia.

> Del punto de vista de un componente, los selectors pueden ser leidos usando los mismos hooks que se usn para leer el átomo. Sin embargo, es importante saber que ciertos hooks solo funcionan con el **estado escribible** (ejemplo `useRecoilState()`). Todos los átomos son parte del estado escribible, pero solo ciertos selectors son considerados como estado escribible (los selectos tienen ambas propiedades, `get` y `set`). Si quiere obtener mas informacion sobre el tema, lea [Conceptos Núcleos](/docs/introduction/core-concepts)

Mostrar nuestro todoList filtrada es tan simple como cambiar una linea en el componente de `TodoList`:

```jsx
function TodoList() {
  // cambio todoListState a filteredTodoListState
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

Observe que la interface del usuario es la misma a `todoListFilterState` y tiene un valor predeterminado de `"Show All"`. Para poder cambiar el filtro, necesitamos implementar el componente de `TodoListFilters`:

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
        <option value="Show All">All</option>
        <option value="Show Completed">Completed</option>
        <option value="Show Uncompleted">Uncompleted</option>
      </select>
    </>
  );
}
```

¡Con tan solo pocas lineas de código hemos podido implementar un sistema de filtración! Usaremos los mismos conceptos para implementar el componente de `TodoListStats`.

Queremos mostrar las siguientes estadisticas:

- Numero total de tareas
- Numero total de tareas completas
- Numero total de tareas sin completar
- Porcentaje de tareas completas

Aun que podemos crear un selector para cada estadística, una manera más fácil de llevar acabo, es crear un selector que nos regrese un objeto que contenga los datos que necesitamos. Llamaremos este selector `todoListStatsState`

```javascript
const todoListStatsState = selector({
  key: 'todoListStatsState',
  get: ({get}) => {
    const todoList = get(filteredTodoListState);
    const totalNum = todoList.length;
    const totalCompletedNum = todoList.filter((item) => item.isComplete).length;
    const totalUncompletedNum = totalNum - totalCompletedNum;
    const percentCompleted = totalNum === 0 ? 0 : totalCompletedNum / totalNum;

    return {
      totalNum,
      totalCompletedNum,
      totalUncompletedNum,
      percentCompleted,
    };
  },
});
```

Para leer el valor de `todoListStatsState`, usaremos `useRecoilValue()` otra vez:

```jsx
function TodoListStats() {
  const {
    totalNum,
    totalCompletedNum,
    totalUncompletedNum,
    percentCompleted,
  } = useRecoilValue(todoListStatsState);

  const formattedPercentCompleted = Math.round(percentCompleted * 100);

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

En resumen, hemos creado un app en forma de lista de tareas que cumple con los requisitos:

- Agregar tareas
- Editar tareas
- Eliminar tareas
- Filtrar tareas
- Mostrar estadisticas útiles
