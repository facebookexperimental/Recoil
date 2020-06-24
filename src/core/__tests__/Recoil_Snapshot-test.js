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
const constSelector = require('../../recoil_values/Recoil_constSelector');
const selector = require('../../recoil_values/Recoil_selector');
const {asyncSelector} = require('../../testing/Recoil_TestingUtils');
const {Snapshot, freshSnapshot} = require('../Recoil_Snapshot');

// Test first since we are testing all registered nodes
test('getNodes', () => {
  const snapshot = freshSnapshot();
  const {getNodes_UNSTABLE} = snapshot;
  expect(Array.from(getNodes_UNSTABLE({status: 'registered'})).length).toEqual(
    0,
  );
  expect(Array.from(getNodes_UNSTABLE()).length).toEqual(0);
  expect(Array.from(getNodes_UNSTABLE({status: 'set'})).length).toEqual(0);

  // Test atoms
  const myAtom = atom({key: 'snapshot getNodes atom', default: 'DEFAULT'});
  expect(Array.from(getNodes_UNSTABLE({status: 'registered'})).length).toEqual(
    1,
  );
  expect(Array.from(getNodes_UNSTABLE()).length).toEqual(0);
  expect(snapshot.getLoadable(myAtom).contents).toEqual('DEFAULT');
  const nodesAfterGet = Array.from(getNodes_UNSTABLE());
  expect(nodesAfterGet.length).toEqual(1);
  expect(nodesAfterGet[0]).toBe(myAtom);
  expect(snapshot.getLoadable(nodesAfterGet[0]).contents).toEqual('DEFAULT');

  // Test selectors
  const mySelector = selector({
    key: 'snapshot getNodes selector',
    get: ({get}) => get(myAtom) + '-SELECTOR',
  });
  expect(Array.from(getNodes_UNSTABLE({status: 'registered'})).length).toEqual(
    2,
  );
  expect(Array.from(getNodes_UNSTABLE()).length).toEqual(1);
  expect(snapshot.getLoadable(mySelector).contents).toEqual('DEFAULT-SELECTOR');
  expect(Array.from(getNodes_UNSTABLE()).length).toEqual(2);
  expect(Array.from(getNodes_UNSTABLE({types: ['atom']})).length).toEqual(1);
  const selectorNodes = Array.from(getNodes_UNSTABLE({types: ['selector']}));
  expect(selectorNodes.length).toEqual(1);
  expect(selectorNodes[0]).toBe(mySelector);

  // Test dirty atoms
  expect(Array.from(getNodes_UNSTABLE({status: 'registered'})).length).toEqual(
    2,
  );
  expect(Array.from(getNodes_UNSTABLE({status: 'set'})).length).toEqual(0);
  expect(
    Array.from(snapshot.getNodes_UNSTABLE({types: ['atom'], modified: true}))
      .length,
  ).toEqual(0);
  const updatedSnapshot = snapshot.map(({set}) => set(myAtom, 'SET'));
  expect(
    Array.from(snapshot.getNodes_UNSTABLE({types: ['atom'], modified: true}))
      .length,
  ).toEqual(0);
  expect(
    Array.from(
      updatedSnapshot.getNodes_UNSTABLE({types: ['atom'], modified: true}),
    ).length,
  ).toEqual(1);
  expect(
    Array.from(snapshot.getNodes_UNSTABLE({status: 'set'})).length,
  ).toEqual(0);
  expect(
    Array.from(updatedSnapshot.getNodes_UNSTABLE({status: 'set'})).length,
  ).toEqual(1);
  const dirtyAtom = Array.from(
    updatedSnapshot.getNodes_UNSTABLE({types: ['atom'], modified: true}),
  )[0];
  expect(snapshot.getLoadable(dirtyAtom).contents).toEqual('DEFAULT');
  expect(updatedSnapshot.getLoadable(dirtyAtom).contents).toEqual('SET');

  // Test reset
  const resetSnapshot = updatedSnapshot.map(({reset}) => reset(myAtom));
  expect(
    Array.from(
      resetSnapshot.getNodes_UNSTABLE({types: ['atom'], modified: true}),
    ).length,
  ).toEqual(1);
  expect(
    Array.from(resetSnapshot.getNodes_UNSTABLE({status: 'set'})).length,
  ).toEqual(0);

  // TODO Test dirty selectors
});

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

test('getDeps', () => {
  const snapshot = freshSnapshot();

  const myAtom = atom<string>({key: 'snapshot getDeps atom', default: 'ATOM'});
  const selectorA = selector({
    key: 'getDepsA',
    get: ({get}) => get(myAtom),
  });
  const selectorB = selector({
    key: 'getDepsB',
    get: ({get}) => get(selectorA) + get(myAtom),
  });
  const selectorC = selector({
    key: 'getDepsC',
    get: async ({get}) => {
      const ret = get(selectorA) + get(selectorB);
      await Promise.resolve();
      return ret;
    },
  });

  expect(Array.from(snapshot.getDeps_UNSTABLE(myAtom))).toEqual([]);
  expect(Array.from(snapshot.getDeps_UNSTABLE(selectorA))).toEqual(
    expect.arrayContaining([myAtom]),
  );
  expect(Array.from(snapshot.getDeps_UNSTABLE(selectorB))).toEqual(
    expect.arrayContaining([selectorA, myAtom]),
  );
  expect(Array.from(snapshot.getDeps_UNSTABLE(selectorC))).toEqual(
    expect.arrayContaining([selectorA, selectorB]),
  );
});

describe('getSubscriptions', () => {
  test('nodes', () => {
    const snapshot = freshSnapshot();

    const myAtom = atom<string>({
      key: 'snapshot getSubscriptions atom',
      default: 'ATOM',
    });
    const selectorA = selector({
      key: 'getSubscriptions A',
      get: ({get}) => get(myAtom),
    });
    const selectorB = selector({
      key: 'getSubscriptions B',
      get: ({get}) => get(selectorA) + get(myAtom),
    });
    const selectorC = selector({
      key: 'getSubscriptions C',
      get: async ({get}) => {
        const ret = get(selectorA) + get(selectorB);
        await Promise.resolve();
        return ret;
      },
    });

    // No initial subscribers
    expect(Array.from(snapshot.getSubscribers_UNSTABLE(myAtom).nodes)).toEqual(
      expect.arrayContaining([]),
    );
    expect(
      Array.from(snapshot.getSubscribers_UNSTABLE(selectorC).nodes),
    ).toEqual(expect.arrayContaining([]));

    // Evaluate selectorC to update all of its upstream node subscriptions
    snapshot.getLoadable(selectorC);
    expect(Array.from(snapshot.getSubscribers_UNSTABLE(myAtom).nodes)).toEqual(
      expect.arrayContaining([selectorA, selectorB, selectorC]),
    );
    expect(
      Array.from(snapshot.getSubscribers_UNSTABLE(selectorA).nodes),
    ).toEqual(expect.arrayContaining([selectorB, selectorC]));
    expect(
      Array.from(snapshot.getSubscribers_UNSTABLE(selectorB).nodes),
    ).toEqual(expect.arrayContaining([selectorC]));
    expect(
      Array.from(snapshot.getSubscribers_UNSTABLE(selectorC).nodes),
    ).toEqual(expect.arrayContaining([]));
  });
});
