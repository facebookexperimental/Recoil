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

let React,
  useEffect,
  act,
  freshSnapshot,
  atom,
  constSelector,
  selector,
  ReadsAtom,
  asyncSelector,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers,
  renderElements,
  useGotoRecoilSnapshot,
  useRecoilSnapshot;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({useEffect} = require('react'));
  ({act} = require('ReactTestUtils'));

  ({freshSnapshot} = require('../../core/Recoil_Snapshot'));
  atom = require('../../recoil_values/Recoil_atom');
  constSelector = require('../../recoil_values/Recoil_constSelector');
  selector = require('../../recoil_values/Recoil_selector');
  ({
    ReadsAtom,
    asyncSelector,
    componentThatReadsAndWritesAtom,
    flushPromisesAndTimers,
    renderElements,
  } = require('../../testing/Recoil_TestingUtils'));
  ({useGotoRecoilSnapshot, useRecoilSnapshot} = require('../Recoil_Hooks'));
});

testRecoil('useRecoilSnapshot - subscribe to updates', () => {
  const myAtom = atom({
    key: 'useRecoilSnapshot - subscribe',
    default: 'DEFAULT',
  });
  const [
    ReadsAndWritesAtom,
    setAtom,
    resetAtom,
  ] = componentThatReadsAndWritesAtom(myAtom);

  // $FlowFixMe[incompatible-call] added when improving typing for this parameters
  const mySelector = constSelector(myAtom);

  const snapshots = [];
  function RecoilSnapshotAndSubscribe() {
    const snapshot = useRecoilSnapshot();
    snapshot.retain();
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

testRecoil('useRecoilSnapshot - goto snapshots', () => {
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
    snapshot.retain();
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

  // $FlowFixMe[incompatible-call]
  act(() => gotoSnapshot(snapshots[2].map(({set}) => set(atomB, 3))));
  expect(c.textContent).toEqual('13');
});

testRecoil('useRecoilSnapshot - async selectors', async () => {
  const [mySelector, resolve] = asyncSelector();

  const snapshots = [];
  function RecoilSnapshotAndSubscribe() {
    const snapshot = useRecoilSnapshot();
    snapshot.retain();
    useEffect(() => {
      snapshots.push(snapshot);
    });
    return null;
  }

  const c = renderElements(
    <>
      <React.Suspense fallback="loading">
        <ReadsAtom atom={mySelector} />
      </React.Suspense>
      <RecoilSnapshotAndSubscribe />
    </>,
  );

  expect(c.textContent).toEqual('loading');

  act(() => resolve('RESOLVE'));
  await flushPromisesAndTimers();
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"RESOLVE"');

  expect(snapshots.length).toEqual(2);
  expect(snapshots[0].getLoadable(mySelector).contents).toEqual('RESOLVE');
});

testRecoil('Subscriptions', async () => {
  const myAtom = atom<string>({
    key: 'useRecoilSnapshot Subscriptions atom',
    default: 'ATOM',
  });
  const selectorA = selector({
    key: 'useRecoilSnapshot Subscriptions A',
    get: ({get}) => get(myAtom),
  });
  const selectorB = selector({
    key: 'useRecoilSnapshot Subscriptions B',
    get: ({get}) => get(selectorA) + get(myAtom),
  });
  const selectorC = selector({
    key: 'useRecoilSnapshot Subscriptions C',
    get: async ({get}) => {
      const ret = get(selectorA) + get(selectorB);
      await Promise.resolve();
      return ret;
    },
  });

  let snapshot = freshSnapshot();
  function RecoilSnapshot() {
    snapshot = useRecoilSnapshot();
    return null;
  }
  const c = renderElements(
    <>
      <ReadsAtom atom={selectorC} />
      <RecoilSnapshot />
    </>,
  );

  await flushPromisesAndTimers();

  expect(c.textContent).toBe('"ATOMATOMATOM"');

  expect(
    Array.from(snapshot.getInfo_UNSTABLE(myAtom).subscribers.nodes).length,
  ).toBe(3);
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(myAtom).subscribers.nodes),
  ).toEqual(expect.arrayContaining([selectorA, selectorB, selectorC]));
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(selectorA).subscribers.nodes).length,
  ).toBe(2);
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(selectorA).subscribers.nodes),
  ).toEqual(expect.arrayContaining([selectorB, selectorC]));
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(selectorB).subscribers.nodes).length,
  ).toBe(1);
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(selectorB).subscribers.nodes),
  ).toEqual(expect.arrayContaining([selectorC]));
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(selectorC).subscribers.nodes).length,
  ).toBe(0);
  expect(
    Array.from(snapshot.getInfo_UNSTABLE(selectorC).subscribers.nodes),
  ).toEqual(expect.arrayContaining([]));
});
