---
title: <RecoilURLSyncJSON>
sidebar_label: <RecoilURLSyncJSON>
---

[Recoil Sync library](/docs/recoil-sync/introduction) 中的一个组件，使用 [`syncEffect()`](/docs/recoil-sync/api/syncEffect) 或 [`urlSyncEffect()` 来同步原子 ](/docs/recoil-sync/api/urlSyncEffect) 原子效果与浏览器 URL。

这与 [`<RecoilURLSync>`](/docs/recoil-sync/api/RecoilURLSync) 组件相同，只是它提供内置的 JSON 编码并且不接受 `serialize`/`deserialize` 选项。

---

[JSON 标准](https://en.wikipedia.org/wiki/JSON) 使用相应的 [Refine](/docs/refine/introduction) 检查器对 JavaScript 原语和对象进行编码：
* **null** - [`literal(null)`](/docs/refine/api/Primitive_Checkers#literal) 或 [`nullable(...)`](/docs/refine/api/Primitive_Checkers#nullable)
* **布尔值** - [`bool()`](/docs/refine/api/Primitive_Checkers#bool)
* **number** - [`number()`](/docs/refine/api/Primitive_Checkers#number)
* **字符串** - [`string()`](/docs/refine/api/Primitive_Checkers#string)
* **Array** - [`array(...)`](/docs/refine/api/Collection_Checkers#array) 或 [`tuple(...)`](/docs/refine/api/Collection_Checkers# 元组）
* **对象** - [`object(...)`](/docs/refine/api/Collection_Checkers#object) 或 [`dict(...)`](/docs/refine/api/Collection_Checkers# 字典）

此实现将“未定义”处理为空查询参数或不存在的对象属性。

`Date` 类也通过将其编码为 ISO 字符串来支持。 如果您使用 [Refine](/docs/refine/introduction) 中的 [`jsonDate()`](/docs/refine/api/Primitive_Checkers#jsondate) 检查器，这可以重新组合成一个“Date”对象。

JSON 不支持 `Set` 和 `Map` JavaScript 容器。 您可以使用 [Transit encoding](/docs/recoil-sync/api/RecoilURLSyncTransit) 对这些容器和自定义用户类进行编码。

＃＃ 例子

有关示例，请参阅 [URL 持久性指南](/docs/recoil-sync/url-persistence)。