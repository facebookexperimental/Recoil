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

const {getRecoilTestFn} = require('../../testing/Recoil_TestingUtils');

let act,
  atom,
  selector,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
  a,
  dependsOnAFn,
  dependsOnA,
  dependsOnDependsOnA,
  b,
  store;

const testRecoil = getRecoilTestFn(() => {
  const {makeStore} = require('../../testing/Recoil_TestingUtils');

  ({act} = require('ReactTestUtils'));
  atom = require('../../recoil_values/Recoil_atom');
  selector = require('../../recoil_values/Recoil_selector');
  ({
    getRecoilValueAsLoadable,
    setRecoilValue,
    setUnvalidatedRecoilValue,
    subscribeToRecoilValue,
  } = require('../Recoil_RecoilValueInterface'));

  a = atom<number>({key: 'a', default: 0});

  dependsOnAFn = jest.fn(x => x + 1);

  dependsOnA = selector({
    key: 'dependsOnA',
    get: ({get}) => dependsOnAFn(get(a)),
  });

  dependsOnDependsOnA = selector({
    key: 'dependsOnDependsOnA',
    get: ({get}) => get(dependsOnA) + 1,
  });

  b = atom<number>({
    key: 'b',
    default: 0,
    persistence_UNSTABLE: {
      type: 'url',
      validator: x => parseInt(x, 10),
    },
  });

  store = makeStore();
});

testRecoil('read default value', () => {
  expect(getRecoilValueAsLoadable(store, a)).toMatchObject({
    state: 'hasValue',
    contents: 0,
  });
});

testRecoil('read written value, visited contains written value', () => {
  setRecoilValue(store, a, 1);
  expect(getRecoilValueAsLoadable(store, a)).toMatchObject({
    state: 'hasValue',
    contents: 1,
  });
});

testRecoil('read selector based on default upstream', () => {
  expect(getRecoilValueAsLoadable(store, dependsOnA).contents).toEqual(1);
});

testRecoil('read selector based on written upstream', () => {
  setRecoilValue(store, a, 1);
  expect(getRecoilValueAsLoadable(store, dependsOnA).contents).toEqual(2);
});

testRecoil('selector subscriber is called when upstream changes', () => {
  const callback = jest.fn();
  const {release} = subscribeToRecoilValue(store, dependsOnA, callback);
  getRecoilValueAsLoadable(store, dependsOnA);
  expect(callback).toHaveBeenCalledTimes(0);
  setRecoilValue(store, a, 1);
  expect(callback).toHaveBeenCalledTimes(1);
  release();
  setRecoilValue(store, a, 2);
  expect(callback).toHaveBeenCalledTimes(1);
});

testRecoil(
  'selector is recursively visited when subscribed and upstream changes',
  () => {
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
    release();
    setRecoilValue(store, a, 2);
    expect(callback).toHaveBeenCalledTimes(1);
  },
);

testRecoil('selector function is evaluated only on first read', () => {
  dependsOnAFn.mockClear();
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

testRecoil('atom can go from unvalidated to normal value', () => {
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

testRecoil('atom can go from normal to unvalidated value', () => {
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

testRecoil('atom can go from unvalidated to unvalidated value', () => {
  // Regression test for an issue where setting an unvalidated value when
  // already in a has-unvalidated-value state would result in a stale value:
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
