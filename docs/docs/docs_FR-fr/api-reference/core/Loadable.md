---
title: class Loadable
sidebar_label: Loadable
---

Un objet `Loadable` représente l'état actuel d'un Recoil [atome](/docs_FR-fr/api-reference/core/atom) ou [sélecteur](/docs_FR-fr/api-reference/core/selector). Cet état peut avoir une valeur disponible, être dans un état d'erreur ou encore être en attente de résolution asynchrone. Un `Loadable` a l'interface suivante:

- `state`: l'état actuel de l'atome ou du sélecteur. Les valeurs possibles sont `'hasValue'`, `'hasError'`, ou `'loading'`.
- `contents`: La valeur représentée par ce `Loadable`. Si l'état est `hasValue`, c'est la valeur réelle, si l'état est `hasError`, c'est l'objet `Error` qui a été lancé, et si l'état est `loading`, alors vous pouvez utiliser `toPromise()` pour obtenir une `Promise` de la valeur.

Les chargeables contiennent également des méthodes d'assistance pour accéder à l'état actuel. *Considérez cette API comme instable*:

- `getValue()` - Méthode pour accéder à la valeur qui correspond à la sémantique des sélecteurs React Suspense et Recoil. Si l'état a une valeur, il renvoie une valeur, s'il contient une erreur, il renvoie cette erreur, et s'il est toujours en attente, il suspend l'exécution ou le rendu pour propager l'état en attente.
- `toPromise()`: renvoie une `Promise` qui se résoudra lorsque le sélecteur sera résolu. Si le sélecteur est synchrone ou a déjà été résolu, il renvoie une `Promise` qui se résout immédiatement.
- `valueMaybe()` - Renvoie la valeur si disponible, sinon renvoie `undefined`
- `valueOrThrow()` - Renvoie la valeur si disponible ou renvoie une erreur.
- `map()` - Prend une fonction pour transformer la valeur du Loadable et renvoie un nouveau Loadable avec la valeur transformée. La fonction de transformation obtient un paramètre de la valeur et renvoie la nouvelle valeur; il peut également propager des erreurs lancées ou du suspense.

### Exemple

```jsx
function UserInfo({userID}) {
  const userNameLoadable = useRecoilValueLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
```
