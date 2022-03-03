---
title: <RecoilURLSync ...props />
sidebar_label: <RecoilURLSync/>
---

A component from the [Recoil Sync library](/docs/recoil-sync/introduction) to sync atoms using the [`syncEffect()`](/docs/recoil-sync/api/syncEffect) or [`urlSyncEffect()`](/docs/recoil-sync/api/urlSyncEffect) atom effects with the browser URL.

---

```jsx
function RecoilURLSync(props: {
  storeKey?: string,

  location: LocationOption,

  serialize: mixed => string,
  deserialize: string => mixed,

  browserInterface?: BrowserInterface,
}): React.Node
```

The `storeKey` is used to match up which atoms should sync with this external store.

## URL Location

The `location` prop specifies what part of the URL to sync with:

```jsx
type LocationOption =
  | {part: 'href'}
  | {part: 'hash'}
  | {part: 'search'}
  | {part: 'queryParams', param?: string};
```

- `queryParams` with no `param` - Atoms sync with individual query params
- `queryParams` with a `param` - Atoms are encoded in a single query param
- `search` - State is encoded with the entire query search string
- `hash` - State is encoded in the anchor tag
- `href` - Escape to be able to encode the entire URL.  Care must be taken to provide a valid and legal URL.

## Examples

See the [URL Persistence Guide](/docs/recoil-sync/url-persistence) for examples.

## Custom serialization

The `serialize()` and `deserialize()` callbacks can provide custom serializations:
```jsx
  serialize: x => JSON.stringify(x),
  deserialize: x => JSON.parse(x),
```

These callbacks should be memoized with something like `useCallback()` to avoid re-parsing the URL with every render.  Depending on the location in the URL that is synced with, the callbacks may be either called with individual values or with an object containing multiple values.  Wrappers such as [`<RecoilURLSyncJSON>`](/docs/recoil-sync/api/RecoilURLSyncJSON) and [`<RecoilURLSyncTransit>`](/docs/recoil-sync/api/RecoilURLSyncTransit) provide these for you.

## Browser Abstraction

By default `<RecoilURLSync/>` will sync directly with the URL in the browser.  However, you may override this by providing a custom browser interface implementation:

```jsx
type BrowserInterface = {
  replaceURL?: string => void,
  pushURL?: string => void,
  getURL?: () => string,
  listenChangeURL?: (handler: () => void) => (() => void),
};
```
