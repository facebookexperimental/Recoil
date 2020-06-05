/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+obviz
 * @flow strict-local
 * @format
 */
'use strict';

const {act} = require('ReactTestUtils');

const atom = require('../../recoil_values/Recoil_atom');
const constSelector = require('../../recoil_values/Recoil_const');
const {asyncSelector} = require('../../testing/Recoil_TestingUtils');
const {Snapshot, freshSnapshot} = require('../Recoil_Snapshot');

test('Read default loadable from snapshot', () => {
  const snapshot: Snapshot = freshSnapshot();

  const myAtom = atom({
    key: 'Snapshot Atom Default',
    default: 'DEFAULT',
  });

  const atomLoadable = snapshot.getLoadable(myAtom);
  expect(atomLoadable.state).toEqual('hasValue');
  expect(atomLoadable.contents).toEqual('DEFAULT');

  const mySelector = constSelector(myAtom);
  const selectorLoadable = snapshot.getLoadable(mySelector);
  expect(selectorLoadable.state).toEqual('hasValue');
  expect(selectorLoadable.contents).toEqual('DEFAULT');
});

test('Read async selector from snapshot', async () => {
  const snapshot = freshSnapshot();

  const [asyncSel, resolve] = asyncSelector();
  const nestSel = constSelector(asyncSel);

  expect(snapshot.getLoadable(asyncSel).state).toEqual('loading');
  expect(snapshot.getLoadable(nestSel).state).toEqual('loading');

  act(() => resolve('SET VALUE'));
  await expect(snapshot.getPromise(asyncSel)).resolves.toEqual('SET VALUE');
  await expect(snapshot.getPromise(nestSel)).resolves.toEqual('SET VALUE');
});
