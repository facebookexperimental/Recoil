---
title: useRecoilBridgeAcrossReactRoots()
sidebar_label: useRecoilBridgeAcrossReactRoots()
---

Ce hook aide à la création de ponts entre l'état Recoil et une racine React imbriquée.

```jsx
function useRecoilBridgeAcrossReactRoots_UNSTABLE():
  React.AbstractComponent<{children: React.Node}>;
```
Si une racine React imbriquée est créée avec `ReactDOM.render()`, ou si un rendu personnalisé imbriqué est utilisé, React ne propagera pas l'état du contexte aux enfants. Ce hook est utile si vous souhaitez "ponter" et partager l'état Recoil avec une racine React imbriquée. Le hook retourne un composant React que vous pouvez utiliser à la place de `<RecoilRoot>` dans votre racine React imbriquée pour partager le même object d'état Recoil. Comme pour tout partage d'état entre racines React, les modifications peuvent ne pas être parfaitement synchronisées. 

### Exemple

```jsx
function Pont() {
  const RecoilBridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

  return (
    <CustomRenderer>
      <RecoilBridge>
        ...
      </RecoilBridge>
    </CustomRenderer>
  );
}

function MyApp() {
  return (
    <RecoilRoot>
      ...
      <Pont />
    </RecoilRoot>
  );
}
```
