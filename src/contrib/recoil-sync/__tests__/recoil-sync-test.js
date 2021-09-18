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

import type {Loadable} from '../../../adt/Recoil_Loadable';

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

// Mock validation library
const validateAny = loadableWithValue;
const validateString = x =>
  typeof x === 'string' ? loadableWithValue(x) : null;
const validateNumber = x =>
  typeof x === 'number' ? loadableWithValue(x) : null;
function upgrade<From, To>(
  validate: mixed => ?Loadable<From>,
  upgrade: From => To,
): mixed => ?Loadable<To> {
  return x => validate(x)?.map(upgrade);
}

test('Write to storage', async () => {
  const atomA = atom({
    key: 'recoil-sync write A',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({restore: validateAny})],
  });
  const atomB = atom({
    key: 'recoil-sync write B',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({restore: validateAny})],
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
    effects_UNSTABLE: [syncEffect({syncKey: 'A', restore: validateAny})],
  });
  const atomB = atom({
    key: 'recoil-sync multiple storage B',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({syncKey: 'B', restore: validateAny})],
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
    effects_UNSTABLE: [syncEffect({restore: validateAny})],
  });
  const atomB = atom({
    key: 'recoil-sync read B',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({restore: validateAny})],
  });
  const atomC = atom({
    key: 'recoil-sync read C',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({restore: validateAny})],
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
    effects_UNSTABLE: [syncEffect({restore: validateAny})],
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
    effects_UNSTABLE: [syncEffect({restore: validateAny})],
  });
  const atomB = atom({
    key: 'recoil-sync read error B',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({restore: validateAny})],
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

test('Read from storage upgrade', async () => {
  // Fail validation
  const atomA = atom<string>({
    key: 'recoil-sync fail validation',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      // No matching sync effect
      syncEffect({restore: validateString}),
    ],
  });

  // Upgrade from number
  const atomB = atom<string>({
    key: 'recoil-sync upgrade number',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      // This sync effect is ignored
      syncEffect<string>({restore: upgrade(validateString, () => 'IGNORE')}),
      syncEffect<string>({restore: upgrade(validateNumber, num => `${num}`)}),
      // This sync effect is ignored
      syncEffect<string>({restore: upgrade(validateString, () => 'IGNORE')}),
    ],
  });

  // Upgrade from string
  const atomC = atom<number>({
    key: 'recoil-sync upgrade string',
    default: 0,
    effects_UNSTABLE: [
      // This sync effect is ignored
      syncEffect<number>({restore: upgrade(validateNumber, () => 999)}),
      syncEffect<number>({
        restore: upgrade(
          // Test async validation
          x =>
            typeof x === 'string'
              ? loadableWithPromise(Promise.resolve({__value: x}))
              : null,
          str => Number(str),
        ),
      }),
      // This sync effect is ignored
      syncEffect<number>({restore: upgrade(validateNumber, () => 999)}),
    ],
  });

  // Upgrade from async
  const atomD = atom<string>({
    key: 'recoil-sync upgrade async',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect<string>({restore: upgrade(validateNumber, num => `${num}`)}),
    ],
  });

  const storage = {
    'recoil-sync fail validation': loadableWithValue(123),
    'recoil-sync upgrade number': loadableWithValue(123),
    'recoil-sync upgrade string': loadableWithValue('123'),
    'recoil-sync upgrade async': loadableWithPromise(
      Promise.resolve({__value: 123}),
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
      <ReadsAtom atom={atomB} />
      <ReadsAtom atom={atomC} />
      <ReadsAtom atom={atomD} />
    </>,
  );

  expect(container.textContent).toBe('loading');
  await flushPromisesAndTimers();
  expect(container.textContent).toBe('"DEFAULT""123"123"123"');
});

test('Read/Write from storage upgrade', async () => {
  const atomA = atom<string>({
    key: 'recoil-sync read/write upgrade type',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect<string>({restore: upgrade(validateNumber, num => `${num}`)}),
      syncEffect({restore: validateString}),
    ],
  });
  const atomB = atom({
    key: 'recoil-sync read/write upgrade key',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect({key: 'OLD KEY', restore: validateAny}),
      syncEffect({key: 'NEW KEY', restore: validateAny}),
    ],
  });
  const atomC = atom({
    key: 'recoil-sync read/write upgrade storage',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect({restore: validateAny}),
      syncEffect({syncKey: 'SYNC_2', restore: validateAny}),
    ],
  });

  const storage1: {[string]: Loadable<mixed>} = {
    'recoil-sync read/write upgrade type': loadableWithValue(123),
    'OLD KEY': loadableWithValue('OLD'),
    'recoil-sync read/write upgrade storage': loadableWithValue('STR1'),
  };
  const storage2 = {
    'recoil-sync read/write upgrade storage': loadableWithValue('STR2'),
  };

  function RecoilSync({
    syncKey,
    storage,
  }: {
    syncKey?: string,
    storage: {[string]: Loadable<mixed>},
  }) {
    useRecoilSync({
      syncKey,
      read: itemKey => storage[itemKey],
      write: ({diff}) => {
        for (const [key, loadable] of diff.entries()) {
          loadable != null ? (storage[key] = loadable) : delete storage[key];
        }
      },
    });
    return null;
  }

  const [AtomA, setA, resetA] = componentThatReadsAndWritesAtom(atomA);
  const [AtomB, setB, resetB] = componentThatReadsAndWritesAtom(atomB);
  const [AtomC, setC, resetC] = componentThatReadsAndWritesAtom(atomC);
  const container = renderElements(
    <>
      <RecoilSync storage={storage1} />
      <RecoilSync storage={storage2} syncKey="SYNC_2" />
      <AtomA />
      <AtomB />
      <AtomC />
    </>,
  );

  expect(container.textContent).toBe('"123""OLD""STR2"');
  expect(Object.keys(storage1).length).toBe(3);

  act(() => setA('A'));
  act(() => setB('B'));
  act(() => setC('C'));
  expect(container.textContent).toBe('"A""B""C"');
  expect(Object.keys(storage1).length).toBe(4);
  expect(storage1['recoil-sync read/write upgrade type']?.getValue()).toBe('A');
  expect(storage1['OLD KEY']?.getValue()).toBe('B');
  expect(storage1['NEW KEY']?.getValue()).toBe('B');
  expect(storage1['recoil-sync read/write upgrade storage']?.getValue()).toBe(
    'C',
  );
  expect(Object.keys(storage2).length).toBe(1);
  expect(storage2['recoil-sync read/write upgrade storage']?.getValue()).toBe(
    'C',
  );

  act(() => resetA());
  act(() => resetB());
  act(() => resetC());
  expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');
  expect(Object.keys(storage1).length).toBe(0);
  expect(Object.keys(storage2).length).toBe(0);
});

// TODO Listen to Storage
