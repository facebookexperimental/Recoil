---
title: atomFamily(options)
sidebar_label: atomFamily()
---

작성 가능한 `RecoilState` [atom](/docs/api-reference/core/atom)를 반환하는 함수를 반환합니다.

---

```jsx
function atomFamily<T, Parameter>({
  key: string,

  default:
    | RecoilValue<T>
    | Promise<T>
    | T
    | (Parameter => T | RecoilValue<T> | Promise<T>),

  effects_UNSTABLE?:
    | $ReadOnlyArray<AtomEffect<T>>
    | (P => $ReadOnlyArray<AtomEffect<T>>),

  dangerouslyAllowMutability?: boolean,
}): Parameter => RecoilState<T>
```

- `key` - 내부적으로 atom을 식별하는데 사용되는 고유한 문자열. 이 문자열은 어플리케이션 전체에서 다른 atom과 selector에 대해 고유해야 한다.
- `default` - atom의 초기값. 직접 값을 입력하거나, 기본 값을 나타내는 `RecoilValue`, `Promise`, 또는 기본값을 가져오는 함수일 수 있습니다. 콜백 함수는 `atomFamily`함수가 호출될 떄 사용되는 매개변수의 복사값을 전달 받습니다.
- `effects_UNSTABLE` - [Atom Effects](/docs/guides/atom-effects)의 family 매개변수를 기반으로 배열을 가져오는 선택적 배열 또는 콜백입니다.
- `dangerouslyAllowMutability` - Recoil은 atom 상태 변경에 따라 리렌더링에 atom을 이용하는 컴포넌트에 언제 알릴지를 알 수 있습니다. 만약 atom의 값이 변경된 경우, 원자의 값은 구독하고 있는 컴포넌트에게 제대로 알리지 않고 우회하여 상태가 변경될 수 있습니다. 이 문제를 방지하기 위해 모든 저장된 값은 동결됩니다. 경우에 따라 이 옵션을 사용해 재정의하는 것이 바람직할 수 있습니다.


---

`atom`은 _Recoil_ 의 상태를 나타냅니다. 앱에서 `<RecoilRoot>`별로 atom을 만들고 등록합니다. 하지만 상태가 전역이 아니라면 어떨까요? 상태가 control의 인스턴스 또는 특정 요소와 연관된 경우 어떻게 될까요? 예를 들어, 사용자가 요소를 동적으로 추가하고 각 요소가 위치를 갖는 UI 프로토타이핑 도구를 만들 수 있습니다. 이상적으로, 각각의 요소들은 각각의 상태 `atom`을 가질 것 입니다. 당신은 메모이제이션 패턴으로 이를 구현할 수 있습니다. 그러나 _Recoil_ 은 이 패턴을 `atomFamly` 유틸리티로 제공합니다. Atom Family는 atom 모음을 의미합니다. `atomFamily`를 호출하면 전달한 매개변수에 따라 `RecoilState`를 제공하는 함수를 반환합니다.

`atomFamily`는 기본적으로 매개변수에서 `atom`으로의 맵을 제공합니다. `atomFamily`에 단일 키만을 제공하면, 각 기본 atom에 대해 고유한 키가 생성됩니다. 이 atom 키는 지속성을 사용될 수 있으므로 어플리케이션 실행 전반에 걸쳐 안정적이여야 합니다. 매개 변수는 다른 호출 지점에서도 생성될 수 있으며 동일한 매개변수가 동일한 기본 atom을 갖기를 원합니다. 그래서, `atomFamily`에서는 참조 동등성 대신 값 동등성을 사용합니다. 이는 매개 변수에 사용할 수 있는 타입을 제한하게 됩니다.  `atomFamily`는 원시 타입, 배열, 또는 배열, 원시 타입을 갖는 객체를 허용합니다. 

## Example

```jsx
const elementPositionStateFamily = atomFamily({
  key: 'ElementPosition',
  default: [0, 0],
});

function ElementListItem({elementID}) {
  const position = useRecoilValue(elementPositionStateFamily(elementID));
  return (
    <div>
      Element: {elementID}
      Position: {position}
    </div>
  );
}
```

`atomFamily()`는 간단한 [`atom()`](/docs/api-reference/core/atom)으로써 거의 동일한 옵션을 사용합니다. 그러나 기본값을 매개변수화 할 수도 있습니다. 즉, 매개 변수값을 받아 실제 기본값을 반환하는 함수를 제공할 수 있습니다. 예제를 살펴보겠습니다.

```jsx
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: param => defaultBasedOnParam(param),
});
```

또는, `selector` 대신 [`selectorFamily`](/docs/api-reference/utils/selectorFamily)를 사용하면 `default` selector에서도 매개 변수 값에 접근할 수 있습니다.  

```jsx
const myAtomFamily = atomFamily({
  key: ‘MyAtom’,
  default: selectorFamily({
    key: 'MyAtom/Default',
    get: param => ({get}) => {
      return computeDefaultUsingParam(param);
    },
  }),
});
```

## 구독

모든 요소에 대한 상태 맵이 있는 단일 atom을 저장하는 것보다 각 요소에 대해 분리된 atom을 갖는 이 패턴을 사용하면 모두 자체 개별 구독을 유지한다는 장점을 얻을 수 있습니다. 따라서, 한 요소의 값을 업데이트하면 해당 atom를 구독하는 React 컴포넌트만 업데이트 됩니다.

## 지속성(Persistence)

지속성 옵저버는 사용 된 매개변수 값의 직렬화에 따라 고유한 키를 사용해 각 매개 변수의 상태를 고유한 atom으로 유지합니다. 따라서, 원시 혹은 원시 타입을 포함하는 단순한 복합 객체 매개 변수만을 사용하는 것이 중요합니다. 커스텀 클래스 또는 함수는 허용되지 않습니다.

동일한 키를 기반으로 한 최신버전의 앱에서 간단한 `atom`을 `atomFamily`로 "업그레이드" 할 수 있습니다. 이렇게 하면, 이전 키로 지속된 값을 읽을 수 있으며 새 `atomFamily`의 모든 매개 변수 값은 기본적으로 단순 atom의 지속된 상태로 설정됩니다. 그러나, `atomFamily`에서 매개 변수의 형식을 변경하면 변경 전의 값을 자동으로 읽을 수 없습니다. 하지만, selector 혹은 validator에 로직을 추가해 이전 매개변수 형식을 기반으로 조회할 수 있습니다. 향후 이 패턴을 자동화 할 수 있기를 바랍니다.