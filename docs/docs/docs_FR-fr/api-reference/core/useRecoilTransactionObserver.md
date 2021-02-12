---
title: useRecoilTransactionObserver_UNSTABLE(callback)
sidebar_label: useRecoilTransactionObserver()
---

## *** REMARQUE ***: *Veuillez considérer cette API comme instable*

Ce hook souscrit à un rappel à exécuter chaque fois qu'il y a un changement dans l'état de l'atome Recoil. Plusieurs mises à jour peuvent être regroupées en une seule transaction. Ce hook est idéal pour les changements d'état persistants, les outils de développement, l'historique de construction, etc.

```jsx
function useRecoilTransactionObserver_UNSTABLE(({
  snapshot: Snapshot,
  previousSnapshot: Snapshot,
}) => void)
```

Le rappel fournit un [`Snapshot`](/docs_FR-fr/api-reference/core/Snapshot) de l'état actuel et précédent de la transaction par lots React. Si vous ne souhaitez vous abonner qu'aux modifications des atomes individuels, pensez plutôt aux effets. À l'avenir, nous pouvons autoriser la possibilité de souscrire à des conditions spécifiques ou de fournir un anti-rebond pour les performances.

### Exemple de débogage

```jsx
function DebugObserver() {
  useRecoilTransactionObserver_UNSTABLE(({snapshot}) => {
    window.myDebugState = {
      a: snapshot.getLoadable(atomA).contents,
      b: snapshot.getLoadable(atomB).contents,
    };
  });
  return null;
}

function MyApp() {
  return (
    <RecoilRoot>
      <DebugObserver />
      ...
    </RecoilRoot>
  );
}
```
