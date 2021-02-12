---
title: useRecoilCallback(callback, deps)
sidebar_label: useRecoilCallback()
---

Ce hook est similaire à [*`useCallback()`*](https://reactjs.org/docs/hooks-reference.html#usecallback), mais fournira également une API pour que vos rappels fonctionnent avec l'état Recoil. Ce hook peut être utilisé pour construire un callback qui a accès à un [`Snapshot`](/docs_FR-fr/api-reference/core/Snapshot) en lecture seule de l'état Recoil et la possibilité de mettre à jour de manière asynchrone l'état Recoil actuel.

Certaines motivations pour utiliser ce crochet peuvent inclure:
* Lire l'état Recoil de manière asynchrone sans souscrire à un composant React pour effectuer un nouveau rendu si l'atome ou le sélecteur est mis à jour.
* Reportez les recherches coûteuses à une action asynchrone que vous ne voulez pas faire au moment du rendu.
* Effectuer des effets secondaires où vous souhaitez également lire ou écrire dans l'état Recoil.
* Mettre à jour dynamiquement un atome ou un sélecteur où nous pouvons ne pas savoir au moment du rendu quel atome ou sélecteur nous voulons mettre à jour, nous ne pouvons donc pas utiliser [`useSetRecoilState()`](/docs_FR-fr/api-reference/core/useSetRecoilState ).
* [Prélecture](/docs_FR-fr/guides/asynchronous-data-queries#pré-extraction) données avant le rendu.

---

```jsx
type CallbackInterface = {
  snapshot: Snapshot,
  gotoSnapshot: Snapshot => void,
  set: <T>(RecoilState<T>, (T => T) | T) => void,
  reset: <T>(RecoilState<T>) => void,
};

function useRecoilCallback<Args, ReturnValue>(
  callback: CallbackInterface => (...Args) => ReturnValue,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => ReturnValue
```

* **`callback`** - La fonction de rappel utilisateur avec une fonction wrapper qui fournit une interface de rappel. Les rappels pour changer l'état seront mis en file d'attente pour mettre à jour de manière asynchrone l'état Recoil actuel. La signature de type de la fonction encapsulée correspond à la signature de type du rappel renvoyé.
* **`deps`** - Un ensemble optionnel de dépendances pour mémoriser le rappel. Comme `useCallback()`, le callback produit ne sera pas mémorisé par défaut et produira une nouvelle fonction à chaque rendu. Vous pouvez transmettre un tableau vide pour toujours renvoyer la même instance de fonction. Si vous passez des valeurs dans le tableau `deps`, une nouvelle fonction sera utilisée si l'égalité de référence de tout dep change. Ces valeurs peuvent ensuite être utilisées à partir du corps de votre rappel sans devenir obsolètes. (Voir [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback)) Vous pouvez [mettre à jour eslint](/docs_FR-fr/introduction/installation#eslint) pour vous assurer qu'il est utilisé correctement .

Interface de rappel:
* **`snapshot`** - Le [`Snapshot`](/docs_FR-fr/api-reference/core/Snapshot) fournit un aperçu en lecture seule de l'état de l'atome Recoil engagé avec un lot React lorsque la transaction actuelle, le rappel est appelé de commencé. Alors que les valeurs d'atome sont statiques, les sélecteurs asynchrones peuvent encore être en attente ou être résolus.
* **`gotoSnapshot`** - Mettre en file d'attente la mise à jour de l'état global pour qu'il corresponde au [` Snapshot`](/docs_FR-fr/api-reference/core/Snapshot) fourni.
* **`set`** - Mise en file d'attente définissant la valeur d'un atome ou d'un sélecteur. Comme ailleurs, vous pouvez soit fournir la nouvelle valeur directement ou une fonction de mise à jour qui renvoie la nouvelle valeur et prend la valeur actuelle comme paramètre. La valeur actuelle représente tous les autres changements d'état mis en file d'attente à ce jour dans la transaction actuelle.
* **`reset`** - Réinitialise la valeur d'un atome ou d'un sélecteur à sa valeur par défaut.

### Exemple de lecture différée

Cet exemple utilise **`useRecoilCallback()`** pour lire de façon différée l'état sans souscrire à un composant à restituer lorsque l'état change.

```jsx
import {atom, useRecoilCallback} from 'recoil';

const itemsInCart = atom({
  key: 'itemsInCart',
  default: 0,
});

function CartInfoDebug() {
  const logCartItems = useRecoilCallback(({snapshot}) => async () => {
    const numItemsInCart = await snapshot.getPromise(itemsInCart);
    console.log('Éléments dans le chariot: ', numItemsInCart);
  });

  return (
    <div>
      <button onClick={logCartItems}>Noter les éléments du chariot</button>
    </div>
  );
}
```
