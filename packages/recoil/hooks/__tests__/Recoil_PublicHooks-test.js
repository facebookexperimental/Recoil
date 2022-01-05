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
/* eslint-disable fb-www/react-no-useless-fragment */
'use strict';

import type {
  RecoilState,
  RecoilValue,
  RecoilValueReadOnly,
} from '../../core/Recoil_RecoilValue';
import type {PersistenceSettings} from '../../recoil_values/Recoil_atom';

const {
  getRecoilTestFn,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

let React,
  useEffect,
  useState,
  Profiler,
  act,
  Queue,
  batchUpdates,
  atom,
  errorSelector,
  selector,
  selectorFamily,
  ReadsAtom,
  asyncSelector,
  errorThrowingAsyncSelector,
  flushPromisesAndTimers,
  renderElements,
  renderUnwrappedElements,
  renderElementsWithSuspenseCount,
  recoilComponentGetRecoilValueCount_FOR_TESTING,
  useRecoilState,
  useRecoilStateLoadable,
  useRecoilValue,
  useRecoilValueLoadable,
  useSetRecoilState,
  useSetUnvalidatedAtomValues,
  useTransactionObservation_DEPRECATED,
  reactMode,
  invariant;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({useEffect, useState, Profiler} = require('react'));
  ({act} = require('ReactTestUtils'));

  Queue = require('../../adt/Recoil_Queue');
  ({batchUpdates} = require('../../core/Recoil_Batching'));
  atom = require('../../recoil_values/Recoil_atom');
  errorSelector = require('../../recoil_values/Recoil_errorSelector');
  selector = require('../../recoil_values/Recoil_selector');
  selectorFamily = require('../../recoil_values/Recoil_selectorFamily');
  ({
    ReadsAtom,
    asyncSelector,
    errorThrowingAsyncSelector,
    flushPromisesAndTimers,
    renderElements,
    renderUnwrappedElements,
    renderElementsWithSuspenseCount,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  ({reactMode} = require('../../core/Recoil_ReactMode'));
  ({
    recoilComponentGetRecoilValueCount_FOR_TESTING,
    useRecoilState,
    useRecoilStateLoadable,
    useRecoilValue,
    useRecoilValueLoadable,
    useSetRecoilState,
    useSetUnvalidatedAtomValues,
  } = require('../Recoil_Hooks'));
  ({useTransactionObservation_DEPRECATED} = require('../Recoil_SnapshotHooks'));

  invariant = require('recoil-shared/util/Recoil_invariant');
});

let nextID = 0;

function counterAtom(persistence?: PersistenceSettings<number>) {
  return atom({
    key: `atom${nextID++}`,
    default: 0,
    persistence_UNSTABLE: persistence,
  });
}

function booleanAtom(persistence?: PersistenceSettings<boolean>) {
  return atom<boolean>({
    key: `atom${nextID++}`,
    default: false,
    persistence_UNSTABLE: persistence,
  });
}

function plusOneSelector(dep: RecoilValue<number>) {
  const fn = jest.fn(x => x + 1);
  const sel = selector({
    key: `selector${nextID++}`,
    get: ({get}) => fn(get(dep)),
  });
  return [sel, fn];
}

function plusOneAsyncSelector(
  dep: RecoilValue<number>,
): [RecoilValueReadOnly<number>, (number) => void] {
  let nextTimeoutAmount = 100;
  const fn = jest.fn(x => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(x + 1);
      }, nextTimeoutAmount);
    });
  });
  const sel = selector({
    key: `selector${nextID++}`,
    get: ({get}) => fn(get(dep)),
  });
  return [
    sel,
    x => {
      nextTimeoutAmount = x;
    },
  ];
}

function additionSelector(
  depA: RecoilValue<number>,
  depB: RecoilValue<number>,
) {
  const fn = jest.fn((a, b) => a + b);
  const sel = selector({
    key: `selector${nextID++}`,
    get: ({get}) => fn(get(depA), get(depB)),
  });
  return [sel, fn];
}

// flowlint-next-line unclear-type:off
function asyncSelectorThatPushesPromisesOntoArray(dep: RecoilValue<any>) {
  const promises = [];
  const sel = selector({
    key: `selector${nextID++}`,
    get: ({get}) => {
      get(dep);
      let resolve = _ => invariant(false, 'bug in test code'); // make flow happy with initialization
      let reject = _ => invariant(false, 'bug in test code');
      const p = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      promises.push([resolve, reject]);
      return p;
    },
  });
  return [sel, promises];
}

function componentThatReadsAndWritesAtom<T>(
  recoilState: RecoilState<T>,
): [React.AbstractComponent<{...}>, ((T => T) | T) => void] {
  let updateValue;
  const Component = jest.fn(() => {
    const [value, _updateValue] = useRecoilState(recoilState);
    updateValue = _updateValue;
    return value;
  });
  // flowlint-next-line unclear-type:off
  return [(Component: any), (...args) => updateValue(...args)];
}

function componentThatWritesAtom<T>(
  recoilState: RecoilState<T>,
  // flowlint-next-line unclear-type:off
): [any, ((T => T) | T) => void] {
  let updateValue;
  const Component = jest.fn(() => {
    updateValue = useSetRecoilState(recoilState);
    return null;
  });
  // flowlint-next-line unclear-type:off
  return [(Component: any), x => updateValue(x)];
}

function componentThatReadsTwoAtoms(one, two) {
  return (jest.fn(function ReadTwoAtoms() {
    return `${useRecoilValue(one)},${useRecoilValue(two)}`;
  }): any); // flowlint-line unclear-type:off
}

function componentThatReadsAtomWithCommitCount(recoilState) {
  const commit = jest.fn(() => {});
  function ReadAtom() {
    return (
      <Profiler id="test" onRender={commit}>
        {useRecoilValue(recoilState)}
      </Profiler>
    );
  }
  return [ReadAtom, commit];
}

function componentThatToggles(a, b) {
  const toggle = {current: () => invariant(false, 'bug in test code')};
  const Toggle = () => {
    const [value, setValue] = useState(false);
    toggle.current = () => setValue(v => !v);
    return value ? b : a;
  };
  return [Toggle, toggle];
}

function ObservesTransactions({fn}) {
  useTransactionObservation_DEPRECATED(fn);
  return null;
}

function advanceTimersBy(ms) {
  // Jest does the right thing for runAllTimers but not advanceTimersByTime:
  act(() => {
    jest.runAllTicks();
    jest.runAllImmediates();
    jest.advanceTimersByTime(ms);
    jest.runAllImmediates(); // order seems backwards but matches jest.runAllTimers().
    jest.runAllTicks();
  });
}

function baseRenderCount(gks): number {
  return reactMode().mode === 'LEGACY' &&
    !gks.includes('recoil_suppress_rerender_in_callback')
    ? 1
    : 0;
}

testRecoil('Component throws error when passing invalid node', async () => {
  function Component() {
    try {
      // $FlowExpectedError[incompatible-call]
      useRecoilValue('foo');
    } catch (error) {
      expect(error.message).toEqual(expect.stringContaining('useRecoilValue'));
      return 'CAUGHT';
    }
    return 'INVALID';
  }

  const container = renderElements(<Component />);
  expect(container.textContent).toEqual('CAUGHT');
});

testRecoil('Components are re-rendered when atoms change', async () => {
  const anAtom = counterAtom();
  const [Component, updateValue] = componentThatReadsAndWritesAtom(anAtom);
  const container = renderElements(<Component />);
  expect(container.textContent).toEqual('0');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('1');
});

testRecoil('Selectors are updated when upstream atoms change', () => {
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneSelector(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements(
    <>
      <Component />
      <ReadsAtom atom={aSelector} />
    </>,
  );
  expect(container.textContent).toEqual('1');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('2');
});

testRecoil('Selectors can depend on other selectors', () => {
  const anAtom = counterAtom();
  const [selectorA, _] = plusOneSelector(anAtom);
  const [selectorB, __] = plusOneSelector(selectorA);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements(
    <>
      <Component />
      <ReadsAtom atom={selectorB} />
    </>,
  );
  expect(container.textContent).toEqual('2');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('3');
});

testRecoil('Selectors can depend on async selectors', async () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [selectorA, _] = plusOneAsyncSelector(anAtom);
  const [selectorB, __] = plusOneSelector(selectorA);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements(
    <>
      <Component />
      <ReadsAtom atom={selectorB} />
    </>,
  );
  expect(container.textContent).toEqual('loading');

  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('2');

  act(() => updateValue(1));

  expect(container.textContent).toEqual('loading');

  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('3');
});

testRecoil('Async selectors can depend on async selectors', async () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [selectorA, _] = plusOneAsyncSelector(anAtom);
  const [selectorB, __] = plusOneAsyncSelector(selectorA);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements(
    <>
      <Component />
      <ReadsAtom atom={selectorB} />
    </>,
  );

  if (reactMode().mode !== 'LEGACY') {
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('2');

    act(() => updateValue(1));
    expect(container.textContent).toEqual('loading');

    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('3');
  } else {
    // we need to test the useRecoilValueLoadable_LEGACY method

    expect(container.textContent).toEqual('loading');

    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('2');

    act(() => updateValue(1));
    expect(container.textContent).toEqual('loading');

    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('3');
  }
});

testRecoil('Dep of upstream selector can change while pending', async () => {
  const anAtom = counterAtom();
  const [upstreamSel, upstreamResolvers] =
    asyncSelectorThatPushesPromisesOntoArray(anAtom);
  const [downstreamSel, downstreamResolvers] =
    asyncSelectorThatPushesPromisesOntoArray(upstreamSel);

  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements(
    <>
      <Component />
      <ReadsAtom atom={downstreamSel} />
    </>,
  );

  // Initially, upstream has returned a promise so there is one upstream resolver.
  // Downstream is waiting on upstream so it hasn't returned anything yet.
  expect(container.textContent).toEqual('loading');
  expect(upstreamResolvers.length).toEqual(1);
  expect(downstreamResolvers.length).toEqual(0);

  // Resolve upstream; downstream should now have returned a new promise:
  upstreamResolvers[0][0](123);
  await flushPromisesAndTimers();
  expect(downstreamResolvers.length).toEqual(1);

  // Update atom to a new value while downstream is pending:
  act(() => updateValue(1));
  await flushPromisesAndTimers();

  // Upstream returns a new promise for the new atom value.
  // Downstream is once again waiting on upstream so it hasn't returned a new
  // promise for the new value.
  expect(upstreamResolvers.length).toEqual(2);
  expect(downstreamResolvers.length).toEqual(1);

  // Resolve the new upstream promise:
  upstreamResolvers[1][0](123);
  await flushPromisesAndTimers();

  // Downstream can now return its new promise:
  expect(downstreamResolvers.length).toEqual(2);

  // If we resolve downstream's new promise we should see the result:
  downstreamResolvers[1][0](123);
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('123');
});

testRecoil('Errors are propogated through selectors', () => {
  const errorThrower = errorSelector('ERROR');
  const [downstreamSelector] = plusOneSelector(errorThrower);
  const container = renderElements(
    <>
      <ReadsAtom atom={downstreamSelector} />
    </>,
  );
  expect(container.textContent).toEqual('error');
});

testRecoil(
  'Rejected promises are propogated through selectors (immediate rejection)',
  async () => {
    const anAtom = counterAtom();
    const errorThrower = errorThrowingAsyncSelector('ERROR', anAtom);
    const [downstreamSelector] = plusOneAsyncSelector(errorThrower);
    const container = renderElements(
      <>
        <ReadsAtom atom={downstreamSelector} />
      </>,
    );
    expect(container.textContent).toEqual('loading');
    await flushPromisesAndTimers();
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('error');
  },
);

testRecoil(
  'Rejected promises are propogated through selectors (later rejection)',
  async () => {
    const anAtom = counterAtom();
    const [errorThrower, _resolve, reject] = asyncSelector(anAtom);
    const [downstreamSelector] = plusOneAsyncSelector(errorThrower);
    const container = renderElements(
      <>
        <ReadsAtom atom={downstreamSelector} />
      </>,
    );
    expect(container.textContent).toEqual('loading');
    act(() => reject(new Error()));
    await flushPromisesAndTimers();
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('error');
  },
);

testRecoil(
  'Component subscribed to atom is rendered just once',
  ({gks, strictMode}) => {
    const BASE_CALLS = baseRenderCount(gks);
    const sm = strictMode ? 2 : 1;

    const anAtom = counterAtom();
    const [Component, updateValue] = componentThatReadsAndWritesAtom(anAtom);
    renderElements(
      <>
        <Component />
      </>,
    );

    expect(Component).toHaveBeenCalledTimes((BASE_CALLS + 1) * sm);
    act(() => updateValue(1));
    expect(Component).toHaveBeenCalledTimes((BASE_CALLS + 2) * sm);
  },
);

testRecoil('Write-only components are not subscribed', ({strictMode}) => {
  const anAtom = counterAtom();
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  renderElements(
    <>
      <Component />
    </>,
  );
  expect(Component).toHaveBeenCalledTimes(strictMode ? 2 : 1);
  act(() => updateValue(1));
  expect(Component).toHaveBeenCalledTimes(strictMode ? 2 : 1);
});

testRecoil(
  'Component that depends on atom in multiple ways is rendered just once',
  ({gks, strictMode}) => {
    const BASE_CALLS = baseRenderCount(gks);
    const sm = strictMode ? 2 : 1;

    const anAtom = counterAtom();
    const [aSelector, _] = plusOneSelector(anAtom);
    const [WriteComp, updateValue] = componentThatWritesAtom(anAtom);
    const ReadComp = componentThatReadsTwoAtoms(anAtom, aSelector);
    renderElements(
      <>
        <WriteComp />
        <ReadComp />
      </>,
    );

    expect(ReadComp).toHaveBeenCalledTimes((BASE_CALLS + 1) * sm);
    act(() => updateValue(1));
    expect(ReadComp).toHaveBeenCalledTimes((BASE_CALLS + 2) * sm);
  },
);

testRecoil('Selector functions are evaluated just once', () => {
  const anAtom = counterAtom();
  const [aSelector, selectorFn] = plusOneSelector(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  renderElements(
    <>
      <Component />
      <ReadsAtom atom={aSelector} />
    </>,
  );
  expect(selectorFn).toHaveBeenCalledTimes(1);
  act(() => updateValue(1));
  expect(selectorFn).toHaveBeenCalledTimes(2);
});

testRecoil(
  'Selector functions are evaluated just once even if multiple upstreams change',
  () => {
    const atomA = counterAtom();
    const atomB = counterAtom();
    const [aSelector, selectorFn] = additionSelector(atomA, atomB);
    const [ComponentA, updateValueA] = componentThatWritesAtom(atomA);
    const [ComponentB, updateValueB] = componentThatWritesAtom(atomB);
    renderElements(
      <>
        <ComponentA />
        <ComponentB />
        <ReadsAtom atom={aSelector} />
      </>,
    );
    expect(selectorFn).toHaveBeenCalledTimes(1);
    act(() => {
      batchUpdates(() => {
        updateValueA(1);
        updateValueB(1);
      });
    });
    expect(selectorFn).toHaveBeenCalledTimes(2);
  },
);

testRecoil(
  'Component that depends on multiple atoms via selector is rendered just once',
  ({gks}) => {
    const BASE_CALLS = baseRenderCount(gks);

    const atomA = counterAtom();
    const atomB = counterAtom();
    const [aSelector, _] = additionSelector(atomA, atomB);
    const [ComponentA, updateValueA] = componentThatWritesAtom(atomA);
    const [ComponentB, updateValueB] = componentThatWritesAtom(atomB);
    const [ReadComp, commit] = componentThatReadsAtomWithCommitCount(aSelector);
    renderElements(
      <>
        <ComponentA />
        <ComponentB />
        <ReadComp />
      </>,
    );

    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 1);
    act(() => {
      batchUpdates(() => {
        updateValueA(1);
        updateValueB(1);
      });
    });
    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 2);
  },
);

testRecoil(
  'Component that depends on multiple atoms directly is rendered just once',
  ({gks, strictMode}) => {
    const BASE_CALLS = baseRenderCount(gks);
    const sm = strictMode ? 2 : 1;

    const atomA = counterAtom();
    const atomB = counterAtom();
    const [ComponentA, updateValueA] = componentThatWritesAtom(atomA);
    const [ComponentB, updateValueB] = componentThatWritesAtom(atomB);
    const ReadComp = componentThatReadsTwoAtoms(atomA, atomB);
    renderElements(
      <>
        <ComponentA />
        <ComponentB />
        <ReadComp />
      </>,
    );

    expect(ReadComp).toHaveBeenCalledTimes((BASE_CALLS + 1) * sm);
    act(() => {
      batchUpdates(() => {
        updateValueA(1);
        updateValueB(1);
      });
    });
    expect(ReadComp).toHaveBeenCalledTimes((BASE_CALLS + 2) * sm);
  },
);

testRecoil(
  'Component is rendered just once when atom is changed twice',
  ({gks}) => {
    const BASE_CALLS = baseRenderCount(gks);

    const atomA = counterAtom();
    const [ComponentA, updateValueA] = componentThatWritesAtom(atomA);
    const [ReadComp, commit] = componentThatReadsAtomWithCommitCount(atomA);
    renderElements(
      <>
        <ComponentA />
        <ReadComp />
      </>,
    );

    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 1);
    act(() => {
      batchUpdates(() => {
        updateValueA(1);
        updateValueA(2);
      });
    });
    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 2);
  },
);

testRecoil(
  'Component does not re-read atom when rendered due to another atom changing, parent re-render, or other state change',
  () => {
    // useSyncExternalStore() will always call getSnapshot() to see if it has
    // mutated between render and commit.
    if (
      reactMode().mode === 'LEGACY' ||
      reactMode().mode === 'SYNC_EXTERNAL_STORE'
    ) {
      return;
    }

    const atomA = counterAtom();
    const atomB = counterAtom();

    let _, setLocal;
    let _a, setA;
    let _b, _setB;
    function Component() {
      [_, setLocal] = useState(0);
      [_a, setA] = useRecoilState(atomA);
      [_b, _setB] = useRecoilState(atomB);
      return null;
    }

    let __, setParentLocal;
    function Parent() {
      [__, setParentLocal] = useState(0);
      return <Component />;
    }

    renderElements(<Parent />);

    const initialCalls = recoilComponentGetRecoilValueCount_FOR_TESTING.current;
    expect(initialCalls).toBeGreaterThan(0);

    // No re-read when setting local state on the component:
    act(() => {
      setLocal(1);
    });
    expect(recoilComponentGetRecoilValueCount_FOR_TESTING.current).toBe(
      initialCalls,
    );

    // No re-read when setting local state on its parent causing it to re-render:
    act(() => {
      setParentLocal(1);
    });
    expect(recoilComponentGetRecoilValueCount_FOR_TESTING.current).toBe(
      initialCalls,
    );

    // Setting an atom causes a re-read for that atom only, not others:
    act(() => {
      setA(1);
    });
    expect(recoilComponentGetRecoilValueCount_FOR_TESTING.current).toBe(
      initialCalls + 1,
    );
  },
);

testRecoil(
  'Components re-render only one time if selectorFamily changed',
  ({gks, strictMode}) => {
    const BASE_CALLS = baseRenderCount(gks);
    const sm = strictMode ? 2 : 1;

    const atomA = counterAtom();

    const selectAFakeId = selectorFamily({
      key: 'selectItem',
      get:
        _id =>
        ({get}) =>
          get(atomA),
    });

    const Component = (jest.fn(function ReadFromSelector({id}) {
      return useRecoilValue(selectAFakeId(id));
      // $FlowFixMe[unclear-type]
    }): Function);

    let increment;

    const App = () => {
      const [state, setState] = useRecoilState(atomA);
      increment = () => setState(s => s + 1);
      return <Component id={state} />;
    };

    const container = renderElements(<App />);

    let baseCalls = BASE_CALLS;

    expect(container.textContent).toEqual('0');
    expect(Component).toHaveBeenCalledTimes((baseCalls + 1) * sm);

    act(() => increment());

    if (
      (reactMode().mode === 'LEGACY' &&
        !gks.includes('recoil_suppress_rerender_in_callback')) ||
      reactMode().mode === 'CONCURRENT_LEGACY'
    ) {
      baseCalls += 1;
    }

    expect(container.textContent).toEqual('1');
    expect(Component).toHaveBeenCalledTimes((baseCalls + 2) * sm);
  },
);

testRecoil('Can subscribe to and also change an atom in the same batch', () => {
  const anAtom = counterAtom();

  let setVisible;
  function Switch({children}) {
    const [visible, mySetVisible] = useState(false);
    setVisible = mySetVisible;
    return visible ? children : null;
  }

  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements(
    <>
      <Component />
      <Switch>
        <ReadsAtom atom={anAtom} />
      </Switch>
    </>,
  );

  expect(container.textContent).toEqual('');

  act(() => {
    batchUpdates(() => {
      setVisible(true);
      updateValue(1337);
    });
  });
  expect(container.textContent).toEqual('1337');
});

testRecoil('Atom values are retained when atom has no subscribers', () => {
  const anAtom = counterAtom();

  let setVisible;
  function Switch({children}) {
    const [visible, mySetVisible] = useState(true);
    setVisible = mySetVisible;
    return visible ? children : null;
  }

  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements(
    <>
      <Component />
      <Switch>
        <ReadsAtom atom={anAtom} />
      </Switch>
    </>,
  );

  act(() => updateValue(1337));
  expect(container.textContent).toEqual('1337');
  act(() => setVisible(false));
  expect(container.textContent).toEqual('');
  act(() => setVisible(true));
  expect(container.textContent).toEqual('1337');
});

testRecoil(
  'Components unsubscribe from atoms when rendered without using them',
  ({gks, strictMode}) => {
    const BASE_CALLS = baseRenderCount(gks);
    const sm = strictMode ? 2 : 1;

    const atomA = counterAtom();
    const atomB = counterAtom();
    const [WriteA, updateValueA] = componentThatWritesAtom(atomA);
    const [WriteB, updateValueB] = componentThatWritesAtom(atomB);

    const Component = (jest.fn(function Read({state}) {
      const [value] = useRecoilState(state);
      return value;
    }): any); // flowlint-line unclear-type:off

    let toggleSwitch;
    const Switch = () => {
      const [value, setValue] = useState(false);
      toggleSwitch = () => setValue(true);
      return value ? <Component state={atomB} /> : <Component state={atomA} />;
    };

    const container = renderElements(
      <>
        <Switch />
        <WriteA />
        <WriteB />
      </>,
    );

    let baseCalls = BASE_CALLS;

    expect(container.textContent).toEqual('0');
    expect(Component).toHaveBeenCalledTimes((baseCalls + 1) * sm);

    act(() => updateValueA(1));
    expect(container.textContent).toEqual('1');
    expect(Component).toHaveBeenCalledTimes((baseCalls + 2) * sm);

    if (
      (reactMode().mode === 'LEGACY' &&
        !gks.includes('recoil_suppress_rerender_in_callback')) ||
      reactMode().mode === 'CONCURRENT_LEGACY'
    ) {
      baseCalls += 1;
    }

    act(() => toggleSwitch());
    expect(container.textContent).toEqual('0');
    expect(Component).toHaveBeenCalledTimes((baseCalls + 3) * sm);

    // Now update the atom that it used to be subscribed to but should be no longer:
    act(() => updateValueA(2));
    expect(container.textContent).toEqual('0');

    // TODO: find out why OSS has additional render
    if (!gks.includes('recoil_suppress_rerender_in_callback')) {
      baseCalls += 1; // @oss-only
    }

    expect(Component).toHaveBeenCalledTimes((baseCalls + 3) * sm); // Important part: same as before

    // It is subscribed to the atom that it switched to:
    act(() => updateValueB(3));
    expect(container.textContent).toEqual('3');
    expect(Component).toHaveBeenCalledTimes((baseCalls + 4) * sm);
  },
);

testRecoil(
  'Selectors unsubscribe from upstream when they have no subscribers',
  () => {
    const atomA = counterAtom();
    const atomB = counterAtom();
    const [WriteA, updateValueA] = componentThatWritesAtom(atomA);

    // Do two layers of selectors to test that the unsubscribing is recursive:
    const selectorMapFn1 = jest.fn(x => x);
    const sel1 = selector({
      key: 'selUpstream',
      get: ({get}) => selectorMapFn1(get(atomA)),
    });

    const selectorMapFn2 = jest.fn(x => x);
    const sel2 = selector({
      key: 'selDownstream',
      get: ({get}) => selectorMapFn2(get(sel1)),
    });

    let toggleSwitch;
    const Switch = () => {
      const [value, setValue] = useState(false);
      toggleSwitch = () => setValue(true);
      return value ? <ReadsAtom atom={atomB} /> : <ReadsAtom atom={sel2} />;
    };

    const container = renderElements(
      <>
        <Switch />
        <WriteA />
      </>,
    );
    expect(container.textContent).toEqual('0');
    expect(selectorMapFn1).toHaveBeenCalledTimes(1);
    expect(selectorMapFn2).toHaveBeenCalledTimes(1);

    act(() => updateValueA(1));
    expect(container.textContent).toEqual('1');
    expect(selectorMapFn1).toHaveBeenCalledTimes(2);
    expect(selectorMapFn2).toHaveBeenCalledTimes(2);

    act(() => toggleSwitch());
    expect(container.textContent).toEqual('0');
    expect(selectorMapFn1).toHaveBeenCalledTimes(2);
    expect(selectorMapFn2).toHaveBeenCalledTimes(2);

    act(() => updateValueA(2));
    expect(container.textContent).toEqual('0');
    expect(selectorMapFn1).toHaveBeenCalledTimes(2);
    expect(selectorMapFn2).toHaveBeenCalledTimes(2);
  },
);

testRecoil(
  'Unsubscribes happen in case of unmounting of a suspended component',
  () => {
    const anAtom = counterAtom();
    const [aSelector, _selFn] = plusOneSelector(anAtom);
    const [_asyncSel, _adjustTimeout] = plusOneAsyncSelector(aSelector);
    // FIXME to implement
  },
);

testRecoil(
  'Selectors stay up to date if deps are changed while they have no subscribers',
  () => {
    const anAtom = counterAtom();
    const [aSelector, _] = plusOneSelector(anAtom);

    let setVisible;
    function Switch({children}) {
      const [visible, mySetVisible] = useState(true);
      setVisible = mySetVisible;
      return visible ? children : null;
    }

    const [Component, updateValue] = componentThatWritesAtom(anAtom);
    const container = renderElements(
      <>
        <Component />
        <Switch>
          <ReadsAtom atom={aSelector} />
        </Switch>
      </>,
    );

    act(() => updateValue(1));
    expect(container.textContent).toEqual('2');
    act(() => setVisible(false));
    expect(container.textContent).toEqual('');
    act(() => updateValue(2));
    expect(container.textContent).toEqual('');
    act(() => setVisible(true));
    expect(container.textContent).toEqual('3');
  },
);

testRecoil('Selectors can be invertible', () => {
  const anAtom = counterAtom();
  const aSelector = selector({
    key: 'invertible1',
    get: ({get}) => get(anAtom),
    set: ({set}, newValue) => set(anAtom, newValue),
  });

  const [Component, updateValue] = componentThatWritesAtom(aSelector);
  const container = renderElements(
    <>
      <Component />
      <ReadsAtom atom={anAtom} />
    </>,
  );

  expect(container.textContent).toEqual('0');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('1');
});

testRecoil('Selector dependencies can change over time', () => {
  const atomA = counterAtom();
  const atomB = counterAtom();
  const aSelector = selector({
    key: 'depsChange',
    get: ({get}) => {
      const a = get(atomA);
      if (a === 1337) {
        const b = get(atomB);
        return b;
      } else {
        return a;
      }
    },
  });

  const [ComponentA, updateValueA] = componentThatWritesAtom(atomA);
  const [ComponentB, updateValueB] = componentThatWritesAtom(atomB);

  const container = renderElements(
    <>
      <ComponentA />
      <ComponentB />
      <ReadsAtom atom={aSelector} />
    </>,
  );

  expect(container.textContent).toEqual('0');
  act(() => updateValueA(1337));
  expect(container.textContent).toEqual('0');
  act(() => updateValueB(1));

  expect(container.textContent).toEqual('1');
  act(() => updateValueA(2));
  expect(container.textContent).toEqual('2');
});

testRecoil('Selectors can gain and lose depnedencies', ({gks}) => {
  const BASE_CALLS = baseRenderCount(gks);

  const switchAtom = booleanAtom();
  const inputAtom = counterAtom();

  // Depends on inputAtom only when switchAtom is true:
  const aSelector = selector<number>({
    key: 'gainsDeps',
    get: ({get}) => {
      if (get(switchAtom)) {
        return get(inputAtom);
      } else {
        return Infinity;
      }
    },
  });

  const [ComponentA, setSwitch] = componentThatWritesAtom(switchAtom);
  const [ComponentB, setInput] = componentThatWritesAtom(inputAtom);
  const [ComponentC, commit] = componentThatReadsAtomWithCommitCount(aSelector);
  const container = renderElements(
    <>
      <ComponentA />
      <ComponentB />
      <ComponentC />
    </>,
  );

  expect(container.textContent).toEqual('Infinity');
  expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 1);

  // Input is not a dep yet, so this has no effect:
  act(() => setInput(1));
  expect(container.textContent).toEqual('Infinity');
  expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 1);

  // Flip switch:
  act(() => setSwitch(true));
  expect(container.textContent).toEqual('1');
  expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 2);

  // Now changing input causes a re-render:
  act(() => setInput(2));
  expect(container.textContent).toEqual('2');
  expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 3);

  // Now that we've added the dep, we can remove it...
  act(() => setSwitch(false));
  expect(container.textContent).toEqual('Infinity');
  expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 4);

  // ... and again changing input will not cause a re-render:
  act(() => setInput(3));
  expect(container.textContent).toEqual('Infinity');
  expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 4);
});

testRecoil('Selector depedencies are updated transactionally', () => {
  const atomA = counterAtom();
  const atomB = counterAtom();
  const atomC = counterAtom();

  const [observedSelector, selectorFn] = plusOneSelector(atomC);

  const aSelector = selector({
    key: 'transactionally',
    get: ({get}) => {
      const a = get(atomA);
      const b = get(atomB);
      return a !== 0 && b === 0
        ? get(observedSelector) // We want to test this never happens
        : null;
    },
  });

  const [ComponentA, updateValueA] = componentThatWritesAtom(atomA);
  const [ComponentB, updateValueB] = componentThatWritesAtom(atomB);
  const [ComponentC, updateValueC] = componentThatWritesAtom(atomC);
  renderElements(
    <>
      <ComponentA />
      <ComponentB />
      <ComponentC />
      <ReadsAtom atom={aSelector} />
    </>,
  );

  act(() => {
    batchUpdates(() => {
      updateValueA(1);
      updateValueB(1);
    });
  });

  // observedSelector wasn't evaluated:
  expect(selectorFn).toHaveBeenCalledTimes(0);

  // nor were any subscriptions created for it:
  act(() => {
    updateValueC(1);
  });
  expect(selectorFn).toHaveBeenCalledTimes(0);
});

testRecoil('Can set an atom during rendering', () => {
  const anAtom = counterAtom();

  function SetsDuringRendering() {
    const [value, setValue] = useRecoilState(anAtom);
    if (value !== 1) {
      setValue(1);
    }
    return null;
  }

  const container = renderElements(
    <>
      <SetsDuringRendering />
      <ReadsAtom atom={anAtom} />
    </>,
  );

  expect(container.textContent).toEqual('1');
});

testRecoil(
  'Does not re-create "setter" function after setting a value',
  ({strictMode, concurrentMode}) => {
    const sm = strictMode && concurrentMode ? 2 : 1;

    const anAtom = counterAtom();
    const anotherAtom = counterAtom();
    let useRecoilStateCounter = 0;
    let useRecoilStateErrorStatesCounter = 0;
    let useTwoAtomsCounter = 0;

    function Component1() {
      const [_, setValue] = useRecoilState(anAtom);
      useEffect(() => {
        setValue(1);
        useRecoilStateCounter += 1;
      }, [setValue]);
      return null;
    }

    function Component2() {
      const [_, setValue] = useRecoilStateLoadable(anAtom);
      useEffect(() => {
        setValue(2);
        useRecoilStateErrorStatesCounter += 1;
      }, [setValue]);
      return null;
    }

    // It is important to test here that the component will re-render with the
    // new setValue() function for a new atom, even if the value of the new
    // atom is the same as the previous value of the previous atom.
    function Component3() {
      const a = useTwoAtomsCounter > 0 ? anotherAtom : anAtom;
      // setValue fn should change when we use a different atom.
      const [, setValue] = useRecoilState(a);
      useEffect(() => {
        setValue(1);
        useTwoAtomsCounter += 1;
      }, [setValue]);
      return null;
    }

    renderElements(
      <>
        <Component1 />
        <Component2 />
        <Component3 />
      </>,
    );

    expect(useRecoilStateCounter).toBe(1 * sm);
    expect(useRecoilStateErrorStatesCounter).toBe(1 * sm);

    // Component3's effect is ran twice because the atom changes and we get a new setter.
    // StrictMode renders twice, but we only change atoms once.  So, only one extra count.
    expect(useTwoAtomsCounter).toBe(strictMode && concurrentMode ? 3 : 2);
  },
);

testRecoil(
  'Can set atom during post-atom-setting effect (NOT during initial render)',
  async () => {
    const anAtom = counterAtom();

    let done = false;
    function SetsDuringEffect() {
      const setValue = useSetRecoilState(anAtom);
      useEffect(() => {
        Queue.enqueueExecution('SetsDuringEffect', () => {
          if (!done) {
            setValue(1);
            done = true;
          }
        });
      });
      return null;
    }

    const container = renderElements(
      <>
        <SetsDuringEffect />
        <ReadsAtom atom={anAtom} />
      </>,
    );

    expect(container.textContent).toEqual('1');
  },
);

testRecoil(
  'Can set atom during post-atom-setting effect regardless of effect order',
  async ({concurrentMode}) => {
    // TODO Test doesn't work in ConcurrentMode.  Haven't investigated why,
    // but it seems fragile with the Queue for enforcing order.
    if (concurrentMode) {
      return;
    }

    function testWithOrder(order) {
      const anAtom = counterAtom();

      let q = [];
      let seen = false;
      const original = Queue.enqueueExecution;
      try {
        Queue.enqueueExecution = (s, f) => {
          if (s === order[0] || seen) {
            seen = true;
            f();
            q.forEach(([_, g]) => g());
          } else {
            q.push([s, f]);
          }
        };

        function SetsDuringEffect() {
          const [value, setValue] = useRecoilState(anAtom);
          useEffect(() => {
            Queue.enqueueExecution('SetsDuringEffect', () => {
              if (value !== 1) {
                setValue(1);
              }
            });
          });
          return null;
        }

        const [Comp, updateValue] = componentThatWritesAtom(anAtom);
        const container = renderElements(
          <>
            <SetsDuringEffect />
            <ReadsAtom atom={anAtom} />
            <Comp />
          </>,
        );
        q = [];
        seen = false;

        // Thus it appears that it only breaks on the initial render.
        act(() => {
          updateValue(0);
        });

        expect(container.textContent).toEqual('1');
      } finally {
        Queue.enqueueExecution = original;
      }
    }

    testWithOrder(['SetsDuringEffect', 'Batcher']);
    testWithOrder(['Batcher', 'SetsDuringEffect']);
  },
);

testRecoil('Basic async selector test', async () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneAsyncSelector(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements(
    <>
      <Component />
      <ReadsAtom atom={aSelector} />
    </>,
  );
  // Begins in loading state, then shows initial value:
  expect(container.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('1');
  // Changing dependency makes it go back to loading, then to show new value:
  act(() => updateValue(1));
  expect(container.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
  expect(container.textContent).toEqual('2');
  // Returning to a seen value does not cause the loading state:
  act(() => updateValue(0));
  expect(container.textContent).toEqual('1');
});

testRecoil('Ability to not use Suspense', () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneAsyncSelector(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);

  function ReadsAtomWithoutSuspense({state}) {
    const loadable = useRecoilValueLoadable(state);
    if (loadable.state === 'loading') {
      return 'loading not with suspense';
    } else if (loadable.state === 'hasValue') {
      return loadable.contents;
    } else {
      throw loadable.contents;
    }
  }

  const container = renderElements(
    <>
      <Component />
      <ReadsAtomWithoutSuspense state={aSelector} />
    </>,
  );
  // Begins in loading state, then shows initial value:
  expect(container.textContent).toEqual('loading not with suspense');
  act(() => jest.runAllTimers());
  expect(container.textContent).toEqual('1');
  // Changing dependency makes it go back to loading, then to show new value:
  act(() => updateValue(1));
  expect(container.textContent).toEqual('loading not with suspense');
  act(() => jest.runAllTimers());
  expect(container.textContent).toEqual('2');
  // Returning to a seen value does not cause the loading state:
  act(() => updateValue(0));
  expect(container.textContent).toEqual('1');
});

testRecoil(
  'Ability to not use Suspense - with value instead of loadable',
  () => {
    jest.useFakeTimers();
    const anAtom = counterAtom();
    const [aSelector, _] = plusOneAsyncSelector(anAtom);
    const [Component, updateValue] = componentThatWritesAtom(anAtom);

    function ReadsAtomWithoutSuspense({state}) {
      return (
        useRecoilValueLoadable(state).valueMaybe() ??
        'loading not with suspense'
      );
    }

    const container = renderElements(
      <>
        <Component />
        <ReadsAtomWithoutSuspense state={aSelector} />
      </>,
    );
    // Begins in loading state, then shows initial value:
    expect(container.textContent).toEqual('loading not with suspense');
    act(() => jest.runAllTimers());
    expect(container.textContent).toEqual('1');
    // Changing dependency makes it go back to loading, then to show new value:
    act(() => updateValue(1));
    expect(container.textContent).toEqual('loading not with suspense');
    act(() => jest.runAllTimers());
    expect(container.textContent).toEqual('2');
    // Returning to a seen value does not cause the loading state:
    act(() => updateValue(0));
    expect(container.textContent).toEqual('1');
  },
);

testRecoil(
  'Selector can alternate between synchronous and asynchronous',
  async () => {
    jest.useFakeTimers();
    const anAtom = counterAtom();
    const aSelector = selector({
      key: 'alternatingSelector',
      get: ({get}) => {
        const x = get(anAtom);
        if (x === 1337) {
          return new Promise(() => {});
        }
        if (x % 2 === 0) {
          return x;
        } else {
          return new Promise(resolve => {
            setTimeout(() => resolve(x), 100);
          });
        }
      },
    });
    const [Component, updateValue] = componentThatWritesAtom(anAtom);
    const container = renderElements(
      <>
        <Component />
        <ReadsAtom atom={aSelector} />
      </>,
    );

    // Transition from sync to async:
    expect(container.textContent).toEqual('0');
    act(() => updateValue(1));
    expect(container.textContent).toEqual('loading');
    advanceTimersBy(101);
    expect(container.textContent).toEqual('1');

    // Transition from async to sync (with async being in hasValue state):
    act(() => updateValue(2));
    expect(container.textContent).toEqual('2');

    // Transition from async to sync (with async being in loading state):
    act(() => updateValue(1337));
    expect(container.textContent).toEqual('loading');
    act(() => updateValue(4));
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('4');

    // Transition from sync to async with still unresolved promise from before:
    act(() => updateValue(5));
    expect(container.textContent).toEqual('loading');
    advanceTimersBy(101);
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('5');
  },
);

testRecoil(
  'Async selectors do not re-query when re-subscribed from having no subscribers',
  async () => {
    const anAtom = counterAtom();
    const [sel, resolvers] = asyncSelectorThatPushesPromisesOntoArray(anAtom);
    const [Component, updateValue] = componentThatWritesAtom(anAtom);
    const [Toggle, toggle] = componentThatToggles(
      <ReadsAtom atom={sel} />,
      null,
    );
    const container = renderElements(
      <>
        <Component />
        <Toggle />
      </>,
    );
    expect(container.textContent).toEqual('loading');
    expect(resolvers.length).toBe(1);
    act(() => updateValue(2));
    await flushPromisesAndTimers();
    expect(resolvers.length).toBe(2);
    resolvers[1][0]('hello');
    await flushPromisesAndTimers();
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('"hello"');

    // Cause sel to have no subscribers:
    act(() => toggle.current());
    expect(container.textContent).toEqual('');

    // Once it's used again, it should not issue another request:
    act(() => toggle.current());
    expect(resolvers.length).toBe(2);
    expect(container.textContent).toEqual('"hello"');
  },
);

testRecoil(
  'Selector subscriptions are correct when a selector is unsubscribed the second time',
  async () => {
    // This regression test would fail by an exception being thrown because subscription refcounts
    // would would fall below zero.
    const anAtom = counterAtom();
    const [sel, _] = plusOneSelector(anAtom);
    const [Toggle, toggle] = componentThatToggles(
      <ReadsAtom atom={sel} />,
      null,
    );
    const container = renderElements(
      <>
        <Toggle />
      </>,
    );

    expect(container.textContent).toEqual('1');

    act(() => toggle.current());
    expect(container.textContent).toEqual('');

    act(() => toggle.current());
    expect(container.textContent).toEqual('1');

    act(() => toggle.current());
    expect(container.textContent).toEqual('');
  },
);

testRecoil('Can move out of suspense by changing deps', async () => {
  const anAtom = counterAtom();
  const [aSelector, resolvers] =
    asyncSelectorThatPushesPromisesOntoArray(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements(
    <>
      <Component />
      <ReadsAtom atom={aSelector} />
    </>,
  );
  // While still waiting for first request, let a second faster request happen:
  expect(container.textContent).toEqual('loading');
  expect(resolvers.length).toEqual(1);
  act(() => updateValue(1));
  await flushPromisesAndTimers();
  expect(resolvers.length).toEqual(2);
  expect(container.textContent).toEqual('loading');
  // When the faster second request resolves, we should see its result:
  resolvers[1][0]('hello');
  await flushPromisesAndTimers();
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('"hello"');
});

testRecoil('Can use an already-resolved promise', async () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const sel = selector({
    key: `selector${nextID++}`,
    get: ({get}) => {
      const x = get(anAtom);
      return Promise.resolve(x + 1);
    },
  });
  const container = renderElements(
    <>
      <Component />
      <ReadsAtom atom={sel} />
    </>,
  );
  await flushPromisesAndTimers();
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('1');
  act(() => updateValue(1));
  await flushPromisesAndTimers();
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('2');
});

testRecoil(
  'Resolution of suspense causes render just once',
  async ({gks, strictMode, concurrentMode}) => {
    const BASE_CALLS = baseRenderCount(gks);
    const sm = strictMode && concurrentMode ? 2 : 1;

    jest.useFakeTimers();
    const anAtom = counterAtom();
    const [aSelector, _] = plusOneAsyncSelector(anAtom);
    const [Component, updateValue] = componentThatWritesAtom(anAtom);
    const [ReadComp, commit] = componentThatReadsAtomWithCommitCount(aSelector);
    const [__, suspense] = renderElementsWithSuspenseCount(
      <>
        <Component />
        <ReadComp />
      </>,
    );

    // Begins in loading state, then shows initial value:
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(suspense).toHaveBeenCalledTimes(1 * sm);
    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 1);
    // Changing dependency makes it go back to loading, then to show new value:
    act(() => updateValue(1));
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(suspense).toHaveBeenCalledTimes(2 * sm);
    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 2);
    // Returning to a seen value does not cause the loading state:
    act(() => updateValue(0));
    await flushPromisesAndTimers();
    expect(suspense).toHaveBeenCalledTimes(2 * sm);
    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 3);
  },
);

testRecoil(
  'Wakeup from Suspense to previous value',
  async ({gks, strictMode, concurrentMode}) => {
    const BASE_CALLS = baseRenderCount(gks);
    const sm = strictMode && concurrentMode ? 2 : 1;

    const myAtom = atom({
      key: `atom${nextID++}`,
      default: {value: 0},
    });
    const mySelector = selector({
      key: `selector${nextID++}`,
      get: ({get}) => get(myAtom).value,
    });

    const [Component, updateValue] = componentThatWritesAtom(myAtom);
    const [ReadComp, commit] =
      componentThatReadsAtomWithCommitCount(mySelector);
    const [container, suspense] = renderElementsWithSuspenseCount(
      <>
        <Component />
        <ReadComp />
      </>,
    );

    // Render initial state "0"
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('0');
    expect(suspense).toHaveBeenCalledTimes(0 * sm);
    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 1);

    // Set selector to a pending state should cause component to suspend
    act(() => updateValue({value: new Promise(() => {})}));
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('loading');
    expect(suspense).toHaveBeenCalledTimes(1 * sm);
    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 1);

    // Setting selector back to the previous state before it was pending should
    // wake it up and render in previous state
    act(() => updateValue({value: 0}));
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('0');
    expect(suspense).toHaveBeenCalledTimes(1 * sm);
    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 2);

    // Setting selector to a new state "1" should update and re-render
    act(() => updateValue({value: 1}));
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('1');
    expect(suspense).toHaveBeenCalledTimes(1 * sm);
    expect(commit).toHaveBeenCalledTimes(BASE_CALLS + 3);

    // Setting selector to the same value "1" should avoid a re-render
    act(() => updateValue({value: 1}));
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('1');
    expect(suspense).toHaveBeenCalledTimes(1 * sm);
    expect(commit).toHaveBeenCalledTimes(
      BASE_CALLS +
        3 +
        ((reactMode().mode === 'LEGACY' ||
          reactMode().mode === 'MUTABLE_SOURCE') &&
        !gks.includes('recoil_suppress_rerender_in_callback')
          ? 1
          : 0),
    );
  },
);

testRecoil('Sync React and Recoil state changes', ({gks}) => {
  if (
    reactMode().mode === 'MUTABLE_SOURCE' &&
    !gks.includes('recoil_suppress_rerender_in_callback')
  ) {
    return;
  }

  const myAtom = atom({key: 'sync react recoil', default: 0});

  let setReact, setRecoil;
  function Component() {
    const [reactState, setReactState] = useState(0);
    const [recoilState, setRecoilState] = useRecoilState(myAtom);
    setReact = setReactState;
    setRecoil = setRecoilState;

    expect(reactState).toBe(recoilState);

    return `${reactState} - ${recoilState}`;
  }

  const c = renderElements(<Component />);
  expect(c.textContent).toBe('0 - 0');

  // Set both React and Recoil state in the same batch and ensure the component
  // render always seems consistent picture of both state changes.
  act(() => {
    setReact(1);
    setRecoil(1);
  });
  expect(c.textContent).toBe('1 - 1');
});

testRecoil(
  'useTransactionObservation_DEPRECATED: Transaction dirty atoms are set',
  async () => {
    const anAtom = counterAtom({
      type: 'url',
      validator: x => (x: any), // flowlint-line unclear-type:off
    });
    const [aSelector, _] = plusOneSelector(anAtom);
    const [anAsyncSelector, __] = plusOneAsyncSelector(aSelector);
    const [Component, updateValue] = componentThatWritesAtom(anAtom);
    const modifiedAtomsList = [];
    renderElements(
      <>
        <Component />
        <ReadsAtom atom={aSelector} />
        <React.Suspense fallback="loading">
          <ReadsAtom atom={anAsyncSelector} />
        </React.Suspense>
        <ObservesTransactions
          fn={({modifiedAtoms}) => {
            modifiedAtomsList.push(modifiedAtoms);
          }}
        />
      </>,
    );

    await flushPromisesAndTimers();
    await flushPromisesAndTimers();
    act(() => updateValue(1));
    await flushPromisesAndTimers();
    expect(modifiedAtomsList.length).toBe(3);
    expect(modifiedAtomsList[1].size).toBe(1);
    expect(modifiedAtomsList[1].has(anAtom.key)).toBe(true);
    for (const modifiedAtoms of modifiedAtomsList) {
      expect(modifiedAtoms.has(aSelector.key)).toBe(false);
      expect(modifiedAtoms.has(anAsyncSelector.key)).toBe(false);
    }
  },
);

testRecoil(
  'Can restore persisted values before atom def code is loaded',
  () => {
    let theAtom = null;
    let setUnvalidatedAtomValues;
    function SetsUnvalidatedAtomValues() {
      setUnvalidatedAtomValues = useSetUnvalidatedAtomValues();
      return null;
    }
    let setVisible;
    function Switch({children}) {
      const [visible, mySetVisible] = useState(false);
      setVisible = mySetVisible;
      return visible ? children : null;
    }
    function MyReadsAtom({getAtom}) {
      const [value] = useRecoilState((getAtom(): any)); // flowlint-line unclear-type:off
      return value;
    }
    const container = renderElements(
      <>
        <SetsUnvalidatedAtomValues />
        <Switch>
          <MyReadsAtom getAtom={() => theAtom} />
        </Switch>
      </>,
    );
    act(() => {
      setUnvalidatedAtomValues(new Map().set('notDefinedYetAtom', 123));
    });
    const validator = jest.fn(() => 789);
    theAtom = atom({
      key: 'notDefinedYetAtom',
      default: 456,
      persistence_UNSTABLE: {
        type: 'url',
        validator,
      },
    });
    act(() => {
      setVisible(true);
    });
    expect(validator.mock.calls[0][0]).toBe(123);
    expect(container.textContent).toBe('789');
  },
);

testRecoil(
  'useTransactionObservation_DEPRECATED: Nonvalidated atoms are included in transaction observation',
  () => {
    const anAtom = counterAtom({
      type: 'url',
      validator: x => (x: any), // flowlint-line unclear-type:off
    });

    const [Component, updateValue] = componentThatWritesAtom(anAtom);

    let setUnvalidatedAtomValues;
    function SetsUnvalidatedAtomValues() {
      setUnvalidatedAtomValues = useSetUnvalidatedAtomValues();
      return null;
    }

    let values = new Map();
    renderElements(
      <>
        <Component />
        <SetsUnvalidatedAtomValues />
        <ObservesTransactions
          fn={({atomValues}) => {
            values = atomValues;
          }}
        />
      </>,
    );
    act(() => {
      setUnvalidatedAtomValues(new Map().set('someNonvalidatedAtom', 123));
    });
    values = new Map();
    act(() => updateValue(1));
    expect(values.size).toBe(2);
    expect(values.get('someNonvalidatedAtom')).toBe(123);
  },
);

testRecoil('Hooks cannot be used outside of RecoilRoot', () => {
  const myAtom = atom({key: 'hook outside RecoilRoot', default: 'INVALID'});
  function Test() {
    useRecoilValue(myAtom);
    return 'TEST';
  }

  // Make sure there is a friendly error message mentioning <RecoilRoot>
  expect(() => renderUnwrappedElements(<Test />)).toThrow('<RecoilRoot>');
});
