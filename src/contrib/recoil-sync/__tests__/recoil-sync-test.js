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
import type {ItemDiff, ItemSnapshot, ListenInterface} from '../recoil-sync';

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

////////////////////////////
// Mock validation library
////////////////////////////
const validateAny = loadableWithValue;
const validateString = x =>
  typeof x === 'string' ? loadableWithValue(x) : null;
const validateNumber = x =>
  typeof x === 'number' ? loadableWithValue(x) : null;
function upgrade<From, To>(
  validate: mixed => ?Loadable<From>,
  upgrader: From => To,
): mixed => ?Loadable<To> {
  return x => validate(x)?.map(upgrader);
}

////////////////////////////
// Mock Storage
////////////////////////////
function TestRecoilSync({
  syncKey,
  storage,
  regListen,
}: {
  syncKey?: string,
  storage: Map<string, Loadable<mixed>>,
  regListen?: ListenInterface => void,
}) {
  useRecoilSync({
    syncKey,
    read: itemKey => {
      if (itemKey === 'error') {
        throw new Error('READ ERROR');
      }
      return storage.get(itemKey);
    },
    write: ({diff, items}) => {
      for (const [key, loadable] of diff.entries()) {
        loadable != null ? storage.set(key, loadable) : storage.delete(key);
      }
      for (const [itemKey, loadable] of diff) {
        expect(items.get(itemKey)?.contents).toEqual(loadable?.contents);
      }
    },
    listen: listenInterface => {
      regListen?.(listenInterface);
    },
  });
  return null;
}

///////////////////////
// Tests
///////////////////////
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
    key: 'recoil-sync write ignore',
    default: 'DEFAULT',
  });

  const storage = new Map();

  const [AtomA, setA, resetA] = componentThatReadsAndWritesAtom(atomA);
  const [AtomB, setB] = componentThatReadsAndWritesAtom(atomB);
  const [IgnoreAtom, setIgnore] = componentThatReadsAndWritesAtom(ignoreAtom);
  const container = renderElements(
    <>
      <TestRecoilSync storage={storage} />
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

  const [AtomA, setA] = componentThatReadsAndWritesAtom(atomA);
  const [AtomB, setB] = componentThatReadsAndWritesAtom(atomB);
  renderElements(
    <>
      <TestRecoilSync syncKey="A" storage={storageA} />
      <TestRecoilSync syncKey="B" storage={storageB} />
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

  const storage = new Map([
    ['recoil-sync read A', loadableWithValue('A')],
    ['recoil-sync read B', loadableWithValue('B')],
  ]);

  const container = renderElements(
    <>
      <TestRecoilSync storage={storage} />
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

  const storage = new Map([
    [
      'recoil-sync read async',
      loadableWithPromise(Promise.resolve({__value: 'A'})),
    ],
  ]);

  const container = renderElements(
    <>
      <TestRecoilSync storage={storage} />
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
    effects_UNSTABLE: [syncEffect({key: 'error', restore: validateAny})],
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

  const storage = new Map([
    ['recoil-sync read error A', loadableWithError(new Error('ERROR A'))],
  ]);

  const container = renderElements(
    <>
      <TestRecoilSync storage={storage} />
      <ReadsAtom atom={mySelector({myAtom: atomA})} />
      <ReadsAtom atom={mySelector({myAtom: atomB})} />
    </>,
  );

  expect(container.textContent).toBe('"ERROR A""READ ERROR"');
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

  const storage = new Map([
    ['recoil-sync fail validation', loadableWithValue(123)],
    ['recoil-sync upgrade number', loadableWithValue(123)],
    ['recoil-sync upgrade string', loadableWithValue('123')],
    [
      'recoil-sync upgrade async',
      loadableWithPromise(Promise.resolve({__value: 123})),
    ],
  ]);

  const container = renderElements(
    <>
      <TestRecoilSync storage={storage} />
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
      syncEffect({syncKey: 'OTHER_SYNC', restore: validateAny}),
    ],
  });

  const storage1 = new Map([
    ['recoil-sync read/write upgrade type', loadableWithValue(123)],
    ['OLD KEY', loadableWithValue('OLD')],
    ['recoil-sync read/write upgrade storage', loadableWithValue('STR1')],
  ]);
  const storage2 = new Map([
    ['recoil-sync read/write upgrade storage', loadableWithValue('STR2')],
  ]);

  const [AtomA, setA, resetA] = componentThatReadsAndWritesAtom(atomA);
  const [AtomB, setB, resetB] = componentThatReadsAndWritesAtom(atomB);
  const [AtomC, setC, resetC] = componentThatReadsAndWritesAtom(atomC);
  const container = renderElements(
    <>
      <TestRecoilSync storage={storage1} />
      <TestRecoilSync storage={storage2} syncKey="OTHER_SYNC" />
      <AtomA />
      <AtomB />
      <AtomC />
    </>,
  );

  expect(container.textContent).toBe('"123""OLD""STR2"');
  expect(storage1.size).toBe(3);

  act(() => setA('A'));
  act(() => setB('B'));
  act(() => setC('C'));
  expect(container.textContent).toBe('"A""B""C"');
  expect(storage1.size).toBe(4);
  expect(storage1.get('recoil-sync read/write upgrade type')?.getValue()).toBe(
    'A',
  );
  expect(storage1.get('OLD KEY')?.getValue()).toBe('B');
  expect(storage1.get('NEW KEY')?.getValue()).toBe('B');
  expect(
    storage1.get('recoil-sync read/write upgrade storage')?.getValue(),
  ).toBe('C');
  expect(storage2.size).toBe(1);
  expect(
    storage2.get('recoil-sync read/write upgrade storage')?.getValue(),
  ).toBe('C');

  act(() => resetA());
  act(() => resetB());
  act(() => resetC());
  expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');
  expect(storage1.size).toBe(0);
  expect(storage2.size).toBe(0);
});

test('Listen to storage', async () => {
  const atomA = atom({
    key: 'recoil-sync listen',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({syncKey: 'SYNC_1', restore: validateAny})],
  });
  const atomB = atom({
    key: 'recoil-sync listen to multiple keys',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect({syncKey: 'SYNC_1', key: 'KEY A', restore: validateAny}),
      syncEffect({syncKey: 'SYNC_1', key: 'KEY B', restore: validateAny}),
    ],
  });
  const atomC = atom({
    key: 'recoil-sync listen to multiple storage',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect({syncKey: 'SYNC_1', restore: validateAny}),
      syncEffect({syncKey: 'SYNC_2', restore: validateAny}),
    ],
  });

  const storage1 = new Map([
    ['recoil-sync listen', loadableWithValue('A')],
    ['KEY A', loadableWithValue('B')],
    ['recoil-sync listen to multiple storage', loadableWithValue('C1')],
  ]);
  const storage2 = new Map([
    ['recoil-sync listen to multiple storage', loadableWithValue('C2')],
  ]);

  let update1: ItemDiff => void = () => {
    throw new Error('Failed to register 1');
  };
  let updateAll1: ItemSnapshot => void = _ => {
    throw new Error('Failed to register 1');
  };
  let update2: ItemDiff => void = () => {
    throw new Error('Failed to register 2');
  };
  const container = renderElements(
    <>
      <TestRecoilSync
        syncKey="SYNC_1"
        storage={storage1}
        regListen={listenInterface => {
          update1 = listenInterface.updateItems;
          updateAll1 = listenInterface.updateAllItems;
        }}
      />
      <TestRecoilSync
        syncKey="SYNC_2"
        storage={storage2}
        regListen={listenInterface => {
          update2 = listenInterface.updateItems;
        }}
      />
      <ReadsAtom atom={atomA} />
      <ReadsAtom atom={atomB} />
      <ReadsAtom atom={atomC} />
    </>,
  );

  expect(container.textContent).toBe('"A""B""C2"');
  expect(storage1.size).toBe(3);

  // Subscribe to new value
  act(() =>
    update1(new Map([['recoil-sync listen', loadableWithValue('AA')]])),
  );
  expect(container.textContent).toBe('"AA""B""C2"');
  // Avoid feedback loops
  expect(storage1.get('recoil-sync listen')?.getValue()).toBe('A');

  // Subscribe to new value from different key
  act(() => update1(new Map([['KEY A', loadableWithValue('BB')]])));
  expect(container.textContent).toBe('"AA""BB""C2"');
  // Neither key in same storage will be updated to avoid feedback loops
  expect(storage1.get('KEY A')?.getValue()).toBe('B');
  expect(storage1.get('KEY B')?.getValue()).toBe(undefined);
  act(() => update1(new Map([['KEY B', loadableWithValue('BBB')]])));
  expect(container.textContent).toBe('"AA""BBB""C2"');
  expect(storage1.get('KEY A')?.getValue()).toBe('B');
  expect(storage1.get('KEY B')?.getValue()).toBe(undefined);

  // Subscribe to new value from different storage
  act(() =>
    update1(
      new Map([
        ['recoil-sync listen to multiple storage', loadableWithValue('CC1')],
      ]),
    ),
  );
  expect(container.textContent).toBe('"AA""BBB""CC1"');
  // Avoid feedback loops, do not update storage based on listening to the storage
  expect(
    storage1.get('recoil-sync listen to multiple storage')?.getValue(),
  ).toBe('C1');
  // But, we should update other storages to stay in sync
  expect(
    storage2.get('recoil-sync listen to multiple storage')?.getValue(),
  ).toBe('CC1');

  act(() =>
    update2(
      new Map([
        ['recoil-sync listen to multiple storage', loadableWithValue('CC2')],
      ]),
    ),
  );
  expect(container.textContent).toBe('"AA""BBB""CC2"');
  expect(
    storage1.get('recoil-sync listen to multiple storage')?.getValue(),
  ).toBe('CC2');
  expect(
    storage2.get('recoil-sync listen to multiple storage')?.getValue(),
  ).toBe('CC1');

  act(() =>
    update1(
      new Map([
        ['recoil-sync listen to multiple storage', loadableWithValue('CCC1')],
      ]),
    ),
  );
  expect(container.textContent).toBe('"AA""BBB""CCC1"');
  expect(
    storage1.get('recoil-sync listen to multiple storage')?.getValue(),
  ).toBe('CC2');
  expect(
    storage2.get('recoil-sync listen to multiple storage')?.getValue(),
  ).toBe('CCC1');

  // Subscribe to reset
  act(() =>
    update1(new Map([['recoil-sync listen to multiple storage', null]])),
  );
  expect(container.textContent).toBe('"AA""BBB""DEFAULT"');
  expect(
    storage1.get('recoil-sync listen to multiple storage')?.getValue(),
  ).toBe('CC2');
  expect(
    storage2.get('recoil-sync listen to multiple storage')?.getValue(),
  ).toBe(undefined);

  // Subscribe to error
  const ERROR = new Error('ERROR');
  act(() =>
    update1(new Map([['recoil-sync listen', loadableWithError(ERROR)]])),
  );
  // TODO Atom should be put in an error state, but is just reset for now.
  expect(container.textContent).toBe('"DEFAULT""BBB""DEFAULT"');
  // expect(storage1.get('recoil-sync listen')?.errorOrThrow()).toBe(ERROR);

  // Update All Items
  // Set A while resetting B
  act(() =>
    updateAll1(new Map([['recoil-sync listen', loadableWithValue('AAA')]])),
  );
  expect(container.textContent).toBe('"AAA""DEFAULT""DEFAULT"');

  // TODO Async Atom support
  // act(() =>
  //   update1(
  //     new Map([
  //       [
  //         'recoil-sync listen',
  //         loadableWithPromise(Promise.resolve({__value: 'ASYNC'})),
  //       ],
  //     ]),
  //   ),
  // );
  // await flushPromisesAndTimers();
  // expect(container.textContent).toBe('"ASYNC""DEFAULT""DEFAULT"');

  // act(() =>
  //   update1(
  //     new Map([
  //       ['KEY B', loadableWithPromise(Promise.reject(new Error('ERROR B')))],
  //     ]),
  //   ),
  // );
  // await flushPromisesAndTimers();
  // expect(container.textContent).toBe('error');
});

test('Persist on read', async () => {
  const atomA = atom({
    key: 'recoil-sync persist on read default',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({restore: validateAny, syncDefault: true})],
  });
  const atomB = atom({
    key: 'recoil-sync persist on read init',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      ({setSelf}) => setSelf('INIT_BEFORE'),
      syncEffect({restore: validateAny, syncDefault: true}),
      ({setSelf}) => setSelf('INIT_AFTER'),
    ],
  });

  const storage = new Map();

  const container = renderElements(
    <>
      <TestRecoilSync storage={storage} />
      <ReadsAtom atom={atomA} />
      <ReadsAtom atom={atomB} />
    </>,
  );

  expect(storage.size).toBe(0);
  expect(container.textContent).toBe('"DEFAULT""INIT_AFTER"');

  await flushPromisesAndTimers();

  expect(storage.size).toBe(2);
  expect(storage.get('recoil-sync persist on read default')?.getValue()).toBe(
    'DEFAULT',
  );
  expect(storage.get('recoil-sync persist on read init')?.getValue()).toBe(
    'INIT_AFTER',
  );
});

test('Persist on read - async', async () => {
  let resolveA, resolveB1, resolveB2;

  const atomA = atom({
    key: 'recoil-sync persist on read default async',
    // default: Promise.resolve('ASYNC_DEFAULT'),
    default: new Promise(resolve => {
      resolveA = resolve;
    }),
    effects_UNSTABLE: [syncEffect({restore: validateAny, syncDefault: true})],
  });
  const atomB = atom({
    key: 'recoil-sync persist on read init async',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      ({setSelf}) =>
        setSelf(
          new Promise(resolve => {
            resolveB1 = resolve;
          }),
        ),
      syncEffect({restore: validateAny, syncDefault: true}),
      ({setSelf}) =>
        setSelf(
          new Promise(resolve => {
            resolveB2 = resolve;
          }),
        ),
    ],
  });

  const storage = new Map();

  const container = renderElements(
    <>
      <TestRecoilSync storage={storage} />
      <ReadsAtom atom={atomA} />
      <ReadsAtom atom={atomB} />
    </>,
  );

  await flushPromisesAndTimers();
  expect(storage.size).toBe(0);

  act(() => {
    resolveA('ASYNC_DEFAULT');
  });
  await flushPromisesAndTimers();
  expect(storage.size).toBe(1);

  act(() => {
    resolveB1('ASYNC_INIT_BEFORE');
  });
  await flushPromisesAndTimers();
  expect(container.textContent).toBe('loading');
  expect(storage.size).toBe(1);

  act(() => {
    resolveB2('ASYNC_INIT_AFTER');
  });
  await flushPromisesAndTimers();
  expect(container.textContent).toBe('"ASYNC_DEFAULT""ASYNC_INIT_AFTER"');
  expect(storage.size).toBe(2);
  expect(
    storage.get('recoil-sync persist on read default async')?.getValue(),
  ).toBe('ASYNC_DEFAULT');
  expect(
    storage.get('recoil-sync persist on read init async')?.getValue(),
  ).toBe('ASYNC_INIT_AFTER');
});
