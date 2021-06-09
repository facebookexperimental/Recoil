---
title: 安装
---

## NPM

Recoil 的 package 已上传至 <a href="https://www.npmjs.com/get-npm" target="_blank">npm</a>。欲下载最新版本，请运行如下命令：

```shell
npm install recoil
```

或者可以使用 <a href="https://classic.yarnpkg.com/en/docs/install/" target="_blank">yarn</a>：

```shell
yarn add recoil
```

### Bundler

通过 npm 安装的 Recoil 与 [Webpack](https://webpack.js.org/) 或 [Rollup](https://rollupjs.org/) 等模块 bunlder 可以轻松匹配。

### 支持 ES5

Recoil 的构建没有转译成 ES5，我们也不支持在 ES5 下使用 Recoil。如果你需要兼容不支持 ES6 的浏览器，你可以通过 [Babel](https://babeljs.io/) 编译你的代码，并使用 [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env) 的 preset。然而，我们建议你这样做，你可能会遇到问题。

主要是，[像 React 这类的库](https://reactjs.org/docs/javascript-environment-requirements.html)，Recoil 依赖于 `Map` 和 `Set` 类型以及其他 ES6 的特性。使用 polyfill 来模拟这些特性可能会导致性能大大降低。

## CDN

从 0.0.11 版本开始，Recoil 提供了 UMD 构建，可以直接在 `<script>` 中使用，并将符号 `Recoil` 暴露给全局的命名空间。我们建议链接到一个特定的版本号和构建，以避免较新版本带来的破坏性更改：

```html
<script src="https://cdn.jsdelivr.net/npm/recoil@0.0.11/umd/recoil.production.js"></script>
```

你可以浏览 [jsdelivr](https://www.jsdelivr.com/package/npm/recoil) CDN 上所有的 Recoil 文件。

## ESLint

如果你在你的项目中使用了 [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)。例如，在 eslint 中的配置如下：

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

建议将 [`'useRecoilCallback'`](/docs/api-reference/core/useRecoilCallback) 添加到 `additionalHooks` 列表中。这样做，当传递给 `useRecoilCallback()` 的依赖关系出错时，ESLint 会发出警告，并建议进行修复。`additionalHooks` 的格式是一个 regex 字符串。

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

## Nightly Builds

我们每天会基于当前的 `master` 分支构建一次 package，并将其作为 `nightly` 分支并发布到 Github 上。你可以通过 `npm` 来使用此分支：

```shell
npm install https://github.com/facebookexperimental/Recoil.git#nightly
```

 或使用 `yarn`:
 ```shell
 yarn add https://github.com/facebookexperimental/Recoil.git#nightly
 ```
 或在 `package.json` 中添加一个依赖项，然后运行 `npm install` 或者 `yarn`：
```js
  "recoil": "facebookexperimental/Recoil.git#nightly",
```
