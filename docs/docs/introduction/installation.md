---
title: Installation
---

## NPM

The Recoil package lives in <a href="https://www.npmjs.com/get-npm" target="_blank">npm</a>. To install the latest stable version, run the following command:

```shell
npm install recoil
```

Or if you're using <a href="https://classic.yarnpkg.com/en/docs/install/" target="_blank">yarn</a>:

```shell
yarn add recoil
```

### Bundler

Recoil installed via NPM pairs nicely with module bundlers such as [Webpack](https://webpack.js.org/) or [Rollup](https://rollupjs.org/).

### ES5 support

Recoil builds are not transpiled to ES5. If you need to support browsers that do not provide ES6 features natively, please compile your code with [Babel](https://babeljs.io/) and use preset [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env).

Please note that [just like React](https://reactjs.org/docs/javascript-environment-requirements.html), Recoil depends on the collection types `Map` and `Set` or other ES6 features. You may need to include polyfills in your application (see the instructions on the React website link) to support older browsers such as IE <= 11. The impact on performance of using polyfills is not yet studied.

## CDN

Since version 0.0.11, Recoil offers a UMD build that can be directly used in a `<script>` tag and expose variable `Recoil` to global namespace. We recommend linking to a specific version number and build to avoid unexpected breakage from newer versions:

```html
<script src="https://cdn.jsdelivr.net/npm/recoil@0.0.11/umd/recoil.production.js"></script>
```

You can browse all Recoil files on CDN at [jsdelivr](https://www.jsdelivr.com/package/npm/recoil).

## ESLint

If you are using [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) in your project. For example, with an eslint config like this:

```json
// previous .eslint config
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

It is recommended to add [`'useRecoilCallback'`](/docs/api-reference/core/useRecoilCallback) to the list of `additionalHooks`. With this change, ESLint will warn when the dependencies passed to `useRecoilCallback()` are specified incorrectly and suggests a fix.  The format of `additionalHooks` is a regex string.

```json
// modified .eslint config
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
