---
title: Recoil Sync Library
sidebar_label: 介绍
---

[`recoil-sync`](https://www.npmjs.com/package/recoil-sync) 这个 NPM 包是Recoil的扩展库，主要用来帮助 Recoil 和外部系统进行状态同步。对于[异步数据查询](/docs/guides/asynchronous-data-queries) 这种场景，可以通过 selectors 或 `useEffect` 实现 ，也可以使用 [atom effects](/docs/guides/atom-effects) 对每个独立的 atoms 进行双向同步实现。 `recoil-sync` 在此基础上提供了一些额外的能力:


**批量处理 Atom** - 当更新多个 atom 时，可以批量并只和外部系统进行一次交互。这对于维护具有相关性的 atom 状态一致性是比较重要的。

**抽象且灵活** - 此 API 允许用户指定要同步的 atom，而不是描述如何同步的机制。 这允许组件使用 atom 时根据不同环境来和不同系统进行同步，而无需更改 atom 的定义。 例如，一个组件可能使用 atom，当在独立工具中使用时，这些原子会持久存在于 URL 中，而当嵌入到另一个工具中时，它会持久存在于自定义用户数据库中。

**校验和向后兼容** - 当处理来自外部来源的状态时，校验输入很重要。 当状态在应用程序的生命周期之外持久化时，考虑以前版本状态的向后兼容性也很重要。 `recoil-sync` 和 [`refine`](/docs/refine/introduction) 有助于提供此功能。

**原子到外部存储的复杂映射** - atom 和外部系统之间可能不是一对一的映射。 atom 可能会迁移以使用更新版本的项目，可能会从多个外部数据项中提取数据，或只是一些复合状态的一部分，或其他复杂的映射。

**与 React Hooks 或 Props 同步** - 该库支持将 atom 与 React hooks 或 props 同步，这种能力无法通过已有的 atom effects 实现。

`recoil-sync` 库还为外部存储提供内置实现，例如 [与浏览器 URL 同步](/docs/recoil-sync/url-persistence)。

---

基本思想是可以将 [`syncEffect()`](/docs/recoil-sync/sync-effect) 添加到您希望同步的每个原子，然后将 [`<RecoilSync>`](/docs /recoil-sync/api/RecoilSync) 添加到你的 `<RecoilRoot>` 中以指定如何同步这些原子。 您可以使用内置存储方案，例如 [`<RecoilURLSyncJSON>`](/docs/recoil-sync/url-persistence)、[自己制作 store](/docs/recoil-sync/implement-store)，甚至可以将不同 atom 组同步到不同的 store 中。

## 案例

### URL 持久化

这有一个简单的例子 [syncing an atom with the browser URL](/docs/recoil-sync/url-persistence):

```jsx
const currentUserState = atom<number>({
  key: 'CurrentUser',
  default: 0,
  effects: [
    syncEffect({ refine: number() }),
  ],
});
```

接着，在应用的顶层, 只需要加一个 [`<RecoilURLSyncJSON>`](/docs/recoil-sync/api/RecoilURLSyncJSON) 就可以将被标记的所有 atom 同步到 URL 中。

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

结束！ 现在这个 atom 将在初始加载期间根据 URL 初始化其状态，任何状态修改都会更新 URL，而 URL 中的更改（例如后退按钮）将更新 atom。 更多例子可参考 [Sync Effect](/docs/recoil-sync/sync-effect)、[Store Implementation](/docs/recoil-sync/implement-store) 和 [URL Persistence](/docs/recoil-sync/url-persistence)。

## 安装

请参阅 [Recoil 安装指南](/docs/introduction/installation) 并添加 [`recoil-sync`](https://www.npmjs.com/package/recoil-sync) 依赖。

`recoil-sync` 还使用 [`refine`](/docs/refine/introduction) 库进行类型优化和输入验证。