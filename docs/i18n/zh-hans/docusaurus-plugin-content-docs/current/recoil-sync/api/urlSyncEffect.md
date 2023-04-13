---
title: urlSyncEffect(...)
sidebar_label: urlSyncEffect()
---

一个可以替代 [`syncEffect()`](/docs/recoil-sync/api/syncEffect) 的 effect ，用来做 [URL 持久化](/docs/recoil-sync/url-persistence) 时指定额外选项，例如状态更改是否应替换 URL 或在浏览器历史堆栈中推送新条目。

---

```jsx
function urlSyncEffect<T>(options: {
  ...SyncEffectOptions<T>,
  history?: 'replace' | 'push',
}): AtomEffect<T>
```

-`history`-
      - `replace`（默认）- 用更新后的状态替换当前浏览器 URL。
      - `push` - 将具有更新状态的 URL 推送到浏览器历史堆栈。

如果事务包含来自一些替换 atom 和一些推送状态更改的 atom 的突变，则 URL 将首先替换为要替换的项目，然后将新的 URL 推送到堆栈上，其中包含批处理事务的完整更改。
