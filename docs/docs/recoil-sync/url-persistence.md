---
title: URL Persistence
sidebar_label: URL Persistence
---

One of the built-in external store syncing mechanisms provided with the [`recoil-sync`](/docs/recoil-sync/introduction) package is URL persistence.  This enables users to easily initialize atoms based on the URL, update the URL when atoms mutate, and subscribe to URL changes (such as the back button).  Atom state changes can be configured to either replace the current URL or push a new entry in the browser history stack.

## Example

Here is a simple example of a specifying that an atom should sync with the URL:

```jsx
const currentUserState = atom<number>({
  key: 'CurrentUser',
  default: 0,
  effects: [syncEffect({ refine: number() })],
});
```

Then, at the root of your application, simply include `<RecoilURLSyncJSON />` to sync all of those tagged atoms with the URL

```jsx
function MyApp() {
  return (
    <RecoilRoot>
      <RecoilURLSyncJSON location={{part: 'queryParams'}} />
      ...
    </RecoilRoot>
  )
}
```

```jsx
https://test.com/myapp?CurrentUser=123
```

## URL Encodings

### State Serialization
There are two built-in mechanisms available to encode state in the URL:

* **JSON** - Use [`<RecoilURLSyncJSON />`](/docs/recoil-sync/api/RecoilURLSyncJSON) or [`useRecoilURLSyncJSON()`](/docs/recoil-sync/api/useRecoilURLSyncJSON).  [JSON encoding](https://en.wikipedia.org/wiki/JSON) is simple and easy to read.  However it does not support custom user classes or containers such as `Map()` and `Set()`.  It will work with `Date` objects if you use the [`jsonDate()`](/docs/refine/api/Primitive_Checkers#jsondate) checker from Refine.
* **Transit** - Use [`<RecoilURLSyncTransit />`](/docs/recoil-sync/api/RecoilURLSyncTransit) or [`useRecoilURLSyncTransit()`](/docs/recoil-sync/api/useRecoilURLSyncTransit).  [Transit encoding](https://github.com/cognitect/transit-js) is a bit more verbose, but it does support `Map()` and `Set()` containers, and can be extended to encode your own classes by providing custom handlers.

You can also use the base [`<RecoilURLSync />`](/docs/recoil-sync/api/RecoilURLSync) or [`useRecoilURLSync())`](/docs/recoil-sync/api/useRecoilURLSync) implementation and provide your own `serialize()` and `deserialize()` implementations.

### Part of the URL

It is configurable which part of the URL your state will sync with.  The [`location`](/docs/recoil-sync/api/RecoilURLSync#url-location) prop can specify this such as `{part: 'hash'}` to store in the anchor tag, `{part: 'queryParams'}` to store as individual query params, or `{part: 'queryParams', param: 'myParam'}` to encode in a single query param.  The library will attempt to coexist and not remove other query params from the URL.

## Push vs Replace

By default, any atom mutations will replace the current URL in the browser with the updated state.  You can also use the [`urlSyncEffect()`](/docs/recoil-sync/api/urlSyncEffect) effect instead of `syncEffect()` to specify additional options such as if changes to this state should cause a new URL to be pushed on the browser history stack.  This allows the browser's back button to be used to undo those state changes.

```jsx
const currentViewState = atom<string>({
  key: 'CurrentView',
  default: 'index',
  effects: [urlSyncEffect({ refine: number(), history: 'push' })],
});
```

## Multiple Encodings

Remember that you can mix-and-match different atoms with different stores.  So, you could encode some atoms as their own query parameters so they are easy to read and parse, while placing the rest of your state in a single query parameter that uses Transit to encode user classes:

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
      <RecoilURLSyncJSON storeKey="json-url" location={{part: 'queryParams'}} />
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
