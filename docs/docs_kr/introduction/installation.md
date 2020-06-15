---
title: 설치
---

Recoil 패키지는 <a href="https://www.npmjs.com/get-npm" target="_blank">npm</a>에 존재한다. 안정한 최신 버전을 설치하기 위해서는 아래의 명령어를 실행하면 된다.

```shell
npm install recoil
```

또는 <a href="https://classic.yarnpkg.com/en/docs/install/" target="_blank">yarn</a>을 사용한다면 이 명령어를 사용하면 된다.

```shell
yarn add recoil
```

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

[useRecoilCallback](docs/api-reference/core/useRecoilCallback)을 `additionalHooks` 목록에 추가하는 것이 좋다. 이런 변경으로 ESLint는 `useRecoilCallback`에 전달된 종속성이 잘못 지정되었을 때 경고하고 수정을 제안한다. `additionalHooks`의 형식은 정규식 문자열이다.

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
