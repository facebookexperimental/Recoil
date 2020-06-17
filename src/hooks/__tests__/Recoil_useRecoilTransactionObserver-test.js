/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

const React = require('React');
const {act} = require('ReactTestUtils');

const atom = require('../../recoil_values/Recoil_atom');
const selector = require('../../recoil_values/Recoil_selector');
const {
  asyncSelector,
  componentThatReadsAndWritesAtom,
  renderElements,
} = require('../../testing/Recoil_TestingUtils');
const {useRecoilTransactionObserver} = require('../Recoil_Hooks');

function TransactionObserver({callback}) {
  useRecoilTransactionObserver(callback);
  return null;
}

test('Can observe atom value', async () => {
  const atomA = atom({
    key: 'Observe Atom A',
    default: 'DEFAULT A',
  });

  const atomB = atom({
    key: 'Observe Atom B',
    default: 'DEFAULT B',
  });

  const [WriteAtomA, setAtomA, resetA] = componentThatReadsAndWritesAtom(atomA);
  const [WriteAtomB, setAtomB] = componentThatReadsAndWritesAtom(atomB);

  const transactions = [];
  renderElements(
    <>
      <TransactionObserver
        callback={({snapshot, previousSnapshot}) => {
          transactions.push({snapshot, previousSnapshot});
        }}
      />
      <WriteAtomA />
      <WriteAtomB />
    </>,
  );

  act(() => setAtomB('SET B'));

  expect(transactions.length).toEqual(1);
  await expect(transactions[0].snapshot.getPromise(atomA)).resolves.toEqual(
    'DEFAULT A',
  );
  await expect(
    transactions[0].previousSnapshot.getPromise(atomA),
  ).resolves.toEqual('DEFAULT A');
  await expect(transactions[0].snapshot.getPromise(atomB)).resolves.toEqual(
    'SET B',
  );
  await expect(
    transactions[0].previousSnapshot.getPromise(atomB),
  ).resolves.toEqual('DEFAULT B');

  act(() => setAtomA('SET A'));

  expect(transactions.length).toEqual(2);
  await expect(transactions[1].snapshot.getPromise(atomA)).resolves.toEqual(
    'SET A',
  );
  await expect(
    transactions[1].previousSnapshot.getPromise(atomA),
  ).resolves.toEqual('DEFAULT A');
  await expect(transactions[1].snapshot.getPromise(atomB)).resolves.toEqual(
    'SET B',
  );
  await expect(
    transactions[1].previousSnapshot.getPromise(atomB),
  ).resolves.toEqual('SET B');

  act(() => resetA());

  expect(transactions.length).toEqual(3);
  await expect(transactions[2].snapshot.getPromise(atomA)).resolves.toEqual(
    'DEFAULT A',
  );
  await expect(
    transactions[2].previousSnapshot.getPromise(atomA),
  ).resolves.toEqual('SET A');
  await expect(transactions[2].snapshot.getPromise(atomB)).resolves.toEqual(
    'SET B',
  );
  await expect(
    transactions[2].previousSnapshot.getPromise(atomB),
  ).resolves.toEqual('SET B');
});

test('Can observe selector value', async () => {
  const atomA = atom({
    key: 'Observe Atom for Selector',
    default: 'DEFAULT',
  });

  const selectorA = selector({
    key: 'Observer Selector As',
    get: ({get}) => `SELECTOR ${get(atomA)}`,
  });

  const [WriteAtom, setAtom] = componentThatReadsAndWritesAtom(atomA);

  const transactions = [];
  renderElements(
    <>
      <TransactionObserver
        callback={({snapshot, previousSnapshot}) => {
          transactions.push({snapshot, previousSnapshot});
        }}
      />
      <WriteAtom />
    </>,
  );

  act(() => setAtom('SET'));

  expect(transactions.length).toEqual(1);
  await expect(transactions[0].snapshot.getPromise(atomA)).resolves.toEqual(
    'SET',
  );
  await expect(
    transactions[0].previousSnapshot.getPromise(atomA),
  ).resolves.toEqual('DEFAULT');
  await expect(transactions[0].snapshot.getPromise(selectorA)).resolves.toEqual(
    'SELECTOR SET',
  );
  await expect(
    transactions[0].previousSnapshot.getPromise(selectorA),
  ).resolves.toEqual('SELECTOR DEFAULT');
});

test('Can observe async selector value', async () => {
  const atomA = atom({
    key: 'Observe Atom for Async Selector',
    default: 'DEFAULT',
  });
  const [WriteAtom, setAtom] = componentThatReadsAndWritesAtom(atomA);

  const [selectorA, resolveA] = asyncSelector();

  const transactions = [];
  renderElements(
    <>
      <TransactionObserver
        callback={({snapshot, previousSnapshot}) => {
          transactions.push({snapshot, previousSnapshot});
        }}
      />
      <WriteAtom />
    </>,
  );

  act(() => setAtom('SET'));

  expect(transactions.length).toEqual(1);
  expect(transactions[0].snapshot.getLoadable(selectorA).state).toEqual(
    'loading',
  );

  act(() => resolveA('RESOLVE'));

  expect(transactions.length).toEqual(1);
  await expect(transactions[0].snapshot.getPromise(selectorA)).resolves.toEqual(
    'RESOLVE',
  );
});
