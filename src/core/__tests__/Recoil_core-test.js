/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow
 * @format
 */
'use strict';

const atom = require('../../recoil_values/Recoil_atom');
const {makeStore} = require('../../testing/Recoil_TestingUtils');
const nullthrows = require('../../util/Recoil_nullthrows');
const {getNodeLoadable, setNodeValue} = require('../Recoil_FunctionalCore');

const a = atom<number>({key: 'a', default: 0}).key;

test('read default value', () => {
  const store = makeStore();
  expect(
    getNodeLoadable(store, store.getState().currentTree, a)[1],
  ).toMatchObject({
    state: 'hasValue',
    contents: 0,
  });
});

test('setNodeValue returns empty deps and written value when writing atom', () => {
  const store = makeStore();
  const [depMap, writes] = setNodeValue(
    store,
    store.getState().currentTree,
    a,
    1,
  );
  expect(depMap.size).toBe(0);
  expect(nullthrows(writes.get(a)).contents).toBe(1);
});
