---
title: 'Bonus: Performance'
---

Our existing implementation is perfectly valid, but there are some important performance implications to consider as our app evolves from being a small toy project to a million-line corporate program.

Let's think about what will cause each of our components to re-render:

### `<TodoList />`

This component is subscribed to `filteredTodoListState`, which is a selector that has a dependency on `todoListState` and `todoListFilterState`. This means `TodoList` will re-render when the following state changes:

- `todoListState`
- `todoListFilterState`

### `<TodoItem />`

This component is subscribed to `todoListState`, so it will re-render whenever `todoListState` changes and whenever its parent component, `TodoList`, re-renders.

### `<TodoItemCreator />`

This component is not subscribed to Recoil state (`useSetRecoilState()` does not create a subscription), so it will only re-render when its parent component, `TodoList`, re-renders.

### `<TodoListFilters />`

This component is subcribed to `todoListFilterState`, so it will re-render when either that state changes or when its parent component, `TodoList`, re-renders.

### `<TodoListStats />`

This component is subscribed to `filteredTodoListState`, so it will re-render whenever that state changes or when its parent component, `TodoList`, re-renders.

## Room for Improvement

The existing implementation has a few drawbacks, mainly that fact that we are re-rendering the entire tree whenever we make any change to `todoListState` due to the fact that `<TodoList />` is the parent of all of our components, so when it re-renders so will all of its children.

Ideally, components would re-render only when they absolutely have to (when the data that they display on the screen has changed).

## Optimization #1: `React.memo()`

To mitigate the issue of child components re-rendering unnecessarily, we can make use of [`React.memo()`](https://react.dev/reference/react/memo), which memoizes a component based on the **props** passed to that component:

```js
const TodoItem = React.memo(({item}) => ...);

const TodoItemCreator = React.memo(() => ...);

const TodoListFilters = React.memo(() => ...);

const TodoListStats = React.memo(() => ...);
```

That helps with the re-renders of `<TodoItemCreator />` and `<TodoListFilters />` as they no longer re-render in response to re-renders of their parent component, `<TodoList />`, but we still have the problem of `<TodoItem />` and `<TodoListStats />` re-rendering when individual todo items have their text changed as text changes will result in a new `todoListFilterState`, which both `<TodoItem />` and `<TodoListStats />` are subscribed to.

## Optimization #2: `atomFamily()`

### Rethinking State Shape

Thinking of a todo list as an array of objects is problematic because it forms a tight coupling between each individual todo item and the list of all todo items.

To fix this issue, we need to rethink our state shape by thinking about **normalized state**. In the context of our todo-list app, this means storing the **list** of item ids separately from the **data** for each individual item.

> For a more detailed discussion on how to think about normalized state, see [this page from the Redux documentation](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape).

This ultimately means that we will be splitting our `todoListState` into two:

- An array of todo item IDs
- A mapping of item ID to item data

The array of todo item IDs can be implemented using an atom like so:

```javascript
const todoListItemIdsState = atom({
  key: 'todoListItemIdsState',
  default: [],
});
```

For implementing a mapping of item ID to item data, Recoil provides a utility method that allows us to dynamically create a mapping from ID to atom. This utility is [`atomFamily()`](/docs/api-reference/utils/atomFamily).

### `atomFamily()`

We use the `atomFamily()` function
