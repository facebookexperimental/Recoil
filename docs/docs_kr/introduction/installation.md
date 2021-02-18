---
title: Installation
---

## NPM

Recoil 패키지는 npm 생태계를 따라갑니다. 최신의 안정적인 버전을 설치하기 위해서는, 다음 명령을 입력하면 됩니다.

```shell
npm install recoil
```

yarn을 사용하신다면:

```shell
yarn add recoil
```

### Bundler

Recoil을 NPM으로 설치하면 [Webpack](https://webpack.js.org)이나 [Rollup](https://rollupjs.org/guide/en/)과 잘 짝을 이룹니다.

### ES5 support

Recoil 빌드는 ES5로 트랜스파일 되지 않으며, Recoil를 ES5로 사용하는 것을 지원하지 않습니다. 만약 ES6의 기능들을 네이티브로 제공하지 않는 브라우저를 지원해야 하는 경우라면 코드를 [Babel](https://babeljs.io) 과 [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env) 프리셋을 사용하여 컴파일하여 사용할 수 있습니다. 그러나, 서포트하지 않는 부분이므로 문제에 봉착할 수 있습니다.

특히, Recoil은 [리액트처럼](https://reactjs.org/docs/javascript-environment-requirements.html) `Map` 과 `Set` 타입, ES6의 다른 기능들에 의존합니다. 이러한 기능들을 polyfills를 사용하여 에뮬레이션 하는 일은 성능을 더 악화시킬 수 있습니다.

## CDN

버전 0.0.11부터, Recoil은 `<script>` 태그 안에 `Recoil` 심볼을 글로벌 네임스페이스에 노출하여 바로 사용할 수 있는 UMD 빌드를 제공합니다. 상세한 버전 넘버와 빌드를 연결해서 새로운 버전으로 인해 발생 할 수 있는 예기치 못한 파손을 방지하는 것을 추천합니다:

```html
<script src="https://cdn.jsdelivr.net/npm/recoil@0.0.11/umd/recoil.production.js"></script>
```

Recoil의 모든 파일들은 [jsdelivr](https://www.jsdelivr.com/package/npm/recoil)의 CDN에서 열람할 수 있습니다.

## ESLint

예를 들어, 다음과 같은 eslint config를 사용해서 [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) 를 프로젝트에서 사용한다면:

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

['useRecoilCallback'](https://recoiljs.org/docs/api-reference/core/useRecoilCallback) 을 `additionalHooks` 리스트에 추가하는 것을 추천합니다. 이렇게 하면 ESLint가 `useRecoilCallback()`에 의존성이 잘못 명시된 부분을 경고하고, 수정 예시를 제안하게 됩니다. `additionalHooks`의 포맷은 정규표현식으로 되어있습니다.

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

Recoil은 매일 한번씩 최신 master branch를 기반으로 패키지를 빌드하며, Github의 nightly branch에 퍼블리시됩니다. 이 branch는 npm을 통해 사용할 수 있습니다:

```shell
npm install https://github.com/facebookexperimental/Recoil.git#nightly
```

혹은 yarn에서도 사용 가능합니다:
 ```shell
 yarn add https://github.com/facebookexperimental/Recoil.git#nightly
 ```
혹은 package.json에 의존성을 추가한 이후 npm install 혹은 yarn을 실행하는 방법:
```js
  "recoil": "facebookexperimental/Recoil.git#nightly",
```
