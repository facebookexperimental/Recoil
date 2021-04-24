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

const {getRecoilTestFn} = require('../../testing/Recoil_TestingUtils');

let React,
  useState,
  act,
  getRecoilValueAsLoadable,
  setRecoilValue,
  subscribeToRecoilValue,
  useRecoilState,
  useSetUnvalidatedAtomValues,
  componentThatReadsAndWritesAtom,
  renderElements,
  atom,
  constSelector,
  store: Store;

let fallback: RecoilValue<number>, hasFallback: RecoilValue<number>;

let id = 0;

const testRecoil = getRecoilTestFn(() => {
  const {makeStore} = require('../../testing/Recoil_TestingUtils');

  React = require('react');
  ({useState} = require('react'));
  ({act} = require('ReactTestUtils'));

  ({
    getRecoilValueAsLoadable,
    setRecoilValue,
    subscribeToRecoilValue,
  } = require('../../core/Recoil_RecoilValueInterface'));
  ({
    useRecoilState,
    useSetUnvalidatedAtomValues,
  } = require('../../hooks/Recoil_Hooks'));
  ({
    componentThatReadsAndWritesAtom,
    renderElements,
  } = require('../../testing/Recoil_TestingUtils'));
  atom = require('../Recoil_atom');
  constSelector = require('../Recoil_constSelector');

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

testRecoil('atomWithFallback', () => {
  expect(get(hasFallback)).toBe(1);
  set(fallback, 2);
  expect(get(hasFallback)).toBe(2);
  set(hasFallback, 3);
  expect(get(hasFallback)).toBe(3);
});

describe('ReturnDefaultOrFallback', () => {
  testRecoil('Returns the default', () => {
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

  testRecoil('Returns the fallback', () => {
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

testRecoil('Atom with atom fallback can store null and undefined', () => {
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

testRecoil('Atom with selector fallback can store null and undefined', () => {
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

testRecoil('Effects', () => {
  let inited = false;
  const fallbackAtom = atom({
    key: 'atom with fallback effects init fallback',
    default: 'FALLBACK',
  });
  const myAtom = atom<string>({
    key: 'atom with fallback effects init',
    default: fallbackAtom,
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
  expect(c.textContent).toEqual('"FALLBACK"');
});
