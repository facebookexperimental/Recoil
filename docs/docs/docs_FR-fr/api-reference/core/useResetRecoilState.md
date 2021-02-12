---
title: useResetRecoilState(state)
sidebar_label: useResetRecoilState()
---

Renvoie une fonction qui réinitialisera la valeur de l'état donné à sa valeur par défaut.

Utiliser `useResetRecoilState()` permet à un composant de réinitialiser l'état à sa valeur par défaut sans souscrire au composant pour le rendre à nouveau chaque fois que l'état change.

---

```jsx
function useResetRecoilState<T>(state: RecoilState<T>): () => void;
```

- `state`: un état Recoil inscriptible

### Exemple

```jsx
import {todoListState} from "../atoms/todoListState";

const TodoResetButton = () => {
  const resetList = useResetRecoilState(todoListState);
  return <button onClick={resetList}>Remettre à zéro</button>;
};
```
