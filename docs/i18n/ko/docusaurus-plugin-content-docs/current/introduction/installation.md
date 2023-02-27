---
title: 설치
---

## NPM

Recoil 패키지는 <a href="https://www.npmjs.com/get-npm" target="_blank">npm</a>에 존재한다. 안정화된 최신 버전을 설치하려면 아래의 명령어를 실행하면 된다:

```shell
npm install recoil
```

또는 <a href="https://classic.yarnpkg.com/en/docs/install/" target="_blank">yarn</a>을 사용한다면:

```shell
yarn add recoil
```

### Bundler

Recoil은 [Webpack](https://webpack.js.org/) 또는 [Rollup](https://rollupjs.org/)과 같은 모듈 번들러와도 문제없이 호환된다.

### ES5 지원

Recoil 빌드는 ES5로 트랜스파일 되지 않으므로, Recoil을 ES5와 사용하는 것은 지원하지 않는다. ES6 기능을 natively하게 제공하지 않는 브라우저를 지원해야 하는 경우 [Babel](https://babeljs.io/)로 코드를 컴파일하고 preset [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env)을 이용하여 이를 수행할 수는 있지만 문제가 발생할 수도 있다.

특히, [React와 같이](https://reactjs.org/docs/javascript-environment-requirements.html), Recoil은 ES6의 `Map`과 `Set` 타입에 의존하는데, 이러한 ES6의 요소들을 polyfills를 통해 에뮬레이션하는 것은 성능상의 문제를 야기할 수 있다.

## CDN

버전 0.0.11 이후, Recoil은 `<script>` 태그에 직접 사용될 수 있는 UMD 빌드를 제공하며 `Recoil` 심볼을 글로벌 네임스페이스에 노출한다. 최신 버전으로부터 예기치 않은 손상을 방지하기 위해 안정된 특정 버전 번호 및 빌드에 연결하는 것이 좋다.

```html
<script src="https://cdn.jsdelivr.net/npm/recoil@0.0.11/umd/recoil.production.js"></script>
```

CDN의 모든 Recoil 파일은 [jsdelivr](https://www.jsdelivr.com/package/npm/recoil)에서 찾아볼 수 있다.

## ESLint

프로젝트에서 [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)을 사용하는 경우, 예를 들어 다음과 같이 eslint 설정을 사용하는 경우:

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

[`'useRecoilCallback'`](docs/api-reference/core/useRecoilCallback)을 `additionalHooks` 목록에 추가하는 것이 좋다. 이를 추가하면, ESLint는 `useRecoilCallback()`을 사용하기 위해 전달된 종속성이 잘못 지정되었을 때 경고를 표시하고 해결 방안을 제시한다. `additionalHooks`의 형식은 정규식(regex) 문자열이다.

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

우리는 매일 한 번씩 현재의 `main` 브랜치에 기반하여 패키지를 빌드하고 GitHub에 `nightly` 브랜치로 배포한다. 아래의 `npm` 명령어를 통해 `nightly` 브랜치를 이용할 수 있다:

```shell
npm install https://github.com/facebookexperimental/Recoil.git#nightly
```

 또는 `yarn`:
 ```shell
 yarn add https://github.com/facebookexperimental/Recoil.git#nightly
 ```
  또는 `package.json` 파일에 종속성을 추가한 뒤, `npm install` 또는 `yarn` 명령어를 실행하면 된다:
```js
  "recoil": "facebookexperimental/Recoil.git#nightly",
```
