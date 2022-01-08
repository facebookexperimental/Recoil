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

import type {Loadable} from '../../adt/Recoil_Loadable';
import type {RecoilValue} from '../../core/Recoil_RecoilValue';

const {
  getRecoilTestFn,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

let React,
  store,
  atom,
  nullthrows,
  useEffect,
  useState,
  Profiler,
  noWait,
  act,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useRecoilValueLoadable,
  useSetRecoilState,
  useResetRecoilState,
  constSelector,
  errorSelector,
  getRecoilValueAsLoadable,
  setRecoilValue,
  selector,
  asyncSelector,
  ReadsAtom,
  renderElements,
  resolvingAsyncSelector,
  loadingAsyncSelector,
  flushPromisesAndTimers,
  DefaultValue,
  freshSnapshot;

const testRecoil = getRecoilTestFn(() => {
  const {
    makeStore,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

  React = require('react');
  ({useEffect, useState, Profiler} = require('react'));
  ({act} = require('ReactTestUtils'));
  atom = require('../Recoil_atom');
  ({
    useRecoilState,
    useRecoilValue,
    useRecoilValueLoadable,
    useSetRecoilState,
    useResetRecoilState,
  } = require('../../hooks/Recoil_Hooks'));
  ({useRecoilCallback} = require('../../hooks/Recoil_useRecoilCallback'));
  constSelector = require('../Recoil_constSelector');
  errorSelector = require('../Recoil_errorSelector');
  nullthrows = require('recoil-shared/util/Recoil_nullthrows');
  ({
    getRecoilValueAsLoadable,
    setRecoilValue,
  } = require('../../core/Recoil_RecoilValueInterface'));
  selector = require('../Recoil_selector');
  ({freshSnapshot} = require('../../core/Recoil_Snapshot'));
  ({
    asyncSelector,
    ReadsAtom,
    renderElements,
    resolvingAsyncSelector,
    loadingAsyncSelector,
    flushPromisesAndTimers,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  ({noWait} = require('../Recoil_WaitFor'));
  ({DefaultValue} = require('../../core/Recoil_Node'));

  store = makeStore();
});

function getLoadable<T>(recoilValue: RecoilValue<T>): Loadable<T> {
  return getRecoilValueAsLoadable(store, recoilValue);
}

function getValue<T>(recoilValue: RecoilValue<T>): T {
  return (getLoadable(recoilValue).contents: any); // flowlint-line unclear-type:off
}

function getPromise<T>(recoilValue: RecoilValue<T>): Promise<T> {
  return getLoadable(recoilValue).promiseOrThrow();
}

function getError(recoilValue): Error {
  const error = getLoadable(recoilValue).errorOrThrow();
  if (!(error instanceof Error)) {
    throw new Error('Expected error to be instance of Error');
  }
  return error;
}

function setValue(recoilState, value) {
  setRecoilValue(store, recoilState, value);
  // $FlowFixMe[unsafe-addition]
  // $FlowFixMe[cannot-write]
  store.getState().currentTree.version++;
}

function resetValue(recoilState) {
  setRecoilValue(store, recoilState, new DefaultValue());
  // $FlowFixMe[unsafe-addition]
  // $FlowFixMe[cannot-write]
  store.getState().currentTree.version++;
}

testRecoil('useRecoilState - static selector', () => {
  const staticSel = constSelector('HELLO');
  const c = renderElements(<ReadsAtom atom={staticSel} />);
  expect(c.textContent).toEqual('"HELLO"');
});

testRecoil('selector get', () => {
  const staticSel = constSelector('HELLO');

  const selectorRO = selector({
    key: 'selector/get',
    get: ({get}) => get(staticSel),
  });

  expect(getValue(selectorRO)).toEqual('HELLO');
});

testRecoil('selector set', () => {
  const myAtom = atom({
    key: 'selector/set/atom',
    default: 'DEFAULT',
  });

  const selectorRW = selector({
    key: 'selector/set',
    get: ({get}) => get(myAtom),
    set: ({set}, newValue) =>
      set(
        myAtom,
        newValue instanceof DefaultValue ? newValue : 'SET: ' + newValue,
      ),
  });

  expect(getValue(selectorRW)).toEqual('DEFAULT');
  setValue(myAtom, 'SET ATOM');
  expect(getValue(selectorRW)).toEqual('SET ATOM');
  setValue(selectorRW, 'SET SELECTOR');
  expect(getValue(selectorRW)).toEqual('SET: SET SELECTOR');
  resetValue(selectorRW);
  expect(getValue(selectorRW)).toEqual('DEFAULT');
});

testRecoil('selector reset', () => {
  const myAtom = atom({
    key: 'selector/reset/atom',
    default: 'DEFAULT',
  });

  const selectorRW = selector({
    key: 'selector/reset',
    get: ({get}) => get(myAtom),
    set: ({reset}) => reset(myAtom),
  });

  expect(getValue(selectorRW)).toEqual('DEFAULT');
  setValue(myAtom, 'SET ATOM');
  expect(getValue(selectorRW)).toEqual('SET ATOM');
  setValue(selectorRW, 'SET SELECTOR');
  expect(getValue(selectorRW)).toEqual('DEFAULT');
});

testRecoil('useRecoilState - resolved async selector', async () => {
  const resolvingSel = resolvingAsyncSelector('HELLO');
  const c = renderElements(<ReadsAtom atom={resolvingSel} />);
  expect(c.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"HELLO"');
});

testRecoil('selector - evaluate to RecoilValue', () => {
  const atomA = atom({key: 'selector/const atom A', default: 'A'});
  const atomB = atom({key: 'selector/const atom B', default: 'B'});
  const inputAtom = atom({key: 'selector/input', default: 'a'});
  const mySelector = selector<string>({
    key: 'selector/output recoil value',
    get: ({get}) => (get(inputAtom) === 'a' ? atomA : atomB),
  });

  expect(getValue(mySelector)).toEqual('A');
  setValue(inputAtom, 'b');
  expect(getValue(mySelector)).toEqual('B');
});

testRecoil('selector - catching exceptions', () => {
  const throwingSel = errorSelector('MY ERROR');
  expect(getValue(throwingSel)).toBeInstanceOf(Error);

  const catchingSelector = selector({
    key: 'selector/catching selector',
    get: ({get}) => {
      try {
        return get(throwingSel);
      } catch (e) {
        expect(e instanceof Error).toBe(true);
        expect(e.message).toContain('MY ERROR');
        return 'CAUGHT';
      }
    },
  });
  expect(getValue(catchingSelector)).toEqual('CAUGHT');
});

testRecoil('selector - catching exception (non Error)', () => {
  const throwingSel = selector({
    key: '__error/non Error thrown',
    get: () => {
      // eslint-disable-next-line no-throw-literal
      throw 'MY ERROR';
    },
  });

  const catchingSelector = selector({
    key: 'selector/catching selector',
    get: ({get}) => {
      try {
        return get(throwingSel);
      } catch (e) {
        expect(e).toBe('MY ERROR');
        return 'CAUGHT';
      }
    },
  });

  expect(getValue(catchingSelector)).toEqual('CAUGHT');
});

testRecoil('selector - catching loads', () => {
  const loadingSel = resolvingAsyncSelector('READY');
  expect(getValue(loadingSel) instanceof Promise).toBe(true);

  const blockedSelector = selector({
    key: 'selector/blocked selector',
    get: ({get}) => get(loadingSel),
  });
  expect(getValue(blockedSelector) instanceof Promise).toBe(true);

  const bypassSelector = selector({
    key: 'selector/bypassing selector',
    get: ({get}) => {
      try {
        return get(loadingSel);
      } catch (promise) {
        expect(promise instanceof Promise).toBe(true);
        return 'BYPASS';
      }
    },
  });
  expect(getValue(bypassSelector)).toBe('BYPASS');
  act(() => jest.runAllTimers());
  expect(getValue(bypassSelector)).toEqual('READY');
});

testRecoil('useRecoilState - selector catching exceptions', () => {
  const throwingSel = errorSelector('MY ERROR');
  const c1 = renderElements(<ReadsAtom atom={throwingSel} />);
  expect(c1.textContent).toEqual('error');

  const catchingSelector = selector({
    key: 'useRecoilState/catching selector',
    get: ({get}) => {
      try {
        return get(throwingSel);
      } catch (e) {
        expect(e instanceof Error).toBe(true);
        expect(e.message).toContain('MY ERROR');
        return 'CAUGHT';
      }
    },
  });
  const c2 = renderElements(<ReadsAtom atom={catchingSelector} />);
  expect(c2.textContent).toEqual('"CAUGHT"');
});

testRecoil('useRecoilState - selector catching exceptions (non Errors)', () => {
  const throwingSel = selector({
    key: '__error/non Error thrown',
    get: () => {
      // eslint-disable-next-line no-throw-literal
      throw 'MY ERROR';
    },
  });

  const c1 = renderElements(<ReadsAtom atom={throwingSel} />);
  expect(c1.textContent).toEqual('error');

  const catchingSelector = selector({
    key: 'useRecoilState/catching selector',
    get: ({get}) => {
      try {
        return get(throwingSel);
      } catch (e) {
        expect(e).toBe('MY ERROR');
        return 'CAUGHT';
      }
    },
  });

  const c2 = renderElements(<ReadsAtom atom={catchingSelector} />);
  expect(c2.textContent).toEqual('"CAUGHT"');
});

testRecoil('useRecoilState - async selector', async () => {
  const resolvingSel = resolvingAsyncSelector('READY');

  // On first read it is blocked on the async selector
  const c1 = renderElements(<ReadsAtom atom={resolvingSel} />);
  expect(c1.textContent).toEqual('loading');

  // When that resolves the data is ready
  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(c1.textContent).toEqual('"READY"');
});

testRecoil('useRecoilState - selector blocked on dependency', async () => {
  const resolvingSel = resolvingAsyncSelector('READY');
  const blockedSelector = selector({
    key: 'useRecoilState/blocked selector',
    get: ({get}) => get(resolvingSel),
  });

  // On first read, the selectors dependency is still loading
  const c2 = renderElements(<ReadsAtom atom={blockedSelector} />);
  expect(c2.textContent).toEqual('loading');

  // When the dependency resolves, the data is ready
  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(c2.textContent).toEqual('"READY"');
});

testRecoil('useRecoilState - selector catching loads', async () => {
  const resolvingSel = resolvingAsyncSelector('READY');
  const bypassSelector = selector({
    key: 'useRecoilState/bypassing selector',
    get: ({get}) => {
      try {
        const value = get(resolvingSel);
        expect(value).toBe('READY');
        return value;
      } catch (promise) {
        expect(promise instanceof Promise).toBe(true);
        return 'BYPASS';
      }
    },
  });

  // On first read the dependency is not yet available, but the
  // selector catches and bypasses it.
  const c3 = renderElements(<ReadsAtom atom={bypassSelector} />);
  expect(c3.textContent).toEqual('"BYPASS"');

  // When the dependency does resolve, the selector re-evaluates
  // with the new data.
  act(() => jest.runAllTimers());
  expect(c3.textContent).toEqual('"READY"');
});

testRecoil('useRecoilState - selector catching all of 2 loads', async () => {
  const [resolvingSel1, res1] = asyncSelector();
  const [resolvingSel2, res2] = asyncSelector();

  const bypassSelector = selector({
    key: 'useRecoilState/bypassing selector all',
    get: ({get}) => {
      let ready = 0;
      try {
        const value1 = get(resolvingSel1);
        expect(value1).toBe('READY1');
        ready++;
        const value2 = get(resolvingSel2);
        expect(value2).toBe('READY2');
        ready++;
        return ready;
      } catch (promise) {
        expect(promise instanceof Promise).toBe(true);
        return ready;
      }
    },
  });

  // On first read the dependency is not yet available, but the
  // selector catches and bypasses it.
  const c3 = renderElements(<ReadsAtom atom={bypassSelector} />);
  expect(c3.textContent).toEqual('0');

  // After the first resolution, we're still waiting on the second
  res1('READY1');
  act(() => jest.runAllTimers());
  expect(c3.textContent).toEqual('1');

  // When both are available, we are done!
  res2('READY2');
  act(() => jest.runAllTimers());
  expect(c3.textContent).toEqual('2');
});

testRecoil('useRecoilState - selector catching any of 2 loads', async () => {
  const resolvingSel1 = resolvingAsyncSelector('READY');
  const resolvingSel2 = resolvingAsyncSelector('READY');
  const bypassSelector = selector({
    key: 'useRecoilState/bypassing selector any',
    get: ({get}) => {
      let ready = 0;
      for (const resolvingSel of [resolvingSel1, resolvingSel2]) {
        try {
          const value = get(resolvingSel);
          expect(value).toBe('READY');
          ready++;
        } catch (promise) {
          expect(promise instanceof Promise).toBe(true);
          ready = ready;
        }
      }
      return ready;
    },
  });

  // On first read the dependency is not yet available, but the
  // selector catches and bypasses it.
  const c3 = renderElements(<ReadsAtom atom={bypassSelector} />);
  expect(c3.textContent).toEqual('0');

  // Because both dependencies are tried, they should both resolve
  // in parallel after one event loop.
  act(() => jest.runAllTimers());
  expect(c3.textContent).toEqual('2');
});

// Test the ability to catch a promise for a pending dependency that we can
// then handle by returning an async promise.
testRecoil(
  'useRecoilState - selector catching promise and resolving asynchronously',
  async () => {
    const [originalDep, resolveOriginal] = asyncSelector();
    const [bypassDep, resolveBypass] = asyncSelector();
    const catchPromiseSelector = selector({
      key: 'useRecoilState/catch then async',
      get: ({get}) => {
        try {
          return get(originalDep);
        } catch (promise) {
          expect(promise instanceof Promise).toBe(true);
          return bypassDep;
        }
      },
    });
    const c = renderElements(<ReadsAtom atom={catchPromiseSelector} />);

    expect(c.textContent).toEqual('loading');
    act(() => jest.runAllTimers());
    expect(c.textContent).toEqual('loading');
    resolveBypass('BYPASS');
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(c.textContent).toEqual('"BYPASS"');
    resolveOriginal('READY');
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(c.textContent).toEqual('"READY"');
  },
);

// This tests ability to catch a pending result as a promise and
// that the promise resolves to the dependency's value and it is handled
// as an asynchronous selector
testRecoil('useRecoilState - selector catching promise 2', async () => {
  let dependencyPromiseTest;
  const resolvingSel = resolvingAsyncSelector('READY');
  const catchPromiseSelector = selector({
    key: 'useRecoilState/catch then async 2',
    get: ({get}) => {
      try {
        return get(resolvingSel);
      } catch (promise) {
        expect(promise instanceof Promise).toBe(true);
        // eslint-disable-next-line jest/valid-expect
        dependencyPromiseTest = expect(promise).resolves.toBe('READY');

        return promise.then(pending => {
          const result = pending.value;
          expect(result).toBe('READY');
          return result.value + ' NOW';
        });
      }
    },
  });
  const c = renderElements(<ReadsAtom atom={catchPromiseSelector} />);

  expect(c.textContent).toEqual('loading');

  await flushPromisesAndTimers();

  // NOTE!!!
  // The output here may be "READY NOW" if we optimize the selector to
  // cache the result of the async evaluation when the dependency is available
  // in the cache key with the dependency being available.  Currently it does not
  // So, when the dependency is ready and the component re-renders it will
  // re-evaluate.  At that point the dependency is now READY and thus we only
  // get READY and not READY NOW.
  // expect(c.textContent).toEqual('"READY NOW"');
  expect(c.textContent).toEqual('"READY"');

  // Test that the promise for the dependency that we got actually resolved
  // to the dependency's value.
  await dependencyPromiseTest;
});

// Test that Recoil will throw an error with a useful debug message instead of
// infinite recurssion when there is a circular dependency
testRecoil('Detect circular dependencies', () => {
  const selectorA = selector({
    key: 'circular/A',
    get: ({get}) => get(selectorC),
  });
  const selectorB = selector({
    key: 'circular/B',
    get: ({get}) => get(selectorA),
  });
  const selectorC = selector({
    key: 'circular/C',
    get: ({get}) => get(selectorB),
  });
  const devStatus = window.__DEV__;
  window.__DEV__ = true;
  expect(getValue(selectorC)).toBeInstanceOf(Error);
  expect(getError(selectorC).message).toEqual(
    expect.stringContaining('circular/A'),
  );
  window.__DEV__ = devStatus;
});

testRecoil(
  'selector is able to track dependencies discovered asynchronously',
  async () => {
    const anAtom = atom({key: 'atomTrackedAsync', default: 'Async Dep Value'});

    const selectorWithAsyncDeps = selector({
      key: 'selectorTrackDepsIncrementally',
      get: async ({get}) => {
        await Promise.resolve(); // needed to simulate discovering a dependency asynchronously

        return get(anAtom);
      },
    });

    let setAtom;

    function Component() {
      [, setAtom] = useRecoilState(anAtom);
      const selVal = useRecoilValue(selectorWithAsyncDeps);

      return selVal;
    }

    const container = renderElements(<Component />);

    expect(container.textContent).toEqual('loading');

    await flushPromisesAndTimers();
    await flushPromisesAndTimers(); // HACK: not sure why but this is needed in OSS

    expect(container.textContent).toEqual('Async Dep Value');

    act(() => setAtom('CHANGED Async Dep'));

    expect(container.textContent).toEqual('loading');

    await flushPromisesAndTimers();

    expect(container.textContent).toEqual('CHANGED Async Dep');
  },
);

/**
 * This test is an extension of the 'selector is able to track dependencies
 * discovered asynchronously' test: in addition to testing that a selector
 * responds to changes in dependencies that were discovered asynchronously, the
 * selector should run through the entire selector in response to those changes.
 */
testRecoil(
  'selector should rerun entire selector when a dep changes',
  async () => {
    const resolvingSel1 = resolvingAsyncSelector(1);
    const resolvingSel2 = resolvingAsyncSelector(2);
    const anAtom3 = atom({key: 'atomTrackedAsync3', default: 3});

    const selectorWithAsyncDeps = selector({
      key: 'selectorNotCacheIncDeps',
      get: async ({get}) => {
        const val1 = get(resolvingSel1);

        await Promise.resolve();

        const val2 = get(resolvingSel2);

        await Promise.resolve();

        const val3 = get(anAtom3);

        return val1 + val2 + val3;
      },
    });

    let setAtom;

    function Component() {
      [, setAtom] = useRecoilState(anAtom3);
      const selVal = useRecoilValue(selectorWithAsyncDeps);

      return selVal;
    }

    const container = renderElements(<Component />);

    expect(container.textContent).toEqual('loading');

    await flushPromisesAndTimers();

    // HACK: not sure why but these are needed in OSS
    await flushPromisesAndTimers();
    await flushPromisesAndTimers();
    await flushPromisesAndTimers();
    await flushPromisesAndTimers();

    expect(container.textContent).toEqual('6');

    act(() => setAtom(4));

    expect(container.textContent).toEqual('loading');

    await flushPromisesAndTimers();
    await flushPromisesAndTimers();
    await flushPromisesAndTimers();

    expect(container.textContent).toEqual('7');
  },
);

testRecoil("Updating with same value doesn't rerender", ({gks}) => {
  if (!gks.includes('recoil_suppress_rerender_in_callback')) {
    return;
  }

  const myAtom = atom({
    key: 'selector same value rerender / atom',
    default: {value: 'DEFAULT'},
  });
  const mySelector = selector({
    key: 'selector - same value rerender',
    get: ({get}) => get(myAtom).value,
  });

  let setAtom;
  let resetAtom;
  let renders = 0;
  function SelectorComponent() {
    const value = useRecoilValue(mySelector);
    const setAtomValue = useSetRecoilState(myAtom);
    const resetAtomValue = useResetRecoilState(myAtom);
    setAtom = x => setAtomValue({value: x});
    resetAtom = resetAtomValue;
    return value;
  }
  expect(renders).toEqual(0);
  const c = renderElements(
    <Profiler
      id="test"
      onRender={() => {
        renders++;
      }}>
      <SelectorComponent />
    </Profiler>,
  );

  // Initial render happens one time in www and 2 times in oss.
  // resetting the counter to 1 after the initial render to make them
  // the same in both repos. 2 renders probably need to be looked into.
  renders = 1;

  expect(c.textContent).toEqual('DEFAULT');

  act(() => setAtom('SET'));
  expect(c.textContent).toEqual('SET');
  expect(renders).toEqual(2);

  act(() => setAtom('SET'));
  expect(c.textContent).toEqual('SET');
  expect(renders).toEqual(2);

  act(() => setAtom('CHANGE'));
  expect(c.textContent).toEqual('CHANGE');
  expect(renders).toEqual(3);

  act(resetAtom);
  expect(c.textContent).toEqual('DEFAULT');
  expect(renders).toEqual(4);

  act(resetAtom);
  expect(c.textContent).toEqual('DEFAULT');
  expect(renders).toEqual(4);
});

// Test the following scenario:
// 0. Recoil state version 1 with A=FOO and B=BAR
// 1. Component renders with A for a value of FOO
// 2. Component renders with B for a value of BAR
// 3. Recoil state updated to version 2 with A=FOO and B=FOO
//
// Step 2 may be problematic if we attempt to suppress re-renders and don't
// properly keep track of previous component values when the mutable source changes.
testRecoil('Updating with changed selector', ({gks}) => {
  if (!gks.includes('recoil_suppress_rerender_in_callback')) {
    return;
  }

  const atomA = atom({
    key: 'selector change rerender / atomA',
    default: {value: 'FOO'},
  });
  const atomB = atom({
    key: 'selector change rerender / atomB',
    default: {value: 'BAR'},
  });
  const selectorA = selector({
    key: 'selector change rerender / selectorA',
    get: ({get}) => get(atomA).value,
  });
  const selectorB = selector({
    key: 'selector change rerender / selectorB',
    get: ({get}) => get(atomB).value,
  });

  let setSide;
  let setB;
  function SelectorComponent() {
    const [side, setSideState] = useState('A');
    setSide = setSideState;

    setB = useRecoilCallback(({snapshot, gotoSnapshot}) => value => {
      gotoSnapshot(
        snapshot.map(({set}) => {
          set(atomB, {value});
        }),
      );
    });

    return useRecoilValue(side === 'A' ? selectorA : selectorB);
  }
  const c = renderElements(<SelectorComponent />);

  expect(c.textContent).toEqual('FOO');

  // When we change the selector we are looking up it will render other atom's value
  act(() => setSide('B'));
  expect(c.textContent).toEqual('BAR');

  // When we change Recoil state the component should re-render with new value.
  // True even if we keep track of previous renders values to suppress re-renders when they don't change.
  // If we don't keep track properly when the atom changes, this may break.
  act(() => setB('FOO'));
  expect(c.textContent).toEqual('FOO');

  // When we swap back to atomA it now has the same value as atomB.
  act(() => setSide('A'));
  expect(c.textContent).toEqual('FOO');
});

testRecoil('Change component prop to suspend and wake', () => {
  const awakeSelector = constSelector('WAKE');
  const suspendedSelector = loadingAsyncSelector();

  function TestComponent({side}) {
    return (
      useRecoilValue(side === 'AWAKE' ? awakeSelector : suspendedSelector) ??
      'LOADING'
    );
  }

  let setSide;
  const SelectorComponent = function () {
    const [side, setSideState] = useState('AWAKE');
    setSide = setSideState;
    return <TestComponent side={side} />;
  };
  const c = renderElements(<SelectorComponent />);

  expect(c.textContent).toEqual('WAKE');

  act(() => setSide('SLEEP'));
  expect(c.textContent).toEqual('loading');

  act(() => setSide('AWAKE'));
  expect(c.textContent).toEqual('WAKE');
});

/**
 * This test ensures that we are not running the selector's get() an unnecessary
 * number of times in response to async selectors resolving (i.e. by retrying
 * more times than we have to or creating numerous promises that retry).
 */
testRecoil(
  'async selector runs the minimum number of times required',
  async () => {
    const [asyncDep1, resolveAsyncDep1] = asyncSelector();
    const [asyncDep2, resolveAsyncDep2] = asyncSelector();

    let numTimesRan = 0;

    const selectorWithAsyncDeps = selector({
      key: 'selectorRunsMinTimes',
      get: async ({get}) => {
        numTimesRan++;
        return get(asyncDep1) + get(asyncDep2);
      },
    });

    const container = renderElements(
      <ReadsAtom atom={selectorWithAsyncDeps} />,
    );

    expect(numTimesRan).toBe(1);

    act(() => resolveAsyncDep1('a'));

    await flushPromisesAndTimers();

    expect(numTimesRan).toBe(2);

    act(() => resolveAsyncDep2('b'));

    await flushPromisesAndTimers();

    expect(numTimesRan).toBe(3);

    await flushPromisesAndTimers();

    expect(container.textContent).toEqual('"ab"');
  },
);

testRecoil(
  'async selector with changing dependencies finishes execution using original state',
  async () => {
    const [asyncDep, resolveAsyncDep] = asyncSelector();
    const anAtom = atom({key: 'atomChangingDeps', default: 3});

    const anAsyncSelector = selector({
      key: 'selectorWithChangingDeps',
      get: ({get}) => {
        const atomValueBefore = get(anAtom);

        get(asyncDep);

        const atomValueAfter = get(anAtom);

        expect(atomValueBefore).toBe(atomValueAfter);

        return atomValueBefore + atomValueAfter;
      },
    });

    let loadableSoFar;
    let setAtom;

    const MyComponent = () => {
      const setAtomLocal = useSetRecoilState(anAtom);
      const asyncSelLoadable = useRecoilValueLoadable(anAsyncSelector);

      setAtom = setAtomLocal;
      loadableSoFar = asyncSelLoadable;

      return asyncSelLoadable.state;
    };

    renderElements(<MyComponent />);

    const loadableBeforeChangingAnything = nullthrows(loadableSoFar);
    expect(loadableBeforeChangingAnything.contents).toBeInstanceOf(Promise);

    act(() => setAtom(10));

    const loadableAfterChangingAtom = nullthrows(loadableSoFar);
    expect(loadableAfterChangingAtom.contents).toBeInstanceOf(Promise);
    expect(loadableBeforeChangingAnything.contents).not.toBe(
      loadableAfterChangingAtom.contents,
    );

    act(() => resolveAsyncDep(''));

    await flushPromisesAndTimers();

    await Promise.all([
      expect(loadableBeforeChangingAnything.toPromise()).resolves.toBe(3 + 3),
      expect(loadableAfterChangingAtom.toPromise()).resolves.toBe(10 + 10),
    ]);
  },
);

testRecoil('selector - dynamic getRecoilValue()', async () => {
  const sel2 = selector({
    key: 'MySelector2',
    get: async () => 'READY',
  });

  const sel1 = selector({
    key: 'MySelector',
    get: async ({get}) => {
      await Promise.resolve();
      return get(sel2);
    },
  });

  const el = renderElements(<ReadsAtom atom={sel1} />);
  expect(el.textContent).toEqual('loading');

  await act(() => getValue(sel1));
  act(() => jest.runAllTimers());

  expect(el.textContent).toEqual('"READY"');
});

testRecoil(
  'distinct loading dependencies are treated as distinct',
  async () => {
    const upstreamAtom = atom({
      key: 'distinct loading dependencies/upstreamAtom',
      default: 0,
    });
    const upstreamAsyncSelector = selector({
      key: 'distinct loading dependencies/upstreamAsyncSelector',
      get: ({get}) => Promise.resolve(get(upstreamAtom)),
    });
    const directSelector = selector({
      key: 'distinct loading dependencies/directSelector',
      get: ({get}) => get(upstreamAsyncSelector),
    });

    expect(getValue(directSelector) instanceof Promise).toBe(true);

    act(() => jest.runAllTimers());
    expect(getValue(directSelector)).toEqual(0);

    setValue(upstreamAtom, 1);
    expect(getValue(directSelector) instanceof Promise).toBe(true);

    act(() => jest.runAllTimers());
    expect(getValue(directSelector)).toEqual(1);
  },
);

testRecoil(
  'Selector deps are saved when a component mounts due to a non-recoil change at the same time that a selector is first read',
  () => {
    // Regression test for an issue where selector dependencies were not saved
    // in this circumstance. In this situation dependencies are discovered for
    // a selector when reading from a non-latest graph. This tests that these deps
    // are carried forward instead of being forgotten.
    let show, setShow, setAnotherAtom;
    function Parent() {
      [show, setShow] = useState(false);
      setAnotherAtom = useSetRecoilState(anotherAtom);
      if (show) {
        return <SelectorUser />;
      } else {
        return null;
      }
    }

    const anAtom = atom<number>({key: 'anAtom', default: 0});
    const anotherAtom = atom<number>({key: 'anotherAtom', default: 0});

    const aSelector = selector({
      key: 'aSelector',
      get: ({get}) => {
        return get(anAtom);
      },
    });

    function SelectorUser() {
      const setter = useSetRecoilState(anAtom);
      useEffect(() => {
        setter(1);
      });
      return useRecoilValue(aSelector);
    }

    const c = renderElements(<Parent />);

    expect(c.textContent).toEqual('');

    act(() => {
      setShow(true);
      setAnotherAtom(1);
    });

    expect(c.textContent).toEqual('1');
  },
);

describe('Async selector resolution notifies all stores that read pending', () => {
  // Regression tests for #534: selectors used to only notify whichever store
  // originally caused a promise to be returned, not any stores that also read
  // the selector in that pending state.
  testRecoil('Selectors read in a snapshot notify all stores', async () => {
    // This version of the test uses the store inside of a Snapshot as its second store.
    const switchAtom = atom({
      key: 'notifiesAllStores/snapshots/switch',
      default: false,
    });
    const selectorA = selector({
      key: 'notifiesAllStores/snapshots/a',
      get: () => 'foo',
    });
    let resolve = _ => {
      throw new Error('error in test');
    };
    const selectorB = selector({
      key: 'notifiesAllStores/snapshots/b',
      get: async () =>
        new Promise(r => {
          resolve = r;
        }),
    });

    let doIt;

    function TestComponent() {
      const shouldQuery = useRecoilValue(switchAtom);
      const query = useRecoilValueLoadable(shouldQuery ? selectorB : selectorA);

      doIt = useRecoilCallback(({snapshot, set}) => () => {
        /**
         * this is required as we need the selector accessed below to outlive
         * the end of this callback so that the async resolution notifies the
         * store of the resolution and a re-render is triggered. Otherwise, the
         * selector will be cleaned up at the end of the callback, meaning the
         * resolution of the selector will not result in a re-render.
         */
        snapshot.retain();
        snapshot.getLoadable(selectorB); // cause query to be triggered in context of snapshot store
        set(switchAtom, true); // cause us to then read from the pending selector
      });

      return query.state === 'hasValue' ? query.contents : 'loading';
    }

    const c = renderElements(<TestComponent />);
    expect(c.textContent).toEqual('foo');

    act(doIt);
    expect(c.textContent).toEqual('loading');

    act(() => resolve('bar'));
    await act(flushPromisesAndTimers);
    await act(flushPromisesAndTimers);
    expect(c.textContent).toEqual('bar');
  });

  testRecoil('Selectors read in a another root notify all roots', async () => {
    // This version of the test uses another RecoilRoot as its second store
    const switchAtom = atom({
      key: 'notifiesAllStores/twoRoots/switch',
      default: false,
    });

    const selectorA = selector({
      key: 'notifiesAllStores/twoRoots/a',
      get: () => 'SELECTOR A',
    });

    let resolve = _ => {
      throw new Error('error in test');
    };
    const selectorB = selector({
      key: 'notifiesAllStores/twoRoots/b',
      get: async () =>
        new Promise(r => {
          resolve = r;
        }),
    });

    function TestComponent({
      setSwitch,
    }: {
      setSwitch: ((boolean) => void) => void,
    }) {
      const [shouldQuery, setShouldQuery] = useRecoilState(switchAtom);
      const query = useRecoilValueLoadable(shouldQuery ? selectorB : selectorA);
      setSwitch(setShouldQuery);
      return query.state === 'hasValue' ? query.contents : 'loading';
    }

    let setRootASelector;
    const rootA = renderElements(
      <TestComponent
        setSwitch={setSelector => {
          setRootASelector = setSelector;
        }}
      />,
    );
    let setRootBSelector;
    const rootB = renderElements(
      <TestComponent
        setSwitch={setSelector => {
          setRootBSelector = setSelector;
        }}
      />,
    );

    expect(rootA.textContent).toEqual('SELECTOR A');
    expect(rootB.textContent).toEqual('SELECTOR A');

    act(() => setRootASelector(true)); // cause rootA to read the selector
    expect(rootA.textContent).toEqual('loading');
    expect(rootB.textContent).toEqual('SELECTOR A');

    act(() => setRootBSelector(true)); // cause rootB to read the selector
    expect(rootA.textContent).toEqual('loading');
    expect(rootB.textContent).toEqual('loading');

    act(() => resolve('SELECTOR B'));

    await flushPromisesAndTimers();

    expect(rootA.textContent).toEqual('SELECTOR B');
    expect(rootB.textContent).toEqual('SELECTOR B');
  });
});

testRecoil(
  'selector - kite pattern runs only necessary selectors',
  async () => {
    const aNode = atom({
      key: 'aNode',
      default: true,
    });

    let bNodeRunCount = 0;
    const bNode = selector({
      key: 'bNode',
      get: ({get}) => {
        bNodeRunCount++;
        const a = get(aNode);
        return String(a);
      },
    });

    let cNodeRunCount = 0;
    const cNode = selector({
      key: 'cNode',
      get: ({get}) => {
        cNodeRunCount++;
        const a = get(aNode);
        return String(Number(a));
      },
    });

    let dNodeRunCount = 0;
    const dNode = selector({
      key: 'dNode',
      get: ({get}) => {
        dNodeRunCount++;
        const value = get(aNode) ? get(bNode) : get(cNode);
        return value.toUpperCase();
      },
    });

    let dNodeValue = getValue(dNode);
    expect(dNodeValue).toEqual('TRUE');
    expect(bNodeRunCount).toEqual(1);
    expect(cNodeRunCount).toEqual(0);
    expect(dNodeRunCount).toEqual(1);

    setValue(aNode, false);
    dNodeValue = getValue(dNode);
    expect(dNodeValue).toEqual('0');
    expect(bNodeRunCount).toEqual(1);
    expect(cNodeRunCount).toEqual(1);
    expect(dNodeRunCount).toEqual(2);
  },
);

testRecoil('async set not supported', async () => {
  const myAtom = atom({
    key: 'selector / async not supported / other atom',
    default: 'DEFAULT',
  });

  const mySelector = selector({
    key: 'selector / async set not supported / async set method',
    get: () => myAtom,
    // Set should not be async, this test checks that it throws an error.
    // $FlowExpectedError
    set: async ({set, reset}, newVal) => {
      await Promise.resolve();
      newVal instanceof DefaultValue ? reset(myAtom) : set(myAtom, 'SET');
    },
  });

  let setAttempt, resetAttempt;
  const mySelector2 = selector({
    key: 'selector / async set not supported / async upstream call',
    get: () => myAtom,
    set: ({set, reset}, newVal) => {
      if (newVal instanceof DefaultValue) {
        resetAttempt = new Promise.resolve().then(() => {
          reset(myAtom);
        });
      } else {
        setAttempt = new Promise.resolve().then(() => {
          set(myAtom, 'SET');
        });
      }
    },
  });

  const testSnapshot = freshSnapshot();
  testSnapshot.retain();
  expect(() =>
    testSnapshot.map(({set}) => {
      set(mySelector, 'SET');
    }),
  ).toThrow();
  expect(() =>
    testSnapshot.map(({reset}) => {
      reset(mySelector);
    }),
  ).toThrow();
  const setSnapshot = testSnapshot.map(({set, reset}) => {
    set(mySelector2, 'SET');
    reset(mySelector2);
  });
  setSnapshot.retain();

  await flushPromisesAndTimers();
  expect(setSnapshot.getLoadable(mySelector2).contents).toEqual('DEFAULT');
  await expect(setAttempt).rejects.toThrowError();
  await expect(resetAttempt).rejects.toThrowError();
});

testRecoil(
  'selectors with user-thrown loadable promises execute to completion as expected',
  async () => {
    const [asyncDep, resolveAsyncDep] = asyncSelector<string, void>();

    const selWithUserThrownPromise = selector({
      key: 'selWithUserThrownPromise',
      get: ({get}) => {
        const loadable = get(noWait(asyncDep));

        if (loadable.state === 'loading') {
          throw loadable.toPromise();
        }

        return loadable.valueOrThrow();
      },
    });

    const loadable = getLoadable(selWithUserThrownPromise);
    const promise = loadable.toPromise();

    expect(loadable.state).toBe('loading');

    resolveAsyncDep('RESOLVED');

    await flushPromisesAndTimers();

    const val: mixed = await promise;

    expect(val).toBe('RESOLVED');
  },
);

testRecoil(
  'selectors with user-thrown loadable promises execute to completion as expected',
  async () => {
    const myAtomA = atom({
      key: 'myatoma selectors user-thrown promise',
      default: 'A',
    });

    const myAtomB = atom({
      key: 'myatomb selectors user-thrown promise',
      default: 'B',
    });

    let isResolved = false;
    let resolve = () => {};

    const myPromise = new Promise(localResolve => {
      resolve = () => {
        isResolved = true;
        localResolve();
      };
    });

    const selWithUserThrownPromise = selector({
      key: 'selWithUserThrownPromise',
      get: ({get}) => {
        const a = get(myAtomA);

        if (!isResolved) {
          throw myPromise;
        }

        const b = get(myAtomB);

        return `${a}${b}`;
      },
    });

    const loadable = getLoadable(selWithUserThrownPromise);
    const promise = loadable.toPromise();

    expect(loadable.state).toBe('loading');

    resolve();

    await flushPromisesAndTimers();

    const val: mixed = await promise;

    expect(val).toBe('AB');
  },
);

testRecoil(
  'selectors with nested user-thrown loadable promises execute to completion as expected',
  async () => {
    const [asyncDep, resolveAsyncDep] = asyncSelector<string, void>();

    const selWithUserThrownPromise = selector({
      key: 'selWithUserThrownPromise',
      get: ({get}) => {
        const loadable = get(noWait(asyncDep));

        if (loadable.state === 'loading') {
          throw loadable.toPromise();
        }

        return loadable.valueOrThrow();
      },
    });

    const selThatDependsOnSelWithUserThrownPromise = selector({
      key: 'selThatDependsOnSelWithUserThrownPromise',
      get: ({get}) => get(selWithUserThrownPromise),
    });

    const loadable = getLoadable(selThatDependsOnSelWithUserThrownPromise);
    const promise = loadable.toPromise();

    expect(loadable.state).toBe('loading');

    resolveAsyncDep('RESOLVED');

    await flushPromisesAndTimers();

    const val: mixed = await promise;

    expect(val).toBe('RESOLVED');
  },
);

testRecoil('selectors cannot mutate values in get() or set()', () => {
  const devStatus = window.__DEV__;
  window.__DEV__ = true;

  const userState = atom({
    key: 'userState',
    default: {
      name: 'john',
      address: {
        road: '103 road',
        nested: {
          value: 'someNestedValue',
        },
      },
    },
  });

  const userSelector = selector({
    key: 'userSelector',
    get: ({get}) => {
      const user = get(userState);

      user.address.road = '301 road';

      return user;
    },
    set: ({set, get}) => {
      const user = get(userState);

      user.address.road = 'narrow road';

      return set(userState, user);
    },
  });

  const testSnapshot = freshSnapshot();
  testSnapshot.retain();

  expect(() =>
    testSnapshot.map(({set}) => {
      set(userSelector, {
        name: 'matt',
        address: {
          road: '103 road',
          nested: {
            value: 'someNestedValue',
          },
        },
      });
    }),
  ).toThrow();

  expect(testSnapshot.getLoadable(userSelector).state).toBe('hasError');

  window.__DEV__ = devStatus;
});

testRecoil(
  'selector does not re-run to completion when one of its async deps resolves to a previously cached value',
  async () => {
    const testSnapshot = freshSnapshot();
    testSnapshot.retain();

    const atomA = atom({
      key: 'atomc-rerun-opt-test',
      default: -3,
    });

    const selectorB = selector({
      key: 'selb-rerun-opt-test',
      get: async ({get}) => {
        await Promise.resolve();

        return Math.abs(get(atomA));
      },
    });

    let numTimesCStartedToRun = 0;
    let numTimesCRanToCompletion = 0;

    const selectorC = selector({
      key: 'sela-rerun-opt-test',
      get: ({get}) => {
        numTimesCStartedToRun++;

        const ret = get(selectorB);

        /**
         * The placement of numTimesCRan is important as this optimization
         * prevents the execution of selectorC _after_ the point where the
         * selector execution hits a known path of dependencies. In other words,
         * the lines prior to the get(selectorB) will run twice, but the lines
         * following get(selectorB) should only run once given that we are
         * setting up this test so that selectorB resolves to a previously seen
         * value the second time that it runs.
         */
        numTimesCRanToCompletion++;

        return ret;
      },
    });

    testSnapshot.getLoadable(selectorC);

    /**
     * Run selector chain so that selectorC is cached with a dep of selectorB
     * set to "3"
     */
    await flushPromisesAndTimers();

    const loadableA = testSnapshot.getLoadable(selectorC);

    expect(loadableA.contents).toBe(3);
    expect(numTimesCRanToCompletion).toBe(1);

    /**
     * It's expected that C started to run twice so far (the first is the first
     * time that the selector was called and suspended, the second was when B
     * resolved and C re-ran because of the async dep resolution)
     */
    expect(numTimesCStartedToRun).toBe(2);

    const mappedSnapshot = testSnapshot.map(({set}) => {
      set(atomA, 3);
    });

    mappedSnapshot.getLoadable(selectorC);

    /**
     * Run selector chain so that selectorB recalculates as a result of atomA
     * being changed to "3"
     */
    await flushPromisesAndTimers();

    const loadableB = mappedSnapshot.getLoadable(selectorC);

    expect(loadableB.contents).toBe(3);

    /**
     * If selectors are correctly optimized, selectorC will not re-run because
     * selectorB resolved to "3", which is a value that selectorC has previously
     * cached for its selectorB dependency.
     */
    expect(numTimesCRanToCompletion).toBe(1);

    /**
     * TODO:
     * in the ideal case this should be:
     *
     * expect(numTimesCStartedToRun).toBe(2);
     */
    expect(numTimesCStartedToRun).toBe(3);
  },
);

testRecoil(
  'async dep that changes from loading to value triggers re-execution',
  async () => {
    const baseAtom = atom({
      key: 'baseAtom',
      default: 0,
    });

    const asyncSel = selector({
      key: 'asyncSel',
      get: ({get}) => {
        const atomVal = get(baseAtom);

        if (atomVal === 0) {
          return new Promise(() => {});
        }

        return atomVal;
      },
    });

    const selWithAsyncDep = selector({
      key: 'selWithAsyncDep',
      get: ({get}) => {
        return get(asyncSel);
      },
    });

    const snapshot = freshSnapshot();
    snapshot.retain();

    const loadingValLoadable = snapshot.getLoadable(selWithAsyncDep);

    expect(loadingValLoadable.state).toBe('loading');

    const mappedSnapshot = snapshot.map(({set}) => {
      set(baseAtom, 10);
    });

    const newAtomVal = mappedSnapshot.getLoadable(baseAtom);

    expect(newAtomVal.valueMaybe()).toBe(10);

    const valLoadable = mappedSnapshot.getLoadable(selWithAsyncDep);

    expect(valLoadable.valueMaybe()).toBe(10);
  },
);

describe('getCallback', () => {
  testRecoil('Selector getCallback', async () => {
    const myAtom = atom({
      key: 'selector - getCallback atom',
      default: 'DEFAULT',
    });
    const mySelector = selector({
      key: 'selector - getCallback',
      get: ({getCallback}) => {
        return {
          onClick: getCallback(
            ({snapshot}) =>
              async () =>
                await snapshot.getPromise(myAtom),
          ),
        };
      },
    });

    const menuItem = getValue(mySelector);
    expect(getValue(myAtom)).toEqual('DEFAULT');
    await expect(menuItem.onClick()).resolves.toEqual('DEFAULT');

    act(() => setValue(myAtom, 'SET'));
    expect(getValue(myAtom)).toEqual('SET');
    await expect(menuItem.onClick()).resolves.toEqual('SET');

    act(() => setValue(myAtom, 'SET2'));
    expect(getValue(myAtom)).toEqual('SET2');
    await expect(menuItem.onClick()).resolves.toEqual('SET2');
  });

  testRecoil('snapshot', async () => {
    const otherSelector = constSelector('VALUE');
    const mySelector = selector({
      key: 'selector getCallback snapshot',
      get: ({getCallback}) =>
        getCallback(({snapshot}) => param => ({
          param,
          loadable: snapshot.getLoadable(otherSelector),
          promise: snapshot.getPromise(otherSelector),
        })),
    });

    expect(getValue(mySelector)(123).param).toBe(123);
    expect(getValue(mySelector)(123).loadable.getValue()).toBe('VALUE');
    await expect(getValue(mySelector)(123).promise).resolves.toBe('VALUE');
  });

  testRecoil('set', () => {
    const myAtom = atom({
      key: 'selector getCallback set atom',
      default: 'DEFAULT',
    });
    const setSelector = selector({
      key: 'selector getCallback set',
      get: ({getCallback}) =>
        getCallback(({set}) => param => {
          set(myAtom, param);
        }),
    });
    const resetSelector = selector({
      key: 'selector getCallback reset',
      get: ({getCallback}) =>
        getCallback(({reset}) => () => {
          reset(myAtom);
        }),
    });

    expect(getValue(myAtom)).toBe('DEFAULT');
    getValue(setSelector)('SET');
    expect(getValue(myAtom)).toBe('SET');

    getValue(resetSelector)();
    expect(getValue(myAtom)).toBe('DEFAULT');
  });

  testRecoil('transaction', () => {
    const myAtom = atom({
      key: 'selector getCallback transact atom',
      default: 'DEFAULT',
    });
    const setSelector = selector({
      key: 'selector getCallback transact set',
      get: ({getCallback}) =>
        getCallback(({transact_UNSTABLE}) => param => {
          transact_UNSTABLE(({set, get}) => {
            expect(get(myAtom)).toBe('DEFAULT');
            set(myAtom, 'TMP');
            expect(get(myAtom)).toBe('TMP');
            set(myAtom, param);
          });
        }),
    });
    const resetSelector = selector({
      key: 'selector getCallback transact',
      get: ({getCallback}) =>
        getCallback(({transact_UNSTABLE}) => () => {
          transact_UNSTABLE(({reset}) => reset(myAtom));
        }),
    });

    expect(getValue(myAtom)).toBe('DEFAULT');
    getValue(setSelector)('SET');
    expect(getValue(myAtom)).toBe('SET');

    getValue(resetSelector)();
    expect(getValue(myAtom)).toBe('DEFAULT');
  });

  testRecoil('node', () => {
    const mySelector = selector({
      key: 'selector getCallback node',
      get: ({getCallback}) =>
        getCallback(({node, snapshot}) => param => ({
          param,
          loadable: snapshot.getLoadable(node),
          promise: snapshot.getPromise(node),
        })),
    });

    expect(getValue(mySelector)(123).param).toBe(123);
    expect(getValue(mySelector)(123).loadable.getValue()(456).param).toBe(456);
  });

  testRecoil('refresh', async () => {
    let externalValue = 0;
    const mySelector = selector({
      key: 'selector getCallback node refresh',
      get: ({getCallback}) => {
        const cachedExternalValue = externalValue;
        return getCallback(({node, refresh}) => () => ({
          cached: cachedExternalValue,
          current: externalValue,
          refresh: () => refresh(node),
        }));
      },
    });

    expect(getValue(mySelector)().current).toBe(0);
    expect(getValue(mySelector)().cached).toBe(0);

    externalValue = 1;
    expect(getValue(mySelector)().current).toBe(1);
    expect(getValue(mySelector)().cached).toBe(0);

    getValue(mySelector)().refresh();
    expect(getValue(mySelector)().current).toBe(1);
    expect(getValue(mySelector)().cached).toBe(1);
  });

  testRecoil('Guard against calling during selector evaluation', async () => {
    const mySelector = selector({
      key: 'selector getCallback guard',
      get: ({getCallback}) => {
        const callback = getCallback(() => () => {});
        expect(() => callback()).toThrow();
        return 'THROW';
      },
    });

    expect(getValue(mySelector)).toBe('THROW');

    const myAsyncSelector = selector({
      key: 'selector getCallback guard async',
      get: async ({getCallback}) => {
        const callback = getCallback(() => () => {});
        await Promise.resolve();
        expect(() => callback()).toThrow();
        return 'THROW';
      },
    });

    await expect(getPromise(myAsyncSelector)).resolves.toBe('THROW');
  });

  testRecoil('Callback can be used from thrown error', async () => {
    const mySelector = selector({
      key: 'selector getCallback from error',
      get: ({getCallback}) => {
        // eslint-disable-next-line no-throw-literal
        throw {callback: getCallback(() => x => x)};
      },
    });

    // $FlowExpectedError[incompatible-use]]
    expect(getLoadable(mySelector).errorOrThrow().callback(123)).toEqual(123);

    const myAsyncSelector = selector({
      key: 'selector getCallback from error async',
      get: ({getCallback}) => {
        return Promise.reject({callback: getCallback(() => x => x)});
      },
    });

    await expect(
      getPromise(myAsyncSelector).catch(({callback}) => callback(123)),
    ).resolves.toEqual(123);
  });
});

testRecoil(
  "Releasing snapshot doesn't invalidate pending selector",
  async () => {
    const [mySelector, resolveSelector] = asyncSelector();

    // Initialize selector with snapshot first so it is initialized for both
    // snapshot and root and has separate cleanup handlers for both.
    function Component() {
      const callback = useRecoilCallback(({snapshot}) => () => {
        snapshot.getLoadable(mySelector);
      });
      callback(); // First initialize with snapshot
      return useRecoilValue(mySelector); // Second initialize with RecoilRoot
    }

    const c = renderElements(<Component />);

    // Wait to allow the snapshot in the callback to release and call the
    // selector node cleanup functions.
    await flushPromisesAndTimers();

    expect(c.textContent).toBe('loading');

    act(() => resolveSelector('RESOLVE'));
    await flushPromisesAndTimers();
    expect(c.textContent).toBe('RESOLVE');
  },
);

testRecoil('Selector values are frozen', async () => {
  const devStatus = window.__DEV__;
  window.__DEV__ = true;

  const frozenSelector = selector({
    key: 'selector frozen',
    get: () => ({state: 'frozen', nested: {state: 'frozen'}}),
  });
  expect(Object.isFrozen(getValue(frozenSelector))).toBe(true);
  expect(Object.isFrozen(getValue(frozenSelector).nested)).toBe(true);

  const thawedSelector = selector({
    key: 'selector frozen thawed',
    get: () => ({state: 'thawed', nested: {state: 'thawed'}}),
    dangerouslyAllowMutability: true,
  });
  expect(Object.isFrozen(getValue(thawedSelector))).toBe(false);
  expect(Object.isFrozen(getValue(thawedSelector).nested)).toBe(false);

  const asyncFrozenSelector = selector({
    key: 'selector frozen async',
    get: () => Promise.resolve({state: 'frozen', nested: {state: 'frozen'}}),
  });
  await expect(
    getPromise(asyncFrozenSelector).then(x => Object.isFrozen(x)),
  ).resolves.toBe(true);
  expect(Object.isFrozen(getValue(asyncFrozenSelector).nested)).toBe(true);

  const asyncThawedSelector = selector({
    key: 'selector frozen thawed async',
    get: () => Promise.resolve({state: 'thawed', nested: {state: 'thawed'}}),
    dangerouslyAllowMutability: true,
  });
  await expect(
    getPromise(asyncThawedSelector).then(x => Object.isFrozen(x)),
  ).resolves.toBe(false);
  expect(Object.isFrozen(getValue(asyncThawedSelector).nested)).toBe(false);

  const upstreamFrozenSelector = selector({
    key: 'selector frozen upstream',
    get: () => ({state: 'frozen', nested: {state: 'frozen'}}),
  });
  const fwdFrozenSelector = selector({
    key: 'selector frozen fwd',
    get: () => upstreamFrozenSelector,
  });
  expect(Object.isFrozen(getValue(fwdFrozenSelector))).toBe(true);
  expect(Object.isFrozen(getValue(fwdFrozenSelector).nested)).toBe(true);

  const upstreamThawedSelector = selector({
    key: 'selector frozen thawed upstream',
    get: () => ({state: 'thawed', nested: {state: 'thawed'}}),
    dangerouslyAllowMutability: true,
  });
  const fwdThawedSelector = selector({
    key: 'selector frozen thawed fwd',
    get: () => upstreamThawedSelector,
    dangerouslyAllowMutability: true,
  });
  expect(Object.isFrozen(getValue(fwdThawedSelector))).toBe(false);
  expect(Object.isFrozen(getValue(fwdThawedSelector).nested)).toBe(false);

  // Selectors should not freeze their upstream dependencies
  const upstreamMixedSelector = selector({
    key: 'selector frozen mixed upstream',
    get: () => ({state: 'thawed', nested: {state: 'thawed'}}),
    dangerouslyAllowMutability: true,
  });
  const fwdMixedSelector = selector({
    key: 'selector frozen mixed fwd',
    get: ({get}) => {
      get(upstreamMixedSelector);
      return {state: 'frozen'};
    },
  });
  expect(Object.isFrozen(getValue(fwdMixedSelector))).toBe(true);
  expect(Object.isFrozen(getValue(upstreamMixedSelector))).toBe(false);
  expect(Object.isFrozen(getValue(upstreamMixedSelector).nested)).toBe(false);

  window.__DEV__ = devStatus;
});

testRecoil('Required options are provided when creating selectors', () => {
  const devStatus = window.__DEV__;
  window.__DEV__ = true;

  // $FlowExpectedError[incompatible-call]
  expect(() => selector({get: () => {}})).toThrow();
  // $FlowExpectedError[incompatible-call]
  expect(() => selector({get: false})).toThrow();
  // $FlowExpectedError[incompatible-call]
  expect(() => selector({key: 'MISSING GET'})).toThrow();

  window.__DEV__ = devStatus;
});
