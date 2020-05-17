---
title: 'Bonus: Performance'
---

우리가 구현한 기존의 것은 완벽하게 유요하다. 하지만 우리 앱이 작은 토이 프로젝트에서 백만줄짜리 기업 프로그램으로 발전하면서 고려해야 할 중요한 성능적 측면이 있다.

우리의 컴포넌트들을 다시 랜더링 시키는 원인이 무엇인지 생각해보자.

### `<TodoList />`

이 컴포넌트는 'todoListState'와 'todoListFilterState'에 의존하는 selector인 'filteredToListState'를 구독한다. 이는 다음 상태가 변경될 때 'TodoList'가 다시 렌더링됨을 의미한다.

- `todoListState`
- `todoListFilterState`

### `<TodoItem />`

이 컴포넌트는 'todoListState'를 구독한다. 그래서 'todoListState'가 바뀔 때나 부모 컴포넌트인 'todoList'가 다시 렌더링 될 때 다시 렌더링 된다.

### `<TodoItemCreator />`

이 컴포넌트는 Recoil 상태("SetRecoilState()"가 구독을 생성하지 않음)를 구독하지 않는다, 그래서 부모 컴포넌트인 `TodoList`가 다시 렌더링 될 때만 다시 렌더링 된다.

### `<TodoListFilters />`

이 컴포넌트는 'todoListFilterState'를 구독한다. 그래서 해당 상태가 변경되거나 부모 컴포넌트인 'todoList'가 다시 렌더링될 때 다시 렌더링된다.

### `<TodoListStats />`

이 컴포넌트는 `filteredToListState`를 구독한다. 그래서 해당 상태가 바뀌거나 부모 컴포넌트인 `TodoList`가 다시 렌더링 될 때마다 다시 렌더링 된다.

## 개션될 여지

기존 구현에는 몇 가지 단점이 있는데, 주로 `<TodoList />`가 우리 모든 컴포넌트의 부모라는 점 때문에 우리가 'todoListState'를 변경할 때마다 트리 전체를 다시 렌더링하고 있다는 점이 있다.

이상적인 경우에는 컴포넌트가 반드시 필요한 경우(화면에 표시되는 데이터가 변경된 경우)에만 다시 렌더링 될 수 있다.

## 최적화 #1: `React.memo()`

하위 컴포넌트가 불필요하게 다시 렌더링되는 문제를 완화하기 위해 우리는 그 컴포넌트에 전달된 **props**를 기반으로 컴포넌트를 기억하는 [`React.memo()`](https://reactjs.org/docs/react-api.html#reactmemo)를 사용할 수 있다.

```js
const TodoItem = React.memo(({item}) => ...);

const TodoItemCreator = React.memo(() => ...);

const TodoListFilters = React.memo(() => ...);

const TodoListStats = React.memo(() => ...);
```

그것은 `<TodoItemCreator />`와 `<TodoListFilters />`가 이것들의 부모 컴포넌트인 `<TodoList />`가 다시 렌더링 되는 반응에 의해 더 이상 다시 렌더링 되지 않도록 돕는다. 그러나  `<TodoItem />`와 `<TodoListStats />`에는 여전히 개별적인 todo 아이템이 갖는 텍스트를 변경할 때 새로운 `todoListFilterState`가 생성되면서 그것을 구독하는 `<TodoItem />`와  `<TodoListStats />`가 다시 렌더링되는 문제가 있다.

## 최적화 #2: `atomFamily()`

### 상태의 모양을 다시 생각하기

todo 리스트를 객체의 배열로 생각하는 것은 각각의 todo 아이템과 전체 todo 아이템 리스트 사이에 긴밀한 결합을 형성하기 때문에 문제가 있다.

이 문제를 해결하기 위해 우리는 **정규화된 상태**를 생각하며 상태의 모양을 다시 생각할 필요가 있다. 우리의 todo 리스트 앱의 맥락에서 이것은 각각의 아이템에 대한 데이터와 별도로 아이템 ID 리스트를 저장하는 것을 의미한다.

> 어떻게 정규화된 상태에 대해 생각할 것인가에 대한 더 상세한 논의는 [이 Redux 문서의 페이지](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape)를 보면된다.

이것은 궁극적으로 'todoListState'를 두 가지로 나눈다는 것을 의미한다.

- todo 아이템의 ID를 갖는 배열
- 아이템의 ID를 아이템의 데이터에 매핑

다음과 같이 atom을 사용해서 todo 아이템 ID를 갖는 배열을 구현할 수 있다.

```javascript
const todoListItemIdsState = atom({
  key: 'todoListItemIdsState',
  default: [],
});
```

아이템의 ID를 아이템의 데이터에 매핑하는 것을 구현하기 위해서 Recoil은 ID로 atom을 동적으로 매핑할 수 있는 유틸리티 매서드을 제공한다. 이 유틸리티가 [`atomFamily()`](/docs/api-reference/utils/atomFamily)다.

### `atomFamily()`

우리는 `atomFamily()` 함수를 이용한다.
