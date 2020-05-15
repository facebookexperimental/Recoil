---
title: Selectors
---

A **selector** represents a piece of **derived state**. You can think of derived state as the output of passing state to a pure function that modifies the given state in some way.

Derived state is a powerful concept because it lets us build dynamic data that depends on other data. In the context of our todo list application, the following are considered derived state:

- **Filtered todo list**: derived from the complete todo list by creating a new list that has certain items filtered out based on some criteria (such as filtering out items that are already completed).
- **Todo list statistics**: derived from the complete todo list by calculating useful attributes of the list, such as the total number of items in the list, the number of completed items, and the percentage of items that are completed.

To implement a filtered todo list, we need to choose a set of filter criteria whose value can be saved in an atom. The filter options we'll use are: "Show All", "Show Completed", and "Show Uncompleted". The default value will be "Show All":

```javascript
const todoListFilterState = atom({
  key: 'todoListFilterState',
  default: 'Show All',
});
```

Using `todoListFilterState` and `todoListState`, we can build a `filteredTodoListState` selector which derives a filtered list:

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

The `filteredTodoListState` internally keeps track of two dependencies: `todoListFilterState` and `todoListState` so that it re-runs if either of those change.

> From a component's point of view, selectors can be read using the same hooks that are used to read atoms. However it's important to note that certain hooks only work with **writable state** (i.e `useRecoilState()`). All atoms are writable state, but only some selectors are considered writable state (selectors that have both a `get` and `set` property). See the [Core Concepts](/docs/introduction/core-concepts) page for more information on this topic.

Displaying our filtered todoList is as simple as changing one line in the `TodoList` component:

```jsx
function TodoList() {
  // changed from todoListState to filteredTodoListState
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

Note the UI is the same as the `todoListFilterState` has a default of `"Show All"`. In order to change the filter, we need to implement the `TodoListFilters` component:

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

With a few lines of code we've managed to implement filtering! We'll use the same concepts to implement the `TodoListStats` component.

We want to display the following stats:

- Total number of todo items
- Total number of completed items
- Total number of uncompleted items
- Percentage of items completed

While we could create a selector for each of the stats, an easier approach would be to create one selector that returns an object containing the data we need. We'll call this selector `todoListStatsState`:

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

To read the value of `todoListStatsState`, we use `useRecoilValue()` once again:

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

To summarize, we've created a todo list app that meets all of our requirements:

- Add todo items
- Edit todo items
- Delete todo items
- Filter todo items
- Display useful stats

We could stop here, but there are some important performance considerations that we explore in the "bonus" section.
