---
title: Selector
---

**Selector** 代表一个**派生状态**，你可以将派生状态视为将状态传递给以某种方式修改给定状态的纯函数的输出。

派生状态（Derived state）是一个强大的概念，因为它使我们可以构建依赖于其他数据的动态数据。 在我们的 Todo List 应用程序的中，以下内容被视为派生数据：

- **过滤筛选后的 Todo List**：通过创建一个新列表，该新列表是从完整的 Todo List 中根据某些条件过滤筛选后派生而来（例如，筛选出已经完成的项目）。
- **Todo List 的信息统计**：通过计算列表的有用属性（例如列表中的项目总数，已完成项目的数量以及已完成项目的百分比）从完整的 Todo List 中派生出来。

要实现过滤的 Todo List，我们需要选择一组过滤条件，其值可以保存在一个 atom 中。 我们将使用的过滤器选项为：“显示全部（Show All）”，“显示完成（Show Completed）”和“显示未完成（Show Uncompleted）”。 默认值为“全部显示（Show All）”：

```javascript
const todoListFilterState = atom({
  key: 'todoListFilterState',
  default: 'Show All',
});
```

使用 `todoListFilterState` 和 `todoListState`，我们可以构建一个 `filteredTodoListState` 的 selector，该 selector 派生一个过滤列表：

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

`filteredTodoListState` 在内部跟踪两个依赖项：`todoListFilterState` 和 `todoListState`，以便在其中任何一个更改时重新运行。

> 从组件的角度来看，selector 可以使用与读取 atom 相同的 hook 来读取。不过务必注意，某些 hook 仅适用于**可写状态（writable state）**，例如 `useRecoilState()`。所有 atom 都是可写状态，但只有一些 selector 可被视为可写状态（同时具有 `get` 和 `set` 属性的 selector）。请参阅[核心概念](/docs/introduction/core-concepts)页面了解更多关于此主题的信息。

要显示过滤后的 TodoList 只需要在 `TodoList` 组件中更改一行代码就能实现：

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

注意，UI 展示了每一项 todo，因为传给了 `todoListFilterState` 一个默认值，即“显示全部（Show All）”。 为了更改过滤器，我们需要创建 `TodoListFilters` 组件：

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

通过几行代码，我们成功实现了过滤筛选！ 我们将使用相同的概念来实现 `TodoListStats` 组件。

我们要显示以下统计信息：

- Todo Item 总数
- 完成的项目总数
- 未完成的项目总数
- 已完成项目的百分比

尽管我们可以为每个统计信息创建一个 selector，但一种更简单的方法是创建一个 selector，该 selector 返回包含我们所需数据的对象。 我们将这个 selector 称为 `todoListStatsState`：

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

为了读取 `todoListStatsState` 的值，我们再次使用 `useRecoilValue()`：

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

总而言之，我们创建了一个满足所有需求的 Todo List 应用程序：

- 添加 Todo Item
- 编辑 Todo Item
- 删除 Todo Item
- 过滤 Todo Item
- 显示有用的统计信息
