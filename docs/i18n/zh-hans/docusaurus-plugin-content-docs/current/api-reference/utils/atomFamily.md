---
title: atomFamily(options)
sidebar_label: atomFamily()
---

返回一个返回可写的 `RecoilState` [atom](/docs/api-reference/core/atom) 函数。

---

```jsx
function atomFamily<T, Parameter>({
  key: string,

  default:
    | RecoilValue<T>
    | Promise<T>
    | T
    | (Parameter => T | RecoilValue<T> | Promise<T>),

  effects_UNSTABLE?:
    | $ReadOnlyArray<AtomEffect<T>>
    | (P => $ReadOnlyArray<AtomEffect<T>>),

  dangerouslyAllowMutability?: boolean,
}): Parameter => RecoilState<T>
```

- `key` —— 一个在内部用来标识 atom 的唯一字符串。在整个应用中，该字符串必须相对于其他 atom 和 selector 保持唯一。
- `default` —— atom 的初始值。它可以是一个直接的值，一个代表默认值的`RecoilValue` 或 `Promise`，或者一个获得默认值的函数。回调函数被传递给 `atomFamily` 函数被调用时使用的参数的副本。
- `effects_UNSTABLE` —— 一个可选的数组，或回调函数，用于根据 [Atom Effects](/docs/guides/atom-effects) 的族参数获取数组。
- `dangerouslyAllowMutability` —— Recoil 依赖 atom 状态的变化来知道何时通知使用原 atom 组件重新渲染。如果一个 atom 的值发生了变异，它可能会绕过这个，并导致状态发生变化，而不正确地通知订阅组件。为了防止这种情况，所有存储的值都被冻结。在某些情况下，我们可能希望使用这个选项来覆盖这一点。

---

一个 `atom` 是一个有 _Recoil_ 的状态。一个 atom 是由你的应用程序在每个 `<RecoilRoot>` 创建和注册。但是，如果你的状态不是全局的呢？如果你的状态是与一个控件的特定实例，或与一个特定的元素相关联呢？例如，也许你的应用程序是一个 UI 原型设计工具，用户可以动态地添加元素，每个元素都有状态，比如说它的位置。理想情况下，每个元素都会有自己的状态 atom。你可以通过备忘录模式自己实现这一点。但是， _Recoil_ 通过 `atomFamily` 为你提供了这种模式。一个 atom 家族代表一个 atom 的集合。当你调用 `atomFamily` 时，它将返回一个函数，根据你传入的参数提供 `RecoilState` atom。

`atomFamily` 本质上提供了一个从参数到 atom 的映射。你只需要为 `atomFamily` 提供一个 key，它将为每个底层 atom 生成一个唯一的 key。这些 atom 的 key 可用于持久化，因此必须在不同的应用执行中保持稳定。参数也可能在不同的调用站生成，我们希望同等的参数使用相同的底层 atom。因此，对于 `atomFamily` 参数，我们使用值等价法而不是引用等价法。这对可用于参数的类型进行了限制。`atomFamily` 接受原始类型，或数组或对象，它们可以包含数组、对象或原始类型。

## 示例

```jsx
const elementPositionStateFamily = atomFamily({
  key: 'ElementPosition',
  default: [0, 0],
});

function ElementListItem({elementID}) {
  const position = useRecoilValue(elementPositionStateFamily(elementID));
  return (
    <div>
      Element: {elementID}
      Position: {position}
    </div>
  );
}
```

## Family Defaults

`atomFamily()` 与简单的 [`atom()`](/docs/api-reference/core/atom) 的选项几乎相同。然而，默认值也可以被参数化。这意味着你可以提供一个函数，它接收参数值并返回实际的默认值。比如说

```jsx
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: param => defaultBasedOnParam(param),
});
```

对于基于其他状态的动态默认值，可以使用 [`selectorFamily()`](/docs/api-reference/utils/selectorFamily)，它可以访问参数的值。不要只用 `selector()` 来做 `atomFamily()`  的默认值，因为会产生重复的键。

```jsx
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: selectorFamily({
    key: 'MyAtom/Default',
    get: param => ({get}) => {
      const otherAtomValue = get(otherState);
      return computeDefaultUsingParam(otherAtomValue, param);
    },
  }),
});
```

## 订阅

与试图用所有元素的状态图来存储一个单独的 atom 相比，为每个元素使用这种模式的一个好处是，它们都保持着各自的订阅。因此，更新一个元素的值将只导致订阅了该 atom 的 React 组件更新。

## 作用域 atoms

有时，你可能想通过其他的 prop、Context 或者部分状态来 “划分” 原子状态。比如：

```jsx
const viewWidthForPaneState = atomFamily<number, PaneID>({
  key: 'ViewWidthForPane',
  default: 42,
});

function PaneView() {
  const paneID = useContext(PaneIDContext);
  const viewWidth = useRecoilValue(viewWidthForPaneState(paneID));
  ...
}
```

如果你想通过其他的 Recoil 状态来划分范围，并希望避免在每次调用时查找范围参数，你可以使用 [`selector()`](/docs/api-reference/core/selector) 进行包装，这对你来说可能非常有用：

```jsx
const viewWidthState = selector({
  key: 'ViewWidth',
  get: ({get}) => viewWidthForPane(get(currentPaneState)),
  set: ({get, set}, newValue) => set(viewWidthForPane(get(currentPaneState)), newValue),
});

function PaneView() {
  const viewWidth = useRecoilValue(viewWidthState);
  ...
}
```

## 持久性

持久 observer 将把每个参数值的状态持久化为一个独特的 atom，并根据所使用的参数值的序列化而有一个独特的 key。因此，只使用基元或包含基元的简单复合对象的参数是很重要的；自定义类或函数是不允许的。

允许把一个简单的 `atom` "升级" 到 `atomFamily`，并在你的应用程序的较新版本中基于相同的 key。如果你这样做，那么任何带有旧的简单 key 的持久值仍然可以被读取，新的 `atomFamily` 的所有参数值将默认为简单 atom 的持久状态。然而，如果你改变了一个 `atomFamily` 中的参数格式，它将不会自动读取改变前持久化的先前的值。然而，你可以在默认的 selector 或验证器中添加逻辑，根据以前的参数格式查询数值。我们希望在未来能帮助实现这种模式的自动化。
