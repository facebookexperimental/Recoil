---
title: <RecoilURLSync>
sidebar_label: <RecoilURLSync>
---

[Recoil Sync library](/docs/recoil-sync/introduction) 中的一个组件，使用 [`syncEffect()`](/docs/recoil-sync/api/syncEffect) 或 [`urlSyncEffect()`](/docs/recoil-sync/api/urlSyncEffect) 来同步 atom 与浏览器 URL。

---

```jsx
function RecoilURLSync(props: {
  storeKey?: string,

  location: LocationOption,

  serialize: mixed => string,
  deserialize: string => mixed,

  browserInterface?: BrowserInterface,
  children: React.Node,
}): React.Node
```

`storeKey` 用于匹配哪些原子应该与这个外部存储同步。

## URL Location

`location` 属性指定要与 URL 的哪一部分同步：

```jsx
type LocationOption =
  | {part: 'href'}
  | {part: 'hash'}
  | {part: 'search'}
  | {part: 'queryParams', param?: string};
```

- 没有 param 的 queryParams - atom 与单个查询参数同步
- 带有 param 的 queryParams - atom 被编码在一个查询参数中
- `search` - 状态使用整个 query search 字符串进行编码
- `hash` - 状态在锚标签中编码
- `href` - 转义以便能够对整个 URL 进行编码。必须注意提供有效且合法的 URL。

## Examples

有关示例，请参阅 [URL 持久性指南](/docs/recoil-sync/url-persistence)。

## 自定义序列化

`serialize()` 和 `deserialize()` 回调可以提供自定义序列化：

```jsx
  serialize: x => JSON.stringify(x),
  deserialize: x => JSON.parse(x),
```

这些回调应该用类似 useCallback() 的东西缓存下，以避免在每次渲染时重新解析 URL。 根据同步的 URL 中的位置，可以使用单个值或包含多个值的对象调用回调。 [`<RecoilURLSyncJSON>`](/docs/recoil-sync/api/RecoilURLSyncJSON) 和 [`<RecoilURLSyncTransit>`](/docs/recoil-sync/api/RecoilURLSyncTransit) 等包装器为您提供了这些。

## 浏览器抽象

默认情况下，`<RecoilURLSync>` 将直接与浏览器中的 URL 同步。 但是，您可以通过提供自定义浏览器接口实现来覆盖它。 如果您可能在服务器端渲染 (SSR) 环境中执行，那么提供这一点也很重要。

```jsx
type BrowserInterface = {
  replaceURL?: string => void,
  pushURL?: string => void,
  getURL?: () => string,
  listenChangeURL?: (handler: () => void) => (() => void),
};
```
