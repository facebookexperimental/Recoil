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

const React = require('React');
const {useState} = require('React');
const {act} = require('ReactTestUtils');

const {
  getRecoilValueAsLoadable,
  setRecoilValue,
} = require('../../core/Recoil_RecoilValueInterface');
const {
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
  useSetUnvalidatedAtomValues,
} = require('../../hooks/Recoil_Hooks');
const {
  ReadsAtom,
  makeStore,
  renderElements,
} = require('../../testing/Recoil_TestingUtils');
const stableStringify = require('../../util/Recoil_stableStringify');
const atom = require('../Recoil_atom');
const atomFamily = require('../Recoil_atomFamily');
const selectorFamily = require('../Recoil_selectorFamily');

let id = 0;

const pAtom = atomFamily({
  key: 'pAtom',
  default: 'fallback',
});

let store;
beforeEach(() => {
  store = makeStore();
});

function get(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue).contents;
}

function set(recoilValue, value) {
  setRecoilValue(store, recoilValue, value);
}

test('Read fallback by default', () => {
  expect(get(pAtom({k: 'x'}))).toBe('fallback');
});

test('Uses value for parameter', () => {
  set(pAtom({k: 'x'}), 'xValue');
  set(pAtom({k: 'y'}), 'yValue');
  expect(get(pAtom({k: 'x'}))).toBe('xValue');
  expect(get(pAtom({k: 'y'}))).toBe('yValue');
  expect(get(pAtom({k: 'z'}))).toBe('fallback');
});

test('Works with non-overlapping sets', () => {
  set(pAtom({x: 'x'}), 'xValue');
  set(pAtom({y: 'y'}), 'yValue');
  expect(get(pAtom({x: 'x'}))).toBe('xValue');
  expect(get(pAtom({y: 'y'}))).toBe('yValue');
});

test('Upgrades non-parameterized atoms', () => {
  let upgrade = atom({
    key: 'upgrade',
    default: 'default',
  });
  set(upgrade, '123');
  upgrade = atomFamily({
    key: 'upgrade', // Intentially same key as above
    default: 'default',
  });
  expect(get(upgrade({x: 'x'}))).toBe('123');
});

test('Works with atom default', () => {
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

test('Works with parameterized default', () => {
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

test('Works with parameterized fallback', () => {
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

test('atomFamily async fallback', () => {
  const paramFallback = atomFamily({
    key: 'paramaterizedAtom async Fallback',
    default: Promise.resolve(42),
  });

  const container = renderElements(<ReadsAtom atom={paramFallback({})} />);
  expect(container.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
  expect(container.textContent).toEqual('42');
});

test('Parameterized fallback with atom and async', () => {
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
  expect(asyncCont.textContent).toEqual('"async"');
});

test('atomFamily with scope', () => {
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

test('atomFamily with parameterized scope', () => {
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

test('Returns the fallback for parameterized atoms', () => {
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
    const atom: any = getAtom();
    const [value, setValue] = useRecoilState(atom(param));
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

test('Returns the fallback for parameterized atoms with a selector as the fallback', () => {
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
    const atom: any = getAtom();
    const [value, setValue] = useRecoilState(atom(param));
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
      get: ({num}) => () => (num === 1 ? 456 : 789),
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
});

test('Independent atom subscriptions', () => {
  const myAtom = atomFamily({
    key: 'atomFamily/independent subscriptions',
    default: 'DEFAULT',
  });

  const TrackingComponent = param => {
    let numUpdates = 0;
    let setValue;

    const Component = () => {
      numUpdates++;
      setValue = useSetRecoilState(myAtom(param));
      return stableStringify(useRecoilValue(myAtom(param)));
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

  expect(container.textContent).toBe('"DEFAULT""DEFAULT"');
  expect(getNumUpdatesA()).toBe(3);
  expect(getNumUpdatesB()).toBe(2);
  act(() => setValueA(1));
  expect(container.textContent).toBe('1"DEFAULT"');
  expect(getNumUpdatesA()).toBe(4);
  expect(getNumUpdatesB()).toBe(2);
  act(() => setValueB(2));
  expect(container.textContent).toBe('12');
  expect(getNumUpdatesA()).toBe(4);
  expect(getNumUpdatesB()).toBe(3);
});

// TODO add non-current-entry tests
// TODO add persistence tests
