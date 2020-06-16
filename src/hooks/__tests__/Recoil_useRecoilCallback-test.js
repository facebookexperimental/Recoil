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

const React = require('React');
const {useRef, useState} = require('React');
const {act} = require('ReactTestUtils');

const {
  atom,
  selector,
  useRecoilCallback,
  useSetRecoilState,
} = require('../../Recoil_index');
const {
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers,
  renderElements,
} = require('../../testing/Recoil_TestingUtils');
const invariant = require('../../util/Recoil_invariant');

// This shouldn't be needed, but something with React and Jest needs a kick..
const kickAtom = atom({key: 'kicker', default: undefined});

describe('useRecoilCallback', () => {
  it('Reads Recoil values', async () => {
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
    act(cb);
    await pTest;
  });

  it('Can read Recoil values without throwing', async () => {
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
    act(cb);
    expect(didRun).toBe(true);
  });

  it('Sets Recoil values (by queueing them)', async () => {
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
    act(() => cb(123));
    expect(container.textContent).toBe('123');
    await pTest;
  });

  it('Reset Recoil values', async () => {
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
    act(() => setCB(123));
    expect(container.textContent).toBe('123');
    act(resetCB);
    expect(container.textContent).toBe('"DEFAULT"');
  });

  it('Sets Recoil values from async callback', async () => {
    const anAtom = atom({key: 'set async callback', default: 'DEFAULT'});
    let cb;
    // let pTest = Promise.reject(new Error("Callback didn't resolve"));
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

    // Something with React and Jest requires this extra kick...
    const [Kick, kick] = componentThatReadsAndWritesAtom(kickAtom);

    const container = renderElements([
      <Component />,
      <ReadsAtom atom={anAtom} />,
      <Kick />,
    ]);
    expect(container.textContent).toBe('"DEFAULT"');
    act(() => cb(123));
    act(kick);
    expect(container.textContent).toBe('123');
    act(() => cb(456));
    expect(container.textContent).toBe('456');
    for (const aTest of pTest) {
      await aTest;
    }
  });

  it('Reads from a snapshot created at callback call time', async () => {
    const anAtom = atom({key: 'atom4', default: 123});
    let cb;
    let setter;
    let seenValue = null;

    let delay = () => new Promise(r => r()); // no delay initially

    function Component() {
      setter = useSetRecoilState(anAtom);
      cb = useRecoilCallback(({snapshot}) => async () => {
        await delay();
        seenValue = await snapshot.getPromise(anAtom);
      });
      return null;
    }

    // It sees an update flushed after the cb is created:
    renderElements(<Component />);
    act(() => setter(345));
    act(cb);
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
    act(cb);
    act(() => setter(678));
    resumeCallback();
    await flushPromisesAndTimers();
    expect(seenValue).toBe(345);
  });

  it('goes to snapshot', async () => {
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

    act(cb);
    await flushPromisesAndTimers();
    expect(c.textContent).toEqual('"SET IN SNAPSHOT"');
  });
});

// Test that we always get a consistent instance of the callback function
// from useRecoilCallback() when it is memoizaed
test('Consistent callback function', () => {
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
