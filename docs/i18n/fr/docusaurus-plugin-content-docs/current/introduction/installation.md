---
title: Installation
---

## NPM

Le packet Recoil est hébergé sur <a href="https://www.npmjs.com/get-npm" target="_blank"> npm </a>. Pour installer la dernière version stable, utiliser la commande suivante:

```shell
npm install recoil
```

Ou si vous utilisez <a href="https://classic.yarnpkg.com/en/docs/install/" target="_blank">yarn</a>:

```shell
yarn add recoil
```

### Groupeur de modules

Recoil, installé via NPM, fonctionne sans soucis avec des groupeur de modules tels que [Webpack](https://webpack.js.org/) ou [Rollup](https://rollupjs.org/).

### Prise en charge ES5

Recoil n'est pas transpilé vers ES5 et nous ne prenons pas en charge l'utilisation de Recoil avec ES5. Si vous avez besoin de prendre en charge des navigateurs qui ne fournissent pas un niveau de fonctionnalités ES6 de manière native, vous pouvez le compiler votre code avec [Babel](https://babeljs.io/) et en utilisant le preset [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env). Cependant, nous ne prenons pas en charge ce cas et vous êtes suceptible de rencontrer des problèmes.

En particulier, [tout comme React](https://reactjs.org/docs/javascript-environment-requirements.html), Recoil dépend des types `Map` et` Set` et d'autres fonctionnalités d'ES6. L'émulation de ces fonctionnalités à l'aide de polyfills peut entraîner des problème de performances.

## RDC

Depuis la version 0.0.11, Recoil offre un packet UMD qui peut être directement utilisée dans une balise `<script>` et expose le symbole `Recoil` globalement. Nous vous recommandons de créer un lien vers un numéro de version et une version spécifiques pour éviter une rupture inattendue des versions plus récentes:

```html
<script src = "https://cdn.jsdelivr.net/npm/recoil@0.0.11/umd/recoil.production.js"> </script>
```

Vous pouvez parcourir tous les fichiers Recoil sur le RDC à [jsdelivr](https://www.jsdelivr.com/package/npm/recoil).

## ESLint

Si vous utilisez [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) dans votre projet. Par exemple, avec une configuration eslint comme celle-ci:

```json
// Configuration .eslint avant
{
  "plugins": [
    "react-hooks"
  ],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

Il est recommandé d'ajouter [`'useRecoilCallback'`](/docs/api-reference/core/useRecoilCallback) à la liste des `additionalHooks`. Avec ce changement, ESLint avertira lorsque les dépendances passées à `useRecoilCallback()` sont spécifiées de manière incorrecte et suggérera un correctif. Le format de `additionalHooks` est une chaîne d'expression régulière.

```json
// Configuration .eslint après
{
  "plugins": [
    "react-hooks"
  ],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": [
      "warn", {
        "additionalHooks": "useRecoilCallback"
      }
    ]
  }
}
```

## Version journalière

Nous construisons un packet une fois par jour basé sur la branche `main` courrente et le publions en tant que branche `nightly` sur GitHub. Vous pouvez utiliser cette branche via `npm`:

```shell
npm install https://github.com/facebookexperimental/Recoil.git#nightly
```

ou `yarn`:

```shell
yarn add https://github.com/facebookexperimental/Recoil.nit#nightly
```
ou ajoutez une dépendance dans `package.json` et exécutez` npm install` ou `yarn install`:

```js
  "recoil": "facebookexperimental/Recoil.git#nightly",
```
