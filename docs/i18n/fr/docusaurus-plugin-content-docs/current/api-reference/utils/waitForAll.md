---
title: waitForAll(dependencies)
sidebar_label: waitForAll()
---

Un assistant d'accès concurrentiel qui nous permet d'évaluer simultanément plusieurs dépendances asynchrones.

Les dépendances peuvent être fournies sous forme de tableau de tuples ou de dépendances nommées dans un objet.

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

Comme l'assistant de concurrence est fourni en tant que sélecteur, il peut être utilisé par les hooks Recoil dans un composant React, en tant que dépendance dans un sélecteur Recoil, ou partout où un état Recoil est utilisé.

### Exemples

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
