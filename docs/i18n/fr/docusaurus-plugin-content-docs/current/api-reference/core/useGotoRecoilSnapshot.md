---
title: useGotoRecoilSnapshot(snapshot)
sidebar_label: useGotoRecoilSnapshot()
---

Ce hook renvoie un callback qui prend un [`Snapshot`](/docs/api-reference/core/Snapshot) comme paramètre et mettra à jour le [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) actuel pour correspondre à cet état d'atome.

```jsx
function useGotoRecoilSnapshot(): Snapshot => void
```

### Exemple de transaction

** Remarque importante **: Cet exemple n'est pas efficace car il abonnera le composant à un nouveau rendu pour * tous * les changements d'état.

```jsx
function TransactionButton(): React.Node {
  const snapshot = useRecoilSnapshot(); // Subscribe to all state changes
  const modifiedSnapshot = snapshot.map(({set}) => {
    set(atomA, x => x + 1);
    set(atomB, x => x * 2);
  });
  const gotoSnapshot = useGotoRecoilSnapshot();
  return <button onClick={() => gotoSnapshot(modifiedSnapshot)}>Perform Transaction</button>;
}
```

### Exemple de voyage dans le temps

Voir l'exemple de [voyage dans le temps](/docs/guides/dev-tools#time-travel)