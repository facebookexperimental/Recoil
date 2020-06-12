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
  const otherA = freshSnapshot();
  const otherB = freshSnapshot();

  const [asyncSel, resolve] = asyncSelector();
  const nestSel = constSelector(asyncSel);

  expect(snapshot.getLoadable(asyncSel).state).toEqual('loading');
  expect(snapshot.getLoadable(nestSel).state).toEqual('loading');
  expect(otherA.getLoadable(nestSel).state).toEqual('loading');
  const otherC = snapshot.map(() => {});

  // eslint-disable-next-line jest/valid-expect
  const ptest = expect(snapshot.getPromise(asyncSel)).resolves.toEqual(
    'SET VALUE',
  );

  act(() => resolve('SET VALUE'));
  await ptest;
  await expect(snapshot.getPromise(asyncSel)).resolves.toEqual('SET VALUE');
  expect(snapshot.getLoadable(asyncSel).contents).toEqual('SET VALUE');
  await expect(snapshot.getPromise(nestSel)).resolves.toEqual('SET VALUE');
  await expect(otherA.getPromise(nestSel)).resolves.toEqual('SET VALUE');
  await expect(otherB.getPromise(nestSel)).resolves.toEqual('SET VALUE');
  await expect(otherC.getPromise(nestSel)).resolves.toEqual('SET VALUE');
});

test('Sync map of snapshot', () => {
  const snapshot = freshSnapshot();

  const myAtom = atom({
    key: 'Snapshot Map Sync',
    default: 'DEFAULT',
  });
  const mySelector = constSelector(myAtom);

  const atomLoadable = snapshot.getLoadable(myAtom);
  expect(atomLoadable.state).toEqual('hasValue');
  expect(atomLoadable.contents).toEqual('DEFAULT');
  const selectorLoadable = snapshot.getLoadable(mySelector);
  expect(selectorLoadable.state).toEqual('hasValue');
  expect(selectorLoadable.contents).toEqual('DEFAULT');

  const setSnapshot = snapshot.map(({set}) => {
    set(myAtom, 'SET');
  });
  const setAtomLoadable = setSnapshot.getLoadable(myAtom);
  expect(setAtomLoadable.state).toEqual('hasValue');
  expect(setAtomLoadable.contents).toEqual('SET');
  const setSelectorLoadable = setSnapshot.getLoadable(myAtom);
  expect(setSelectorLoadable.state).toEqual('hasValue');
  expect(setSelectorLoadable.contents).toEqual('SET');

  const resetSnapshot = snapshot.map(({reset}) => {
    reset(myAtom);
  });
  const resetAtomLoadable = resetSnapshot.getLoadable(myAtom);
  expect(resetAtomLoadable.state).toEqual('hasValue');
  expect(resetAtomLoadable.contents).toEqual('DEFAULT');
  const resetSelectorLoadable = resetSnapshot.getLoadable(myAtom);
  expect(resetSelectorLoadable.state).toEqual('hasValue');
  expect(resetSelectorLoadable.contents).toEqual('DEFAULT');
});

test('Async map of snapshot', async () => {
  const snapshot = freshSnapshot();

  const myAtom = atom({
    key: 'Snapshot Map Async',
    default: 'DEFAULT',
  });
  const [asyncSel, resolve] = asyncSelector();

  const newSnapshotPromise = snapshot.asyncMap(async ({getPromise, set}) => {
    const value = await getPromise(asyncSel);
    expect(value).toEqual('VALUE');
    set(myAtom, value);
  });

  act(() => resolve('VALUE'));

  const newSnapshot = await newSnapshotPromise;
  const value = await newSnapshot.getPromise(myAtom);
  expect(value).toEqual('VALUE');
});
