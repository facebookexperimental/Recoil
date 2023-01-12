---
title: Recoil Sync Library
sidebar_label: 介绍
---

[`recoil-sync`](https://www.npmjs.com/package/recoil-sync) 这个 npm 包是 Recoil 的扩展，主要用于将 Recoil 的状态与外部系统进行同步。对于[异步数据查询](/docs/guides/asynchronous-data-queries) 这种场景，可以使用 selector 或 `useEffect` ，也可以使用 [atom effects](/docs/guides/atom-effects) 对 atom 进行双向数据同步实现相同的功能。 `recoil-sync` 是在 atom effects 的基础上提供了一些额外的能力:


**批量处理 atom** - 当更新多个 atom 时，可以批量并只和外部系统进行一次交互。这对于维护具有相关性的 atom 状态一致性是比较重要的。

**灵活抽象** - 这套 API 只需要标记需要同步的 atom，而无需配置这些 atom 如何同步。 从而允许组件在不需要修改自身实现的情况下使用 atom 时根据不同环境来和不同系统进行同步。 例如，一个组件可能用到了一个 atom，当在独立工具中使用时，这些原子会持久存在于 URL 中，而当嵌入到另一个工具中时，它会持久存在于自定义用户数据库中。

**校验和向后兼容** - 当处理来自外部数据源的状态时，校验输入很重要。 当状态在应用程序的生命周期之外持久化时，考虑之前版本状态的向后兼容性也很重要。 `recoil-sync` 和 [`refine`](/docs/refine/introduction) 有助于此场景。

**atom 到外部存储的复杂映射** - atom 和外部系统之间可能不是一对一的映射， atom 可能会迁移以支持新的数据项，也可能会从多个外部数据项中提取数据，或只是一些复合状态的一部分，或其他复杂的映射。

**与 React Hooks 或 Props 同步** - 该库支持将 atom 与 React hooks 或 props 同步，这种能力无法通过已有的 atom effects 实现。

`recoil-sync` 库还为一些外部存储提供内置实现，例如 [与浏览器 URL 同步](/docs/recoil-sync/url-persistence)。

---

基本思想是可以将 [`syncEffect()`](/docs/recoil-sync/sync-effect) 添加到您希望同步的每个 atom ，然后将 [`<RecoilSync>`](/docs/recoil-sync/api/RecoilSync) 添加到您的 `<RecoilRoot>` 中以指定如何同步这些 atom。 您可以使用内置存储方案，例如 [`<RecoilURLSyncJSON>`](/docs/recoil-sync/url-persistence)，或[自定义存储方案](/docs/recoil-sync/implement-store)，甚至可以将不同分组的 atom 同步到不同的存储方案中。

## 案例

### URL 持久化

这有一个简单的例子 [将atom与URL进行状态同步](/docs/recoil-sync/url-persistence):

```jsx
const currentUserState = atom<number>({
  key: 'CurrentUser',
  default: 0,
  effects: [
    syncEffect({ refine: number() }),
  ],
});
```

接着，在应用的顶层, 只需要加一个 [`<RecoilURLSyncJSON>`](/docs/recoil-sync/api/RecoilURLSyncJSON) 就可以将被标记的 atom 同步到 URL 中。

```jsx
function MyApp() {
  return (
    <RecoilRoot>
      <RecoilURLSyncJSON location={{part: 'queryParams'}}>
        ...
      </RecoilURLSyncJSON>
    </RecoilRoot>
  )
}
```

结束！ 现在这个 atom 将在初始加载期间根据 URL 初始化其状态，任何状态修改都会更新 URL，而 URL 中的更改（例如后退按钮）将更新 atom。 更多例子可参考 [Sync Effect](/docs/recoil-sync/sync-effect)、[实现一个 Store](/docs/recoil-sync/implement-store) 和 [URL 持久化](/docs/recoil-sync/url-persistence)。

## 安装

请参阅 [Recoil 安装指南](/docs/introduction/installation) 并添加 [`recoil-sync`](https://www.npmjs.com/package/recoil-sync) 作为额外的依赖。

`recoil-sync` 还使用 [`refine`](/docs/refine/introduction) 库进行类型优化和输入验证。
