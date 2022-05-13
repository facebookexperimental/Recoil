---
title: selector(options)
sidebar_label: selector()
---

在 Recoil 里，_selector_ 代表一个函数，或 **派生状态**。你可以把它们看作是类似于一个没有副作用的 "幂等操作" 或 "纯函数"，对于一组给定的依赖值永远返回相同的值。如果只提供 `get` 方法，则 selector 便是只读的，并且会返回一个 `RecoilValueReadOnly` 对象。如果还提供了一个 `set` 方法，它的返回值将变为一个可写的 `RecoilState` 对象。

为了知道何时通知订阅该 selector 的组件重新渲染，Recoil 会自动管理 atom 以及 selector 的状态变化。如果一个 selector 的对象值被直接改变，它可能会绕过管理，以避免通知订阅它的组件。为了帮助检测 bug，Recoil 将在开发模式下 freeze selector 的值对象。

---

```jsx
function selector<T>({
  key: string,

  get: ({
    get: GetRecoilValue,
    getCallback: GetCallback,
  }) => T | Promise<T> | RecoilValue<T>,

  set?: (
    {
      get: GetRecoilValue,
      set: SetRecoilState,
      reset: ResetRecoilState,
    },
    newValue: T | DefaultValue,
  ) => void,

  dangerouslyAllowMutability?: boolean,
})
```

```jsx
type ValueOrUpdater<T> = T | DefaultValue | ((prevValue: T) => T | DefaultValue);
type GetCallback =
  <Args, Return>(
    fn: ({snapshot: Snapshot}) => (...Args) => Return,
  ) => (...Args) => Return;

type GetRecoilValue = <T>(RecoilValue<T>) => T;
type SetRecoilState = <T>(RecoilState<T>, ValueOrUpdater<T>) => void;
type ResetRecoilState = <T>(RecoilState<T>) => void;
```

- `key` - 一个在内部用来标识 atom 的唯一字符串。在整个应用中，该字符串必须相对于其他 atom 和 selector 保持唯一。如果用于持久化，则他需要在整个执行过程中保持稳定性。
- `get` - 一个评估派生 state 值的函数。它可以直接返回一个值，也可以返回一个异步的 `Promise` 或另一个代表相同类型的 atom 或 selector。它被传递给一个对象作为第一个参数，并包含如下属性：
  - `get` - 一个用来从其他 atom 或 selector 获取值的函数。所有传入该函数的 atom 或 selector 将会隐式地被添加到此 selector 的一个 **依赖** 列表中。如果这个 selector 的任何一个依赖发生改变，这个 selector 就会重新计算值。
  - `getCallback()` - 用于创建 Recoil-aware 回调的函数。参见后续 [示例](/docs/api-reference/core/selector#returning-objects-with-callbacks)。
- `set?` - 如果设置了该属性，selector 就会返回一个 **可写** 的 state。这个函数需要传入一个回调函数的对象作为其第一个参数以及一个新值。新值可以是一个 `T` 类型的值，如果用户重置了 selector，也可以是一个 `DefaultValue` 类型的对象。该回调函数包含了：
  - `get()` - 一个用来从其他 atom 或 selector 获取值的函数。该函数不会为 selector 订阅给定的 atom 或 selector。
  - `set()` - 一个用来设置 Recoil 状态的函数。第一个参数是 Recoil 的 state，第二个参数是新的值。新值可以是一个更新函数，或一个 `DefaultValue` 类型的对象，用以传递更新操作。
- `dangerouslyAllowMutability` - 在某些情况下，我们可能希望允许存储在 atom 中的对象发生改变，而这些变化并不代表 status 的变更。使用这个选项可以覆盖开发模式下的 freezing 对象。

---

一个具有简单静态依赖的 selector：

```jsx
const mySelector = selector({
  key: 'MySelector',
  get: ({get}) => get(myAtom) * 100,
});
```

### 动态依赖

只读 selector 有一个 `get` 方法，该方法会根据依赖关系计算 selector 的值。如果这些依赖项中的任何一个更新了，那么 selector 的值也将重新计算。求该 selector 的值时，其依赖关系是基于实际使用的 atoms 或 selectors 动态确定的。根据先前依赖项的值，你可以动态地使用不同的附加依赖项。Recoil 将自动更新当前的数据流图，因此 selector 只需订阅来自当前依赖关系集的更新。
在这个示例中，`mySelector` 将取决于 `toggleState` 的 atom 以及依赖于 `toggleState` 状态的 `selectorA` 或 `selectorB`。
```jsx
const toggleState = atom({key: 'Toggle', default: false});

const mySelector = selector({
  key: 'MySelector',
  get: ({get}) => {
    const toggle = get(toggleState);
    if (toggle) {
      return get(selectorA);
    } else {
      return get(selectorB);
    }
  },
});
```

### 可写的 Selectors

一个双向 (bi-directional) selector 接收传入值作为参数，并可以使用该参数沿数据流图向上游传递更改。因为用户既可以选择使用新值设置 selector，也可以选择重置 selector，所以传入的值要么是与 selector 表示的同类值，要么是表示重置操作的 `DefaultValue` 对象。

这个简单的 selector 实质上包装了一个 atom 来添加一个额外的字段。它仅仅只是将 set 和 reset 操作传递给了上游的 atom。
```jsx
const proxySelector = selector({
  key: 'ProxySelector',
  get: ({get}) => ({...get(myAtom), extraField: 'hi'}),
  set: ({set}, newValue) => set(myAtom, newValue),
});
```

这个 selector 转换了数据，所以需要检查传入值是否是一个 `DefaultValue`。
```jsx
const transformSelector = selector({
  key: 'TransformSelector',
  get: ({get}) => get(myAtom) * 100,
  set: ({set}, newValue) =>
    set(myAtom, newValue instanceof DefaultValue ? newValue : newValue / 100),
});
```

### 异步 Selectors

Selectors 还可以具有异步求值函数，并将一个 `Promise` 作为返回值。更多信息，请参阅 [此指南](/docs/guides/asynchronous-data-queries)

```jsx
const myQuery = selector({
  key: 'MyQuery',
  get: async ({get}) => {
    return await myAsyncQuery(get(queryParamState));
  }
});
```

### 示例 (同步)

```jsx
import {atom, selector, useRecoilState, DefaultValue} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelsius = selector({
  key: 'tempCelsius',
  get: ({get}) => ((get(tempFahrenheit) - 32) * 5) / 9,
  set: ({set}, newValue) =>
    set(
      tempFahrenheit,
      newValue instanceof DefaultValue ? newValue : (newValue * 9) / 5 + 32
    ),
});

function TempCelsius() {
  const [tempF, setTempF] = useRecoilState(tempFahrenheit);
  const [tempC, setTempC] = useRecoilState(tempCelsius);
  const resetTemp = useResetRecoilState(tempCelsius);

  const addTenCelsius = () => setTempC(tempC + 10);
  const addTenFahrenheit = () => setTempF(tempF + 10);
  const reset = () => resetTemp();

  return (
    <div>
      Temp (Celsius): {tempC}
      <br />
      Temp (Fahrenheit): {tempF}
      <br />
      <button onClick={addTenCelsius}>Add 10 Celsius</button>
      <br />
      <button onClick={addTenFahrenheit}>Add 10 Fahrenheit</button>
      <br />
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### 示例 (异步)

```jsx
import {selector, useRecoilValue} from 'recoil';

const myQuery = selector({
  key: 'MyDBQuery',
  get: async () => {
    const response = await fetch(getMyRequestUrl());
    return response.json();
  },
});

function QueryResults() {
  const queryResults = useRecoilValue(myQuery);

  return (
    <div>
      {queryResults.foo}
    </div>
  );
}

function ResultsSection() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <QueryResults />
    </React.Suspense>
  );
}
```

更多复杂的示例，请参考 [这篇指南](/docs/guides/asynchronous-data-queries)。

### 使用回调来返回对象

有时 selector 可以用来返回包含回调的对象。这些回调有助于访问 Recoil 的状态。例如查询 typeahead 或点击处理程序。下面示例中使用一个 selector 来生成菜单项，点击事件可以访问 Recoil 状态。当把这些对象传递给 React 组件上下文之外的框架或逻辑时，会很有益处。

此回调与使用 [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) 之间是一致的。请注意，由 `getCallback()` 返回的回调可以作为一个同步回调使用，用以访问 Recoil 状态，它不应该在评估 selector 本身时被调用。

```jsx
const menuItemState = selectorFamily({
  key: 'MenuItem',
  get: itemID => ({get, getCallback}) => {
    const name = get(itemNameQuery(itemID));
    const onClick = getCallback(({snapshot}) => async () => {
      const info = await snapshot.getPromise(itemInfoQuery(itemID));
      displayInfoModal(info);
    });
    return {
      title: `Show info for ${name}`,
      onClick,
    };
  },
});
```
