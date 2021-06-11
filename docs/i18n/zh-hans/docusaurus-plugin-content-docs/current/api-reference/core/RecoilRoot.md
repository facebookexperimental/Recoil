---
title: <RecoilRoot ...props />
sidebar_label: <RecoilRoot />
---

提供了上下文，并且 atom 有值。此组件必须是所有使用 Recoil hook 的根组件。

---

### Props
- `initializeState?`: `({set, setUnvalidatedAtomValues}) => void`。
  - 可选函数，可使用 [`MutableSnapshot`](/docs/api-reference/core/Snapshot#Transforming_Snapshots) 来[初始化](/docs/api-reference/core/Snapshot#state-initialization) `<RecoilRoot>` 类型的 atom 状态。这为初始渲染设置了状态，并不打算用于后续的状态变化或异步的初始化。使用类似 [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState) 或 [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) 的 hook 来同步状态的变化。
- `override?`: `boolean`
  - 默认为 `true`。此 prop 只有在 `<RecoilRoot>` 被嵌套在另一个 `<RecoilRoot>` 中时才有效。如果 `override` 为 `true`，这个根节点将创建一个新的 Recoil 作用域。如果为 `false`，这个 `<RecoilRoot>` 除了渲染它的子代外，将不会执行任何额外功能，因此，这个根的子代将访问最近的祖先节点 `<RecoilRoot>` 作用域中 Recoil 的值。

### 使用多个 `<RecoilRoot>`

多个 `<RecoilRoot>` 可以共存，代表 atom 状态的独立提供者/存储者；atom 在每个根中拥有不同的值。当你将一个根嵌入到另一个根中时，这一行为保持不变（内部根将覆盖外部根），除非你将 `override` 设为 `false`（详见 `Props`）。

注意，缓存可以跨根节点共享，如 selector 缓存。 Selector 的评估对于缓存或日志必须幂等，因此跨根结点缓存不应该是个问题，但是可能会被观测到或者引起重复查询。

### 示例

```jsx
import {RecoilRoot} from 'recoil';

function AppRoot() {
  return (
    <RecoilRoot>
      <ComponentThatUsesRecoil />
    </RecoilRoot>
  );
}
```
