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

import type {RecoilValue} from 'Recoil_RecoilValue';
import type {Store} from 'Recoil_State';

const React = require('React');
const {useState} = require('React');
const {act} = require('ReactTestUtils');

const {
  getRecoilValueAsLoadable,
  setRecoilValue,
  subscribeToRecoilValue,
} = require('../../core/Recoil_RecoilValueInterface');
const {
  useRecoilState,
  useSetUnvalidatedAtomValues,
} = require('../../hooks/Recoil_Hooks');
const {
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers,
  makeStore,
  renderElements,
} = require('../../testing/Recoil_TestingUtils');
const atom = require('../Recoil_atom');
const constSelector = require('../Recoil_constSelector');

let fallback: RecoilValue<number>,
  hasFallback: RecoilValue<number>,
  store: Store;
let id = 0;

beforeEach(() => {
  store = makeStore();
  fallback = atom<number>({key: `fallback${id}`, default: 1});
  hasFallback = atom<number>({
    key: `hasFallback${id++}`,
    default: fallback,
  });
  subscribeToRecoilValue(store, hasFallback, () => undefined);
});

function get(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue).contents;
}

function set(recoilValue, value) {
  setRecoilValue(store, recoilValue, value);
}

test('atomWithFallback', () => {
  expect(get(hasFallback)).toBe(1);
  set(fallback, 2);
  expect(get(hasFallback)).toBe(2);
  set(hasFallback, 3);
  expect(get(hasFallback)).toBe(3);
});

test('Async fallback', async () => {
  const asyncFallback = atom<number>({
    key: 'asyncFallback',
    default: Promise.resolve(42),
  });
  const container = renderElements(<ReadsAtom atom={asyncFallback} />);

  expect(container.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('42');
});

describe('ReturnDefaultOrFallback', () => {
  test('Returns the default', () => {
    let theAtom = null;
    let setUnvalidatedAtomValues;
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
      // flowlint-next-line unclear-type:off
      const [value] = useRecoilState((getAtom(): any));
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
        new Map().set('notDefinedYetAtomValidator', 123),
      );
    });
    theAtom = atom({
      key: 'notDefinedYetAtomValidator',
      default: 456,
      persistence_UNSTABLE: {
        type: 'url',
        validator: (_, returnFallback) => returnFallback,
      },
    });
    act(() => {
      setVisible(true);
    });
    expect(container.textContent).toBe('456');
  });

  test('Returns the fallback', () => {
    let theAtom = null;
    let setUnvalidatedAtomValues;
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
      // flowlint-next-line unclear-type:off
      const [value] = useRecoilState((getAtom(): any));
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
        new Map().set('notDefinedYetAtomWithFallback', 123),
      );
    });
    const fallback = atom<number>({
      key: 'notDefinedYetAtomFallback',
      default: 222,
    });
    theAtom = atom({
      key: 'notDefinedYetAtomWithFallback',
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
  });
});

test('Atom with atom fallback can store null and undefined', () => {
  const fallbackAtom = atom<?string>({
    key: 'fallback for null undefined',
    default: 'FALLBACK',
  });
  const myAtom = atom<?string>({
    key: 'fallback atom with undefined',
    default: fallbackAtom,
  });
  expect(get(myAtom)).toBe('FALLBACK');
  act(() => set(myAtom, 'VALUE'));
  expect(get(myAtom)).toBe('VALUE');
  act(() => set(myAtom, null));
  expect(get(myAtom)).toBe(null);
  act(() => set(myAtom, undefined));
  expect(get(myAtom)).toBe(undefined);
  act(() => set(myAtom, 'VALUE'));
  expect(get(myAtom)).toBe('VALUE');
});

test('Atom with selector fallback can store null and undefined', () => {
  const fallbackSelector = constSelector('FALLBACK');
  const myAtom = atom<?string>({
    key: 'fallback selector with undefined',
    default: fallbackSelector,
  });
  expect(get(myAtom)).toBe('FALLBACK');
  act(() => set(myAtom, 'VALUE'));
  expect(get(myAtom)).toBe('VALUE');
  act(() => set(myAtom, null));
  expect(get(myAtom)).toBe(null);
  act(() => set(myAtom, undefined));
  expect(get(myAtom)).toBe(undefined);
  act(() => set(myAtom, 'VALUE'));
  expect(get(myAtom)).toBe('VALUE');
});

test('Effects', () => {
  let inited = false;
  const myAtom = atom<string>({
    key: 'atom hooks init',
    default: Promise.resolve('RESOLVE'),
    effects_UNSTABLE: [
      ({setSelf}) => {
        inited = true;
        setSelf('INIT');
      },
    ],
  });

  expect(get(myAtom)).toEqual('INIT');
  expect(inited).toEqual(true);

  const [ReadsWritesAtom, _, reset] = componentThatReadsAndWritesAtom(myAtom);
  const c = renderElements(<ReadsWritesAtom />);
  expect(c.textContent).toEqual('"INIT"');

  act(reset);
  expect(c.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
  expect(c.textContent).toEqual('"RESOLVE"');
});
