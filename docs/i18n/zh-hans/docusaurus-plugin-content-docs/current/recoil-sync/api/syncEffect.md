---
title: syncEffect(...)
sidebar_label: syncEffect()
---

为 [`recoil-sync`](/docs/recoil-sync/introduction) 创建 [atom effect](/docs/guides/atom-effects) 的函数，以将 atom 与定义的外部状态 [`<RecoilSync>`](/docs/recoil-sync/api/RecoilSync) 同步。

---

```jsx
function syncEffect<T>(options: {
  refine: Checker<T>,

  itemKey?: string,
  storeKey?: string,

  syncDefault?: boolean,

  // Optional for advanced mappings
  read?: ReadAtom,
  write?: WriteAtom<T>,
}): AtomEffect<T>
```

- `refine` - 验证输入的 [Refine](/docs/refine/introduction) [`Checker<>`](/docs/refine/api/Checkers) 函数

可选选项：
- `itemKey` - 外部存储中此 atom 的字符串键。 如果未提供，则默认为 atom 自己的键。
- `storeKey` - 将此 effect 与要同步的 [`<RecoilSync>`](/docs/recoil-sync/api/RecoilSync) 存储相匹配的字符串键。
- `syncDefault` - 如果为真，原子将同步实际的默认值，而不是清除或重置外部状态。设置时，这还将尝试在首次读取原子时写入默认值，而不仅仅是在设置时。
- `read` - 一个可选的回调，描述如何从外部存储中读取这个 atom。
- `write` - 一个可选的回调，描述如何将此 atom 写入外部存储。

---

## Examples

有关示例，请参阅 [同步效果指南](/docs/recoil-sync/sync-effect#input-validation)。

## Advanced Mappings

### `read` Interface

```jsx
type ReadItem = ItemKey =>
  | void
  | DefaultValue
  | Promise<DefaultValue | mixed>
  | Loadable<DefaultValue | mixed>
  | mixed;

type ReadAtom = ({read: ReadItem}) =>
  | DefaultValue
  | Promise<DefaultValue | mixed>
  | Loadable<DefaultValue | mixed>
  | mixed;
```

### `write` Interface
```jsx
type WriteItem = <T>(ItemKey, DefaultValue | T) => void;
type ResetItem = ItemKey => void;

type WriteAtomInterface = {
  write: WriteItem,
  reset: ResetItem,
  read: ReadItem,
};
type WriteAtom<T> = (WriteAtomInterface, DefaultValue | T) => void;
```

See the [these examples](/docs/recoil-sync/sync-effect#advanced-atom-mappings).
