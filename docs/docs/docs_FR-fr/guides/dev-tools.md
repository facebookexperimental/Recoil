---
title: Outils de développement
sidebar_label: Outils de développement
---

Recoil a des fonctionnalités pour vous permettre d'observer et de mettre à jour les changements d'état.

----
## *NOTE IMPORTANTE*
***Cette API est actuellement en cours de développement et changera. Merci de restez à l'écoute...***

----

## Observation de tous les changements d'état

Vous pouvez utiliser un hook tel que [**`useRecoilSnapshot()`**](/docs_FR-fr/api-reference/core/useRecoilSnapshot) ou [**`useRecoilTransactionObserver_UNSTABLE()`**](/docs_FR-fr/api-reference/core/useRecoilTransactionObserver) pour vous abonner aux changements d'état et obtenir un [**`Snapshot`**](/docs_FR-fr/api-reference/core/Snapshot) (instantané) du nouvel état.

Une fois que vous avez un `instantané`, vous pouvez utiliser des méthodes telles que **`getLoadable()`**, **`getPromise()`** et **`getInfo_UNSTABLE()`** pour inspecter l'état et utiliser **`getNodes_UNSTABLE()`** pour itérer sur l'ensemble des atomes connus.

```jsx
function DebugObserver(): React.Node {
  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    console.debug('Les atomes suivants on été modifiés:');
    for (const node of snapshot.getNodes_UNSTABLE({isModified: true})) {
      console.debug(node.key, snapshot.getLoadable(node));
    }
  }, [snapshot]);

  return null;
}
```

```jsx
function MyApp() {
  return (
    <RecoilRoot>
      <DebugObserver />
      ...
    </RecoilRoot>
  );
}
```

## Observation des changements d'état sur demande

Ou, vous pouvez utiliser le hook [**`useRecoilCallback()`**](/docs_FR-fr/api-reference/core/useRecoilCallback) pour obtenir un [**`Snapshot`**](/ docs_FR-fr/api-reference/core/Snapshot) (instantané) à la demande.

```jsx
function DebugButton(): React.Node {
  const onClick = useRecoilCallback(({snapshot}) => async () => {
    console.debug('Atom values:');
    for (const node of snapshot.getNodes_UNSTABLE()) {
      const value = await snapshot.getPromise(node);
      console.debug(node.key, value);
    }
  }, []);

  return <button onClick={onClick}>Dump State</button>
}
```

## Voyage dans le temps

Le hook [**`useGotoRecoilSnapshot()`**](/docs_FR-fr/api-reference/core/useGotoRecoilSnapshot) peut être utilisé pour mettre à jour l'intégralité de l'état Recoil pour qu'il corresponde à l'instantané fourni. Cet exemple conserve un historique des changements d'état avec la possibilité de revenir en arrière et de restaurer l'état global précédent.

`Snapshot` fournit également une méthode **` getID () `**. Cela peut être utilisé, par exemple, pour vous aider à déterminer si vous revenez à un état antérieur connu pour éviter de mettre à jour votre historique des instantanés.

```jsx
function TimeTravelObserver() {
  const [snapshots, setSnapshots] = useState([]);

  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    if (snapshots.every(s => s.getID() !== snapshot.getID())) {
      setSnapshots([...snapshots, snapshot]);
    }
  }, [snapshot]);

  const gotoSnapshot = useGotoRecoilSnapshot();

  return (
    <ol>
      {snapshots.map((snapshot, i) => (
        <li key={i}>
          Snapshot {i}
          <button onClick={() => gotoSnapshot(snapshot)}>
            Restore
          </button>
        </li>
      ))}
    </ol>
  );
}
```
