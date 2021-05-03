---
title: 주요 개념
---

## 개요

Recoil을 사용하면 _atoms_ (공유 상태)에서 _selectors_ (순수 함수)를 거쳐 React 컴포넌트로 내려가는 데이터 흐름 그래프를 생성할 수 있다. Atoms는 컴포넌트가 구독할 수 있는 상태의 단위다. Selectors 는 이 atoms state를 동기 또는 비동기식으로 변환한다.

## Atoms

Atoms는 상태의 단위다. 그것들은 업데이트와 구독이 가능하다. atom이 업데이트되면 각각의 구독된 컴포넌트는 새로운 값을 반영하여 다시 렌더링 된다. atoms는 런타임에서 생성될 수도 있다. Atoms는 React의 로컬 컴포넌트의 상태 대신 사용할 수 있다. 동일한 atom이 여러 컴포넌트에서 사용되는 경우 모든 컴포넌트는 상태를 공유한다.

Atoms는 `atom`함수를 사용해 생성한다.

```javascript
const fontSizeState = atom({
  key: 'fontSizeState',
  default: 14,
});
```

Atoms는 디버깅, 지속성 및 모든 atoms의 map을 볼 수 있는 특정 고급 API에 사용되는 고유한 키가 필요하다. 두개의 atom이 같은 키를 갖는 것은 오류이기 때문에 키값은 전역적으로 고유하도록 해야한다.
React 컴포넌트의 상태처럼 기본값도 가진다.

컴포넌트에서 atom을 읽고 쓰려면 `useRecoilState`라는 훅을 사용한다. React의 `useState`와 비슷하지만 상태가 컴포넌트 간에 공유될 수 있다는 차이가 있다.

```jsx
function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return (
    <button onClick={() => setFontSize((size) => size + 1)} style={{fontSize}}>
      Click to Enlarge
    </button>
  );
}
```

버튼을 클릭하면 버튼의 글꼴 크기가 1만큼 증가하며, fontSizeState atom을 사용하는 다른 컴포넌트의 글꼴 크기도 같이 변화한다.

```jsx
function Text() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  return <p style={{fontSize}}>This text will increase in size too.</p>;
}
```

## Selectors

**Selector**는 atoms나 다른 selectors를 입력으로 받아들이는 순수 함수(pure function)다. 상위의 atoms 또는 selectors가 업데이트되면 하위의 selector 함수도 다시 실행된다. 컴포넌트들은 selectors를 atoms처럼 구독할 수 있으며 selectors가 변경되면 컴포넌트들도 다시 렌더링된다.

Selectors는 상태를 기반으로 하는 파생 데이터를 계산하는 데 사용된다. 최소한의 상태 집합만 atoms에 저장하고 다른 모든 파생되는 데이터는 selectors에 명시한 함수를 통해 효율적으로 계산함으로써 쓸모없는 상태의 보존을 방지한다.

Selectors는 어떤 컴포넌트가 필요한지, 어떤 상태에 의존하는지 추적하기 때문에 이러한 함수적인 접근방식을 매우 효율적으로 만든다.

컴포넌트의 관점에서 보면 selectors와 atoms는 동일한 인터페이스를 가지므로 서로 대체할 수 있다.

Selectors는 `selector`함수를 사용해 정의한다.

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

`get` 속성은 계산될 함수다. 전달되는 `get` 인자를 통해 atoms와 다른 selectors에 접근할 수 있다. 다른 atoms나 selectors에 접근하면 자동으로 종속 관계가 생성되므로, 참조했던 다른 atoms나 selectors가 업데이트되면 이 함수도 다시 수행된다.

이 `fontSizeLabelState` 예시에서 selector는 `fontSizeState` atom에 대한 하나의 의존성을 갖는다. 개념적으로 `fontSizeLabelState` selector는 `fontSizeState`를 입력으로 사용하고 형식화된 글꼴 크기 레이블을 출력으로 반환하는 순수 함수처럼 동작한다.

Selectors는 `useRecoilValue()`를 사용해 읽을 수 있다. `useRecoilValue()`는 하나의 atom이나 selector를 인자로 받아 대응하는 값을 반환한다. `fontSizeLabelState` selector는 writable하지 않기 때문에 `useRecoilState()`를 이용하지 않는다. (writable한 selectors의 더 많은 정보를 보려면 [selector API reference](/docs/api-reference/core/selector)를 봐라.)

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
