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

NPM을 통해 설치된 Recoil은 [Webpack](https://webpack.js.org/)이나 [Rollup](https://rollupjs.org/)같은 모듈 번들러와도 잘 맞는다.

### ES5 지원

Recoil 빌드는 ES5로 변환(transpile)되지 않으며 ES5에서 Recoil 사용을 지원하지 않는다. ES6 기능을 기본적으로 제공하지 않는 브라우저를 지원해야하는 경우에는 [Babel](https://babeljs.io/)로 컴파일하고 preset [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env)을 이용하면 된다. 그러나 우리는 이런 기능을 직접 제공하고 있지 않으며, 이는 문제가 될 수 있다.

특히 [React와 마찬가지로](https://reactjs.org/docs/javascript-environment-requirements.html), Recoil은 `Map` 및 `Set` 유형과 ES6의 기타 기능에 의존한다. polyfill을 사용하여 이러한 기능을 에뮬레이션하면 성능이 훨씬 저하 될 수 있다.

## CDN

버전 0.0.11부터 Recoil은 `<script>` 태그에서 직접 사용할 수있는 UMD 빌드를 제공하고 `Recoil` 기호를 전역 네임스페이스에 노출한다. 최신 버전에서 예기치 않은 손상을 방지하기 위해 특정 버전의 번호와 연결하고 빌드하기를 추천한다.

```html
<script src="https://cdn.jsdelivr.net/npm/recoil@0.0.11/umd/recoil.production.js"></script>
```

[jsdelivr](https://www.jsdelivr.com/package/npm/recoil)에서 CDN에 있는 모든 Recoil 파일을 확인할 수 있다.

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

매일 한 번씩 `master` 브랜치를 기준으로 빌드하여 Github의 `nightly` 브랜치로 배포된다. `npm`을 통해 해당 브랜치를 사용할 수 있다:

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
