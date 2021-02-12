---
title: useSetRecoilState(state)
sidebar_label: useSetRecoilState()
---

Renvoie une fonction de réglage pour mettre à jour la valeur de l'état Recoil inscriptible.

---

```jsx
function useSetRecoilState<T>(state: RecoilState<T>): SetterOrUpdater<T>;

type SetterOrUpdater<T> = (T | (T => T)) => void;
```

- `state`: état Recoil inscriptible (un [`atome`](/docs_FR-fr/api-reference/core/atom) ou un _writeable_ [`sélecteur`](/docs_FR-fr/api-reference/core/selector))

Renvoie une fonction setter qui peut être utilisée de manière asynchrone pour changer l'état. Le setter peut recevoir une nouvelle valeur ou une fonction de mise à jour qui reçoit la valeur précédente comme argument.

---

Il s'agit du hook recommandé à utiliser lorsqu'un composant a l'intention d'écrire dans l'état sans le lire. Si un composant utilisait le hook [`useRecoilState()`](/docs_FR-fr/api-reference/core/useRecoilState) pour obtenir le setter, il s'abonnerait également aux mises à jour et effectuerait un nouveau rendu lorsque l'atome ou le sélecteur serait mis à jour. L'utilisation de `useSetRecoilState()` permet à un composant de définir la valeur sans souscrire au composant pour le restituer lorsque la valeur change.

### Exemple

```jsx
import {atom, useSetRecoilState} from 'recoil';

const namesState = atom({
  key: 'namesState',
  default: ['Ella', 'Chris', 'Paul'],
});

function FormContent({setNamesState}) {
  const [name, setName] = useState('');
  
  return (
    <>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => setNamesState(names => [...names, name])}>Ajouter un nom</button>
    </>
)}

// Ce composant sera rendu une fois
function Form() {
  const setNamesState = useSetRecoilState(namesState);
  
  return <FormContent setNamesState={setNamesState} />;
}
```
