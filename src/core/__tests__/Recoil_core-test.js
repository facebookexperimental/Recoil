/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+perf_viz
 * @flow
 * @format
 */
'use strict';

const React = require('React');
const atom = require('../../recoil_values/Recoil_atom');
const {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  subscribeComponentToNode,
} = require('../Recoil_FunctionalCore');
const {RecoilState} = require('../Recoil_RecoilValue');
const selector = require('../../recoil_values/Recoil_selector');
const {makeStore} = require('../../testing/Recoil_TestingUtils');

const immutable = require('immutable');

const a = atom<number>({key: 'a', default: 0}).key;
const dependsOnAFn = jest.fn(x => x + 1);
const dependsOnA = selector({
  key: 'dependsOnA',
  get: ({get}) => dependsOnAFn(get(new RecoilState(a))),
}).key;

test('read default value', () => {
  const store = makeStore();
  expect(
    peekNodeLoadable(store, store.getState().currentTree, a),
  ).toMatchObject({
    state: 'hasValue',
    contents: 0,
  });
});

test('read written value, visited contains written value', () => {
  const store = makeStore();
  const [state, writtenNodes] = setNodeValue(
    store,
    store.getState().currentTree,
    a,
    1,
  );
  expect(peekNodeLoadable(store, state, a)).toMatchObject({
    state: 'hasValue',
    contents: 1,
  });
  expect(writtenNodes.has(a)).toBe(true);
});

test('read selector based on default upstream', () => {
  const store = makeStore();
  expect(
    peekNodeLoadable(store, store.getState().currentTree, dependsOnA).contents,
  ).toEqual(1);
});

test('read selector based on written upstream', () => {
  const store = makeStore();
  const [state, _] = setNodeValue(store, store.getState().currentTree, a, 1);
  expect(peekNodeLoadable(store, state, dependsOnA).contents).toEqual(2);
});

test('selector function is evaluated only on first read', () => {
  dependsOnAFn.mockClear();
  const store = makeStore();
  let [state, _] = subscribeComponentToNode(
    store.getState().currentTree,
    dependsOnA,
    () => undefined,
  );
  [state, _] = getNodeLoadable(store, state, dependsOnA);
  [state, _] = setNodeValue(store, state, a, 2);
  expect(dependsOnAFn).toHaveBeenCalledTimes(1);
  peekNodeLoadable(store, state, dependsOnA);
  expect(dependsOnAFn).toHaveBeenCalledTimes(2);
  peekNodeLoadable(store, state, dependsOnA);
  expect(dependsOnAFn).toHaveBeenCalledTimes(2);
});

test('object is frozen when stored in atom', () => {
  const anAtom = atom<{x: mixed, ...}>({key: 'anAtom', default: {x: 0}}).key;

  function valueBySettingAndThenGetting<T>(value: T): T {
    const store = makeStore();
    const [state, _] = setNodeValue(
      store,
      store.getState().currentTree,
      anAtom,
      value,
    );
    return (peekNodeLoadable(store, state, anAtom).contents: any);
  }

  function isFrozen(value, getter = x => x) {
    const object = valueBySettingAndThenGetting({x: value});
    return Object.isFrozen(getter(object.x));
  }

  expect(isFrozen({y: 0})).toBe(true);

  // React elements are not deep-frozen (they are already shallow-frozen on creation):
  const element = {
    ...(<div />),
    _owner: {ifThisWereAReactFiberItShouldNotBeFrozen: true},
  };
  expect(isFrozen(element, x => (x: any)._owner)).toBe(false);

  // Immutable stuff is not frozen:
  expect(isFrozen(immutable.List())).toBe(false);
  expect(isFrozen(immutable.Map())).toBe(false);
  expect(isFrozen(immutable.OrderedMap())).toBe(false);
  expect(isFrozen(immutable.Set())).toBe(false);
  expect(isFrozen(immutable.OrderedSet())).toBe(false);
  expect(isFrozen(immutable.Seq())).toBe(false);
  expect(isFrozen(immutable.Stack())).toBe(false);
  expect(isFrozen(immutable.Range())).toBe(false);
  expect(isFrozen(immutable.Repeat())).toBe(false);
  expect(isFrozen(new (immutable.Record({}))())).toBe(false);
});
