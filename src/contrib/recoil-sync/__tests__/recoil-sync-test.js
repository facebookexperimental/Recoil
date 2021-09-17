/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

// TODO UPDATE IMPORTS TO USE PUBLIC INTERFACE
// TODO PUBLIC LOADABLE INTERFACE

const {act} = require('ReactTestUtils');

const {
  loadableWithError,
  loadableWithPromise,
  loadableWithValue,
} = require('../../../adt/Recoil_Loadable');
const atom = require('../../../recoil_values/Recoil_atom');
const selectorFamily = require('../../../recoil_values/Recoil_selectorFamily');
const {
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers,
  renderElements,
} = require('../../../testing/Recoil_TestingUtils');
const {syncEffect, useRecoilSync} = require('../recoil-sync');
const React = require('react');

test('Write to storage', async () => {
  const atomA = atom({
    key: 'recoil-sync write A',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({validate: x => loadableWithValue(x)})],
  });
  const atomB = atom({
    key: 'recoil-sync write B',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({validate: x => loadableWithValue(x)})],
  });
  const ignoreAtom = atom({
    key: 'recol-sync write ignore',
    default: 'DEFAULT',
  });

  const storage = new Map();

  function write({diff}) {
    for (const [key, loadable] of diff.entries()) {
      loadable != null ? storage.set(key, loadable) : storage.delete(key);
    }
  }
  function RecoilSync() {
    useRecoilSync({write});
    return null;
  }

  const [AtomA, setA, resetA] = componentThatReadsAndWritesAtom(atomA);
  const [AtomB, setB] = componentThatReadsAndWritesAtom(atomB);
  const [IgnoreAtom, setIgnore] = componentThatReadsAndWritesAtom(ignoreAtom);
  const container = renderElements(
    <>
      <RecoilSync />
      <AtomA />
      <AtomB />
      <IgnoreAtom />
    </>,
  );

  expect(storage.size).toBe(0);
  expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');

  act(() => setA('A'));
  act(() => setB('B'));
  act(() => setIgnore('IGNORE'));
  expect(container.textContent).toBe('"A""B""IGNORE"');
  expect(storage.size).toBe(2);
  expect(storage.get('recoil-sync write A')?.getValue()).toBe('A');
  expect(storage.get('recoil-sync write B')?.getValue()).toBe('B');

  act(() => resetA());
  act(() => setB('BB'));
  expect(container.textContent).toBe('"DEFAULT""BB""IGNORE"');
  expect(storage.size).toBe(1);
  expect(storage.has('recoil-sync write A')).toBe(false);
  expect(storage.get('recoil-sync write B')?.getValue()).toBe('BB');
});

test('Write to multiple storages', async () => {
  const atomA = atom({
    key: 'recoil-sync multiple storage A',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect({syncKey: 'A', validate: x => loadableWithValue(x)}),
    ],
  });
  const atomB = atom({
    key: 'recoil-sync multiple storage B',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect({syncKey: 'B', validate: x => loadableWithValue(x)}),
    ],
  });

  const storageA = new Map();
  const storageB = new Map();

  const write = storage => ({diff}) => {
    for (const [key, loadable] of diff.entries()) {
      loadable != null ? storage.set(key, loadable) : storage.delete(key);
    }
  };
  function RecoilSync({syncKey, storage}) {
    useRecoilSync({syncKey, write: write(storage)});
    return null;
  }

  const [AtomA, setA] = componentThatReadsAndWritesAtom(atomA);
  const [AtomB, setB] = componentThatReadsAndWritesAtom(atomB);
  renderElements(
    <>
      <RecoilSync syncKey="A" storage={storageA} />
      <RecoilSync syncKey="B" storage={storageB} />
      <AtomA />
      <AtomB />
    </>,
  );

  expect(storageA.size).toBe(0);
  expect(storageB.size).toBe(0);

  act(() => setA('A'));
  act(() => setB('B'));
  expect(storageA.size).toBe(1);
  expect(storageB.size).toBe(1);
  expect(storageA.get('recoil-sync multiple storage A')?.getValue()).toBe('A');
  expect(storageB.get('recoil-sync multiple storage B')?.getValue()).toBe('B');
});

test('Read from storage', async () => {
  const atomA = atom({
    key: 'recoil-sync read A',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({validate: x => loadableWithValue(x)})],
  });
  const atomB = atom({
    key: 'recoil-sync read B',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({validate: x => loadableWithValue(x)})],
  });
  const atomC = atom({
    key: 'recoil-sync read C',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({validate: x => loadableWithValue(x)})],
  });

  const storage = {
    'recoil-sync read A': loadableWithValue('A'),
    'recoil-sync read B': loadableWithValue('B'),
  };

  function RecoilSync() {
    useRecoilSync({read: itemKey => storage[itemKey]});
    return null;
  }

  const container = renderElements(
    <>
      <RecoilSync />
      <ReadsAtom atom={atomA} />
      <ReadsAtom atom={atomB} />
      <ReadsAtom atom={atomC} />
    </>,
  );

  expect(container.textContent).toBe('"A""B""DEFAULT"');
});

test('Read from storage async', async () => {
  const atomA = atom({
    key: 'recoil-sync read async',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({validate: x => loadableWithValue(x)})],
  });

  const storage = {
    'recoil-sync read async': loadableWithPromise(
      Promise.resolve({__value: 'A'}),
    ),
  };

  function RecoilSync() {
    useRecoilSync({read: itemKey => storage[itemKey]});
    return null;
  }

  const container = renderElements(
    <>
      <RecoilSync />
      <ReadsAtom atom={atomA} />
    </>,
  );

  expect(container.textContent).toBe('loading');
  await flushPromisesAndTimers();
  expect(container.textContent).toBe('"A"');
});

test('Read from storage error', async () => {
  const atomA = atom({
    key: 'recoil-sync read error A',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({validate: x => loadableWithValue(x)})],
  });
  const atomB = atom({
    key: 'recoil-sync read error B',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({validate: x => loadableWithValue(x)})],
  });
  const mySelector = selectorFamily({
    key: 'recoil-sync read error selector',
    get: ({myAtom}) => ({get}) => {
      try {
        return get(myAtom);
      } catch (e) {
        return e.message;
      }
    },
  });

  const storage = {
    'recoil-sync read error A': loadableWithError(new Error('ERROR A')),
  };
  function RecoilSync() {
    useRecoilSync({
      read: itemKey => {
        if (storage[itemKey] != null) {
          return storage[itemKey];
        }
        throw new Error('ERROR MISSING');
      },
    });
    return null;
  }

  const container = renderElements(
    <>
      <RecoilSync />
      <ReadsAtom atom={mySelector({myAtom: atomA})} />
      <ReadsAtom atom={mySelector({myAtom: atomB})} />
    </>,
  );

  expect(container.textContent).toBe('"ERROR A""ERROR MISSING"');
});
