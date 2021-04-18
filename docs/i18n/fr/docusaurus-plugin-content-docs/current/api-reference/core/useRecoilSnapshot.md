---
title: useRecoilSnapshot()
sidebar_label: useRecoilSnapshot()
---

Ce hook renvoie de manière synchrone un objet [`Snapshot`](/docs/api-reference/core/Snapshot) pendant le rendu et souscrit au composant appelant pour tous les changements d'état Recoil. Vous souhaiterez peut-être utiliser ce hook pour les outils de débogage ou pour le rendu côté serveur où vous devez avoir l'état de manière synchrone lors du rendu initial.

```jsx
function useRecoilSnapshot(): Snapshot
```

Soyez prudent en utilisant ce hook car il entraînera le nouveau rendu du composant pour les changements d'état * all * Recoil. À l'avenir, nous espérons offrir la possibilité de rebondir pour la performance.

### Exemple de lien
Définissez un composant `<LinkToNewView>` qui rend une ancre `<a>` avec un `href` basé sur l'état actuel avec une mutation appliquée. Dans cet exemple, `uriFromSnapshot()` est une fonction définie par l'utilisateur qui code l'état actuel dans l'URI qui peut être restauré lors du chargement de la page.

```jsx
function LinkToNewView() {
  const snapshot = useRecoilSnapshot();
  const newSnapshot = snapshot.map(({set}) => set(viewState, 'Nouvelle Vue'));
  return <a href={uriFromSnapshot(newSnapshot)}>Cliquez Moi!</a>;
}
```

Ceci est un exemple simplifié. Nous fournissons une aide comme celle-ci pour générer des liens dans notre bibliothèque de persistance d'historique de navigateur à venir, qui est plus extensible et optimisée. Par exemple, il détournera le gestionnaire de clics pour mettre à jour l'état local en remplaçant l'historique du navigateur.