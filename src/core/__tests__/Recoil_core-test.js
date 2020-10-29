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

const {getRecoilTestFn} = require('../../testing/Recoil_TestingUtils');

let a, atom, store, nullthrows, getNodeLoadable, setNodeValue;

const testRecoil = getRecoilTestFn(() => {
  const {makeStore} = require('../../testing/Recoil_TestingUtils');

  atom = require('../../recoil_values/Recoil_atom');
  nullthrows = require('../../util/Recoil_nullthrows');
  ({getNodeLoadable, setNodeValue} = require('../Recoil_FunctionalCore'));

  a = atom<number>({key: 'a', default: 0}).key;

  store = makeStore();
});

testRecoil('read default value', () => {
  expect(
    getNodeLoadable(store, store.getState().currentTree, a)[1],
  ).toMatchObject({
    state: 'hasValue',
    contents: 0,
  });
});

testRecoil(
  'setNodeValue returns empty deps and written value when writing atom',
  () => {
    const [depMap, writes] = setNodeValue(
      store,
      store.getState().currentTree,
      a,
      1,
    );
    expect(depMap.size).toBe(0);
    expect(nullthrows(writes.get(a)).contents).toBe(1);
  },
);
