/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
/* eslint-disable fb-www/react-no-useless-fragment */
'use strict';

import type {RecoilState} from '../../core/Recoil_RecoilValue';

const {
  getRecoilTestFn,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');
let {mutableSourceExists} = require('recoil-shared/util/Recoil_mutableSource');

let React,
  useEffect,
  useState,
  Profiler,
  act,
  Queue,
  batchUpdates,
  atom,
  errorSelector,
  selector,
  ReadsAtom,
  Selector,
  errorThrowingSelector,
  flushPromisesAndTimers,
  renderElements,
  renderElementsWithSuspenseCount,
  recoilComponentGetRecoilValueCount_FOR_TESTING,
  useRecoilState,
  useRecoilStateLoadable,
  useRecoilValue,
  useRecoilValueLoadable,
  useSetRecoilState,
  useRecoilAction,
  useSetUnvalidatedAtomValues,
  useTransactionObservation_DEPRECATED,
  invariant;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({useEffect, useState, Profiler} = require('react'));
  ({act} = require('ReactTestUtils'));

  Queue = require('../../adt/Recoil_Queue');
  ({batchUpdates} = require('../../core/Recoil_Batching'));
  atom = require('../../recoil_values/Recoil_atom');
  errorSelector = require('../../recoil_values/Recoil_errorSelector');
  selector = require('../../recoil_values/Recoil_selector');
  ({
    ReadsAtom,
    Selector,
    errorThrowingSelector,
    flushPromisesAndTimers,
    renderElements,
    renderElementsWithSuspenseCount,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  ({mutableSourceExists} = require('recoil-shared/util/Recoil_mutableSource'));
  ({
    recoilComponentGetRecoilValueCount_FOR_TESTING,
    useRecoilState,
    useRecoilStateLoadable,
    useRecoilValue,
    useRecoilValueLoadable,
    useSetRecoilState,
    useRecoilAction,
    useSetUnvalidatedAtomValues,
  } = require('../Recoil_Hooks'));
  ({useTransactionObservation_DEPRECATED} = require('../Recoil_SnapshotHooks'));

  invariant = require('recoil-shared/util/Recoil_invariant');
});

let nextID = 0;

function store() {
  return atom(
    {
      key: 'counterAtom',
      default: 0,
    },
    {
      setCounter: counter => {
        return counter;
      },
      increaseCounter: state => {
        return state + 1;
      },
      decreaseCounter: state => {
        return state - 1;
      },
      add: function (state, value) {
        return state + value;
      },
      addThree: (state, value, s_value) => {
        return state + value + s_value;
      },
    },
  );
}

function anotherStore() {
  return atom(
    {
      key: 'anotherCounterAtom',
      default: 20,
    },
    {
      setCounter: value => {
        return value;
      },
      multiplyCounter: state => {
        return state * 2;
      },
    },
  );
}

function componentThatReadsAndWritesAtom<T>(
  recoilState: RecoilState<T>,
): [React.AbstractComponent<{...}>, ((T => T) | T) => void] {
  let addThree;
  let increaseCounter;
  let setCounter;
  let add;
  const Component = jest.fn(() => {
    const value = useRecoilValue(recoilState);

    setCounter = useRecoilAction(recoilState, 'setCounter');
    addThree = useRecoilAction(recoilState, 'addThree');
    increaseCounter = useRecoilAction(recoilState, 'increaseCounter');
    add = useRecoilAction(recoilState, 'add');
    return value;
  });

  return [
    (Component: any),
    (...arg) => setCounter(...arg),
    (...arg) => increaseCounter(...arg),
    (...arg) => addThree(...arg),
    (...arg) => add(...arg),
  ];
}

function componentThatUsesWrongAction<T>(
  recoilState: RecoilState<T>,
): [React.AbstractComponent<{...}>, ((T => T) | T) => void] {
  let setCounter;
  const Component = jest.fn(() => {
    setCounter = useRecoilAction(recoilState, 'setCounters');
    return null;
  });

  return [(Component: any), (...arg) => setCounter(...arg)];
}

function componentThatWritesAtom<T>(
  recoilState: RecoilState<T>,
  anotherRecoilState: RecoilState<T>,
): [any, ((T => T) | T) => void] {
  let setCounter;
  let setCounterForAnotherAtom;
  let increaseCounter;
  let multiplyCounter;
  const Component = jest.fn(() => {
    setCounter = useRecoilAction(recoilState, 'setCounter');
    increaseCounter = useRecoilAction(recoilState, 'increaseCounter');
    multiplyCounter = useRecoilAction(anotherRecoilState, 'multiplyCounter');
    setCounterForAnotherAtom = useRecoilAction(
      anotherRecoilState,
      'setCounter',
    );
    return null;
  });

  return [
    (Component: any),
    (...arg) => setCounter(...arg),
    (...arg) => increaseCounter(...arg),
    (...arg) => multiplyCounter(...arg),
    (...arg) => setCounterForAnotherAtom(...arg),
  ];
}

function componentThatReadsTwoAtoms(one, two) {
  return (jest.fn(function ReadTwoAtoms() {
    return `${useRecoilValue(one)},${useRecoilValue(two)} `;
  }): any); // flowlint-line unclear-type:off
}

function anotherComponentThatReadsTwoAtoms(one, two) {
  return (jest.fn(function ReadTwoAtoms() {
    return `${useRecoilValue(one)},${useRecoilValue(two)} `;
  }): any); // flowlint-line unclear-type:off
}

function componentThatUsesSelectors<T>(
  recoilState: RecoilState<T>,
  anotherRecoilState: RecoilState<T>,
): [React.AbstractComponent<{...}>, ((T => T) | T) => void] {
  let addThree;
  let increaseCounter;
  let setCounter;
  let add;
  const Component = jest.fn(() => {
    const combinedAtom = selector({
      key: 'combinedAtom',
      get: ({get}) => {
        const one = get(recoilState);
        const two = get(anotherRecoilState);
        return one.toString() + ' ' + two.toString();
      },
    });

    const combinedAtomValue = useRecoilValue(combinedAtom);

    setCounter = useRecoilAction(recoilState, 'setCounter');
    addThree = useRecoilAction(recoilState, 'addThree');
    increaseCounter = useRecoilAction(recoilState, 'increaseCounter');
    add = useRecoilAction(recoilState, 'add');
    return combinedAtomValue;
  });

  return [
    (Component: any),
    (...arg) => setCounter(...arg),
    (...arg) => increaseCounter(...arg),
    (...arg) => addThree(...arg),
    (...arg) => add(...arg),
  ];
}

function componentThatUsesSelectorsToReturnMultipleValues<T>(
  recoilState: RecoilState<T>,
  anotherRecoilState: RecoilState<T>,
): [React.AbstractComponent<{...}>, ((T => T) | T) => void] {
  let addThree;
  let increaseCounter;
  let setCounter;
  let setCounterForAnotherAtom;
  let add;
  let multiplyCounter;
  const Component = jest.fn(() => {
    const combinedAtom = selector({
      key: 'combinedAtom',
      get: ({get}) => {
        const one = get(recoilState);
        const two = get(anotherRecoilState);
        return one.toString() + ' ' + two.toString();
      },
    });

    const combinedAtomValue = useRecoilValue(combinedAtom);

    setCounter = useRecoilAction(recoilState, 'setCounter');
    setCounterForAnotherAtom = useRecoilAction(
      anotherRecoilState,
      'setCounter',
    );
    multiplyCounter = useRecoilAction(anotherRecoilState, 'multiplyCounter');
    addThree = useRecoilAction(recoilState, 'addThree');
    increaseCounter = useRecoilAction(recoilState, 'increaseCounter');
    add = useRecoilAction(recoilState, 'add');
    return combinedAtomValue;
  });

  return [
    (Component: any),
    (...arg) => setCounter(...arg),
    (...arg) => increaseCounter(...arg),
    (...arg) => addThree(...arg),
    (...arg) => multiplyCounter(...arg),
    (...arg) => setCounterForAnotherAtom(...arg),
    (...arg) => add(...arg),
  ];
}

testRecoil(
  'Component that depends on multiple atoms read values correctly',
  () => {
    const anAtom = store();
    const anotherAtom = anotherStore();
    const ReadComp = componentThatReadsTwoAtoms(anAtom, anotherAtom);
    const [
      WriteComp,
      setCounter,
      increaseCounter,
      multiplyCounter,
      setCounterForAnotherAtom,
    ] = componentThatWritesAtom(anAtom, anotherAtom);
    const container = renderElements(
      <>
        <WriteComp />
        <ReadComp />
      </>,
    );
    expect(container.textContent).toEqual('0,20 ');
    act(() => setCounter(291));
    act(() => setCounter(151));
    act(() => setCounter(152));
    act(() => setCounterForAnotherAtom(101));
    act(() => multiplyCounter());
    act(() => increaseCounter());
    act(() => setCounter(150));
    expect(container.textContent).toEqual('150,202 ');
  },
);

testRecoil(
  'Component that depends on atom is rendered once on same values of action',
  ({strictMode}) => {
    const sm = strictMode ? 2 : 1;
    const anAtom = store();
    const anotherAtom = anotherStore();
    const [WriteComp, setCounter] = componentThatWritesAtom(
      anAtom,
      anotherAtom,
    );
    const ReadComp = componentThatReadsTwoAtoms(anAtom, anotherAtom);
    renderElements(
      <>
        <WriteComp />
        <ReadComp />
      </>,
    );

    expect(ReadComp).toHaveBeenCalledTimes(1 * sm);
    act(() => setCounter(150)); // render two
    act(() => setCounter(150)); // render two
    act(() => setCounter(150)); // render two
    act(() => setCounter(150)); // render two
    act(() => setCounter(150)); // render two
    expect(ReadComp).toHaveBeenCalledTimes(2 * sm);
  },
);
//
testRecoil(
  'Component that depends on different atoms is rendered after any actions',
  ({strictMode}) => {
    const sm = strictMode ? 2 : 1;
    const anAtom = store();
    const anotherAtom = anotherStore();
    const [WriteComp, setCounter, increaseCounter, multiplyCounter] =
      componentThatWritesAtom(anAtom, anotherAtom);
    const ReadComp = componentThatReadsTwoAtoms(anAtom, anotherAtom);
    renderElements(
      <>
        <WriteComp />
        <ReadComp />
      </>,
    );

    expect(ReadComp).toHaveBeenCalledTimes(1 * sm);
    act(() => setCounter(100)); // render one
    act(() => setCounter(150)); // render two
    act(() => multiplyCounter()); // render three
    act(() => increaseCounter()); // render four
    expect(ReadComp).toHaveBeenCalledTimes(5 * sm);
  },
);

//
testRecoil('Write-only components are not subscribed', ({strictMode}) => {
  const sm = strictMode ? 2 : 1;
  const anAtom = store();
  const anotherAtom = anotherStore();
  const [
    Component,
    setCounter,
    increaseCounter,
    multiplyCounter,
    setCounterForAnotherAtom,
  ] = componentThatWritesAtom(anAtom, anotherAtom);
  renderElements(
    <>
      <Component />
    </>,
  );
  expect(Component).toHaveBeenCalledTimes(1 * sm);
  act(() => setCounter(100));
  act(() => setCounter(100));
  act(() => setCounterForAnotherAtom(100));
  act(() => setCounter(100));
  act(() => multiplyCounter());
  expect(Component).toHaveBeenCalledTimes(1 * sm);
});

testRecoil('Component throws error when passing invalid action', () => {
  // Passing setCounters instead of setCounter
  const anAtom = store();
  const [Component] = componentThatUsesWrongAction(anAtom);
  const container = renderElements(<Component />);
  expect(container.textContent).toEqual('error');
});

testRecoil('Components are re-rendered when atoms change', () => {
  const anAtom = store();
  const anotherAtom = anotherStore();
  const [Component, setCounter, increaseCounter, addThree, add] =
    componentThatReadsAndWritesAtom(anAtom, anotherAtom);
  const container = renderElements(<Component />);
  expect(container.textContent).toEqual('0');

  act(() => setCounter(100));
  act(() => add(20));
  act(() => addThree(5, 10));
  act(() => increaseCounter());

  expect(container.textContent).toEqual('136');
});

testRecoil(
  'Proof of actions will change just one value of atom in selectors',
  () => {
    const anAtom = store();
    const anotherAtom = anotherStore();
    const [Component, setCounter, increaseCounter, addThree, add] =
      componentThatUsesSelectors(anAtom, anotherAtom);
    const container = renderElements(<Component />);

    expect(container.textContent).toEqual('0 20');

    act(() => setCounter(100));
    act(() => add(20));
    act(() => addThree(5, 10));
    act(() => increaseCounter());

    expect(container.textContent).toEqual('136 20');
  },
);

testRecoil(
  'Proof of actions will change both values of different atoms in a selector',
  () => {
    const anAtom = store();
    const anotherAtom = anotherStore();
    const [
      Component,
      setCounter,
      increaseCounter,
      addThree,
      multiplyCounter,
      setCounterForAnotherAtom,
      add,
    ] = componentThatUsesSelectorsToReturnMultipleValues(anAtom, anotherAtom);
    const container = renderElements(<Component />);

    expect(container.textContent).toEqual('0 20');

    act(() => setCounter(100));
    act(() => add(50));
    act(() => addThree(40, 10));
    act(() => setCounterForAnotherAtom(100));
    act(() => multiplyCounter());
    act(() => increaseCounter());

    expect(container.textContent).toEqual('201 200');
  },
);

testRecoil(
  'Two components will return correct value after action triggered',
  () => {
    const anAtom = store();
    const anotherAtom = anotherStore();
    const [
      Component,
      setCounter,
      increaseCounter,
      multiplyCounter,
      setCounterForAnotherAtom,
    ] = componentThatWritesAtom(anAtom, anotherAtom);
    const Reader = componentThatReadsTwoAtoms(anAtom, anotherAtom);
    const AnotherReader = anotherComponentThatReadsTwoAtoms(
      anAtom,
      anotherAtom,
    );
    const container = renderElements(
      <>
        <Component />
        <Reader />
        <AnotherReader />
      </>,
    );

    expect(container.textContent).toEqual('0,20 0,20 ');

    act(() => setCounter(100));
    act(() => setCounterForAnotherAtom(250));
    act(() => multiplyCounter());
    act(() => increaseCounter());

    expect(container.textContent).toEqual('101,500 101,500 ');
  },
);

testRecoil(
  'Two components will render after action triggered',
  async ({gks, strictMode}) => {
    const sm = strictMode ? 2 : 1;

    const anAtom = store();
    const anotherAtom = anotherStore();
    const [
      Component,
      setCounter,
      increaseCounter,
      multiplyCounter,
      setCounterForAnotherAtom,
    ] = componentThatWritesAtom(anAtom, anotherAtom);
    const Reader = componentThatReadsTwoAtoms(anAtom, anotherAtom);
    const AnotherReader = anotherComponentThatReadsTwoAtoms(
      anAtom,
      anotherAtom,
    );
    renderElements(
      <>
        <Component />
        <Reader />
        <AnotherReader />
      </>,
    );

    expect(Reader).toHaveBeenCalledTimes(1 * sm);

    act(() => setCounter(100)); // render two
    act(() => setCounter(100)); // render two
    act(() => setCounter(100)); // render two
    act(() => setCounterForAnotherAtom(250)); // render three
    act(() => multiplyCounter()); // render four
    act(() => increaseCounter()); // // render five

    expect(Reader).toHaveBeenCalledTimes(5 * sm);
    // The result is same for AnotherReader component
  },
);
