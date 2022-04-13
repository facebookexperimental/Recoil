---
title: Selectors
---

**Selector**는 파생된 상태(**derived state**)의 일부를 나타낸다. 파생된 상태를 어떤 방법으로든 주어진 상태를 수정하는 순수 함수에 전달된 상태의 결과물로 생각할 수 있다.

파생된 상태는 다른 데이터에 의존하는 동적인 데이터를 만들 수 있기 때문에 강력한 개념이다. 우리의 todo 리스트 애플리케이션 맥락에서는 다음과 같은 것들이 파생된 상태로 간주된다.

- **필터링 된 todo 리스트** : 전체 todo 리스트에서 일부 기준에 따라 특정 항목이 필터링 된 새 리스트(예: 이미 완료된 항목 필터링)를 생성되어 파생된다.
- **Todo 리스트 통계** : 전체 todo 리스트에서 목록의 총 항목 수, 완료된 항목 수, 완료된 항목의 백분율 같은 리스트의 유용한 속성들을 계산하여 파생된다.

필터링 된 todo 리스트를 구현하기 위해서 우리는 atom에 저장될 수 있는 필터 기준을 선택해야 한다. 우리가 사용하게 될 필터 옵션은 "Show All", "Show Completed"과 "Show Uncompleted"가 있다. 기본값은 "Show All"이 될 것이다.

```javascript
const todoListFilterState = atom({
  key: 'todoListFilterState',
  default: 'Show All',
});
```

`todoListFilterState`와 `todoListState`를 사용해서 우리는 필터링 된 리스트를 파생하는 `filteredTodoListState` selector를 구성할 수 있다.

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

`filteredTodoListState`는 내부적으로 2개의 의존성 `todoListFilterState`와 `todoListState`을 추적한다. 그래서 둘 중 하나라도 변하면 `filteredTodoListState`는 재 실행된다.

> 컴포넌트 관점에서 보면 selector는 atom을 읽을 때 사용하는 같은 훅을 사용해서 읽을 수 있다. 그러나 특정한 훅은 **쓰기 가능 상태** (즉, `useRecoilState()`)에서만 작동하는 점을 유의해야 한다. 모든 atom은 쓰기 가능 상태지만 selector는 일부만 쓰기 가능한 상태(`get`과 `set` 속성을 둘 다 가지고 있는 `selector`)로 간주된다. 이 주제에 대해서 더 많은 정보를 보고 싶다면 [Core Concepts](/docs/introduction/core-concepts) 페이지를 보면 된다.

필터링 된 todo 리스트를 표시하는 것은 `TodoList` 컴포넌트에서 한 줄만 변경하면 될 만큼 간단하다.

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

UI는 `toDoListFilterState`의 기본값인 `Show All`과 동일하다. 필터를 변경하려면 우리는 `TodoListFilter` 컴포넌트를 구현해야 한다.

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

몇 줄의 코드로 우리는 필터링 기능을 구현할 수 있다! 우리는 `TodoListStats` 컴포넌트를 구현하기 위해 동일한 개념을 사용할 것이다.

우리는 다음 통계를 표시하려 한다.

- todo 항목들의 총개수
- 완료된 todo 항목들의 총개수
- 완료되지 않은 todo 항목들의 총개수
- 완료된 항목의 백분율

각 통계에 대해 selector를 만들 수 있지만, 필요한 데이터를 포함하는 객체를 반환하는 selector 하나를 만드는 것이 더 쉬운 방법일 것이다. 우리는 이 selector를 'toDoListStatsState'라고 부를 것이다.

```javascript
const todoListStatsState = selector({
  key: 'todoListStatsState',
  get: ({get}) => {
    const todoList = get(todoListState);
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

`todoListStatsState`값을 읽기 위해, 우리는 `useRecoilValue()`를 한 번 더 사용할 것이다.

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

요약하자면, 우리는 모든 요구 사항을 충족하는 todo 리스트 앱을 만들었다.

- todo 아이템 추가
- todo 아이템 수정
- todo 아이템 삭제
- todo 아이템 필터링
- 유용한 통계 표시
