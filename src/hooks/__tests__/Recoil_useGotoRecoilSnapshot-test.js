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

const React = require('React');
const {useState} = require('React');
const {act} = require('ReactTestUtils');

const {freshSnapshot} = require('../../core/Recoil_Snapshot');
const {
  useGotoRecoilSnapshot,
  useRecoilCallback,
  useRecoilValue,
} = require('../../hooks/Recoil_Hooks');
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

test('Goto mapped snapshot', async () => {
  const snapshot = freshSnapshot();

  const myAtom = atom({
    key: 'Goto Snapshot Atom',
    default: 'DEFAULT',
  });
  const [ReadsAndWritesAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);

  const mySelector = constSelector(myAtom);

  const updatedSnapshot = snapshot.map(({set}) => {
    set(myAtom, 'SET IN SNAPSHOT');
  });

  let gotoRecoilSnapshot;
  function GotoRecoilSnapshot() {
    gotoRecoilSnapshot = useGotoRecoilSnapshot();
    return null;
  }

  const c = renderElements(
    <>
      <ReadsAndWritesAtom />
      <ReadsAtom atom={mySelector} />
      <GotoRecoilSnapshot />
    </>,
  );

  expect(c.textContent).toEqual('"DEFAULT""DEFAULT"');

  act(() => setAtom('SET IN CURRENT'));
  expect(c.textContent).toEqual('"SET IN CURRENT""SET IN CURRENT"');

  await expect(updatedSnapshot.getPromise(myAtom)).resolves.toEqual(
    'SET IN SNAPSHOT',
  );
  act(() => gotoRecoilSnapshot(updatedSnapshot));
  expect(c.textContent).toEqual('"SET IN SNAPSHOT""SET IN SNAPSHOT"');

  act(() => setAtom('SET AGAIN IN CURRENT'));
  expect(c.textContent).toEqual('"SET AGAIN IN CURRENT""SET AGAIN IN CURRENT"');

  // Test that atoms set after snapshot were created are reset
  act(() => gotoRecoilSnapshot(snapshot));
  expect(c.textContent).toEqual('"DEFAULT""DEFAULT"');
});

test('Goto callback snapshot', () => {
  const myAtom = atom({
    key: 'Goto Snapshot From Callback',
    default: 'DEFAULT',
  });
  const [ReadsAndWritesAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);

  const mySelector = constSelector(myAtom);

  let cb;
  function RecoilCallback() {
    const gotoSnapshot = useGotoRecoilSnapshot();
    cb = useRecoilCallback(({snapshot}) => () => {
      const updatedSnapshot = snapshot.map(({set}) => {
        set(myAtom, 'SET IN SNAPSHOT');
      });
      gotoSnapshot(updatedSnapshot);
    });
    return null;
  }

  const c = renderElements(
    <>
      <ReadsAndWritesAtom />
      <ReadsAtom atom={mySelector} />
      <RecoilCallback />
    </>,
  );

  expect(c.textContent).toEqual('"DEFAULT""DEFAULT"');

  act(() => setAtom('SET IN CURRENT'));
  expect(c.textContent).toEqual('"SET IN CURRENT""SET IN CURRENT"');

  act(cb);
  expect(c.textContent).toEqual('"SET IN SNAPSHOT""SET IN SNAPSHOT"');
});

test('Goto snapshot with dependent async selector', async () => {
  const snapshot = freshSnapshot();

  const myAtom = atom({
    key: 'atom for dep async snapshot',
    default: 'DEFAULT',
  });
  const [ReadsAndWritesAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);
  const mySelector = selector({
    key: 'selector for async snapshot',
    get: ({get}) => {
      const dep = get(myAtom);
      return Promise.resolve(dep);
    },
  });

  const updatedSnapshot = snapshot.map(({set}) => {
    set(myAtom, 'SET IN SNAPSHOT');
  });

  let gotoRecoilSnapshot;
  function GotoRecoilSnapshot() {
    gotoRecoilSnapshot = useGotoRecoilSnapshot();
    return null;
  }

  const c = renderElements(
    <>
      <ReadsAndWritesAtom />
      <ReadsAtom atom={mySelector} />
      <GotoRecoilSnapshot />
    </>,
  );

  expect(c.textContent).toEqual('loading');
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"DEFAULT""DEFAULT"');

  act(() => setAtom('SET IN CURRENT'));
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"SET IN CURRENT""SET IN CURRENT"');

  await expect(updatedSnapshot.getPromise(myAtom)).resolves.toEqual(
    'SET IN SNAPSHOT',
  );
  act(() => gotoRecoilSnapshot(updatedSnapshot));
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"SET IN SNAPSHOT""SET IN SNAPSHOT"');
});

test('Goto snapshot with async selector', async () => {
  const snapshot = freshSnapshot();

  const [mySelector, resolve] = asyncSelector();

  let gotoRecoilSnapshot;
  function GotoRecoilSnapshot() {
    gotoRecoilSnapshot = useGotoRecoilSnapshot();
    return null;
  }

  const c = renderElements(
    <>
      <ReadsAtom atom={mySelector} />
      <GotoRecoilSnapshot />
    </>,
  );

  expect(c.textContent).toEqual('loading');

  act(() => resolve('RESOLVE'));
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"RESOLVE"');

  act(() => gotoRecoilSnapshot(snapshot));
  expect(c.textContent).toEqual('"RESOLVE"');
});

// Test that going to a snapshot where an atom was not yet initialized will
// not cause the atom to be re-initialized when used again.
test('Effects going to previous snapshot', () => {
  let init = 0;
  const myAtom = atom({
    key: 'gotoSnapshot effect',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      () => {
        init++;
      },
    ],
  });

  let forceUpdate;
  function ReadAtom() {
    const [_, setValue] = useState({});
    forceUpdate = () => setValue({});
    return useRecoilValue(myAtom);
  }

  let gotoRecoilSnapshot;
  function GotoRecoilSnapshot() {
    gotoRecoilSnapshot = useGotoRecoilSnapshot();
    return null;
  }

  expect(init).toEqual(0);

  renderElements(
    <>
      <ReadAtom />
      <GotoRecoilSnapshot />
    </>,
  );

  expect(init).toEqual(1);
  act(forceUpdate);
  expect(init).toEqual(1);

  gotoRecoilSnapshot?.(freshSnapshot());
  expect(init).toEqual(1);
  act(forceUpdate);
  expect(init).toEqual(1);

  act(forceUpdate);
  expect(init).toEqual(1);
});
