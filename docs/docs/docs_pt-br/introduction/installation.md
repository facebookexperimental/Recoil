---
title: Instalação
---

## NPM

O pacote Recoil está disponível em <a href="https://www.npmjs.com/get-npm" target="_blank">npm</a>. Para instalar a versão estável mais recente, execute o seguinte comando:

```shell
npm install recoil
```

Ou se você estiver usando <a href="https://classic.yarnpkg.com/en/docs/install/" target="_blank">yarn</a>:

```shell
yarn add recoil
```

### Bundler

Recoil instalado por meio de pares NPM muito bem com empacotadores de módulo, como [Webpack](https://webpack.js.org/) ou [Rollup](https://rollupjs.org/).

### ES5 suporte

As compilações de Recoil não são transpiladas para ES5 e não oferecemos suporte ao uso de Recoil com ES5. Se você precisar oferecer suporte a navegadores que não fornecem recursos ES6 nativamente, você pode fazer isso compilando seu código com [Babel](https://babeljs.io/) e usando predefinição [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env). No entanto, não oferecemos suporte para isso e você pode ter problemas.

Em particular, [just like React](https://reactjs.org/docs/javascript-environment-requirements.html), Recoil depende dos tipos `Map` e` Set` e outros recursos do ES6. A emulação desses recursos usando polyfills pode resultar em um desempenho muito pior.

## CDN

Desde a versão 0.0.11, Recoil oferece um build UMD que pode ser usado diretamente em uma tag `<script>` e expõe o símbolo `Recoil` para o namespace global. Recomendamos vincular a um número de versão específico e compilar para evitar interrupções inesperadas de versões mais recentes:

```html
<script src="https://cdn.jsdelivr.net/npm/recoil@0.0.11/umd/recoil.production.js"></script>
```

Você pode navegar por todos os arquivos Recoil no CDN em [jsdelivr](https://www.jsdelivr.com/package/npm/recoil).

## ESLint

Se você estiver usando [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) no seu projecto. Por exemplo, com uma configuração eslint como esta:

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

Recomenda-se adicionar: [`'useRecoilCallback'`](/docs/api-reference/core/useRecoilCallback) à lista de `additionalHooks`. Com esta mudança, o ESLint avisará quando as dependências passadas para `useRecoilCallback ()` forem especificadas incorretamente e sugere uma correção. O formato de `additionalHooks` é uma string regex.

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
