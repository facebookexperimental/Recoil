/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+obviz
 * @flow strict-local
 * @format
 */
'use strict';

const React = require('React');
const {useEffect} = require('React');
const {act} = require('ReactTestUtils');

const {freshSnapshot} = require('../../core/Recoil_Snapshot');
const atom = require('../../recoil_values/Recoil_atom');
const constSelector = require('../../recoil_values/Recoil_constSelector');
const selector = require('../../recoil_values/Recoil_selector');
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

test('getSubscriptions', async () => {
  const myAtom = atom<string>({
    key: 'useRecoilSnapshot getSubscriptions atom',
    default: 'ATOM',
  });
  const selectorA = selector({
    key: 'useRecoilSnapshot getSubscriptions A',
    get: ({get}) => get(myAtom),
  });
  const selectorB = selector({
    key: 'useRecoilSnapshot getSubscriptions B',
    get: ({get}) => get(selectorA) + get(myAtom),
  });
  const selectorC = selector({
    key: 'useRecoilSnapshot getSubscriptions C',
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

  // Wrap flush with act() to avoid warning that only shows up in OSS environment
  await act(flushPromisesAndTimers);

  expect(c.textContent).toBe('"ATOMATOMATOM"');

  expect(
    Array.from(snapshot.getSubscribers_UNSTABLE(myAtom).nodes).length,
  ).toBe(3);
  expect(Array.from(snapshot.getSubscribers_UNSTABLE(myAtom).nodes)).toEqual(
    expect.arrayContaining([selectorA, selectorB, selectorC]),
  );
  expect(
    Array.from(snapshot.getSubscribers_UNSTABLE(selectorA).nodes).length,
  ).toBe(2);
  expect(Array.from(snapshot.getSubscribers_UNSTABLE(selectorA).nodes)).toEqual(
    expect.arrayContaining([selectorB, selectorC]),
  );
  expect(
    Array.from(snapshot.getSubscribers_UNSTABLE(selectorB).nodes).length,
  ).toBe(1);
  expect(Array.from(snapshot.getSubscribers_UNSTABLE(selectorB).nodes)).toEqual(
    expect.arrayContaining([selectorC]),
  );
  expect(
    Array.from(snapshot.getSubscribers_UNSTABLE(selectorC).nodes).length,
  ).toBe(0);
  expect(Array.from(snapshot.getSubscribers_UNSTABLE(selectorC).nodes)).toEqual(
    expect.arrayContaining([]),
  );
});
