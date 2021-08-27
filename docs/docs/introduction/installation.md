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

Recoil builds are not transpiled to ES5, and we do not support the use of Recoil with ES5. If you need to support browsers that do not provide ES6 features natively, you can do so by compiling your code with [Babel](https://babeljs.io/) and using preset [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env). However, we do not support this and you may run into problems.

In particular, [just like React](https://reactjs.org/docs/javascript-environment-requirements.html), Recoil depends on the `Map` and `Set` types and other features of ES6. Emulation of these features using polyfills may result in far worse performance.

## CDN

Since version 0.0.11, Recoil offers a UMD build that can be directly used in a `<script>` tag and exposes the symbol `Recoil` to the global namespace. We recommend linking to a specific version number and build to avoid unexpected breakage from newer versions:

```html
<script src="https://cdn.jsdelivr.net/npm/recoil@0.0.11/umd/recoil.production.js"></script>
```

You can browse all Recoil files on the CDN at [jsdelivr](https://www.jsdelivr.com/package/npm/recoil).

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
        "additionalHooks": "(useRecoilCallback|useRecoilTransaction_UNSTABLE)"
      }
    ]
  }
}
```

## Nightly Builds

We build a package once every day based on the current `master` branch and publish it as the `nightly` branch on GitHub.  You can use this branch via `npm`:

```shell
npm install https://github.com/facebookexperimental/Recoil.git#nightly
```

 or `yarn`:
 ```shell
 yarn add https://github.com/facebookexperimental/Recoil.git#nightly
 ```
  or add a dependency in `package.json` and run `npm install` or `yarn`:
```js
  "recoil": "facebookexperimental/Recoil.git#nightly",
```
