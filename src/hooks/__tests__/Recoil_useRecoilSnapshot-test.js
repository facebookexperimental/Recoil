/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+obviz
 * @flow strict-local
 * @format
 */
'use strict';

const React = require('React');
const {act} = require('ReactTestUtils');

const atom = require('../../recoil_values/Recoil_atom');
const constSelector = require('../../recoil_values/Recoil_constSelector');
const {
  ReadsAtom,
  asyncSelector,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers,
  renderElements,
} = require('../../testing/Recoil_TestingUtils');
const {useGotoRecoilSnapshot, useRecoilSnapshot} = require('../Recoil_Hooks');

test('useRecoilSnapshot - subscribe to updates', () => {
  const myAtom = atom({
    key: 'useRecoilSnapshot - subscribe',
    default: 'DEFAULT',
  });
  const [
    ReadsAndWritesAtom,
    setAtom,
    resetAtom,
  ] = componentThatReadsAndWritesAtom(myAtom);

  const mySelector = constSelector(myAtom);

  const snapshots = [];
  function RecoilSnapshotAndSubscribe() {
    const snapshot = useRecoilSnapshot();
    snapshots.push(snapshot);
    return null;
  }

  const c = renderElements(
    <>
      <ReadsAndWritesAtom />
      <ReadsAtom atom={mySelector} />
      <RecoilSnapshotAndSubscribe />
    </>,
  );

  expect(c.textContent).toEqual('"DEFAULT""DEFAULT"');

  act(() => setAtom('SET IN CURRENT'));
  expect(c.textContent).toEqual('"SET IN CURRENT""SET IN CURRENT"');

  act(resetAtom);
  expect(c.textContent).toEqual('"DEFAULT""DEFAULT"');

  expect(snapshots.length).toEqual(3);
  expect(snapshots[0].getLoadable(myAtom).contents).toEqual('DEFAULT');
  expect(snapshots[1].getLoadable(myAtom).contents).toEqual('SET IN CURRENT');
  expect(snapshots[1].getLoadable(mySelector).contents).toEqual(
    'SET IN CURRENT',
  );
  expect(snapshots[2].getLoadable(myAtom).contents).toEqual('DEFAULT');
});

test('useRecoilSnapshot - goto snapshots', () => {
  const atomA = atom({
    key: 'useRecoilSnapshot - goto A',
    default: 'DEFAULT',
  });
  const [ReadsAndWritesAtomA, setAtomA] = componentThatReadsAndWritesAtom(
    atomA,
  );

  const atomB = atom({
    key: 'useRecoilSnapshot - goto B',
    default: 'DEFAULT',
  });
  const [ReadsAndWritesAtomB, setAtomB] = componentThatReadsAndWritesAtom(
    atomB,
  );

  const snapshots = [];
  let gotoSnapshot;
  function RecoilSnapshotAndSubscribe() {
    gotoSnapshot = useGotoRecoilSnapshot();
    const snapshot = useRecoilSnapshot();
    snapshots.push(snapshot);
    return null;
  }

  const c = renderElements(
    <>
      <ReadsAndWritesAtomA />
      <ReadsAndWritesAtomB />
      <RecoilSnapshotAndSubscribe />
    </>,
  );

  expect(c.textContent).toEqual('"DEFAULT""DEFAULT"');

  act(() => setAtomA(1));
  expect(c.textContent).toEqual('1"DEFAULT"');

  act(() => setAtomB(2));
  expect(c.textContent).toEqual('12');

  expect(snapshots.length).toEqual(3);

  act(() => gotoSnapshot(snapshots[1]));
  expect(c.textContent).toEqual('1"DEFAULT"');

  act(() => gotoSnapshot(snapshots[0]));
  expect(c.textContent).toEqual('"DEFAULT""DEFAULT"');

  act(() => gotoSnapshot(snapshots[2].map(({set}) => set(atomB, 3))));
  expect(c.textContent).toEqual('13');
});

test('useRecoilSnapshot - async selectors', async () => {
  const [mySelector, resolve] = asyncSelector();

  const snapshots = [];
  function RecoilSnapshotAndSubscribe() {
    const snapshot = useRecoilSnapshot();
    snapshots.push(snapshot);
    return null;
  }

  const c = renderElements(
    <>
      <ReadsAtom atom={mySelector} />
      <RecoilSnapshotAndSubscribe />
    </>,
  );

  expect(c.textContent).toEqual('loading');

  act(() => resolve('RESOLVE'));
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"RESOLVE"');

  expect(snapshots.length).toEqual(1);
  expect(snapshots[0].getLoadable(mySelector).contents).toEqual('RESOLVE');
});
