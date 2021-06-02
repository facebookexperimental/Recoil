---
title: 核心概念
---

## 概览

使用 Recoil 会为你创建一个数据流向图，从 _atom_（共享状态）到 _selector_（纯函数），再流向 React 组件。Atom 是组件可以订阅的 state 单位。selector 可以同步或异步改变此 state。

## Atom

Atom 是状态的单位。它们可更新也可订阅：当 atom 被更新，每个被订阅的组件都将使用新值进行重渲染。它们也可以在运行时创建。可以使用 atom 替代组件内部的 state。如果多个组件使用相同的 atom，则这些组件共享 atom 的状态。

Atom 是使用 `atom` 函数创建的：

```javascript
const fontSizeState = atom({
  key: 'fontSizeState',
  default: 14,
});
```

Atom 需要一个唯一的 key 值，该 key 可用于调试、持久化以及使用某些高级的 API，这些 API 可让你查看所有 atom 的图。两个 atom 不应拥有相同的 key 值，因此请确保它们在全局上的唯一性。和 React 组件中的 state 一致，它们也拥有默认值。

要从组件中读取和写入 atom，我们需使用一个名为 `useRecoilState` 的 hook。和 React 的 `useState` 用法一致，但是这里的 state 可以在组件间共享使用：

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return (
    <button onClick={() => setFontSize((size) => size + 1)} style={{fontSize}}>
      Click to Enlarge
    </button>
  );
}
```

单击此按钮将使按钮的字体大小加 1。此时其他组件也可以使用相同的字体大小：

```jsx
function Text() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return <p style={{fontSize}}>This text will increase in size too.</p>;
}
```

## Selector

**selector** 是一个纯函数，入参为 atom 或者其他 selector。当上游 atom 或 selector 更新时，将重新执行 selector 函数。组件可以像 atom 一样订阅 selector，当 selector 发生变化时，重新渲染相关组件。

Selector 被用于计算基于 state 的派生数据。这使得我们避免了冗余 state，通常无需使用 reduce 来保持状态同步性和有效性。作为替代，将最小粒度的状态存储在 atom 中，而其它所有内容根据最小粒度的状态进行有效计算。由于 selector 会追踪需要哪些组件使用了相关的状态，因此它们使这种方式更加有效。

从组件的角度来看，selector 和 atom 具有相同的功能，因此可以交替使用。

使用 `selector` 函数来定义 selector：

```javascript
const fontSizeLabelState = selector({
  key: 'fontSizeLabelState',
  get: ({get}) => {
    const fontSize = get(fontSizeState);
    const unit = 'px';

    return `${fontSize}${unit}`;
  },
});
```

`get` 属性是要计算的函数。它可以使用 get 的入参来访问 atom 以及其他 selector 的值。每当它访问另一个 atom 或 selector 时，就会创建相应的依赖关系，以便更新另一个 atom 或 selector 时，导致该 atom 或 selector 重新计算。

在这个 `fontSizeLabelState` 示例中，selector 包含一个依赖项：`fontSizeState` atom. 从概念上讲，`fontSizeLabelState` selector的行为与纯函数类似，该函数将 `fontSizeState` 作为输入，并将格式化后的字体大小的 label 值作为返回值。

可以使用 `useRecoilValue()` 读取 selector。它使用 atom 或 selector 作为参数，并返回相应的值。我们不使用 `useRecoilState()`，因为`fontSizeLabelState` selector 不可写。（请参阅 [selector API 参考资料](/docs/api-reference/core/selector) 了解更多关于可写 selector）：

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  const fontSizeLabel = useRecoilValue(fontSizeLabelState);

  return (
    <>
      <div>Current font size: {fontSizeLabel}</div>

      <button onClick={() => setFontSize(fontSize + 1)} style={{fontSize}}>
        Click to Enlarge
      </button>
    </>
  );
}
```

现在，单击按钮会触发两件事：增加按钮字体大小，同时更新字体大小的 label，并展示当前字体大小。
