---
title: <RecoilURLSyncTransit>
sidebar_label: <RecoilURLSyncTransit>
---

A component from the [Recoil Sync library](/docs/recoil-sync/introduction) to sync atoms using the [`syncEffect()`](/docs/recoil-sync/api/syncEffect) or [`urlSyncEffect()`](/docs/recoil-sync/api/urlSyncEffect) atom effects with the browser URL.

This is identical to the [`<RecoilURLSync>`](/docs/recoil-sync/api/RecoilURLSync) component except that it provides built-in [Transit encoding](https://github.com/cognitect/transit-js).

```jsx
function RecoilURLSyncTransit(props: {
  ...RecoilURLSyncOptions,
  handlers?: Array<TransitHandler<any, any>>,
}): React.Node
```

---

Transit encoding is not as terse or readable as just using [JSON](/docs/recoil-sync/api/RecoilURLSyncJSON), however it can support `Map` and `Set` JavaScript containers as well as custom user classes.

## Custom Classes

Handlers for custom user classes can be defined with the `handlers` prop:

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
  constructor(active, pos) {
    this.active = active;
    this.pos = pos;
  }
  // ...
}
const viewStateChecker = custom((x) => (x instanceof ViewState ? x : null));

function MyApp() {
  return (
    <RecoilRoot>
      <RecoilURLSyncTransit
        storeKey="transit-url"
        location={{part: 'queryParam', param: 'state'}}
        handlers={[
          {
            tag: 'VS',
            class: ViewState,
            write: (x) => [x.active, x.pos],
            read: ([active, pos]) => new ViewState(active, pos),
          },
        ]}
      />
      {/* ... */}
    </RecoilRoot>
  );
}

const ViewState = atom<ViewState>({
  key: 'ViewState',
  default: new ViewState(true, [1, 2]),
  effects: [syncEffect({storeKey: 'transit-url', refine: viewStateChecker})],
});
```
