---
title: selector(options)
sidebar_label: selector()
---

**Selector**는 Recoil에서 함수나 **파생된 상태**를 나타낸다. 주어진 종속성 값 집합에 대해 항상 동일한 값을 반환하는 부작용이 없는 "순수함수"라고 생각하면 된다. `get` 함수만 제공되면 Selector는 읽기만 가능한 `RecoilValueReadOnly` 객체를 반환한다. `set` 함수 또한 제공되면 Selector는 쓰기 가능한 `RecoilState` 객체를 반환한다.

---

```jsx
function selector<T>({
  key: string,

  get: ({
    get: GetRecoilValue
  }) => T | Promise<T> | RecoilValue<T>,

  set?: (
    {
      get: GetRecoilValue,
      set: SetRecoilState,
      reset: ResetRecoilState,
    },
    newValue: T | DefaultValue,
  ) => void,

  dangerouslyAllowMutability?: boolean,
})
```

```jsx
type ValueOrUpdater<T> =
  | T
  | DefaultValue
  | ((prevValue: T) => T | DefaultValue);
type GetRecoilValue = <T>(RecoilValue<T>) => T;
type SetRecoilState = <T>(RecoilState<T>, ValueOrUpdater<T>) => void;
type ResetRecoilState = <T>(RecoilState<T>) => void;
```

- `key` - 내부적으로 atom을 식별하는데 사용되는 고유한 문자열. 이 문자열은 어플리케이션 전체에서 다른 atom과 selector에 대해 고유해야 한다. 지속성을 위하여 사용된다면 실행 전반에 걸쳐 안정적일 필요가 있다.
- `get` - 파생된 상태의 값을 평가하는 함수. 값을 직접 반환하거나 비동기적인 `Promise`나 또는 같은 유형을 나타내는 다른 atom이나 selector를 반환할 수 있다. 첫 번째 매개변수로 다음 속성을 포함하는 객체를 전달한다:
  - `get` - 다른 atom이나 selector로부터 값을 찾는데 사용되는 함수. 이 함수에 전달된 모든 atom과 selector는 암시적으로 selector에 대한 **의존성** 목록에 추가된다. Selector의 의존성이 변경되면 Selector가 다시 평가된다.
- `set?` - 이 속성이 설정되면 selector는 **읽기 가능한** 상태를 반환한다. 첫번째 매개변수로 콜백 객체와 새로 입력 값이 전달된다. 사용자가 selector를 재설정할 경우 새로 입력 값은 `T` 타입의 값 또는 `DefaultValue` 타입의 객체일 수 있다. 콜백에는 다음이 포함된다.:
  - `get` - 다른 atom이나 selector로부터 값을 찾는데 사용되는 함수. 이 함수는 selector를 주어진 atom이나 selector를 구독하지 않는다.
  - `set` - 업스트림 Recoil 상태의 값을 설정할 때 사용되는 함수. 첫 번째 매개변수는 Recoil 상태, 두 번째 매개변수는 새로운 값이다. 새로운 값은 업데이트 함수나 재설정 액션을 전파하는 `DefalutValue` 객체일 수 있다.
- `dangerouslyAllowMutability` - Selector는 파생된 상태의 "순수 함수"를 나타내며 항상 동일한 의존성 입력 값 집합에 대하여 동일한 값을 반환해야 한다. 이를 보호하기 위해 selector에 저장된 모든 값은 기본적으로 고정되어 있다. 경우에 따라 이 옵션을 사용하여 재정의해야 할 수 있다.

---

단순한 정적인 의존성이 있는 Selector:

```jsx
const mySelector = selector({
  key: 'MySelector',
  get: ({get}) => get(myAtom) * 100,
});
```

### 동적 의존성

읽기만 가능한 selector는 의존성을 기준으로 selector의 값을 평가하는 `get` 메서드를 갖는다. 의존성 중 어떠한 것이 업데이트 되면 selector는 다시 평가된다. Selector를 평가할 때 실제로 사용하는 atom이나 selector를 기반으로 의존성이 동적으로 결정된다. 이전 의존성의 값에 따라 다른 추가적인 의존성을 동적으로 사용할 수 있다. Recoil은 Selector가 현재 업데이트되어진 의존성 집합만 구독하도록 현재 데이터 흐름 그래프를 자동적으로 업데이트한다.

아래 예시에서 `mySelector`는 `toggleState` atom뿐만 아니라 `toggleState`에 의존하는 `selectorA` 또는 `selectorB` selector도 의존한다.

```jsx
const toggleState = atom({key: 'Toggle', default: false});

const mySelector = selector({
  key: 'MySelector',
  get: ({get}) => {
    const toggle = get(toggleState);
    if (toggle) {
      return get(selectorA);
    } else {
      return get(selectorB);
    }
  },
});
```

### 쓰기 가능한 Selector

양방향 selector는 입력 값을 매개변수로 받고 데이터 흐름 그래프를 따라 업스트림에서 변경사항을 전파하는 데 사용할 수 있다. 사용자가 selector를 새 값으로 설정하거나 selector를 재설정할 수 있기 때문에 입력 값은 selector가 나타내는 타입과 동일하거나 재설정 작업을 나타내는 `DefaultValue` 객체 중 하나이다.

이 간단한 selector는 기본적으로 atom을 감싸서 필드를 추가한다. 이것은 단지 설정과 재설정 작업을 업스트림 atom까지 통과한다.

```jsx
const proxySelector = selector({
  key: 'ProxySelector',
  get: ({get}) => ({...get(myAtom), extraField: 'hi'}),
  set: ({set}, newValue) => set(myAtom, newValue),
});
```

이 selector는 데이터를 변환하므로 입력 값이 `DefaultValue`인지 확인해야 한다.

```jsx
const transformSelector = selector({
  key: 'TransformSelector',
  get: ({get}) => get(myAtom) * 100,
  set: ({set}, newValue) =>
    set(myAtom, newValue instanceof DefaultValue ? newValue : newValue / 100),
});
```

### 비동기 Selector

Selector는 또한 비동기 평가 함수를 가지고 있으며 `Promise`를 출력값으로 반환할 수 있다. 자세한 정보는 이 [가이드](/docs/guides/asynchronous-data-queries)를 보면 된다.

```jsx
const myQuery = selector({
  key: 'MyQuery',
  get: async ({get}) => {
    return await myAsyncQuery(get(queryParamState));
  },
});
```

### 예시 (동기)

```jsx
import {atom, selector, useRecoilState, DefaultValue} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelcius = selector({
  key: 'tempCelcius',
  get: ({get}) => ((get(tempFahrenheit) - 32) * 5) / 9,
  set: ({set}, newValue) =>
    set(
      tempFahrenheit,
      newValue instanceof DefaultValue ? newValue : (newValue * 9) / 5 + 32,
    ),
});

function TempCelcius() {
  const [tempF, setTempF] = useRecoilState(tempFahrenheit);
  const [tempC, setTempC] = useRecoilState(tempCelcius);
  const resetTemp = useResetRecoilState(tempCelcius);

  const addTenCelcius = () => setTempC(tempC + 10);
  const addTenFahrenheit = () => setTempF(tempF + 10);
  const reset = () => resetTemp();

  return (
    <div>
      Temp (Celcius): {tempC}
      <br />
      Temp (Fahrenheit): {tempF}
      <br />
      <button onClick={addTenCelcius}>Add 10 Celcius</button>
      <br />
      <button onClick={addTenFahrenheit}>Add 10 Fahrenheit</button>
      <br />
      <button onClick={reset}>>Reset</button>
    </div>
  );
}
```

### 예시 (비동기)

```jsx
import {selector, useRecoilValue} from 'recoil';

const myQuery = selector({
  key: 'MyDBQuery',
  get: async () => {
    const response = await fetch(getMyRequestUrl());
    return response.json();
  },
});

function QueryResults() {
  const queryResults = useRecoilValue(myQuery);

  return <div>{queryResults.foo}</div>;
}

function ResultsSection() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <QueryResults />
    </React.Suspense>
  );
}
```

더 복잡한 예시는 이 [가이드](/docs/guides/asynchronous-data-queries)를 보면 된다.
