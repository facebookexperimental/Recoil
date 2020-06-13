/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {Store} from 'Recoil_State';

const {act} = require('ReactTestUtils');

const {
  getRecoilValueAsLoadable,
  setRecoilValue,
} = require('../../core/Recoil_RecoilValueInterface');
const {makeStore} = require('../../testing/Recoil_TestingUtils');
const atom = require('../Recoil_atom');

let store: Store;
beforeEach(() => {
  store = makeStore();
});

function get(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue).contents;
}

function set(recoilValue, value) {
  setRecoilValue(store, recoilValue, value);
}

test('atom can read and write value', () => {
  const myAtom = atom<string>({
    key: 'atom with default',
    default: 'DEFAULT',
  });
  expect(get(myAtom)).toBe('DEFAULT');
  act(() => set(myAtom, 'VALUE'));
  expect(get(myAtom)).toBe('VALUE');
});

test('atom can store null and undefined', () => {
  const myAtom = atom<?string>({
    key: 'atom with default for null and undefined',
    default: 'DEFAULT',
  });
  expect(get(myAtom)).toBe('DEFAULT');
  act(() => set(myAtom, 'VALUE'));
  expect(get(myAtom)).toBe('VALUE');
  act(() => set(myAtom, null));
  expect(get(myAtom)).toBe(null);
  act(() => set(myAtom, undefined));
  expect(get(myAtom)).toBe(undefined);
  act(() => set(myAtom, 'VALUE'));
  expect(get(myAtom)).toBe('VALUE');
});

test('atom can store a circular reference object', () => {
  class Circular {
    self: Circular;

    constructor() {
      this.self = this;
    }
  }
  const circular = new Circular();
  const myAtom = atom<?Circular>({
    key: 'atom',
    default: undefined,
  });
  expect(get(myAtom)).toBe(undefined);
  act(() => set(myAtom, circular));
  expect(get(myAtom)).toBe(circular);
});
