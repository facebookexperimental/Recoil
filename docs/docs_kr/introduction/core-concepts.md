---
title: 핵심 개념
---

## 개요

Recoil을 사용하면 *atoms* (공유 상태)에서 *selectors* (순수 함수)를 거쳐 React 컴포넌트로 내려가는 데이터 흐름 그래프를 생성할 수 있다.
Atoms는 컴포넌트가 구독할 수 있는 상태의 단위다. Selectors 가 이 상태를 동기 또는 비동기식으로 변환한다.

## Atoms

Atoms는 상태의 단위다. 그것들은 업데이트와 구독이 가능하다. atom이 업데이트되면 각각의 구독된 컴포넌트는 새로운 값으로 다시 렌더링 된다. atoms는 런타임에서 생성될 수도 있다. Atoms는 React의 로컬 컴포넌트의 상태 대신 사용할 수 있다. 동일한 atom이 여러 컴포넌트에서 사용되는 경우 모든 컴포넌트는 상태를 공유한다.

Atoms는 `atom`함수를 사용해 생성한다.

```javascript
const fontSizeState = atom({
  key: 'fontSizeState',
  default: 14,
});
```

Atoms는 디버깅, 지속성, 그리고 모든 atom들의 맵을 볼 수 있는 특정 고급 API에 사용되는 고유한 키가 필요하다. 두 atom이 같은 키를 갖는 것은 오류이기 때문에 그것들이 전역적으로 고유하다는 것을 확실하게 해야 한다. React 컴포넌트의 상태처럼 기본값 또한 가지고 있는다.

컴포넌트에서 atom을 읽고 쓰려면 `useRecoilState`라는 흑을 사용한다. React의 `useState`와 같지만 이제는 다음과 같은 컴포넌트들 사이에서 상태를 공유할 수 있게 되었다.

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return (
    <button onClick={() => setFontSize(size => size + 1)} style={{fontSize}}>
      Click to Enlarge
    </button>
  );
}
```

버튼을 클릭하면 버튼의 글꼴 크기가 하나 증가한다. 그러나 이제 일부 다른 컴포넌트도 동일한 글꼴 크기를 사용할 수 있다.

```jsx
function Text() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return (
    <p style={{fontSize}}>
      This text will increase in size too.
    </p>
  );
}
```


## Selectors

**Selector**는 atom이나 다른 selector를 입력으로 받아들이는 순수한 함수다.
상위의 atom 또는 selector가 업데이트되면 selector 함수가 재평가된다. 
컴포넌트들은 selector를 atom처럼 구독할 수 있고 selector가 변경될 때 다시 렌더링이 이루어진다.

Selector는 상태를 기반으로 하는 파생 데이터를 계산하는 데 사용된다. 
이것은 중복 상태를 피할 수 있고 상태를 동기화하고 유효하게 유지하기 위한 reducers의 필요성을 없앤다. 
대신, 최소의 상태는 atom에 저장되도록 하고 다른 모든 것은 효율적으로 최소 상태의 함수로 계산된다.

Selector는 어떤 컴포넌트가 필요한지, 어떤 상태에 의존하는지 추적하기 때문에 이러한 함수적인 접근방식을 더욱 효율적으로 만든다.

컴포넌트의 관점에서 보면 selector와 atom는 동일한 인터페이스를 가지므로 서로 대체할 수 있다.

Selector는 `selector`함수를 사용해 정의한다.

```javascript
const fontSizeLabelState = selector({
  key: 'fontSizeLabelState',
  get: ({get}) => {
    const fontSize = get(fontSizeState);
    const unit = 'px';

    return `${fontSize}${unit}`;
  },
});
```

`get`속성은 계산될 함수다. `get`인자를 통해 atom의 값이나 다른 selector에 접근할 수 있다.
그것이 다른 atom이나 selector에 접근할 때마다 다른 atom이나 selector를 업데이트하면 이 atom이나 selector를 다시 계산할 수 있도록 종속 관계가 만들어진다.

이 `fontSizeLabelState` 예시에서 selector는 `fontSizeState` atom에서 하나의 의존성을 갖는다.
개념적으로 `fontSizeLabelState` selector는 `fontSizeState`를 입력으로 사용하고 형식화된 글꼴 크기 레이블을 출력으로 반환하는 순수 함수처럼 동작한다.

Selector는 `useRecoilValue()`를 사용해 읽을 수 있다. `useRecoilValue()`는 atom이나 selector를 인자로 받아 해당 값을 반환한다.
`fontSizeLabelState` selector는 쓸 수 없기 때문에 우리는 `useRecoilState()`를 이용하지 않는다. (읽기 가능한 selector의 더 많은 정보를 보려면 [selector API reference](/docs/api-reference/core/selector)를 보면된다.)

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  const fontSizeLabel = useRecoilValue(fontSizeLabelState);

  return (
    <>
      <div>Current font size: ${fontSizeLabel}</div>

      <button onClick={setFontSize(fontSize + 1)} style={{fontSize}}>
        Click to Enlarge
      </button>
    </>
  );
}
```

버튼를 클릭하면 버튼의 글꼴 크기가 증가하는 동시에 현재 글꼴 크기를 반영하도록 글꼴 크기 레이블을 업데이트하는 두 가지 작업이 수행된다.

