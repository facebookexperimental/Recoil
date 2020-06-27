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

import type {LoadablePromise} from 'Recoil_Loadable';
import type {RecoilValue} from 'Recoil_RecoilValue';

const gkx = require('../../util/Recoil_gkx');
gkx.setPass('recoil_async_selector_refactor');

const atom = require('../Recoil_atom');
const cacheMostRecent = require('../../caches/Recoil_cacheMostRecent');
const cacheWithReferenceEquality = require('../../caches/Recoil_cacheWithReferenceEquality');
const {DefaultValue} = require('../../core/Recoil_Node');
const selectorFamily = require('../Recoil_selectorFamily');
const {
  getRecoilValueAsLoadable,
  setRecoilValue,
} = require('../../core/Recoil_RecoilValueInterface');
const {makeStore} = require('../../testing/Recoil_TestingUtils');

let store;
beforeEach(() => {
  store = makeStore();
});

function get<T>(recoilValue: RecoilValue<T>): T | LoadablePromise<T> | Error {
  return getRecoilValueAsLoadable<T>(store, recoilValue).contents;
}

function set(recoilValue, value) {
  setRecoilValue(store, recoilValue, value);
}

const myAtom = atom({
  key: 'atom',
  default: 0,
});

test('selectorFamily - number parameter', () => {
  const mySelector = selectorFamily({
    key: 'selectorFamily/number',
    get: multiplier => ({get}) => get(myAtom) * multiplier,
  });

  set(myAtom, 1);
  expect(get(mySelector(10))).toBe(10);
  expect(get(mySelector(100))).toBe(100);
  set(myAtom, 2);
  expect(get(mySelector(10))).toBe(20);
  expect(get(mySelector(100))).toBe(200);
});

test('selectorFamily - array parameter', () => {
  const mySelector = selectorFamily({
    key: 'selectorFamily/array',
    get: numbers => () => numbers.reduce((x, y) => x + y, 0),
  });

  expect(get(mySelector([]))).toBe(0);
  expect(get(mySelector([1, 2, 3]))).toBe(6);
  expect(get(mySelector([0, 1, 1, 2, 3, 5]))).toBe(12);
});

test('selectorFamily - object parameter', () => {
  const mySelector = selectorFamily({
    key: 'selectorFamily/object',
    get: ({multiplier}) => ({get}) => get(myAtom) * multiplier,
  });

  set(myAtom, 1);
  expect(get(mySelector({multiplier: 10}))).toBe(10);
  expect(get(mySelector({multiplier: 100}))).toBe(100);
  set(myAtom, 2);
  expect(get(mySelector({multiplier: 10}))).toBe(20);
  expect(get(mySelector({multiplier: 100}))).toBe(200);
});

test('Works with supersets', () => {
  const mySelector = selectorFamily({
    key: 'selectorFamily/supersets',
    get: ({multiplier}) => ({get}) => get(myAtom) * multiplier,
  });
  set(myAtom, 1);
  expect(get(mySelector({multiplier: 10}))).toBe(10);
  expect(get(mySelector({multiplier: 100}))).toBe(100);
  expect(get(mySelector({multiplier: 100, extra: 'foo'}))).toBe(100);
});

test('selectorFamily - writable', () => {
  const mySelector = selectorFamily({
    key: 'selectorFamily/writable',
    get: ({multiplier}) => ({get}) => get(myAtom) * multiplier,
    set: ({multiplier}) => ({set}, num) =>
      set(myAtom, num instanceof DefaultValue ? num : num / multiplier),
  });

  set(myAtom, 1);
  expect(get(mySelector({multiplier: 10}))).toBe(10);
  set(mySelector({multiplier: 10}), 20);
  expect(get(myAtom)).toBe(2);
  set(mySelector({multiplier: 10}), 30);
  expect(get(myAtom)).toBe(3);
  set(mySelector({multiplier: 100}), 400);
  expect(get(myAtom)).toBe(4);
});

test('selectorFamily - value caching', () => {
  let evals = 0;
  const mySelector = selectorFamily({
    key: 'selectorFamily/value caching',
    get: ({multiplier}) => ({get}) => {
      evals++;
      return get(myAtom) * multiplier;
    },
  });

  expect(evals).toBe(0);

  set(myAtom, 1);
  expect(get(mySelector({multiplier: 10}))).toBe(10);
  expect(evals).toBe(1);
  expect(get(mySelector({multiplier: 10}))).toBe(10);
  expect(evals).toBe(1);
  expect(get(mySelector({multiplier: 100}))).toBe(100);
  expect(evals).toBe(2);
  expect(get(mySelector({multiplier: 100}))).toBe(100);
  expect(evals).toBe(2);
  expect(get(mySelector({multiplier: 10}))).toBe(10);
  expect(evals).toBe(2);

  set(myAtom, 2);
  expect(get(mySelector({multiplier: 10}))).toBe(20);
  expect(evals).toBe(3);
  expect(get(mySelector({multiplier: 10}))).toBe(20);
  expect(evals).toBe(3);
  expect(get(mySelector({multiplier: 100}))).toBe(200);
  expect(evals).toBe(4);
  expect(get(mySelector({multiplier: 100}))).toBe(200);
  expect(evals).toBe(4);
});

test('selectorFamily - reference caching', () => {
  let evals = 0;
  const mySelector = selectorFamily({
    key: 'selectorFamily/reference caching',
    get: ({multiplier}) => ({get}) => {
      evals++;
      return get(myAtom) * multiplier;
    },
    cacheImplementationForParams_UNSTABLE: cacheWithReferenceEquality,
  });

  expect(evals).toBe(0);

  set(myAtom, 1);
  expect(get(mySelector({multiplier: 10}))).toBe(10);
  expect(evals).toBe(1);
  expect(get(mySelector({multiplier: 10}))).toBe(10);
  expect(evals).toBe(2);
  expect(get(mySelector({multiplier: 100}))).toBe(100);
  expect(evals).toBe(3);
  expect(get(mySelector({multiplier: 100}))).toBe(100);
  expect(evals).toBe(4);
  expect(get(mySelector({multiplier: 10}))).toBe(10);
  expect(evals).toBe(5);

  set(myAtom, 2);
  expect(get(mySelector({multiplier: 10}))).toBe(20);
  expect(evals).toBe(6);
  expect(get(mySelector({multiplier: 10}))).toBe(20);
  expect(evals).toBe(7);
  expect(get(mySelector({multiplier: 100}))).toBe(200);
  expect(evals).toBe(8);
  expect(get(mySelector({multiplier: 100}))).toBe(200);
  expect(evals).toBe(9);

  const multiply10 = {multiplier: 10};
  const multiply100 = {multiplier: 100};

  set(myAtom, 1);
  expect(get(mySelector(multiply10))).toBe(10);
  expect(evals).toBe(10);
  expect(get(mySelector(multiply10))).toBe(10);
  expect(evals).toBe(10);
  expect(get(mySelector(multiply100))).toBe(100);
  expect(evals).toBe(11);
  expect(get(mySelector(multiply100))).toBe(100);
  expect(evals).toBe(11);
  expect(get(mySelector(multiply10))).toBe(10);
  expect(evals).toBe(11);

  set(myAtom, 2);
  expect(get(mySelector(multiply10))).toBe(20);
  expect(evals).toBe(12);
  expect(get(mySelector(multiply10))).toBe(20);
  expect(evals).toBe(12);
  expect(get(mySelector(multiply100))).toBe(200);
  expect(evals).toBe(13);
  expect(get(mySelector(multiply100))).toBe(200);
  expect(evals).toBe(13);
});

test('selectorFamily - most recent caching', () => {
  let evals = 0;
  const mySelector = selectorFamily({
    key: 'selectorFamily/most recent caching',
    get: ({multiplier}) => ({get}) => {
      evals++;
      return get(myAtom) * multiplier;
    },
    cacheImplementationForParams_UNSTABLE: cacheMostRecent,
  });

  const multiply10 = {multiplier: 10};
  const multiply100 = {multiplier: 100};

  expect(evals).toBe(0);

  set(myAtom, 1);
  expect(get(mySelector(multiply10))).toBe(10);
  expect(evals).toBe(1);
  expect(get(mySelector(multiply10))).toBe(10);
  expect(evals).toBe(1);
  expect(get(mySelector(multiply100))).toBe(100);
  expect(evals).toBe(2);
  expect(get(mySelector(multiply100))).toBe(100);
  expect(evals).toBe(2);
  expect(get(mySelector(multiply10))).toBe(10);
  expect(evals).toBe(3);
  expect(get(mySelector(multiply10))).toBe(10);
  expect(evals).toBe(3);
});

// Parameterized selector results should be frozen unless
// dangerouslyAllowMutability is set
test('selectorFamily - mutability', () => {
  const myImmutableSelector = selectorFamily({
    key: 'selectorFamily/immutable',
    get: ({key}) => ({get}) => ({[key]: get(myAtom)}),
  });
  set(myAtom, 42);
  const immutableResult: {[string]: number, ...} = get(
    myImmutableSelector({key: 'foo'}),
  );
  expect(immutableResult).toEqual({foo: 42});
  expect(() => {
    immutableResult.foo = 2600;
  }).toThrow();

  const myMutableSelector = selectorFamily({
    key: 'selectorFamily/mutable',
    get: ({key}) => ({get}) => ({[key]: get(myAtom)}),
    dangerouslyAllowMutability: true,
  });
  set(myAtom, 42);
  const mutableResult: {[string]: number, ...} = get(
    myMutableSelector({key: 'foo'}),
  );
  expect(mutableResult).toEqual({foo: 42});
  mutableResult.foo = 2600;
  expect(mutableResult).toEqual({foo: 2600});
});

test('selectorFamily - evaluate to RecoilValue', () => {
  const atomA = atom({key: 'selectorFamily/const atom A', default: 'A'});
  const atomB = atom({key: 'selectorFamily/const atom B', default: 'B'});
  const mySelector = selectorFamily<string, string>({
    key: 'selectorFamily/',
    get: param => () => (param === 'a' ? atomA : atomB),
  });

  expect(get(mySelector('a'))).toEqual('A');
  expect(get(mySelector('b'))).toEqual('B');
});
