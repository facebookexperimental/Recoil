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
  useRef,
  useState,
  act,
  useStoreRef,
  atom,
  atomFamily,
  selector,
  useRecoilCallback,
  useSetRecoilState,
  ReadsAtom,
  flushPromisesAndTimers,
  renderElements,
  invariant;

const testRecoil = getRecoilTestFn(() => {
  React = require('React');
  ({useRef, useState} = require('React'));
  ({act} = require('ReactTestUtils'));

  ({useStoreRef} = require('../../core/Recoil_RecoilRoot.react'));
  ({
    atom,
    atomFamily,
    selector,
    useRecoilCallback,
    useSetRecoilState,
  } = require('../../Recoil_index'));
  ({
    ReadsAtom,
    flushPromisesAndTimers,
    renderElements,
  } = require('../../testing/Recoil_TestingUtils'));
  invariant = require('../../util/Recoil_invariant');
});

describe('useRecoilCallback', () => {
  testRecoil('Reads Recoil values', async () => {
    const anAtom = atom({key: 'atom1', default: 'DEFAULT'});
    let pTest = Promise.reject(new Error("Callback didn't resolve"));
    let cb;

    function Component() {
      cb = useRecoilCallback(({snapshot}) => () => {
        // eslint-disable-next-line jest/valid-expect
        pTest = expect(snapshot.getPromise(anAtom)).resolves.toBe('DEFAULT');
      });
      return null;
    }
    renderElements(<Component />);
    act(() => void cb());
    await pTest;
  });

  testRecoil('Can read Recoil values without throwing', async () => {
    const anAtom = atom({key: 'atom2', default: 123});
    const asyncSelector = selector({
      key: 'sel',
      get: () => {
        return new Promise(() => undefined);
      },
    });
    let didRun = false;
    let cb;

    function Component() {
      cb = useRecoilCallback(({snapshot}) => () => {
        expect(snapshot.getLoadable(anAtom)).toMatchObject({
          state: 'hasValue',
          contents: 123,
        });
        expect(snapshot.getLoadable(asyncSelector)).toMatchObject({
          state: 'loading',
        });
        didRun = true; // ensure these assertions do get made
      });
      return null;
    }
    renderElements(<Component />);
    act(() => void cb());
    expect(didRun).toBe(true);
  });

  testRecoil('Sets Recoil values (by queueing them)', async () => {
    const anAtom = atom({key: 'atom3', default: 'DEFAULT'});
    let cb;
    let pTest = Promise.reject(new Error("Callback didn't resolve"));

    function Component() {
      cb = useRecoilCallback(({snapshot, set}) => value => {
        set(anAtom, value);
        // eslint-disable-next-line jest/valid-expect
        pTest = expect(snapshot.getPromise(anAtom)).resolves.toBe('DEFAULT');
      });
      return null;
    }

    const container = renderElements(
      <>
        <Component />
        <ReadsAtom atom={anAtom} />
      </>,
    );
    expect(container.textContent).toBe('"DEFAULT"');
    act(() => void cb(123));
    expect(container.textContent).toBe('123');
    await pTest;
  });

  testRecoil('Reset Recoil values', async () => {
    const anAtom = atom({key: 'atomReset', default: 'DEFAULT'});
    let setCB, resetCB;

    function Component() {
      setCB = useRecoilCallback(({set}) => value => set(anAtom, value));
      resetCB = useRecoilCallback(({reset}) => () => reset(anAtom));
      return null;
    }

    const container = renderElements(
      <>
        <Component />
        <ReadsAtom atom={anAtom} />
      </>,
    );
    expect(container.textContent).toBe('"DEFAULT"');
    act(() => void setCB(123));
    expect(container.textContent).toBe('123');
    act(() => void resetCB());
    expect(container.textContent).toBe('"DEFAULT"');
  });

  testRecoil('Sets Recoil values from async callback', async () => {
    const anAtom = atom({key: 'set async callback', default: 'DEFAULT'});
    let cb;
    const pTest = [];

    function Component() {
      cb = useRecoilCallback(({snapshot, set}) => async value => {
        set(anAtom, value);
        pTest.push(
          // eslint-disable-next-line jest/valid-expect
          expect(snapshot.getPromise(anAtom)).resolves.toBe(
            value === 123 ? 'DEFAULT' : 123,
          ),
        );
      });
      return null;
    }

    const container = renderElements([
      <Component />,
      <ReadsAtom atom={anAtom} />,
    ]);

    expect(container.textContent).toBe('"DEFAULT"');
    act(() => void cb(123));
    expect(container.textContent).toBe('123');
    act(() => void cb(456));
    expect(container.textContent).toBe('456');
    for (const aTest of pTest) {
      await aTest;
    }
  });

  testRecoil(
    'Reads from a snapshot created at callback call time',
    async () => {
      const anAtom = atom({key: 'atom4', default: 123});
      let cb;
      let setter;
      let seenValue = null;

      let delay = () => new Promise(r => r()); // no delay initially

      function Component() {
        setter = useSetRecoilState(anAtom);
        cb = useRecoilCallback(({snapshot}) => async () => {
          snapshot.retain();
          await delay();
          seenValue = await snapshot.getPromise(anAtom);
        });
        return null;
      }

      // It sees an update flushed after the cb is created:
      renderElements(<Component />);
      act(() => setter(345));
      act(() => void cb());
      await flushPromisesAndTimers();
      await flushPromisesAndTimers();

      expect(seenValue).toBe(345);

      // But does not see an update flushed while the cb is in progress:
      seenValue = null;
      let resumeCallback = () => invariant(false, 'must be initialized');
      delay = () => {
        return new Promise(resolve => {
          resumeCallback = resolve;
        });
      };
      act(() => void cb());
      act(() => setter(678));
      resumeCallback();
      await flushPromisesAndTimers();
      await flushPromisesAndTimers();
      expect(seenValue).toBe(345);
    },
  );

  testRecoil('Setter updater sees current state', () => {
    const myAtom = atom({key: 'useRecoilCallback updater', default: 'DEFAULT'});

    let setAtom;
    let cb;
    function Component() {
      setAtom = useSetRecoilState(myAtom);
      cb = useRecoilCallback(({snapshot, set}) => prevValue => {
        // snapshot sees the stable snapshot from batch at beginning of transaction
        expect(snapshot.getLoadable(myAtom).contents).toEqual('DEFAULT');

        // Test that callback sees value updates from within the same transaction
        set(myAtom, value => {
          expect(value).toEqual(prevValue);
          return 'UPDATE';
        });
        set(myAtom, value => {
          expect(value).toEqual('UPDATE');
          return 'UPDATE AGAIN';
        });
      });
      return null;
    }

    const c = renderElements(
      <>
        <ReadsAtom atom={myAtom} />
        <Component />
      </>,
    );

    expect(c.textContent).toEqual('"DEFAULT"');

    // Set then callback in the same transaction
    act(() => {
      setAtom('SET');
      cb('SET');
      cb('UPDATE AGAIN');
    });
    expect(c.textContent).toEqual('"UPDATE AGAIN"');
  });

  testRecoil('goes to snapshot', async () => {
    const myAtom = atom({
      key: 'Goto Snapshot From Callback',
      default: 'DEFAULT',
    });

    let cb;
    function RecoilCallback() {
      cb = useRecoilCallback(({snapshot, gotoSnapshot}) => () => {
        const updatedSnapshot = snapshot.map(({set}) => {
          set(myAtom, 'SET IN SNAPSHOT');
        });
        expect(updatedSnapshot.getLoadable(myAtom).contents).toEqual(
          'SET IN SNAPSHOT',
        );
        gotoSnapshot(updatedSnapshot);
      });
      return null;
    }

    const c = renderElements(
      <>
        <ReadsAtom atom={myAtom} />
        <RecoilCallback />
      </>,
    );

    expect(c.textContent).toEqual('"DEFAULT"');

    act(() => void cb());
    await flushPromisesAndTimers();
    expect(c.textContent).toEqual('"SET IN SNAPSHOT"');
  });

  testRecoil('Updates are batched', () => {
    const family = atomFamily({
      key: 'useRecoilCallback/batching/family',
      default: 0,
    });

    let cb;
    function RecoilCallback() {
      cb = useRecoilCallback(({set}) => () => {
        for (let i = 0; i < 100; i++) {
          set(family(i), 1);
        }
      });
    }

    let store: any; // flowlint-line unclear-type:off
    function GetStore() {
      store = useStoreRef().current;
    }

    renderElements(
      <>
        <RecoilCallback />
        <GetStore />
      </>,
    );

    invariant(store, 'store should be initialized');
    const originalReplaceState = store.replaceState;
    store.replaceState = jest.fn(originalReplaceState);

    expect(store.replaceState).toHaveBeenCalledTimes(0);
    act(() => cb());
    expect(store.replaceState).toHaveBeenCalledTimes(1);

    store.replaceState = originalReplaceState;
  });
});

// Test that we always get a consistent instance of the callback function
// from useRecoilCallback() when it is memoizaed
testRecoil('Consistent callback function', () => {
  let setIteration;
  const Component = () => {
    const [iteration, _setIteration] = useState(0);
    setIteration = _setIteration;

    const callback = useRecoilCallback(() => () => {});
    const callbackRef = useRef(callback);
    iteration
      ? expect(callback).not.toBe(callbackRef.current)
      : expect(callback).toBe(callbackRef.current);

    const callbackMemoized = useRecoilCallback(() => () => {}, []);
    const callbackMemoizedRef = useRef(callbackMemoized);
    expect(callbackMemoized).toBe(callbackMemoizedRef.current);

    return iteration;
  };
  const out = renderElements(<Component />);
  expect(out.textContent).toBe('0');
  act(() => setIteration(1)); // Force a re-render of the Component
  expect(out.textContent).toBe('1');
});
