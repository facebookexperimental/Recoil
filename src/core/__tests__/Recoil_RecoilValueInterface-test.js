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

const {act} = require('ReactTestUtils');

const atom = require('../../recoil_values/Recoil_atom');
const selector = require('../../recoil_values/Recoil_selector');
const {makeStore} = require('../../testing/Recoil_TestingUtils');
const {
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
} = require('../Recoil_RecoilValueInterface');

const a = atom<number>({key: 'a', default: 0});
const dependsOnAFn = jest.fn(x => x + 1);
const dependsOnA = selector({
  key: 'dependsOnA',
  get: ({get}) => dependsOnAFn(get(a)),
});
const dependsOnDependsOnA = selector({
  key: 'dependsOnDependsOnA',
  get: ({get}) => get(dependsOnA) + 1,
});

const b = atom<number>({
  key: 'b',
  default: 0,
  persistence_UNSTABLE: {
    type: 'url',
    validator: x => parseInt(x, 10),
  },
});

test('read default value', () => {
  const store = makeStore();
  expect(getRecoilValueAsLoadable(store, a)).toMatchObject({
    state: 'hasValue',
    contents: 0,
  });
});

test('read written value, visited contains written value', () => {
  const store = makeStore();
  setRecoilValue(store, a, 1);
  expect(getRecoilValueAsLoadable(store, a)).toMatchObject({
    state: 'hasValue',
    contents: 1,
  });
});

test('read selector based on default upstream', () => {
  const store = makeStore();
  expect(getRecoilValueAsLoadable(store, dependsOnA).contents).toEqual(1);
});

test('read selector based on written upstream', () => {
  const store = makeStore();
  setRecoilValue(store, a, 1);
  expect(getRecoilValueAsLoadable(store, dependsOnA).contents).toEqual(2);
});

test('selector subscriber is called when upstream changes', () => {
  const store = makeStore();
  const callback = jest.fn();
  const {release} = subscribeToRecoilValue(store, dependsOnA, callback);
  getRecoilValueAsLoadable(store, dependsOnA);
  expect(callback).toHaveBeenCalledTimes(0);
  setRecoilValue(store, a, 1);
  expect(callback).toHaveBeenCalledTimes(1);
  release(store);
  setRecoilValue(store, a, 2);
  expect(callback).toHaveBeenCalledTimes(1);
});

test('selector is recursively visited when subscribed and upstream changes', () => {
  const store = makeStore();
  const callback = jest.fn();
  const {release} = subscribeToRecoilValue(
    store,
    dependsOnDependsOnA,
    callback,
  );
  getRecoilValueAsLoadable(store, dependsOnDependsOnA);
  expect(callback).toHaveBeenCalledTimes(0);
  setRecoilValue(store, a, 1);
  expect(callback).toHaveBeenCalledTimes(1);
  release(store);
  setRecoilValue(store, a, 2);
  expect(callback).toHaveBeenCalledTimes(1);
});

test('selector function is evaluated only on first read', () => {
  dependsOnAFn.mockClear();
  const store = makeStore();
  const callback = jest.fn();
  subscribeToRecoilValue(store, dependsOnA, callback);
  getRecoilValueAsLoadable(store, dependsOnA);
  expect(dependsOnAFn).toHaveBeenCalledTimes(1); // called once on initial read
  act(() => setRecoilValue(store, a, 1337)); // input number must not be used in any other test due to selector-internal caching
  getRecoilValueAsLoadable(store, dependsOnA);
  expect(dependsOnAFn).toHaveBeenCalledTimes(2); // called again on read following upstream change
  getRecoilValueAsLoadable(store, dependsOnA);
  expect(dependsOnAFn).toHaveBeenCalledTimes(2); // not called on subsequent read with no upstream change
});

test('atom can go from unvalidated to normal value', () => {
  const store = makeStore();
  setUnvalidatedRecoilValue(store, b, '1');
  expect(getRecoilValueAsLoadable(store, b)).toMatchObject({
    state: 'hasValue',
    contents: 1,
  });
  setRecoilValue(store, b, 2);
  expect(getRecoilValueAsLoadable(store, b)).toMatchObject({
    state: 'hasValue',
    contents: 2,
  });
});

test('atom can go from normal to unvalidated value', () => {
  const store = makeStore();
  setRecoilValue(store, b, 1);
  expect(getRecoilValueAsLoadable(store, b)).toMatchObject({
    state: 'hasValue',
    contents: 1,
  });
  setUnvalidatedRecoilValue(store, b, '2');
  expect(getRecoilValueAsLoadable(store, b)).toMatchObject({
    state: 'hasValue',
    contents: 2,
  });
});

test('atom can go from unvalidated to unvalidated value', () => {
  // Regression test for an issue where setting an unvalidated value when
  // already in a has-unvalidated-value state would result in a stale value:
  const store = makeStore();
  setUnvalidatedRecoilValue(store, b, '1');
  expect(getRecoilValueAsLoadable(store, b)).toMatchObject({
    state: 'hasValue',
    contents: 1,
  });
  setUnvalidatedRecoilValue(store, b, '2');
  expect(getRecoilValueAsLoadable(store, b)).toMatchObject({
    state: 'hasValue',
    contents: 2,
  });
});
