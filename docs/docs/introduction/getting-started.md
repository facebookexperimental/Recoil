---
title: Getting Started
---

## Create React App

Recoil is a state management library for React, so you need to have React installed and running to use Recoil. The easiest and recommended way for bootstrapping a React application is to use [Create React App](https://github.com/facebook/create-react-app#creating-an-app):

```shell
npx create-react-app my-app
```

> [`npx`](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) is a package runner tool that comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f).

For more ways to install Create React App, see the [official documentation](https://github.com/facebook/create-react-app#creating-an-app).

## Installation

The Recoil package lives in <a href="https://www.npmjs.com/get-npm" target="_blank">npm</a>. To install the latest stable version, run the following command:

```shell
npm install recoil
```

Or if you're using <a href="https://classic.yarnpkg.com/en/docs/install/" target="_blank">yarn</a>:

```shell
yarn add recoil
```

## RecoilRoot

Components that use recoil state need `RecoilRoot` to appear somewhere in the parent tree. A good place to put this is in your root component:

```jsx
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil';

function App() {
  return (
    <RecoilRoot>
      <CharacterCounter />
    </RecoilRoot>
  );
}
```

We'll implement the `CharacterCounter` component in the following section.

## Atom

An **atom** represents a piece of **state**. Atoms can be read from and written to from any component. Components that read the value of an atom are implicitly **subscribed** to that atom, so any atom updates will result in a re-render of all components subscribed to that atom:

```javascript
const textState = atom({
  key: 'textState', // unique ID (with respect to other atoms/selectors)
  default: '', // default value (aka initial value)
});
```

Components that need to read from _and_ write to an atom should use `useRecoilState()` as shown below:

```jsx
function CharacterCounter() {
  return (
    <>
      <TextInput />
      <CharacterCount />
    </>
  );
}

function TextInput() {
  const [text, setText] = useRecoilState(textState);

  return (
    <>
      <input type="text" value={text} onChange={setText} />
      <br />
      Echo: {text}
    </>
  );
}
```

## Selector

A **selector** represents a piece of **derived state**. Derived state is a **transformation** of state. You can think of derived state as the output of passing state to a pure function that modifies the given state in some way:

```jsx
const charCountState = selector({
  key: 'charCountState', // unique ID (with respect to other atoms/selectors)
  get: ({get}) => {
    const text = get(textState);

    return text.length;
  },
});
```

We can use the `useRecoilValue()` hook to read the value of `charCountState`:

```jsx
function CharacterCount() {
  const count = useRecoilValue(charCountState);

  return <>Character Count: {count}</>;
}
```
