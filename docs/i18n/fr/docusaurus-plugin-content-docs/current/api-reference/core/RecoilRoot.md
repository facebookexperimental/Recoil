---
title: <RecoilRoot ...props />
sidebar_label: <RecoilRoot />
---

Fournit le contexte dans lequel les atomes ont des valeurs. Doit être un ancêtre de tout composant qui utilise des hooks Recoil. Plusieurs racines peuvent coexister; les atomes auront des valeurs distinctes dans chaque racine. S'ils sont imbriqués, la racine la plus interne masquera complètement les racines externes.

---

**Props**:
- `initializeState?`: `(MutableSnapshot => void)`
  - Une fonction optionnelle qui prend un [`MutableSnapshot`](/docs/api-reference/core/Snapshot#transforming-snapshots) à [initialize](/docs/api-reference/core/Snapshot#state-initialization) le `<RecoilRoot>` état de l'atome. Cela configure l'état du rendu initial et n'est pas destiné aux changements d'état ultérieurs ou à l'initialisation asynchrone. Utilisez des hooks tels que [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState) ou [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) pour les changements d'état asynchrone.

---

Les `<RecoilRoot>` représentent des fournisseurs / magasins indépendants de l'état de l'atome. Notez que les caches, tels que les caches de sélecteurs, peuvent être partagés entre les racines. Les évaluations des sélecteurs doivent être idempotentes, sauf pour la mise en cache ou la journalisation, donc cela ne devrait pas être un problème, mais peut être observable ou peut entraîner la mise en cache de requêtes redondantes entre les racines.

### Exemple

```jsx
import {RecoilRoot} from 'recoil';

function AppRoot() {
  return (
    <RecoilRoot>
      <ComponentThatUsesRecoil />
    </RecoilRoot>
  );
}
```
