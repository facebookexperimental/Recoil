---
title: useRecoilState(state)
sidebar_label: useRecoilState()
---

返回一个数组，第一个元素是 state 的值，第二个元素是一个 setter 函数，调用该函数时会更新为给定 state 的值。

使用此 hook 会使组件隐式地订阅给定的 state。

---

```jsx
function useRecoilState<T>(state: RecoilState<T>): [T, SetterOrUpdater<T>];

type SetterOrUpdater<T> = (T | (T => T)) => void;
```

- `state`: 一个 [`atom`](/docs/api-reference/core/atom) 或一个 _可写_ 的 [`selector`](/docs/api-reference/core/selector)。可写的 selector 在其定义的同时具有 `get` 和 `set` 函数，而只读 selector 只有一个 `get`。

本 API 和 React 的 [`useState()`](https://reactjs.org/docs/hooks-reference.html#usestate) hook 类似，区别在于 `useRecoilState` 的参数使用 Recoil state 代替了 `useState()` 的默认值。它返回由 state 的当前值和 setter 函数组成的元组。Setter 函数的参数可以是新值，也可以是一个以之前的值为参数的更新器函数。

---

当组件同时需要读写状态时，推荐使用该 hook。

在 React 组件中，使用本 hook 将会订阅该组件，并且在 state 更新时重新渲染该组件。该 hook 在 state 异常或者在异步解析时抛出异常。详细可以参考[指南](/docs/guides/asynchronous-data-queries)。

### 示例

```jsx
import {atom, selector, useRecoilState} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelsius = selector({
  key: 'tempCelsius',
  get: ({get}) => ((get(tempFahrenheit) - 32) * 5) / 9,
  set: ({set}, newValue) => set(tempFahrenheit, (newValue * 9) / 5 + 32),
});

function TempCelsius() {
  const [tempF, setTempF] = useRecoilState(tempFahrenheit);
  const [tempC, setTempC] = useRecoilState(tempCelsius);

  const addTenCelsius = () => setTempC(tempC + 10);
  const addTenFahrenheit = () => setTempF(tempF + 10);

  return (
    <div>
      Temp (Celsius): {tempC}
      <br />
      Temp (Fahrenheit): {tempF}
      <br />
      <button onClick={addTenCelsius}>Add 10 Celsius</button>
      <br />
      <button onClick={addTenFahrenheit}>Add 10 Fahrenheit</button>
    </div>
  );
}
```
