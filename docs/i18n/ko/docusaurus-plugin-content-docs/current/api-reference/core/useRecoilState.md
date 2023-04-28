---
title: useRecoilState(state)
sidebar_label: useRecoilState()
---

첫 요소가 상태의 값이며, 두번째 요소가 호출되었을 때 주어진 값을 업데이트하는 setter 함수인 튜플을 리턴합니다.

이 hook은 암묵적으로 주어진 상태에 컴포넌트를 구독합니다.

---

```jsx
function useRecoilState<T>(state: RecoilState<T>): [T, SetterOrUpdater<T>];

type SetterOrUpdater<T> = (T | (T => T)) => void;
```

- `state`: [`atom`](/docs/api-reference/core/atom) 혹은 *쓰기가능*한 selector. 읽기 전용 [`selector`](/docs/api-reference/core/selector)가 `get`만 가지고 있을 때, *쓰기가능*한 selector는  `get` 과  `set` 를 정의에 가지고 있습니다.

이 API는 기본값 대신 React Recoil 상태를 인수로 받는 다는 점만 빼면 [`useState()`](https://react.dev/reference/react/useState) hook과 비슷합니다. 상태와 setter 함수의 최신 값의 튜플을 리턴합니다. setter 함수는 새로운 값을 인수로 받거나 이전 값을 매개변수로 받는 updater 함수를 취합니다.

---

이 hook은 컴포넌트가 상태를 읽고 쓰려고 할 때에 권장합니다

이 hook을 React 컴포넌트에서 사용하면 상태가 업데이트 되었을 때 리렌더링을 하도록 컴포넌트를 구독합니다. 이 hook은 상태가 error를 가지고 있거나 보류중인 비동기 resolution을 던져 줄 있습니다. 다음의 [가이드](/docs/guides/asynchronous-data-queries)를 참고해주세요.

### Example

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
