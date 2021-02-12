---
title: Installation
---

Le packet Recoil est hébergé à <a href="https://www.npmjs.com/get-npm" target="_blank">npm</a>. Pour installer la dernière version stable, utiliser la commande suivante:

```shell
npm install recoil
```

Ou, si vous utilisez <a href="https://classic.yarnpkg.com/en/docs/install/" target="_blank">yarn</a>:

```shell
yarn add recoil
```

## ESLint

Si vous utilisez [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) dans votre projet. Par exemple, avec un configuration eslint comme:

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

Il est recommendé d'ajouter [`'useRecoilCallback'`](/docs_FR-fr/api-reference/core/useRecoilCallback) à la list des `additionalHooks`. Avec ce changement, ESLint prévient quand les dépendances passées à `useRecoilCallback()` sont incorrectes et sugggère une solution.  Le format de `additionalHooks` est une chaine de charactères regex.

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
