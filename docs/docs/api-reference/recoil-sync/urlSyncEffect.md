---
title: urlSyncEffect(...)
sidebar_label: urlSyncEffect()
---

An optional effect that may be used instead of [`syncEffect()`](/docs/api-reference/recoil-sync/syncEffect) for [URL Persistence](/docs/guides/url-persistence) in order to specify additional options, such as if state changes should replace the URL or push a new entry in the browser history stack.

---

```jsx
function urlSyncEffect<T>(options: {
  ...SyncEffectOptions<T>,
  history?: 'replace' | 'push',
}): AtomEffect<T>
```

  - `history` -
     - `replace` (default) - Replace the current browser URL with the updated state.
     - `push` - Push a URL with the updated state onto the browser history stack.

If a transaction contains mutations from some atoms that replace and some atoms that push state changes, then the URL will first replace with the items to replace and then push a new URL on the stack with the full changes from the batched transaction.
