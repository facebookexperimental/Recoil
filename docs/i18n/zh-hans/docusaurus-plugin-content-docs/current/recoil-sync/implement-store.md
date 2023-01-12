---
title: 实现一个 Store
sidebar_label: 实现一个 Store
---

虽然该库带有一些内置存储方案，但可以使用 [`<RecoilSync>`](/docs/recoil-sync/api/RecoilSync) 实现自己的存储。 指定一个可选的`storeKey`来识别和匹配哪些 atom 应该与哪个 Store 同步。 然后，指定以下可选回调来定义 Store 的行为：

* [**`read`**](/docs/recoil-sync/api/RecoilSync#read-interface) - 如何从外部存储中读取单个数据项，例如在初始化 atom 时。
* [**`write`**](/docs/recoil-sync/api/RecoilSync#write-interface) - 如何将被修改的 atom 状态写入外部存储。
* [**`listen`**](/docs/recoil-sync/api/RecoilSync#listen-interface) - 如何从 Store 中订阅异步更新以改变atom状态。

更多详情可参考 [`<RecoilSync>` API reference](/docs/recoil-sync/api/RecoilSync)。


## 与 React Props 同步案例

使用 [`<RecoilSync>`](/docs/recoil-sync/api/RecoilSync) 根据 React prop 值初始化 atom：

```jsx
function InitFromProps({children, ...props}) {
  return (
    <RecoilSync
      storeKey="init-from-props"
      read={itemKey => props[itemKey]}
    >
      {children}
    </RecoilSync>
  );
}
```

## 与用户数据库同步案例

使用 [`<RecoilSync>`](/docs/recoil-sync/api/RecoilSync) 与自定义数据库同步：

```jsx
function SyncWithDB({children}) {
  const connection = useMyDB();
  return (
    <RecoilSync
      storeKey="my-db"
      read={itemKey => connection.get(itemKey)}
      write={({diff}) => {
        for (const [key, value] of diff) {
          connection.set(key, value);
        }
      }}
      listen={({updateItem}) => {
        const subscription = connection.subscribe((key, value) => {
          updateItem(key, value);
        });
        return () => subscription.release();
      }}
    >
      {children}
    </RecoilSync>
  );
}
```
