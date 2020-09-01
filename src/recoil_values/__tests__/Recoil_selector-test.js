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

const gkx = require('../../util/Recoil_gkx');
gkx.setFail('recoil_async_selector_refactor');

const React = require('React');
const {useEffect, useState} = require('React');
const {act} = require('ReactTestUtils');
const atom = require('../Recoil_atom');
const {useRecoilValue, useSetRecoilState} = require('../../hooks/Recoil_Hooks');
const constSelector = require('../Recoil_constSelector');
const errorSelector = require('../Recoil_errorSelector');
const {
  getRecoilValueAsLoadable,
  setRecoilValue,
} = require('../../core/Recoil_RecoilValueInterface');
const selector = require('../Recoil_selector');
const {
  asyncSelector,
  makeStore,
  ReadsAtom,
  renderElements,
  resolvingAsyncSelector,
  flushPromisesAndTimers,
} = require('../../testing/Recoil_TestingUtils');
const {DefaultValue} = require('../../core/Recoil_Node');

let store;
beforeEach(() => {
  store = makeStore();
});

function get(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue).contents;
}

function getError(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue).errorOrThrow();
}

function set(recoilState, value) {
  setRecoilValue(store, recoilState, value);
}

function reset(recoilState) {
  setRecoilValue(store, recoilState, new DefaultValue());
}

test('useRecoilState - static selector', () => {
  const staticSel = constSelector('HELLO');
  const c = renderElements(<ReadsAtom atom={staticSel} />);
  expect(c.textContent).toEqual('"HELLO"');
});

test('selector get', () => {
  const staticSel = constSelector('HELLO');

  const selectorRO = selector({
    key: 'selector/get',
    get: ({get}) => get(staticSel),
  });

  expect(get(selectorRO)).toEqual('HELLO');
});

test('selector set', () => {
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

  expect(get(selectorRW)).toEqual('DEFAULT');
  set(myAtom, 'SET ATOM');
  expect(get(selectorRW)).toEqual('SET ATOM');
  set(selectorRW, 'SET SELECTOR');
  expect(get(selectorRW)).toEqual('SET: SET SELECTOR');
  reset(selectorRW);
  expect(get(selectorRW)).toEqual('DEFAULT');
});

test('selector reset', () => {
  const myAtom = atom({
    key: 'selector/reset/atom',
    default: 'DEFAULT',
  });

  const selectorRW = selector({
    key: 'selector/reset',
    get: ({get}) => get(myAtom),
    set: ({reset}) => reset(myAtom),
  });

  expect(get(selectorRW)).toEqual('DEFAULT');
  set(myAtom, 'SET ATOM');
  expect(get(selectorRW)).toEqual('SET ATOM');
  set(selectorRW, 'SET SELECTOR');
  expect(get(selectorRW)).toEqual('DEFAULT');
});

test('useRecoilState - resolved async selector', async () => {
  const resolvingSel = resolvingAsyncSelector('HELLO');
  const c = renderElements(<ReadsAtom atom={resolvingSel} />);
  expect(c.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('"HELLO"');
});

test('selector - evaluate to RecoilValue', () => {
  const atomA = atom({key: 'selector/const atom A', default: 'A'});
  const atomB = atom({key: 'selector/const atom B', default: 'B'});
  const inputAtom = atom({key: 'selector/input', default: 'a'});
  const mySelector = selector<string>({
    key: 'selector/output recoil value',
    get: ({get}) => (get(inputAtom) === 'a' ? atomA : atomB),
  });

  expect(get(mySelector)).toEqual('A');
  set(inputAtom, 'b');
  expect(get(mySelector)).toEqual('B');
});

test('selector - catching exceptions', () => {
  const throwingSel = errorSelector('MY ERROR');
  expect(get(throwingSel)).toBeInstanceOf(Error);

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
  expect(get(catchingSelector)).toEqual('CAUGHT');
});

test('selector - catching loads', () => {
  const loadingSel = resolvingAsyncSelector('READY');
  expect(get(loadingSel) instanceof Promise).toBe(true);

  const blockedSelector = selector({
    key: 'selector/blocked selector',
    get: ({get}) => get(loadingSel),
  });
  expect(get(blockedSelector) instanceof Promise).toBe(true);

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
  expect(get(bypassSelector)).toBe('BYPASS');
  act(() => jest.runAllTimers());
  expect(get(bypassSelector)).toEqual('READY');
});

test('useRecoilState - selector catching exceptions', () => {
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

test('useRecoilState - async selector', async () => {
  const resolvingSel = resolvingAsyncSelector('READY');

  // On first read it is blocked on the async selector
  const c1 = renderElements(<ReadsAtom atom={resolvingSel} />);
  expect(c1.textContent).toEqual('loading');

  // When that resolves the data is ready
  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(c1.textContent).toEqual('"READY"');
});

test('useRecoilState - selector blocked on dependency', async () => {
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

test('useRecoilState - selector catching loads', async () => {
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

test('useRecoilState - selector catching all of 2 loads', async () => {
  const resolvingSel1 = resolvingAsyncSelector('READY1');
  const resolvingSel2 = resolvingAsyncSelector('READY2');
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
  act(() => jest.runAllTimers());
  expect(c3.textContent).toEqual('1');

  // When both are available, we are done!
  act(() => jest.runAllTimers());
  expect(c3.textContent).toEqual('2');
});

test('useRecoilState - selector catching any of 2 loads', async () => {
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
test('useRecoilState - selector catching promise and resolving asynchronously', async () => {
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
});

test('Selector deps are saved when a component mounts due to a non-recoil change at the same time that a selector is first read', () => {
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
});

// This tests ability to catch a pending result as a promise and
// that the promise resolves to the dependency's value and it is handled
// as an asynchronous selector
/* FIXME broken without new selector implementation
test('useRecoilState - selector catching promise 2', async () => {
  let dependencyPromiseTest;
  const resolvingSel = resolvingAsyncSelector('READY');
  const catchPromiseSelector = selector({
    key: 'useRecoilState/catch then async 2',
    get: ({get}) => {
      try {
        return get(resolvingSel);
      } catch (promise) {
        expect(promise instanceof Promise).toBe(true);
        dependencyPromiseTest = expect(promise).resolves.toHaveProperty(
          'value',
          'READY',
        );
        return promise.then(result => {
          expect(result).toHaveProperty('value', 'READY');
          return result.value + ' NOW';
        });
      }
    },
  });
  const c = renderElements(<ReadsAtom atom={catchPromiseSelector} />);

  expect(c.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
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
*/

// Test that Recoil will throw an error with a useful debug message instead of
// infinite recurssion when there is a circular dependency
test('Detect circular dependencies', () => {
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
  expect(get(selectorC)).toBeInstanceOf(Error);
  expect(getError(selectorC).message).toEqual(
    expect.stringContaining('circular/A'),
  );
  window.__DEV__ = devStatus;
});

/* FIXME broken without new selector implementation
test('selector is able to track dependencies discovered asynchronously', async () => {
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

  await act(() => get(selectorWithAsyncDeps));
  await flushPromisesAndTimers();

  expect(container.textContent).toEqual('Async Dep Value');

  act(() => setAtom('CHANGED Async Dep'));

  expect(container.textContent).toEqual('loading');

  await act(() => get(selectorWithAsyncDeps));
  await flushPromisesAndTimers();

  expect(container.textContent).toEqual('CHANGED Async Dep');
});
*/

/**
 * This test is an extension of the 'selector is able to track dependencies
 * discovered asynchronously' test: in addition to testing that a selector
 * responds to changes in dependencies that were discovered asynchronously, the
 * selector should run through the entire selector in response to those changes.
 */
/* FIXME broken without new selector implementation
test('selector should rerun entire selector when a dep changes', async () => {
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

  await act(() => get(selectorWithAsyncDeps));
  act(() => jest.runAllTimers());

  expect(container.textContent).toEqual('6');

  act(() => setAtom(4));

  expect(container.textContent).toEqual('loading');

  await act(() => get(selectorWithAsyncDeps));
  act(() => jest.runAllTimers());

  expect(container.textContent).toEqual('7');
});
*/

/**
 * This test ensures that we are not running the selector's get() an unnecessary
 * number of times in response to async selectors resolving (i.e. by retrying
 * more times than we have to or creating numerous promises that retry).
 */
/* FIXME broken without new selector implementation
test('async selector runs the minimum number of times required', () => {
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

  const container = renderElements(<ReadsAtom atom={selectorWithAsyncDeps} />);

  expect(numTimesRan).toBe(1);

  resolveAsyncDep1('a');

  act(() => jest.runAllTimers());

  expect(numTimesRan).toBe(2);

  resolveAsyncDep2('b');

  act(() => jest.runAllTimers());

  expect(numTimesRan).toBe(3);
  expect(container.textContent).toEqual('"ab"');
});
*/

/* FIXME broken without new selector implementation
test('async selector with changing dependencies finishes execution using original state', async () => {
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

  const promiseBeforeChangingAnything = get(anAsyncSelector);

  expect(promiseBeforeChangingAnything).toBeInstanceOf(Promise);

  set(anAtom, 10);

  const promiseAfterChangingAtom = get(anAsyncSelector);

  expect(promiseAfterChangingAtom).toBeInstanceOf(Promise);
  expect(promiseAfterChangingAtom).not.toBe(promiseBeforeChangingAnything);

  resolveAsyncDep('');

  await Promise.all([
    expect(promiseBeforeChangingAnything).resolves.toHaveProperty(
      'value',
      3 + 3,
    ),
    expect(promiseAfterChangingAtom).resolves.toHaveProperty('value', 10 + 10),
  ]);
});
*/

// Test that an async selector will resolve to its dependency's value
// when it provides the dependency from an async callback.
/* FIXME broken without new selector implementation
test('selector - dynamic getRecoilValue()', async () => {
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

  await act(() => get(sel1));
  act(() => jest.runAllTimers());

  expect(el.textContent).toEqual('"READY"');
});
*/

test('distinct loading dependencies are treated as distinct', async () => {
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

  expect(get(directSelector) instanceof Promise).toBe(true);

  act(() => jest.runAllTimers());
  expect(get(directSelector)).toEqual(0);

  set(upstreamAtom, 1);
  expect(get(directSelector) instanceof Promise).toBe(true);

  act(() => jest.runAllTimers());
  expect(get(directSelector)).toEqual(1);
});
