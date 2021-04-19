---
title: useRecoilState(state)
sidebar_label: useRecoilState()
---

Renvoie un tuple où le premier élément est la valeur de l'état et le deuxième élément est une fonction de définition qui mettra à jour la valeur de l'état donné lorsqu'elle est appelée.

Ce hook abonnera implicitement le composant à l'état donné.

---

```jsx
function useRecoilState<T>(state: RecoilState<T>): [T, SetterOrUpdater<T>];

type SetterOrUpdater<T> = (T | (T => T)) => void;
```

- `state`: un [`atome`](/docs/api-reference/core/atom) ou un [`selecteur`](/docs/api-reference/core/selector) _inscriptible_. Les sélecteurs inscriptibles sont des sélecteurs qui ont à la fois un `get` et un `set` dans leur définition tandis que les sélecteurs en lecture seule n'ont qu'un `get`.

Cette API est similaire au hook React [`useState()`](https://reactjs.org/docs/hooks-reference.html#usestate) sauf qu'il prend un état Recoil au lieu d'une valeur par défaut comme argument. Il retourne un tuple de la valeur actuelle de l'état et une fonction de définition. La fonction de définition peut prendre une nouvelle valeur comme argument ou une fonction de mise à jour qui reçoit la valeur précédente en tant que paramètre.

---

Il s'agit du hook recommandé à utiliser lorsqu'un composant a l'intention de lire et d'écrire l'état.

L'utilisation de ce hook dans un composant React abonnera le composant à restituer lorsque l'état est mis à jour. Ce hook peut déclencher si l'état a une erreur ou est en attente de résolution asynchrone. Veuillez consulter [ce guide](/docs/guides/asynchronous-data-queries).

### Exemple

```jsx
import {atom, selector, useRecoilState} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelsius = selector({
  key: 'tempCelsius',
  get: ({get}) => ((get(tempFahrenheit) - 32) * 5) / 9,
  set: ({set}, newValue) => set(tempFahrenheit, (newValue * 9) / 5 + 32),
});

function TempCelsius() {
  const [tempF, setTempF] = useRecoilState(tempFahrenheit);
  const [tempC, setTempC] = useRecoilState(tempCelsius);

  const addTenCelsius = () => setTempC(tempC + 10);
  const addTenFahrenheit = () => setTempF(tempF + 10);

  return (
    <div>
      Temp (Celsius): {tempC}
      <br />
      Temp (Fahrenheit): {tempF}
      <br />
      <button onClick={addTenCelsius}>Ajouter 10 Celsius</button>
      <br />
      <button onClick={addTenFahrenheit}>Ajouter 10 Fahrenheit</button>
    </div>
  );
}
```
