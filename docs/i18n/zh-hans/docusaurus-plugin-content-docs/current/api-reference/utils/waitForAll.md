---
title: waitForAll(dependencies)
sidebar_label: waitForAll()
---

一个允许我们并发计算多个异步依赖项的并发 helper 方法。

依赖项可以作为元组数组提供，也可以作为对象中的命名依赖项提供。

---

```jsx
function waitForAll(dependencies: Array<RecoilValue<>>):
  RecoilValueReadOnly<UnwrappedArray>
```

```jsx
function waitForAll(dependencies: {[string]: RecoilValue<>}):
  RecoilValueReadOnly<UnwrappedObject>
```
---

因为此并发 helper 是作为一个 selector 提供的，所以它可以作为 React 组件中的 Recoil 钩子函数使用，也可以作为 Recoil selector 中的依赖项使用，或者任何使用 Recoil 状态的地方。

### 示例

```jsx
function FriendsInfo() {
  const [friendA, friendB] = useRecoilValue(
    waitForAll([friendAState, friendBState])
  );
  return (
    <div>
      Friend A Name: {friendA.name}
      Friend B Name: {friendB.name}
    </div>
  );
}
```

```jsx
const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    const friends = get(waitForAll(
      friendList.map(friendID => userInfoQuery(friendID))
    ));
    return friends;
  },
});
```

```jsx
const customerInfoQuery = selectorFamily({
  key: 'CustomerInfoQuery',
  get: id => ({get}) => {
    const {info, invoices, payments} = get(waitForAll({
      info: customerInfoQuery(id),
      invoices: invoicesQuery(id),
      payments: paymentsQuery(id),
    }));

    return {
      name: info.name,
      transactions: [
        ...invoices,
        ...payments,
      ],
    };
  },
});
```
