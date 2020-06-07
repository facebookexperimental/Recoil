---
title: waitForAll(dependencies)
---

A concurrency helper which allows us to concurrently evaluate multiple asynchronous dependencies.

The dependencies may either be provided as a tuple array or as named dependencies in an object.

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

Becuase the concurrency helper is provided as a selector, it may be used by Recoil hooks in a React component, as a dependency in a Recoil selector, or anywhere a Recoil state is used.

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
