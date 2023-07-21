---
title: selectorFamily(options)
sidebar_label: selectorFamily()
---

읽기 전용 `RecoilValueReadOnly` 또는 수정 가능한 `RecoilState` selector를 반환하는 함수를 반환합니다.

`selectorFamily`는 [`selector`](/docs/api-reference/core/selector)와 유사한 강력한 패턴입니다. 다만, `get`, `set`, `selector`의 콜백을 매개변수로 전달할 수 있다는 점이 다릅니다. `selectorFamily()` 유틸리티는 사용자 정의 매개변수로 호출 할 수 있는 함수를 반환하고 selector를 반환합니다. 각 고유 매개 변수값은 메모이징된 동일한 selector 인스턴스를 반환합니다.

---

```jsx
function selectorFamily<T, Parameter>({
  key: string,

  get: Parameter => ({get: GetRecoilValue}) => Promise<T> | RecoilValue<T> | T,

  dangerouslyAllowMutability?: boolean,
}): Parameter => RecoilValueReadOnly<T>
```

```jsx
function selectorFamily<T, Parameter>({
  key: string,

  get: Parameter => ({get: GetRecoilValue}) => Promise<T> | RecoilValue<T> | T,

  set: Parameter => (
    {
      get: GetRecoilValue,
      set: SetRecoilValue,
      reset: ResetRecoilValue,
    },
    newValue: T | DefaultValue,
  ) => void,

  dangerouslyAllowMutability?: boolean,
}): Parameter => RecoilState<T>
```

Where

```jsx
type ValueOrUpdater<T> =  T | DefaultValue | ((prevValue: T) => T | DefaultValue);
type GetRecoilValue = <T>(RecoilValue<T>) => T;
type SetRecoilValue = <T>(RecoilState<T>, ValueOrUpdater<T>) => void;
type ResetRecoilValue = <T>(RecoilState<T>) => void;
```

- `key` - 내부적으로 atom을 식별하는데 사용되는 고유한 문자열. 이 문자열은 어플리케이션 전체에서 다른 atom과 selector에 대해 고유해야 한다.
- `get` - selector의 값을 반환하는 명명된 콜백들의 객체를 전달하는 함수입니다.`selector()` 인터페이스와 동일합니다. get은 selector family 함수 호출에서 매개변수를 전달하는 함수에 의해 래핑됩니다.
- `set?` - 제공 될 때 쓰기 가능한 selector를 생성하는 선택적 함수입니다. `selector()` 인터페이스와 동일하게, 명명된 콜백의 객체를 취하는 함수여야 합니다. set은 selector family 함수 호출에서 매개변수를 가져오는 다른 함수에 의해 다시 래핑됩니다.

---

`selectorFamily`는 기본적으로 매개변수에서 selector로의 맵을 제공합니다. family를 사용하는 함수 호출 위치에서 매개 변수가 생성되는 경우가 많고, 동일한 파라미터를 동일한 selector에서 다시 사용하기를 원하기 때문에 참조 동등성 대신 값 동등성을 사용합니다.(이 동작을 조절하기 위한 불안정한 `cacheImplementationForParams` API가 존재합니다.) 이는 매개 변수에 사용할 수 있는 타입을 제한하게 됩니다. 원시 타입 혹은 직렬화 가능한 타입을 사용해주세요. Recoil은 커스텀 직렬 도구를 사용합니다. 이 직렬 도구는 객체와 배열, 일부 컨테이너(ES6의 Set과 Map)는 객체 키 순서에 불변하며, Symbols, Iterables를 지원합니다. 또한, 커스텀 직렬화를 위해 `toJSON`속성을 사용합니다. (불변 컨테이너와 같은 라이브러리와 함께 제공됩니다.) 매개 변수에서 Promise와 같은 함수나 변경 가능한 객체를 사용하는 것은 문제가 됩니다.

## Example

```jsx
const myNumberState = atom({
  key: 'MyNumber',
  default: 2,
});

const myMultipliedState = selectorFamily({
  key: 'MyMultipliedNumber',
  get: (multiplier) => ({get}) => {
    return get(myNumberState) * multiplier;
  },

  // optional set
  set: (multiplier) => ({set}, newValue) => {
    set(myNumberState, newValue / multiplier);
  },
});

function MyComponent() {
  // defaults to 2
  const number = useRecoilValue(myNumberState);

  // defaults to 200
  const multipliedNumber = useRecoilValue(myMultipliedState(100));

  return <div>...</div>;
}
```

## 비동기 쿼리 Example

Selector Family는 쿼리에 매개변수를 전달하는데에도 유용합니다. 지금 같이 쿼리를 추상화하는데 selector를 사용하는 것은 종속성 값들과 주어진 입력에 대해 항상 같은 결과를 반환하는 "순수" 함수여야 합니다. 더 많은 예시가 궁금하다면 [이 가이드](/docs/guides/asynchronous-data-queries)를 살펴보세요.

```jsx
const myDataQuery = selectorFamily({
  key: 'MyDataQuery',
  get: (queryParameters) => async ({get}) => {
    const response = await asyncDataRequest(queryParameters);
    if (response.error) {
      throw response.error;
    }
    return response.data;
  },
});

function MyComponent() {
  const data = useRecoilValue(myDataQuery({userID: 132}));
  return <div>...</div>;
}
```

## 디스트럭처링 Example

```jsx
const formState = atom({
  key: 'formState',
  default: {
    field1: "1",
    field2: "2",
    field3: "3",
  },
});

const formFieldState = selectorFamily({
  key: 'FormField',
  get: field => ({get}) => get(formState)[field],
  set: field => ({set}, newValue) =>
    set(formState, prevState => {...prevState, [field]: newValue}),
});

const Component1 = () => {
  const [value, onChange] = useRecoilState(formFieldState('field1'));
  return (
    <>
      <input value={value} onChange={onChange} />
      <Component2 />
    </>
  );
}

const Component2 = () => {
  const [value, onChange] = useRecoilState(formFieldState('field2'));
  return (
    <input value={value} onChange={onChange} />
  );
}
```
