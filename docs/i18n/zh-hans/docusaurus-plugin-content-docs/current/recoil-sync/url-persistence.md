---
title: URL 持久化
sidebar_label: URL 持久化
---

[`recoil-sync`](/docs/recoil-sync/introduction) 包提供的内置外部存储同步机制之一是 URL 持久化。 这使用户可以轻松地根据 URL 初始化 atom，在atom发生变更时更新 URL，并订阅 URL 变化（例如后退按钮）。 Atom 状态变更可以被配置为替换当前 URL 或在浏览器历史堆栈中推入新条目。

## 示例

这是一个指定 atom 与 URL 同步的简单示例：

```jsx
const currentUserState = atom<number>({
  key: 'CurrentUser',
  default: 0,
  effects: [syncEffect({ refine: number() })],
});
```

然后，在应用的顶层，只需包含 [`<RecoilURLSyncJSON>`](/docs/recoil-sync/api/RecoilURLSyncJSON) 即可将所有这些标记的 atom 与 URL 同步

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

```jsx
https://test.com/myapp?CurrentUser=123
```

## URL 编码

### 状态序列化

有两种内置机制可用于对 URL 中的状态进行编码：

* **JSON** - 使用 [`<RecoilURLSyncJSON>`](/docs/recoil-sync/api/RecoilURLSyncJSON)。 [JSON编码](https://en.wikipedia.org/wiki/JSON)简单易读。 但是，它不支持自定义用户类或容器，例如 `Map()` 和 `Set()`。 如果使用来自 Refine 的 [`jsonDate()`](/docs/refine/api/Primitive_Checkers#jsondate) 检查器，它将可以支持 `Date` 对象。
* **Transit** - 使用 [`<RecoilURLSyncTransit>`](/docs/recoil-sync/api/RecoilURLSyncTransit)。 [Transit encoding](https://github.com/cognitect/transit-js) 有点冗长，但它确实支持 `Map()` 和 `Set()` 容器，并且可以为自定义的类扩展您自己的编码方式。

您还可以使用基础 [`<RecoilURLSync>`](/docs/recoil-sync/api/RecoilURLSync) 实现并提供您自己的 `serialize()` 和 `deserialize()` 实现。

### Part of the URL

您的状态将与 URL 的哪一部分同步是可配置的。 这个配置可以通过 [`location`](/docs/recoil-sync/api/RecoilURLSync#url-location) 属性来指定，例如`{part: 'hash'}` 存储在锚标记中，`{part: 'queryParams '}` 存储为单独的查询参数，或`{part: 'queryParams', param: 'myParam'}` 在单个查询参数中编码。 该库将尝试共存而不是从 URL 中删除其他查询参数。

## Push vs Replace

默认情况下，任何 atom 变更都会用更新后的状态替换浏览器中的当前 URL。 您还可以使用 [`urlSyncEffect()`](/docs/recoil-sync/api/urlSyncEffect) 而不是 `syncEffect()` 来指定其他选项，例如如果更改此状态应导致新 URL 推送到浏览器历史堆栈。 这允许使用浏览器的后退按钮来撤消这些状态更改。

```jsx
const currentViewState = atom<string>({
  key: 'CurrentView',
  default: 'index',
  effects: [urlSyncEffect({ refine: number(), history: 'push' })],
});
```

## Multiple Encodings

请记住，您可以将不同的原子与不同的 Store 混合搭配。 因此，您可以将一些 atom 编码为它们自己的查询参数，以便它们易于阅读和解析，同时将其余状态放在使用 Transit 对用户类进行编码的单个查询参数中：

```jsx
class ViewState {
  active: boolean;
  pos: [number, number];
  constructor(active, pos) {
    this.active = active;
    this.pos = pos;
  }
  ...
};
const viewStateChecker = custom(x => x instanceof ViewState ? x : null);

function MyApp() {
  return (
    <RecoilRoot>
      <RecoilURLSyncJSON storeKey="json-url" location={{part: 'queryParams'}}>
        <RecoilURLSyncTransit
          storeKey="transit-url"
          location={{part: 'queryParam', param: 'state'}}
          handlers={[
            {
              tag: 'VS',
              class: ViewState,
              write: x => [x.active, x.pos],
              read: ([active, pos]) => new ViewState(active, pos),
            },
          ]}
        />
          ...
        </RecoilURLSyncTransit>
      </RecoilURLSyncJSON>
    </RecoilRoot>
  )
}

const currentUserState = atom<number>({
  key: 'CurrentUser',
  default: 0,
  effects: [syncEffect({ storeKey: 'json-url', refine: number() })],
});

const ViewState = atom<ViewState>({
  key: 'ViewState',
  default: new ViewState(),
  effects: [syncEffect({ storeKey: 'transit-url', refine: viewStateChecker() })],
});
```
