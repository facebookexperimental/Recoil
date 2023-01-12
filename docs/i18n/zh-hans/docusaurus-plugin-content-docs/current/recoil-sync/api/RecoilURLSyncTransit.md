---
title: <RecoilURLSyncTransit>
sidebar_label: <RecoilURLSyncTransit>
---

[Recoil Sync library](/docs/recoil-sync/introduction) 中的一个组件，使用 [`syncEffect()`](/docs/recoil-sync/api/syncEffect) 或 [`urlSyncEffect()`](/docs/recoil-sync/api/urlSyncEffect) 这两个 atom effect 来与浏览器 URL 同步。

这与 [`<RecoilURLSync>`](/docs/recoil-sync/api/RecoilURLSync) 组件相同，除了它提供内置的 [Transit 编码](https://github.com/cognitect/transit-js ).

```tsx
function RecoilURLSyncTransit(props: {
  ...RecoilURLSyncOptions,
  handlers?: Array<TransitHandler<any, any>>,
}): React.Node
```

- **`handlers`** - [自定义类](#custom-classes) 的可选处理程序数组。 重要的是，这需要是一个稳定的或被缓存的的数组实例。 否则，您可能会在重新订阅侦听器时错过 URL 更改。

---

传输编码不像仅使用 [JSON](/docs/recoil-sync/api/RecoilURLSyncJSON) 那样简洁或可读，但它可以支持 `Map` 和 `Set` JavaScript 容器以及自定义用户类。

## Custom Classes

可以使用 `handlers` 属性定义自定义用户类的处理程序：

```tsx
type TransitHandler<T, S> = {
  tag: string;
  class: Class<T>;
  write: (T) => S;
  read: (S) => T;
};
```

### Example

```tsx
class ViewState {
  active: boolean;
  pos: [number, number];
  constructor(active: boolean, pos: [number, number]) {
    this.active = active;
    this.pos = pos;
  }
  // ...
}
const viewStateChecker = custom((x) => (x instanceof ViewState ? x : null));

const HANDLERS = [
  {
    tag: 'VS',
    class: ViewState,
    write: (x) => [x.active, x.pos],
    read: ([active, pos]) => new ViewState(active, pos),
  },
];

function MyApp() {
  return (
    <RecoilRoot>
      <RecoilURLSyncTransit
        storeKey="transit-url"
        location={{part: 'queryParams', param: 'state'}}
        handlers={HANDLERS}>
        {/* children */}
      </RecoilURLSyncTransit>
    </RecoilRoot>
  );
}

const ViewState = atom<ViewState>({
  key: 'ViewState',
  default: new ViewState(true, [1, 2]),
  effects: [syncEffect({storeKey: 'transit-url', refine: viewStateChecker})],
});
```
