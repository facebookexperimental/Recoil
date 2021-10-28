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

const {getRecoilTestFn} = require('../../__test_utils__/Recoil_TestingUtils');

let React,
  act,
  useGotoRecoilSnapshot,
  useRecoilTransactionObserver,
  atom,
  constSelector,
  selector,
  ReadsAtom,
  asyncSelector,
  componentThatReadsAndWritesAtom,
  renderElements,
  Snapshot,
  freshSnapshot;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({act} = require('ReactTestUtils'));

  ({
    useGotoRecoilSnapshot,
    useRecoilTransactionObserver,
  } = require('../../hooks/Recoil_SnapshotHooks'));
  atom = require('../../recoil_values/Recoil_atom');
  constSelector = require('../../recoil_values/Recoil_constSelector');
  selector = require('../../recoil_values/Recoil_selector');
  ({
    ReadsAtom,
    asyncSelector,
    componentThatReadsAndWritesAtom,
    renderElements,
  } = require('../../__test_utils__/Recoil_TestingUtils'));
  ({Snapshot, freshSnapshot} = require('../Recoil_Snapshot'));
});

// Test first since we are testing all registered nodes
testRecoil('getNodes', () => {
  const snapshot = freshSnapshot();
  const {getNodes_UNSTABLE} = snapshot;
  expect(Array.from(getNodes_UNSTABLE()).length).toEqual(0);
  expect(Array.from(getNodes_UNSTABLE({isInitialized: true})).length).toEqual(
    0,
  );
  // expect(Array.from(getNodes_UNSTABLE({isSet: true})).length).toEqual(0);

  // Test atoms
  const myAtom = atom({key: 'snapshot getNodes atom', default: 'DEFAULT'});
  expect(Array.from(getNodes_UNSTABLE()).length).toEqual(1);
  expect(Array.from(getNodes_UNSTABLE({isInitialized: true})).length).toEqual(
    0,
  );
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
  expect(Array.from(getNodes_UNSTABLE()).length).toEqual(2);
  expect(Array.from(getNodes_UNSTABLE({isInitialized: true})).length).toEqual(
    1,
  );
  expect(snapshot.getLoadable(mySelector).contents).toEqual('DEFAULT-SELECTOR');
  expect(Array.from(getNodes_UNSTABLE({isInitialized: true})).length).toEqual(
    2,
  );
  // expect(Array.from(getNodes_UNSTABLE({types: ['atom']})).length).toEqual(1);
  // const selectorNodes = Array.from(getNodes_UNSTABLE({types: ['selector']}));
  // expect(selectorNodes.length).toEqual(1);
  // expect(selectorNodes[0]).toBe(mySelector);

  // Test dirty atoms
  expect(Array.from(getNodes_UNSTABLE()).length).toEqual(2);
  // expect(Array.from(getNodes_UNSTABLE({isSet: true})).length).toEqual(0);
  expect(
    Array.from(snapshot.getNodes_UNSTABLE({isModified: true})).length,
  ).toEqual(0);
  const updatedSnapshot = snapshot.map(({set}) => set(myAtom, 'SET'));
  expect(
    Array.from(snapshot.getNodes_UNSTABLE({isModified: true})).length,
  ).toEqual(0);
  expect(
    Array.from(updatedSnapshot.getNodes_UNSTABLE({isModified: true})).length,
  ).toEqual(1);
  // expect(
  //   Array.from(snapshot.getNodes_UNSTABLE({isSet: true})).length,
  // ).toEqual(0);
  // expect(
  //   Array.from(updatedSnapshot.getNodes_UNSTABLE({isSet: true})).length,
  // ).toEqual(1);
  const dirtyAtom = Array.from(
    updatedSnapshot.getNodes_UNSTABLE({isModified: true}),
  )[0];
  expect(snapshot.getLoadable(dirtyAtom).contents).toEqual('DEFAULT');
  expect(updatedSnapshot.getLoadable(dirtyAtom).contents).toEqual('SET');

  // Test reset
  const resetSnapshot = updatedSnapshot.map(({reset}) => reset(myAtom));
  expect(
    Array.from(resetSnapshot.getNodes_UNSTABLE({isModified: true})).length,
  ).toEqual(1);
  // expect(
  //   Array.from(resetSnapshot.getNodes_UNSTABLE({isSet: true})).length,
  // ).toEqual(0);

  // TODO Test dirty selectors
});

testRecoil(
  'State ID after going to snapshot matches the ID of the snapshot',
  () => {
    const seenIDs = new Set();
    const snapshots = [];
    let expectedSnapshotID = null;

    const myAtom = atom({key: 'Snapshot ID atom', default: 0});
    // $FlowFixMe[incompatible-call] added when improving typing for this parameters
    const mySelector = constSelector(myAtom); // For read-only testing below

    const transactionObserver = ({snapshot}) => {
      const snapshotID = snapshot.getID();
      if (expectedSnapshotID != null) {
        expect(seenIDs.has(snapshotID)).toBe(true);
        expect(snapshotID).toBe(expectedSnapshotID);
      } else {
        expect(seenIDs.has(snapshotID)).toBe(false);
      }
      seenIDs.add(snapshotID);
      snapshot.retain();
      snapshots.push({snapshotID, snapshot});
    };
    function TransactionObserver() {
      useRecoilTransactionObserver(transactionObserver);
      return null;
    }

    let gotoSnapshot;
    function GotoSnapshot() {
      gotoSnapshot = useGotoRecoilSnapshot();
      return null;
    }

    const [WriteAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);
    const c = renderElements(
      <>
        <TransactionObserver />
        <GotoSnapshot />
        <WriteAtom />
        <ReadsAtom atom={mySelector} />
      </>,
    );
    expect(c.textContent).toBe('00');

    // Test changing state produces a new state version
    act(() => setAtom(1));
    act(() => setAtom(2));
    expect(snapshots.length).toBe(2);
    expect(seenIDs.size).toBe(2);

    // Test going to a previous snapshot re-uses the state ID
    expectedSnapshotID = snapshots[0].snapshotID;
    act(() => gotoSnapshot(snapshots[0].snapshot));

    // Test changing state after going to a previous snapshot uses a new version
    expectedSnapshotID = null;
    act(() => setAtom(3));

    // Test mutating a snapshot creates a new version
    const transactionSnapshot = snapshots[0].snapshot.map(({set}) => {
      set(myAtom, 4);
    });
    act(() => gotoSnapshot(transactionSnapshot));

    expect(seenIDs.size).toBe(4);
    expect(snapshots.length).toBe(5);

    // Test that added read-only selector doesn't cause an issue getting the
    // current version to see the current deps of the selector since we mutated a
    // state after going to a snapshot, so that version may not be known by the store.
    // If there was a problem, then the component may throw an error when evaluating the selector.
    expect(c.textContent).toBe('44');
  },
);

testRecoil('Read default loadable from snapshot', () => {
  const snapshot: Snapshot = freshSnapshot();

  const myAtom = atom({
    key: 'Snapshot Atom Default',
    default: 'DEFAULT',
  });

  const atomLoadable = snapshot.getLoadable(myAtom);
  expect(atomLoadable.state).toEqual('hasValue');
  expect(atomLoadable.contents).toEqual('DEFAULT');

  // $FlowFixMe[incompatible-call] added when improving typing for this parameters
  const mySelector = constSelector(myAtom);
  const selectorLoadable = snapshot.getLoadable(mySelector);
  expect(selectorLoadable.state).toEqual('hasValue');
  expect(selectorLoadable.contents).toEqual('DEFAULT');
});

testRecoil('Read async selector from snapshot', async () => {
  const snapshot = freshSnapshot();
  const otherA = freshSnapshot();
  const otherB = freshSnapshot();

  const [asyncSel, resolve] = asyncSelector();
  // $FlowFixMe[incompatible-call] added when improving typing for this parameters
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

testRecoil('Sync map of snapshot', () => {
  const snapshot = freshSnapshot();

  const myAtom = atom({
    key: 'Snapshot Map Sync',
    default: 'DEFAULT',
  });
  // $FlowFixMe[incompatible-call] added when improving typing for this parameters
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

testRecoil('Async map of snapshot', async () => {
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

testRecoil('getInfo', () => {
  const snapshot = freshSnapshot();

  const myAtom = atom<string>({
    key: 'snapshot getInfo atom',
    default: 'DEFAULT',
  });
  const selectorA = selector({
    key: 'getInfo A',
    get: ({get}) => get(myAtom),
  });
  const selectorB = selector({
    key: 'getInfo B',
    get: ({get}) => get(selectorA) + get(myAtom),
  });

  // Initial status
  expect(snapshot.getInfo_UNSTABLE(myAtom)).toMatchObject({
    loadable: expect.objectContaining({state: 'hasValue', contents: 'DEFAULT'}),
    isActive: false,
    isSet: false,
    isModified: false,
    type: undefined,
  });
  expect(Array.from(snapshot.getInfo_UNSTABLE(myAtom).deps)).toEqual([]);
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(myAtom).subscribers.nodes),
  ).toEqual([]);
  expect(snapshot.getInfo_UNSTABLE(selectorA)).toMatchObject({
    loadable: undefined,
    isActive: false,
    isSet: false,
    isModified: false,
    type: undefined,
  });
  expect(Array.from(snapshot.getInfo_UNSTABLE(selectorA).deps)).toEqual([]);
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(selectorA).subscribers.nodes),
  ).toEqual([]);
  expect(snapshot.getInfo_UNSTABLE(selectorB)).toMatchObject({
    loadable: undefined,
    isActive: false,
    isSet: false,
    isModified: false,
    type: undefined,
  });
  expect(Array.from(snapshot.getInfo_UNSTABLE(selectorB).deps)).toEqual([]);
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(selectorB).subscribers.nodes),
  ).toEqual([]);

  // After reading values
  snapshot.getLoadable(selectorB);
  expect(snapshot.getInfo_UNSTABLE(myAtom)).toMatchObject({
    loadable: expect.objectContaining({state: 'hasValue', contents: 'DEFAULT'}),
    isActive: true,
    isSet: false,
    isModified: false,
    type: 'atom',
  });
  expect(Array.from(snapshot.getInfo_UNSTABLE(myAtom).deps)).toEqual([]);
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(myAtom).subscribers.nodes),
  ).toEqual(expect.arrayContaining([selectorA, selectorB]));
  expect(snapshot.getInfo_UNSTABLE(selectorA)).toMatchObject({
    loadable: expect.objectContaining({state: 'hasValue', contents: 'DEFAULT'}),
    isActive: true,
    isSet: false,
    isModified: false,
    type: 'selector',
  });
  expect(Array.from(snapshot.getInfo_UNSTABLE(selectorA).deps)).toEqual(
    expect.arrayContaining([myAtom]),
  );
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(selectorA).subscribers.nodes),
  ).toEqual(expect.arrayContaining([selectorB]));
  expect(snapshot.getInfo_UNSTABLE(selectorB)).toMatchObject({
    loadable: expect.objectContaining({
      state: 'hasValue',
      contents: 'DEFAULTDEFAULT',
    }),
    isActive: true,
    isSet: false,
    isModified: false,
    type: 'selector',
  });
  expect(Array.from(snapshot.getInfo_UNSTABLE(selectorB).deps)).toEqual(
    expect.arrayContaining([myAtom, selectorA]),
  );
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(selectorB).subscribers.nodes),
  ).toEqual([]);

  // After setting a value
  const setSnapshot = snapshot.map(({set}) => set(myAtom, 'SET'));
  setSnapshot.getLoadable(selectorB); // Read value to prime
  expect(setSnapshot.getInfo_UNSTABLE(myAtom)).toMatchObject({
    loadable: expect.objectContaining({state: 'hasValue', contents: 'SET'}),
    isActive: true,
    isSet: true,
    isModified: true,
    type: 'atom',
  });
  expect(Array.from(setSnapshot.getInfo_UNSTABLE(myAtom).deps)).toEqual([]);
  expect(
    Array.from(setSnapshot.getInfo_UNSTABLE(myAtom).subscribers.nodes),
  ).toEqual(expect.arrayContaining([selectorA, selectorB]));
  expect(setSnapshot.getInfo_UNSTABLE(selectorA)).toMatchObject({
    loadable: expect.objectContaining({state: 'hasValue', contents: 'SET'}),
    isActive: true,
    isSet: false,
    isModified: false,
    type: 'selector',
  });
  expect(Array.from(setSnapshot.getInfo_UNSTABLE(selectorA).deps)).toEqual(
    expect.arrayContaining([myAtom]),
  );
  expect(
    Array.from(setSnapshot.getInfo_UNSTABLE(selectorA).subscribers.nodes),
  ).toEqual(expect.arrayContaining([selectorB]));
  expect(setSnapshot.getInfo_UNSTABLE(selectorB)).toMatchObject({
    loadable: expect.objectContaining({state: 'hasValue', contents: 'SETSET'}),
    isActive: true,
    isSet: false,
    isModified: false,
    type: 'selector',
  });
  expect(Array.from(setSnapshot.getInfo_UNSTABLE(selectorB).deps)).toEqual(
    expect.arrayContaining([myAtom, selectorA]),
  );
  expect(
    Array.from(setSnapshot.getInfo_UNSTABLE(selectorB).subscribers.nodes),
  ).toEqual([]);

  // After reseting a value
  const resetSnapshot = setSnapshot.map(({reset}) => reset(myAtom));
  resetSnapshot.getLoadable(selectorB); // prime snapshot
  expect(resetSnapshot.getInfo_UNSTABLE(myAtom)).toMatchObject({
    loadable: expect.objectContaining({state: 'hasValue', contents: 'DEFAULT'}),
    isActive: true,
    isSet: false,
    isModified: true,
    type: 'atom',
  });
  expect(Array.from(resetSnapshot.getInfo_UNSTABLE(myAtom).deps)).toEqual([]);
  expect(
    Array.from(resetSnapshot.getInfo_UNSTABLE(myAtom).subscribers.nodes),
  ).toEqual(expect.arrayContaining([selectorA, selectorB]));
  expect(resetSnapshot.getInfo_UNSTABLE(selectorA)).toMatchObject({
    loadable: expect.objectContaining({state: 'hasValue', contents: 'DEFAULT'}),
    isActive: true,
    isSet: false,
    isModified: false,
    type: 'selector',
  });
  expect(Array.from(resetSnapshot.getInfo_UNSTABLE(selectorA).deps)).toEqual(
    expect.arrayContaining([myAtom]),
  );
  expect(
    Array.from(resetSnapshot.getInfo_UNSTABLE(selectorA).subscribers.nodes),
  ).toEqual(expect.arrayContaining([selectorB]));
  expect(resetSnapshot.getInfo_UNSTABLE(selectorB)).toMatchObject({
    loadable: expect.objectContaining({
      state: 'hasValue',
      contents: 'DEFAULTDEFAULT',
    }),
    isActive: true,
    isSet: false,
    isModified: false,
    type: 'selector',
  });
  expect(Array.from(resetSnapshot.getInfo_UNSTABLE(selectorB).deps)).toEqual(
    expect.arrayContaining([myAtom, selectorA]),
  );
  expect(
    Array.from(resetSnapshot.getInfo_UNSTABLE(selectorB).subscribers.nodes),
  ).toEqual([]);
});
