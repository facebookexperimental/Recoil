---
title: urlSyncEffect(...)
sidebar_label: urlSyncEffect()
---

可以使用可选效果代替 [`syncEffect()`](/docs/recoil-sync/api/syncEffect) for [URL Persistence](/docs/recoil-sync/url-persistence) 以指定额外 选项，例如状态更改是否应替换 URL 或在浏览器历史堆栈中推送新条目。

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

如果事务包含来自一些替换原子和一些推送状态更改的原子的突变，则 URL 将首先替换为要替换的项目，然后将新的 URL 推送到堆栈上，其中包含批处理事务的完整更改。     