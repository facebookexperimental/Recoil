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

const atom = require('../../recoil_values/Recoil_atom');
const {
  getRecoilValueAsLoadable,
  peekRecoilValueAsLoadable,
  setRecoilValue,
  subscribeToRecoilValue,
} = require('../Recoil_RecoilValue');
const selector = require('../../recoil_values/Recoil_selector');
const {makeStore} = require('../../testing/Recoil_TestingUtils');

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

test('read default value', () => {
  const store = makeStore();
  expect(peekRecoilValueAsLoadable(store, a)).toMatchObject({
    state: 'hasValue',
    contents: 0,
  });
});

test('read written value, visited contains written value', () => {
  const store = makeStore();
  setRecoilValue(store, a, 1);
  expect(peekRecoilValueAsLoadable(store, a)).toMatchObject({
    state: 'hasValue',
    contents: 1,
  });
});

test('read selector based on default upstream', () => {
  const store = makeStore();
  expect(peekRecoilValueAsLoadable(store, dependsOnA).contents).toEqual(1);
});

test('read selector based on written upstream', () => {
  const store = makeStore();
  setRecoilValue(store, a, 1);
  expect(peekRecoilValueAsLoadable(store, dependsOnA).contents).toEqual(2);
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
