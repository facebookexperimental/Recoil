---
title: atom(options)
sidebar_label: atom()
---

一个 *atom* 表示 Recoil 的 state。`atom()` 函数返回一个可写的 `RecoilState` 对象。

---

```jsx
function atom<T>({
  key: string,
  default: T | Promise<T> | RecoilValue<T>,

  effects_UNSTABLE?: $ReadOnlyArray<AtomEffect<T>>,

  dangerouslyAllowMutability?: boolean,
}): RecoilState<T>
```

  - `key` - 在内部用于标识 atom 的唯一字符串。在整个应用中，该字符串必须相对于其他 atom 和 selector 保持唯一。
  - `default` - atom 的初始值，或一个 `Promise`，或另一个 atom，或一个用来表示相同类型的值的 selector。
  - `dangerouslyAllowMutability` - 在某些情况下，我们可能希望允许存储在 atom 中的对象发生改变，而这些变化并不代表 status 的变更。使用这个选项可以覆盖开发模式下的 freezing 对象。

---

Recoil 会负责将这些 atom 的 state 的变化通知到订阅了这些 atom 的组件，并告诉这些组件进行重新渲染。所以你应该使用下面列出的这些 hooks 来修改 atom 的状态，如果一个 atom 内部存储的对象被直接地改变（而不是通过对应的 hooks 改变）的时候，可能造成的情况是，这次改变会绕过这些 hooks 去修改atom内部的 state 进而导致不能及时的通知订阅了该 atom 的组件。为了帮助大家检测类似于这种情况的 bug，Recoil 会在开发模式下 freeze 存储在 atom 中的对象。

通常，你需要使用以下 hook 来与 atom 搭配使用。

- [`useRecoilState()`](/docs/api-reference/core/useRecoilState)：当你同时需要对 atom 进行读写时，使用此 hook。使用此 hook 会使组件订阅 atom。
- [`useRecoilValue()`](/docs/api-reference/core/useRecoilValue)：当你仅需要读取 atom 时，使用此 hook。使用此 hook 会使组件订阅 atom。
- [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState)：当你仅需要写入 atom 时，使用此 hook。
- [`useResetRecoilState()`](/docs/api-reference/core/useResetRecoilState)：需将 atom 重置为默认值时，使用此 hook。

在一些罕见的场景下，你需要在不订阅组件的情况下读取 atom 的值，请参考 [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback)。

可以使用 `Promise` 或者表示相同类型值的 `RecoilValue`。因为 `Promise` 会是 pending 状态，而默认的 selector 也可能是异步的，因此 atom 的值也可以是 pending 状态，或者在读取值的时候抛出异常。注意设置 atom 时，你不能对 `Promise` 实时赋值。对于异步函数，请使用 [selectors](/docs/api-reference/core/selector) 。

Atom 不能用来直接存储 `Promise` 或 `RecoilValue`，但是可以用对象包装它们。注意 `Promise` 是可变的。Atoms 可以设置为纯函数，如果你这么做，你需要使用更新器组成 setter。（例如： `set(myAtom, () => myFunc);`）。

### 示例

```jsx
import {atom, useRecoilState} from 'recoil';

const counter = atom({
  key: 'myCounter',
  default: 0,
});

function Counter() {
  const [count, setCount] = useRecoilState(counter);
  const incrementByOne = () => setCount(count + 1);

  return (
    <div>
      Count: {count}
      <br />
      <button onClick={incrementByOne}>Increment</button>
    </div>
  );
}
```

## Atom Families

[`atomFamily()`](/docs/api-reference/utils/atomFamily) 对于存储一系列的相关状态以及 [划分你 atom 状态的作用域](/docs/api-reference/utils/atomFamily#scoped-atoms) 来说，非常有用。
