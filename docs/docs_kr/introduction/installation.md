---
title: 설치
---

## NPM

Recoil 패키지는 <a href="https://www.npmjs.com/get-npm" target="_blank">npm</a>에 존재한다. 안정한 최신 버전을 설치하기 위해서는 아래의 명령어를 실행하면 된다.

```shell
npm install recoil
```

또는 <a href="https://classic.yarnpkg.com/en/docs/install/" target="_blank">yarn</a>을 사용한다면 이 명령어를 사용하면 된다.

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

프로젝트에서 [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)을 사용하는 경우. 예를 들어 다음과 같은 eslint 설정을 사용하는 경우

```json
// 이전의 .eslint 설정
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

[`'useRecoilCallback'`](docs/api-reference/core/useRecoilCallback)을 `additionalHooks` 목록에 추가하는 것이 좋다. 이런 변경으로 ESLint는 `useRecoilCallback`에 전달된 종속성이 잘못 지정되었을 때 경고하고 수정을 제안한다. `additionalHooks`의 형식은 정규식 문자열이다.

```json
// 수정된 .eslint 설정
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": [
      "warn",
      {
        "additionalHooks": "useRecoilCallback"
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
