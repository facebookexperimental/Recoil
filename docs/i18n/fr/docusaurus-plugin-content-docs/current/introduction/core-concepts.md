---
title: Concepts de base
---

## Aperçu

Recoil vous permet de créer un graphe de flux de données qui s'écoule des _atomes_ (état partagé) via des _sélecteurs_ (fonctions pures) et descend dans vos composants React. Les atomes sont des unités d'état auxquelles les composants peuvent s'abonner. Les sélecteurs transforment cet état de manière synchrone ou asynchrone.

## Atomes

Les atomes sont des unités d'état. Ils peuvent être mis à jour et il est possible de s'y abonner: lorsqu'un atome est mis à jour, chaque composant abonné est re-rendu avec la nouvelle valeur. Ils peuvent également être créés à l'exécution. Les atomes peuvent être utilisés à la place de l'état local du composant React. Si le même atome est utilisé à partir de plusieurs composants, tous ces composants partagent leur état.

Les atomes sont créés en utilisant la fonction `atom`:

```javascript
const fontSizeState = atom({
  key: 'fontSizeState',
  default: 14,
});
```

Les atomes ont besoin d'une clé unique, qui est utilisée pour le débogage, la persistance et pour certaines API avancées qui vous permettent de voir une carte de tous les atomes. C'est une erreur pour deux atomes d'avoir la même clé, alors assurez-vous qu'ils sont uniques à travers toute l'application. Comme les états locaux de composant React, ils ont également une valeur par défaut.

Pour lire et écrire un atome à partir d'un composant, nous utilisons un _Hook_ appelé `useRecoilState`. C'est exactement comme `useState` de React, mais maintenant l'état peut être partagé entre les composants:

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return (
    <button onClick={() => setFontSize((size) => size + 1)} style={{fontSize}}>
      Cliquer pour agrandir
    </button>
  );
}
```

Cliquer sur le bouton augmentera la taille de la police du bouton d'une unité. Mais maintenant, un autre composant peut également utiliser la même taille de police:

```jsx
function Text() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return <p style={{fontSize}}>Ce text va aussi s'agrandir.</p>;
}
```

## Sélecteurs

Un **sélecteur** est une fonction pure qui accepte des atomes ou d'autres sélecteurs en entrée. Lorsque ces atomes ou sélecteurs en amont sont mis à jour, le sélecteur sera réévaluée. Les composants peuvent s'abonner à des sélecteurs tout comme les atomes, et seront ensuite re-rendu lorsque les sélecteurs changent.

Les sélecteurs sont utilisés pour calculer des données dérivées basées sur l'état. Cela nous permet d'éviter un état redondant, ce qui annule généralement la nécessité d'utiliser des réducteurs pour maintenir l'état synchronisé et valide. Au lieu de cela, un ensemble minimal d'états est stocké dans des atomes, tandis que tout le reste est calculé efficacement en fonction de ces états minimaux. Étant donné que les sélecteurs gardent une trace des composants qui en ont besoin et de leur état, ils rendent cette approche fonctionnelle plus efficace.

Du point de vue des composants, les sélecteurs et les atomes ont la même interface et peuvent donc se substituer les uns aux autres.

Les sélecteurs sont définis à l'aide de la fonction `selector`:

```javascript
const fontSizeLabelState = selector({
  key: 'fontSizeLabelState',
  get: ({get}) => {
    const fontSize = get(fontSizeState);
    const unit = 'px';

    return `${fontSize}${unit}`;
  },
});
```

La propriété `get` est la fonction à calculer. Elle peut accéder à la valeur des atomes et d'autres sélecteurs à l'aide de l'argument `get` qui lui est transmis. Chaque fois qu'elle accède à un autre atome ou sélecteur, une relation de dépendance est créée de telle sorte que la mise à jour de l'autre atome ou sélecteur entraîne le recalcul de celle-ci.

Dans cet exemple `fontSizeLabelState`, le sélecteur a une dépendance: l'atome `fontSizeState`. Conceptuellement, le sélecteur `fontSizeLabelState` se comporte comme une fonction pure qui prend `fontSizeState` en entrée et renvoie la de taille de police formatée en sortie.

Les sélecteurs peuvent être lus à l'aide de `useRecoilValue()`, qui prend un atome ou un sélecteur comme argument et renvoie la valeur correspondante. Nous n'utilisons pas `useRecoilState()` car le sélecteur `fontSizeLabelState` n'est pas accessible en écriture (voir la [référence de l'API selector](/docs/api-reference/core/selector) pour plus d'informations sur les sélecteurs accessibles en écriture):

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  const fontSizeLabel = useRecoilValue(fontSizeLabelState);

  return (
    <>
      <div>Taille actuelle: ${fontSizeLabel}</div>

      <button onClick={() => setFontSize(fontSize + 1)} style={{fontSize}}>
        Cliquer pour agrandir
      </button>
    </>
  );
}
```

Cliquer sur le bouton fait maintenant deux choses: cela augmente la taille de police du bouton tout en mettant à jour la taille de police pour refléter la taille de police actuelle.
