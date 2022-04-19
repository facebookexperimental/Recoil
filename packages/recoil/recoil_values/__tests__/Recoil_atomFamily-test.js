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
'use strict';

import type {Store} from '../../core/Recoil_State';
import type {StoreID as StoreIDType} from 'Recoil_Keys';

const {
  getRecoilTestFn,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

let store: Store,
  React,
  Profiler,
  useState,
  act,
  RecoilRoot,
  getRecoilValueAsLoadable,
  setRecoilValue,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
  useSetUnvalidatedAtomValues,
  useRecoilStoreID,
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers,
  renderElements,
  reactMode,
  stableStringify,
  atom,
  atomFamily,
  selectorFamily,
  RecoilLoadable,
  pAtom;

const testRecoil = getRecoilTestFn(() => {
  const {
    makeStore,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

  React = require('react');
  ({Profiler, useState} = require('react'));
  ({act} = require('ReactTestUtils'));

  ({RecoilRoot, useRecoilStoreID} = require('../../core/Recoil_RecoilRoot'));
  ({
    getRecoilValueAsLoadable,
    setRecoilValue,
  } = require('../../core/Recoil_RecoilValueInterface'));
  ({
    useRecoilState,
    useRecoilValue,
    useSetRecoilState,
    useSetUnvalidatedAtomValues,
  } = require('../../hooks/Recoil_Hooks'));
  ({
    ReadsAtom,
    componentThatReadsAndWritesAtom,
    flushPromisesAndTimers,
    renderElements,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  ({reactMode} = require('../../core/Recoil_ReactMode'));
  stableStringify = require('recoil-shared/util/Recoil_stableStringify');
  atom = require('../Recoil_atom');
  atomFamily = require('../Recoil_atomFamily');
  selectorFamily = require('../Recoil_selectorFamily');
  ({RecoilLoadable} = require('../../adt/Recoil_Loadable'));

  store = makeStore();

  pAtom = atomFamily({
    key: 'pAtom',
    default: 'fallback',
  });
});

let fbOnlyTest = test.skip;
// $FlowFixMe[prop-missing]
// $FlowFixMe[incompatible-type]
// @fb-only: fbOnlyTest = testRecoil;

let id = 0;

function get(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue).contents;
}

function getLoadable(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue);
}

function set(recoilValue, value) {
  setRecoilValue(store, recoilValue, value);
}

testRecoil('Read fallback by default', () => {
  expect(get(pAtom({k: 'x'}))).toBe('fallback');
});

testRecoil('Uses value for parameter', () => {
  set(pAtom({k: 'x'}), 'xValue');
  set(pAtom({k: 'y'}), 'yValue');
  expect(get(pAtom({k: 'x'}))).toBe('xValue');
  expect(get(pAtom({k: 'y'}))).toBe('yValue');
  expect(get(pAtom({k: 'z'}))).toBe('fallback');
});

testRecoil('Works with non-overlapping sets', () => {
  set(pAtom({x: 'x'}), 'xValue');
  set(pAtom({y: 'y'}), 'yValue');
  expect(get(pAtom({x: 'x'}))).toBe('xValue');
  expect(get(pAtom({y: 'y'}))).toBe('yValue');
});

describe('Default', () => {
  testRecoil('default is optional', () => {
    const myAtom = atom({key: 'atom without default'});
    expect(getLoadable(myAtom).state).toBe('loading');

    act(() => set(myAtom, 'VALUE'));
    expect(get(myAtom)).toBe('VALUE');
  });

  testRecoil('Works with atom default', () => {
    const fallbackAtom = atom({key: 'fallback', default: 0});
    const hasFallback = atomFamily({
      key: 'hasFallback',
      default: fallbackAtom,
    });
    expect(get(hasFallback({k: 'x'}))).toBe(0);
    set(fallbackAtom, 1);
    expect(get(hasFallback({k: 'x'}))).toBe(1);
    set(hasFallback({k: 'x'}), 2);
    expect(get(hasFallback({k: 'x'}))).toBe(2);
    expect(get(hasFallback({k: 'y'}))).toBe(1);
  });

  testRecoil('Works with parameterized default', () => {
    const paramDefaultAtom = atomFamily({
      key: 'parameterized default',
      default: ({num}) => num,
    });
    expect(get(paramDefaultAtom({num: 1}))).toBe(1);
    expect(get(paramDefaultAtom({num: 2}))).toBe(2);
    set(paramDefaultAtom({num: 1}), 3);
    expect(get(paramDefaultAtom({num: 1}))).toBe(3);
    expect(get(paramDefaultAtom({num: 2}))).toBe(2);
  });

  testRecoil('Parameterized async default', async () => {
    const paramDefaultAtom = atomFamily({
      key: 'parameterized async default',
      default: ({num}) =>
        num === 1 ? Promise.reject(num) : Promise.resolve(num),
    });
    await expect(get(paramDefaultAtom({num: 1}))).rejects.toBe(1);
    await expect(get(paramDefaultAtom({num: 2}))).resolves.toBe(2);
    set(paramDefaultAtom({num: 1}), 3);
    expect(get(paramDefaultAtom({num: 1}))).toBe(3);
    expect(get(paramDefaultAtom({num: 2}))).toBe(2);
  });

  testRecoil('Parameterized loadable default', async () => {
    const paramDefaultAtom = atomFamily({
      key: 'parameterized loadable default',
      default: ({num}) =>
        num === 1 ? RecoilLoadable.error(num) : RecoilLoadable.of(num),
    });
    expect(getLoadable(paramDefaultAtom({num: 1})).state).toBe('hasError');
    expect(getLoadable(paramDefaultAtom({num: 1})).contents).toBe(1);
    expect(getLoadable(paramDefaultAtom({num: 2})).state).toBe('hasValue');
    expect(getLoadable(paramDefaultAtom({num: 2})).contents).toBe(2);
    set(paramDefaultAtom({num: 1}), 3);
    expect(getLoadable(paramDefaultAtom({num: 1})).state).toBe('hasValue');
    expect(getLoadable(paramDefaultAtom({num: 1})).contents).toBe(3);
    expect(getLoadable(paramDefaultAtom({num: 2})).state).toBe('hasValue');
    expect(getLoadable(paramDefaultAtom({num: 2})).contents).toBe(2);
  });
});

testRecoil('Works with date as parameter', () => {
  const dateAtomFamily = atomFamily({
    key: 'dateFamily',
    default: _date => 0,
  });
  // $FlowFixMe[incompatible-call] added when improving typing for this parameters
  expect(get(dateAtomFamily(new Date(2021, 2, 25)))).toBe(0);
  // $FlowFixMe[incompatible-call] added when improving typing for this parameters
  expect(get(dateAtomFamily(new Date(2021, 2, 26)))).toBe(0);
  // $FlowFixMe[incompatible-call] added when improving typing for this parameters
  set(dateAtomFamily(new Date(2021, 2, 25)), 1);
  // $FlowFixMe[incompatible-call] added when improving typing for this parameters
  expect(get(dateAtomFamily(new Date(2021, 2, 25)))).toBe(1);
  // $FlowFixMe[incompatible-call] added when improving typing for this parameters
  expect(get(dateAtomFamily(new Date(2021, 2, 26)))).toBe(0);
});

testRecoil('Works with parameterized fallback', () => {
  const fallbackAtom = atomFamily({
    key: 'parameterized fallback default',
    default: ({num}) => num * 10,
  });
  const paramFallbackAtom = atomFamily({
    key: 'parameterized fallback',
    default: fallbackAtom,
  });
  expect(get(paramFallbackAtom({num: 1}))).toBe(10);
  expect(get(paramFallbackAtom({num: 2}))).toBe(20);
  set(paramFallbackAtom({num: 1}), 3);
  expect(get(paramFallbackAtom({num: 1}))).toBe(3);
  expect(get(paramFallbackAtom({num: 2}))).toBe(20);
  set(fallbackAtom({num: 2}), 200);
  expect(get(paramFallbackAtom({num: 2}))).toBe(200);
  set(fallbackAtom({num: 1}), 100);
  expect(get(paramFallbackAtom({num: 1}))).toBe(3);
  expect(get(paramFallbackAtom({num: 2}))).toBe(200);
});

testRecoil('atomFamily async fallback', async () => {
  const paramFallback = atomFamily({
    key: 'paramaterizedAtom async Fallback',
    default: Promise.resolve(42),
  });

  const container = renderElements(<ReadsAtom atom={paramFallback({})} />);
  expect(container.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('42');
});

testRecoil('Parameterized fallback with atom and async', async () => {
  const paramFallback = atomFamily({
    key: 'parameterized async Fallback',
    default: ({param}) =>
      ({
        value: 'value',
        atom: atom({key: `param async fallback atom ${id++}`, default: 'atom'}),
        async: Promise.resolve('async'),
      }[param]),
  });

  const valueCont = renderElements(
    <ReadsAtom atom={paramFallback({param: 'value'})} />,
  );
  expect(valueCont.textContent).toEqual('"value"');

  const atomCont = renderElements(
    <ReadsAtom atom={paramFallback({param: 'atom'})} />,
  );
  expect(atomCont.textContent).toEqual('"atom"');

  const asyncCont = renderElements(
    <ReadsAtom atom={paramFallback({param: 'async'})} />,
  );
  expect(asyncCont.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(asyncCont.textContent).toEqual('"async"');
});

fbOnlyTest('atomFamily with scope', () => {
  const scopeForParamAtom = atom<string>({
    key: 'scope atom for atomFamily',
    default: 'foo',
  });
  const paramAtomWithScope = atomFamily<string, {k: string}>({
    key: 'parameterized atom with scope',
    default: 'default',
    scopeRules_APPEND_ONLY_READ_THE_DOCS: [[scopeForParamAtom]],
  });
  expect(get(paramAtomWithScope({k: 'x'}))).toBe('default');
  expect(get(paramAtomWithScope({k: 'y'}))).toBe('default');
  set(paramAtomWithScope({k: 'x'}), 'xValue1');
  expect(get(paramAtomWithScope({k: 'x'}))).toBe('xValue1');
  expect(get(paramAtomWithScope({k: 'y'}))).toBe('default');
  set(paramAtomWithScope({k: 'y'}), 'yValue1');
  expect(get(paramAtomWithScope({k: 'x'}))).toBe('xValue1');
  expect(get(paramAtomWithScope({k: 'y'}))).toBe('yValue1');

  set(scopeForParamAtom, 'bar');

  expect(get(paramAtomWithScope({k: 'x'}))).toBe('default');
  expect(get(paramAtomWithScope({k: 'y'}))).toBe('default');
  set(paramAtomWithScope({k: 'x'}), 'xValue2');
  expect(get(paramAtomWithScope({k: 'x'}))).toBe('xValue2');
  expect(get(paramAtomWithScope({k: 'y'}))).toBe('default');
  set(paramAtomWithScope({k: 'y'}), 'yValue2');
  expect(get(paramAtomWithScope({k: 'x'}))).toBe('xValue2');
  expect(get(paramAtomWithScope({k: 'y'}))).toBe('yValue2');
});

fbOnlyTest('atomFamily with parameterized scope', () => {
  const paramScopeForParamAtom = atomFamily<string, {namespace: string}>({
    key: 'scope atom for atomFamily with parameterized scope',
    default: ({namespace}) => namespace,
  });
  const paramAtomWithParamScope = atomFamily<string, {k: string, n: string}>({
    key: 'parameterized atom with parameterized scope',
    default: 'default',
    scopeRules_APPEND_ONLY_READ_THE_DOCS: [
      [({n}) => paramScopeForParamAtom({namespace: n})],
    ],
  });

  expect(get(paramScopeForParamAtom({namespace: 'foo'}))).toBe('foo');

  expect(get(paramAtomWithParamScope({n: 'foo', k: 'x'}))).toBe('default');
  expect(get(paramAtomWithParamScope({n: 'foo', k: 'y'}))).toBe('default');
  set(paramAtomWithParamScope({n: 'foo', k: 'x'}), 'xValue1');
  expect(get(paramAtomWithParamScope({n: 'foo', k: 'x'}))).toBe('xValue1');
  expect(get(paramAtomWithParamScope({n: 'foo', k: 'y'}))).toBe('default');
  set(paramAtomWithParamScope({n: 'foo', k: 'y'}), 'yValue1');
  expect(get(paramAtomWithParamScope({n: 'foo', k: 'x'}))).toBe('xValue1');
  expect(get(paramAtomWithParamScope({n: 'foo', k: 'y'}))).toBe('yValue1');

  set(paramScopeForParamAtom({namespace: 'foo'}), 'eggs');
  expect(get(paramScopeForParamAtom({namespace: 'foo'}))).toBe('eggs');

  expect(get(paramAtomWithParamScope({n: 'foo', k: 'x'}))).toBe('default');
  expect(get(paramAtomWithParamScope({n: 'foo', k: 'y'}))).toBe('default');
  set(paramAtomWithParamScope({n: 'foo', k: 'x'}), 'xValue2');
  expect(get(paramAtomWithParamScope({n: 'foo', k: 'x'}))).toBe('xValue2');
  expect(get(paramAtomWithParamScope({n: 'foo', k: 'y'}))).toBe('default');
  set(paramAtomWithParamScope({n: 'foo', k: 'y'}), 'yValue2');
  expect(get(paramAtomWithParamScope({n: 'foo', k: 'x'}))).toBe('xValue2');
  expect(get(paramAtomWithParamScope({n: 'foo', k: 'y'}))).toBe('yValue2');

  expect(get(paramScopeForParamAtom({namespace: 'bar'}))).toBe('bar');

  expect(get(paramAtomWithParamScope({n: 'bar', k: 'x'}))).toBe('default');
  expect(get(paramAtomWithParamScope({n: 'bar', k: 'y'}))).toBe('default');
  set(paramAtomWithParamScope({n: 'bar', k: 'x'}), 'xValue3');
  expect(get(paramAtomWithParamScope({n: 'bar', k: 'x'}))).toBe('xValue3');
  expect(get(paramAtomWithParamScope({n: 'bar', k: 'y'}))).toBe('default');
  set(paramAtomWithParamScope({n: 'bar', k: 'y'}), 'yValue3');
  expect(get(paramAtomWithParamScope({n: 'bar', k: 'x'}))).toBe('xValue3');
  expect(get(paramAtomWithParamScope({n: 'bar', k: 'y'}))).toBe('yValue3');

  set(paramScopeForParamAtom({namespace: 'bar'}), 'spam');
  expect(get(paramScopeForParamAtom({namespace: 'bar'}))).toBe('spam');

  expect(get(paramAtomWithParamScope({n: 'bar', k: 'x'}))).toBe('default');
  expect(get(paramAtomWithParamScope({n: 'bar', k: 'y'}))).toBe('default');
  set(paramAtomWithParamScope({n: 'bar', k: 'x'}), 'xValue4');
  expect(get(paramAtomWithParamScope({n: 'bar', k: 'x'}))).toBe('xValue4');
  expect(get(paramAtomWithParamScope({n: 'bar', k: 'y'}))).toBe('default');
  set(paramAtomWithParamScope({n: 'bar', k: 'y'}), 'yValue4');
  expect(get(paramAtomWithParamScope({n: 'bar', k: 'x'}))).toBe('xValue4');
  expect(get(paramAtomWithParamScope({n: 'bar', k: 'y'}))).toBe('yValue4');
});

testRecoil('Returns the fallback for parameterized atoms', () => {
  let theAtom = null;
  let setUnvalidatedAtomValues;
  let setAtomParam;
  let setAtomValue;
  function SetsUnvalidatedAtomValues() {
    setUnvalidatedAtomValues = useSetUnvalidatedAtomValues();
    return null;
  }
  let setVisible;
  function Switch({children}) {
    const [visible, mySetVisible] = useState(false);
    setVisible = mySetVisible;
    return visible ? children : null;
  }
  function MyReadsAtom({getAtom}) {
    const [param, setParam] = useState({num: 1});
    setAtomParam = setParam;
    // flowlint-next-line unclear-type:off
    const myAtom: any = getAtom();
    const [value, setValue] = useRecoilState(myAtom(param));
    setAtomValue = setValue;
    return value;
  }
  const container = renderElements(
    <>
      <SetsUnvalidatedAtomValues />
      <Switch>
        <MyReadsAtom getAtom={() => theAtom} />
      </Switch>
    </>,
  );
  act(() => {
    setUnvalidatedAtomValues(
      new Map().set('notDefinedYetAtomFamilyWithFallback', 123),
    );
  });
  const fallback = atom<number>({
    key: 'fallback for atomFamily',
    default: 222,
  });
  theAtom = atomFamily({
    key: 'notDefinedYetAtomFamilyWithFallback',
    default: fallback,
    persistence_UNSTABLE: {
      type: 'url',
      validator: (_, returnFallback) => returnFallback,
    },
  });
  act(() => {
    setVisible(true);
  });
  expect(container.textContent).toBe('222');
  act(() => {
    setAtomValue(111);
  });
  expect(container.textContent).toBe('111');
  act(() => {
    setAtomParam({num: 2});
  });
  expect(container.textContent).toBe('222');
});

testRecoil(
  'Returns the fallback for parameterized atoms with a selector as the fallback',
  () => {
    let theAtom = null;
    let setUnvalidatedAtomValues;
    let setAtomParam;
    let setAtomValue;
    function SetsUnvalidatedAtomValues() {
      setUnvalidatedAtomValues = useSetUnvalidatedAtomValues();
      return null;
    }
    let setVisible;
    function Switch({children}) {
      const [visible, mySetVisible] = useState(false);
      setVisible = mySetVisible;
      return visible ? children : null;
    }
    function MyReadsAtom({getAtom}) {
      const [param, setParam] = useState({num: 10});
      setAtomParam = setParam;
      // flowlint-next-line unclear-type:off
      const myAtom: any = getAtom();
      const [value, setValue] = useRecoilState(myAtom(param));
      setAtomValue = setValue;
      return value;
    }
    const container = renderElements(
      <>
        <SetsUnvalidatedAtomValues />
        <Switch>
          <MyReadsAtom getAtom={() => theAtom} />
        </Switch>
      </>,
    );
    act(() => {
      setUnvalidatedAtomValues(
        new Map().set('notDefinedYetAtomFamilyFallbackSel', 123),
      );
    });

    theAtom = atomFamily({
      key: 'notDefinedYetAtomFamilyFallbackSel',
      default: selectorFamily({
        key: 'notDefinedYetAtomFamilyFallbackSelFallback',
        get:
          ({num}) =>
          () =>
            num === 1 ? 456 : 789,
      }),
      persistence_UNSTABLE: {
        type: 'url',
        validator: (_, notValid) => notValid,
      },
    });
    act(() => {
      setVisible(true);
    });
    expect(container.textContent).toBe('789');
    act(() => {
      setAtomValue(111);
    });
    expect(container.textContent).toBe('111');
    act(() => {
      setAtomParam({num: 1});
    });
    expect(container.textContent).toBe('456');
  },
);

testRecoil('Independent atom subscriptions', ({gks}) => {
  const BASE_CALLS =
    reactMode().mode === 'LEGACY' &&
    !gks.includes('recoil_suppress_rerender_in_callback')
      ? 1
      : 0;

  const myAtom = atomFamily({
    key: 'atomFamily/independent subscriptions',
    default: 'DEFAULT',
  });

  const TrackingComponent = param => {
    let numUpdates = 0;
    let setValue;

    const Component = () => {
      setValue = useSetRecoilState(myAtom(param));
      return (
        <Profiler
          id="test"
          onRender={() => {
            numUpdates++;
          }}>
          {stableStringify(useRecoilValue(myAtom(param)))}
        </Profiler>
      );
    };

    return [Component, value => setValue(value), () => numUpdates];
  };

  const [ComponentA, setValueA, getNumUpdatesA] = TrackingComponent('A');
  const [ComponentB, setValueB, getNumUpdatesB] = TrackingComponent('B');
  const container = renderElements(
    <>
      <ComponentA />
      <ComponentB />
    </>,
  );

  // Initial:
  expect(container.textContent).toBe('"DEFAULT""DEFAULT"');
  expect(getNumUpdatesA()).toBe(BASE_CALLS + 1);
  expect(getNumUpdatesB()).toBe(BASE_CALLS + 1);

  // After setting at parameter A, component A should update:
  act(() => setValueA(1));
  expect(container.textContent).toBe('1"DEFAULT"');
  expect(getNumUpdatesA()).toBe(BASE_CALLS + 2);
  expect(getNumUpdatesB()).toBe(BASE_CALLS + 1);

  // After setting at parameter B, component B should update:
  act(() => setValueB(2));
  expect(container.textContent).toBe('12');
  expect(getNumUpdatesA()).toBe(BASE_CALLS + 2);
  expect(getNumUpdatesB()).toBe(BASE_CALLS + 2);
});

describe('Effects', () => {
  testRecoil('Initialization', () => {
    let inited = 0;
    const myFamily = atomFamily<string, number>({
      key: 'atomFamily effect init',
      default: 'DEFAULT',
      effects: [
        ({setSelf}) => {
          inited++;
          setSelf('INIT');
        },
      ],
    });
    expect(inited).toEqual(0);

    expect(get(myFamily(1))).toEqual('INIT');
    expect(inited).toEqual(1);

    set(myFamily(2));
    expect(inited).toEqual(2);

    const [ReadsWritesAtom, _, reset] = componentThatReadsAndWritesAtom(
      myFamily(1),
    );
    const c = renderElements(<ReadsWritesAtom />);
    expect(c.textContent).toEqual('"INIT"');

    act(reset);
    expect(c.textContent).toEqual('"DEFAULT"');
  });

  testRecoil('Parameterized Initialization', () => {
    const myFamily = atomFamily({
      key: 'atomFamily effect parameterized init',
      default: 'DEFAULT',
      effects: param => [({setSelf}) => setSelf(param)],
    });

    expect(get(myFamily(1))).toEqual(1);
    expect(get(myFamily(2))).toEqual(2);
  });

  testRecoil('Cleanup Handlers - when root unmounted', () => {
    const refCounts: {[string]: number} = {A: 0, B: 0};

    const atoms = atomFamily({
      key: 'atomFamily effect cleanup',
      default: p => p,
      effects: p => [
        () => {
          refCounts[p]++;
          return () => {
            refCounts[p]--;
          };
        },
      ],
    });

    let setNumRoots;
    function App() {
      const [numRoots, _setNumRoots] = useState(0);
      setNumRoots = _setNumRoots;
      return (
        <div>
          {Array(numRoots)
            .fill(null)
            .map((_, idx) => (
              <RecoilRoot key={idx}>
                <ReadsAtom atom={atoms('A')} />
                <ReadsAtom atom={atoms('B')} />
              </RecoilRoot>
            ))}
        </div>
      );
    }

    const c = renderElements(<App />);

    expect(c.textContent).toBe('');
    expect(refCounts).toEqual({A: 0, B: 0});

    act(() => setNumRoots(1));
    expect(c.textContent).toBe('"A""B"');
    expect(refCounts).toEqual({A: 1, B: 1});

    act(() => setNumRoots(2));
    expect(c.textContent).toBe('"A""B""A""B"');
    expect(refCounts).toEqual({A: 2, B: 2});

    act(() => setNumRoots(1));
    expect(c.textContent).toBe('"A""B"');
    expect(refCounts).toEqual({A: 1, B: 1});

    act(() => setNumRoots(0));
    expect(c.textContent).toBe('');
    expect(refCounts).toEqual({A: 0, B: 0});
  });

  testRecoil('storeID matches <RecoilRoot>', async () => {
    const atoms = atomFamily({
      key: 'atomFamily effect - storeID',
      default: 'DEFAULT',
      effects: rootKey => [
        ({storeID, setSelf}) => {
          expect(storeID).toEqual(storeIDs[rootKey]);
          setSelf(rootKey);
        },
      ],
    });

    const storeIDs: {[string]: StoreIDType} = {};
    function StoreID({rootKey}) {
      const storeID = useRecoilStoreID();
      storeIDs[rootKey] = storeID;
      return null;
    }

    function MyApp() {
      return (
        <div>
          <RecoilRoot>
            <StoreID rootKey="A" />
            <ReadsAtom atom={atoms('A')} />
            <RecoilRoot>
              <StoreID rootKey="A1" />
              <ReadsAtom atom={atoms('A1')} />
            </RecoilRoot>
            <RecoilRoot override={false}>
              <StoreID rootKey="A2" />
              <ReadsAtom atom={atoms('A2')} />
            </RecoilRoot>
          </RecoilRoot>
          <RecoilRoot>
            <StoreID rootKey="B" />
            <ReadsAtom atom={atoms('B')} />
          </RecoilRoot>
        </div>
      );
    }

    const c = renderElements(<MyApp />);
    expect(c.textContent).toEqual('"A""A1""A2""B"');

    expect('A' in storeIDs).toEqual(true);
    expect('A1' in storeIDs).toEqual(true);
    expect('A2' in storeIDs).toEqual(true);
    expect('B' in storeIDs).toEqual(true);
    expect(storeIDs.A).not.toEqual(storeIDs.B);
    expect(storeIDs.A).not.toEqual(storeIDs.A1);
    expect(storeIDs.A).toEqual(storeIDs.A2);
    expect(storeIDs.B).not.toEqual(storeIDs.A1);
    expect(storeIDs.B).not.toEqual(storeIDs.A2);
  });
});
