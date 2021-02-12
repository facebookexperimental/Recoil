---
title: Tester
---

## Tester des sélecteur Recoil en dehors de React

Il peut être utile de manipuler et d'évaluer les sélecteurs Recoil en dehors d'un contexte React à des fins de test. Cela peut être fait en travaillant avec un Recoil [`Snapshot`](/docs_FR-fr/api-reference/core/Snapshot) (instantané). Vous pouvez créer un instantané frais en utilisant `snapshot_UNSTABLE()` puis utiliser cet instantané pour évaluer les sélecteurs pour les tests. 

### Exemple: test unitaire de sélecteurs avec Jest

```jsx
const numberState = atom({key: 'Number', default: 0});

const multipliedState = selector({
  key: 'MultipliedNumber',
  get: ({get}) => get(numberState) * 100,
});

test('Teste multipliedState', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  expect(initialSnapshot.getLoadable(multipliedState).valueOrThrow()).toBe(0);

  const testSnapshot = snapshot_UNSTABLE(({set}) => set(numberState, 1));
  expect(testSnapshot.getLoadable(multipliedState).valueOrThrow()).toBe(100);
})
```
