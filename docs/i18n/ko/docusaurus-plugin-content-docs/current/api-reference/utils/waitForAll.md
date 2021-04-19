---
title: waitForAll(dependencies)
sidebar_label: waitForAll()
---

여러 비동기 종속성을 동시에 평가할 수 있는 동시성(concurrency) helper입니다.

종속성들은 튜플 배열 또는 객체에 명명된 종속성으로 제공됩니다.

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

동시성 helper는 selector로 제공되기 때문에, React 컴포넌트에서 Recoil hook으로, Recoil selector의 종속성으로, Recoil state가 사용되는 모든 곳에서 사용될 수 있습니다.

### Examples

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
