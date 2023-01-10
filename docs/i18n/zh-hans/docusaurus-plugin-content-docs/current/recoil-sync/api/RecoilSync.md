---
title: <RecoilSync> - Recoil Sync Store
sidebar_label: <RecoilSync>
---

[Recoil Sync library](/docs/recoil-sync/introduction) 中的组件，用于[定义外部存储](/docs/recoil-sync/implement-store)，以便原子使用 [`syncEffect()` 进行同步 ](/docs/recoil-sync/api/syncEffect) 原子效果。

---

```jsx
function RecoilSync(props: {
  storeKey?: string,

  read?: ReadItem,
  write?: WriteItems,
  listen?: ListenToItems,

  children: React.Node,
}): React.Node

```

`storeKey` 用于匹配哪些原子应该与这个外部存储同步。

## Read Interface

`read()` 回调定义了如何从外部存储中读取项目。 这在尝试基于外部存储初始化原子值时使用。 它也可以从其他复杂映射中调用。

```jsx
type ReadItem = ItemKey =>
  | DefaultValue
  | Promise<DefaultValue | mixed>
  | Loadable<DefaultValue | mixed>
  | mixed;
```

您可以退还商店中商品的实际价值。 如果商品未设置或在商店中不可用，您可以返回“DefaultValue”。 如果需要异步操作从存储中读取，也可以将异步“Promise”返回给该值。 您还可以提供 [`Loadable`](/docs/api-reference/core/Loadable) 表示，这对于在必要时提供错误状态很有用。

## Write Interface

`write()` 回调在原子状态发生变化时被调用，因此您可以定义如何将这些更改写入外部存储。

```jsx
type ItemDiff = Map<ItemKey, DefaultValue | any>;
type ItemSnapshot = Map<ItemKey, DefaultValue | mixed>;

type WriteItems = ({
  diff: ItemDiff,
  allItems: ItemSnapshot,
}) => void;
```

`write()` 回调提供了一些命名参数：
- `diff` - 项目键的映射及其为此原子事务更改的新值。
- `allItems` - 已在此商店中使用的所有项目的键和值的映射。

项目的值可能是一个“DefaultValue”对象，这意味着该项目应该被重置或删除。 如果 [`syncEffect()`](/docs/recoil-sync/api/syncEffect) 指定了 `syncDefault` 选项，那么将提供实际的默认值而不是 `DefaultValue` 占位符对象。

## Listen Interface

`listen()` 回调允许您订阅来自外部存储的异步更新并改变原子状态以保持它们同步。

```jsx
type UpdateItem = <T>(ItemKey, DefaultValue | T) => void;
type UpdateItems = ItemSnapshot => void;
type UpdateAllKnownItems = ItemSnapshot => void;

type ListenToItems = ({
  updateItem: UpdateItem,
  updateItems: UpdateItems,
  updateAllKnownItems: UpdateAllKnownItems,
}) => void | (() => void);
```

`listen()` 回调在其参数中提供了一些回调，允许您将项目更新为新值。 从这些项目中读取的任何原子都是“订阅的”，并且将通过从更新的项目中读取来更新它们的状态。

- `updateItem()` - 这将通过提供键和值来更新单个项目的值。 如果该值为“DefaultValue”，那么它会将项目重置为默认值。 这只会更新单个项目，其他项目不会受到影响。
- `updateItems()` - 这将通过提供项目键和值的映射来更新多个项目。 同样，如果 any 的值为“DefaultValue”，那么它将重置这些项目。 这只会更新提供的项目，其他项目不会受到影响。
- `updateAllKnownItems()` - 这将通过提供项目键和值的映射来更新多个项目。 同样，如果 any 的值为“DefaultValue”，那么它将重置这些项目。 此函数将更新*所有*已被与此存储同步的原子读取的已知项目。 这意味着如果提供的 Map 中未包含项目键，则该项目将重置为默认值。

您可以从 `listen()` 实现中返回一个回调处理函数，该函数将在清理存储效果时调用。 这可用于清理您对外部商店的订阅。

## Examples

有关示例，请参阅[“实施商店”](/docs/recoil-sync/implement-store) 指南。