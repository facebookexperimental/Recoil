/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow
 * @format
 */
'use strict';

import type {PersistenceSettings} from 'Recoil_atom';
import type {
  RecoilState,
  RecoilValue,
  RecoilValueReadOnly,
} from 'Recoil_RecoilValue';

const React = require('React');
const {useEffect, useState} = require('React');
const ReactDOM = require('ReactDOM');
const {act} = require('ReactTestUtils');
const atom = require('Recoil_atom');
const errorSelector = require('Recoil_error');
const {
  useRecoilState,
  useRecoilStateLoadable,
  useRecoilValue,
  useRecoilValueLoadable,
  useSetRecoilState,
  useSetUnvalidatedAtomValues,
  useTransactionObservation,
} = require('Recoil_Hooks');
const Queue = require('Recoil_Queue');
const selector = require('Recoil_selector');
const {
  ReadsAtom,
  asyncSelector,
  errorThrowingAsyncSelector,
  flushPromisesAndTimers,
  renderElements,
} = require('Recoil_TestingUtils');

const gkx = require('gkx');

gkx.setPass('recoil_async_selector_refactor');

const invariant = require('Recoil_invariant');

jest.mock('Recoil_expectationViolation', () => (fmt, ...args) => {
  throw new Error(require('sprintf')(fmt, ...args));
});

let nextID = 0;

function counterAtom(persistence?: PersistenceSettings<number>) {
  return atom({
    key: `atom${nextID++}`,
    default: 0,
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
  atom: RecoilState<T>,
): [React.AbstractComponent<{...}>, ((T => T) | T) => void] {
  let updateValue;
  const Component = jest.fn(() => {
    const [value, _updateValue] = useRecoilState(atom);
    updateValue = _updateValue;
    return value;
  });
  return [(Component: any), (...args) => updateValue(...args)];
}

function componentThatWritesAtom(atom) {
  let updateValue;
  const Component = jest.fn(() => {
    updateValue = useSetRecoilState(atom);
    return null;
  });
  return [(Component: any), (...args) => updateValue(...args)];
}

function componentThatReadsAtom(atom) {
  return (jest.fn(function ReadsAtom() {
    return useRecoilValue(atom);
  }): any);
}

function componentThatReadsTwoAtoms(one, two) {
  return (jest.fn(function ReadTwoAtoms() {
    return `${useRecoilValue(one)},${useRecoilValue(two)}`;
  }): any);
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
  useTransactionObservation(fn);
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

test('Components are re-rendered when atoms change', async () => {
  const anAtom = counterAtom();
  const [Component, updateValue] = componentThatReadsAndWritesAtom(anAtom);
  const container = renderElements(<Component />);
  expect(container.textContent).toEqual('0');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('1');
});

test('Selectors are updated when upstream atoms change', () => {
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneSelector(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements([
    <Component />,
    <ReadsAtom atom={aSelector} />,
  ]);
  expect(container.textContent).toEqual('1');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('2');
});

test('Selectors can depend on other selectors', () => {
  const anAtom = counterAtom();
  const [selectorA, _] = plusOneSelector(anAtom);
  const [selectorB, __] = plusOneSelector(selectorA);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements([
    <Component />,
    <ReadsAtom atom={selectorB} />,
  ]);
  expect(container.textContent).toEqual('2');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('3');
});

test('Selectors can depend on async selectors', () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [selectorA, _] = plusOneAsyncSelector(anAtom);
  const [selectorB, __] = plusOneSelector(selectorA);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements([
    <Component />,
    <ReadsAtom atom={selectorB} />,
  ]);
  expect(container.textContent).toEqual('loading');

  act(() => jest.runAllTimers());
  expect(container.textContent).toEqual('2');

  act(() => updateValue(1));
  expect(container.textContent).toEqual('loading');

  act(() => jest.runAllTimers());
  expect(container.textContent).toEqual('3');
});

test('Async selectors can depend on async selectors', () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [selectorA, _] = plusOneAsyncSelector(anAtom);
  const [selectorB, __] = plusOneAsyncSelector(selectorA);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements([
    <Component />,
    <ReadsAtom atom={selectorB} />,
  ]);
  expect(container.textContent).toEqual('loading');

  act(() => jest.runAllTimers());
  expect(container.textContent).toEqual('2');

  act(() => updateValue(1));
  expect(container.textContent).toEqual('loading');

  act(() => jest.runAllTimers());
  expect(container.textContent).toEqual('3');
});

test('Dep of upstream selector can change while pending', async () => {
  const anAtom = counterAtom();
  const [
    upstreamSel,
    upstreamResolvers,
  ] = asyncSelectorThatPushesPromisesOntoArray(anAtom);
  const [
    downstreamSel,
    downstreamResolvers,
  ] = asyncSelectorThatPushesPromisesOntoArray(upstreamSel);

  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements([
    <Component />,
    <ReadsAtom atom={downstreamSel} />,
  ]);

  expect(container.textContent).toEqual('loading');
  expect(upstreamResolvers.length).toEqual(1);
  expect(downstreamResolvers.length).toEqual(0);
  upstreamResolvers[0][0](123);
  act(() => updateValue(1));
  await flushPromisesAndTimers();
  expect(upstreamResolvers.length).toEqual(2);
  expect(downstreamResolvers.length).toEqual(1);
  upstreamResolvers[1][0](123);
  await flushPromisesAndTimers();
  expect(downstreamResolvers.length).toEqual(2);
  downstreamResolvers[1][0](123);
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('123');
});

test('Errors are propogated through selectors', () => {
  const errorThrower = errorSelector('ERROR');
  const [downstreamSelector] = plusOneSelector(errorThrower);
  const container = renderElements([<ReadsAtom atom={downstreamSelector} />]);
  expect(container.textContent).toEqual('error');
});

test('Rejected promises are propogated through selectors (immediate rejection)', async () => {
  const anAtom = counterAtom();
  const errorThrower = errorThrowingAsyncSelector('ERROR', anAtom);
  const [downstreamSelector] = plusOneAsyncSelector(errorThrower);
  const container = renderElements([<ReadsAtom atom={downstreamSelector} />]);
  expect(container.textContent).toEqual('loading');
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('error');
});

test('Rejected promises are propogated through selectors (later rejection)', async () => {
  const anAtom = counterAtom();
  const [errorThrower, _resolve, reject] = asyncSelector(anAtom);
  const [downstreamSelector] = plusOneAsyncSelector(errorThrower);
  const container = renderElements([<ReadsAtom atom={downstreamSelector} />]);
  expect(container.textContent).toEqual('loading');
  act(() => reject(new Error()));
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('error');
});

test('Component subscribed to atom is rendered just once', () => {
  const anAtom = counterAtom();
  const [Component, updateValue] = componentThatReadsAndWritesAtom(anAtom);
  renderElements([<Component />]);
  expect(Component).toHaveBeenCalledTimes(2);
  act(() => updateValue(1));
  expect(Component).toHaveBeenCalledTimes(3);
});

test('Write-only components are not subscribed', () => {
  const anAtom = counterAtom();
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  renderElements([<Component />]);
  expect(Component).toHaveBeenCalledTimes(1);
  act(() => updateValue(1));
  expect(Component).toHaveBeenCalledTimes(1);
});

test('Component that depends on atom in multiple ways is rendered just once', () => {
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneSelector(anAtom);
  const [WriteComp, updateValue] = componentThatWritesAtom(anAtom);
  const ReadComp = componentThatReadsTwoAtoms(anAtom, aSelector);
  renderElements([<WriteComp />, <ReadComp />]);
  expect(ReadComp).toHaveBeenCalledTimes(2);
  act(() => updateValue(1));
  // TODO FIX THIS OPTIMIZATION
  // expect(ReadComp).toHaveBeenCalledTimes(3);
});

test('Selector functions are evaluated just once', () => {
  const anAtom = counterAtom();
  const [aSelector, selectorFn] = plusOneSelector(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  renderElements([<Component />, <ReadsAtom atom={aSelector} />]);
  expect(selectorFn).toHaveBeenCalledTimes(1);
  act(() => updateValue(1));
  expect(selectorFn).toHaveBeenCalledTimes(2);
});

test('Selector functions are evaluated just once even if multiple upstreams change', () => {
  const atomA = counterAtom();
  const atomB = counterAtom();
  const [aSelector, selectorFn] = additionSelector(atomA, atomB);
  const [ComponentA, updateValueA] = componentThatWritesAtom(atomA);
  const [ComponentB, updateValueB] = componentThatWritesAtom(atomB);
  renderElements([
    <ComponentA />,
    <ComponentB />,
    <ReadsAtom atom={aSelector} />,
  ]);
  expect(selectorFn).toHaveBeenCalledTimes(1);
  act(() => {
    ReactDOM.unstable_batchedUpdates(() => {
      updateValueA(1);
      updateValueB(1);
    });
  });
  expect(selectorFn).toHaveBeenCalledTimes(2);
});

test('Component that depends on multiple atoms via selector is rendered just once', () => {
  const atomA = counterAtom();
  const atomB = counterAtom();
  const [aSelector, _] = additionSelector(atomA, atomB);
  const [ComponentA, updateValueA] = componentThatWritesAtom(atomA);
  const [ComponentB, updateValueB] = componentThatWritesAtom(atomB);
  const ReadComp = componentThatReadsAtom(aSelector);
  renderElements([<ComponentA />, <ComponentB />, <ReadComp />]);
  expect(ReadComp).toHaveBeenCalledTimes(2);
  act(() => {
    ReactDOM.unstable_batchedUpdates(() => {
      updateValueA(1);
      updateValueB(1);
    });
  });
  expect(ReadComp).toHaveBeenCalledTimes(3);
});

test('Component that depends on multiple atoms directly is rendered just once', () => {
  const atomA = counterAtom();
  const atomB = counterAtom();
  const [ComponentA, updateValueA] = componentThatWritesAtom(atomA);
  const [ComponentB, updateValueB] = componentThatWritesAtom(atomB);
  const ReadComp = componentThatReadsTwoAtoms(atomA, atomB);
  renderElements([<ComponentA />, <ComponentB />, <ReadComp />]);
  expect(ReadComp).toHaveBeenCalledTimes(2);
  act(() => {
    ReactDOM.unstable_batchedUpdates(() => {
      updateValueA(1);
      updateValueB(1);
    });
  });
  expect(ReadComp).toHaveBeenCalledTimes(3);
});

test('Component is rendered just once when atom is changed twice', () => {
  const atomA = counterAtom();
  const [ComponentA, updateValueA] = componentThatWritesAtom(atomA);
  const ReadComp = componentThatReadsAtom(atomA);
  renderElements([<ComponentA />, <ReadComp />]);
  expect(ReadComp).toHaveBeenCalledTimes(2);
  act(() => {
    ReactDOM.unstable_batchedUpdates(() => {
      updateValueA(1);
      updateValueA(2);
    });
  });
  expect(ReadComp).toHaveBeenCalledTimes(3);
});

test('Can subscribe to and also change an atom in the same batch', () => {
  const anAtom = counterAtom();

  let setVisible;
  function Switch({children}) {
    const [visible, mySetVisible] = useState(false);
    setVisible = mySetVisible;
    return visible ? children : null;
  }

  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements([
    <Component />,
    <Switch>
      <ReadsAtom atom={anAtom} />
    </Switch>,
  ]);

  expect(container.textContent).toEqual('');

  act(() => {
    ReactDOM.unstable_batchedUpdates(() => {
      setVisible(true);
      updateValue(1337);
    });
  });
  expect(container.textContent).toEqual('1337');
});

test('Atom values are retained when atom has no subscribers', () => {
  const anAtom = counterAtom();

  let setVisible;
  function Switch({children}) {
    const [visible, mySetVisible] = useState(true);
    setVisible = mySetVisible;
    return visible ? children : null;
  }

  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements([
    <Component />,
    <Switch>
      <ReadsAtom atom={anAtom} />
    </Switch>,
  ]);

  act(() => updateValue(1337));
  expect(container.textContent).toEqual('1337');
  act(() => setVisible(false));
  expect(container.textContent).toEqual('');
  act(() => setVisible(true));
  expect(container.textContent).toEqual('1337');
});

test('Components unsubscribe from atoms when rendered without using them', () => {
  const atomA = counterAtom();
  const atomB = counterAtom();
  const [WriteA, updateValueA] = componentThatWritesAtom(atomA);
  const [WriteB, updateValueB] = componentThatWritesAtom(atomB);

  const Component = (jest.fn(function Read({atom}) {
    const [value] = useRecoilState(atom);
    return value;
  }): any);

  let toggleSwitch;
  const Switch = () => {
    const [value, setValue] = useState(false);
    toggleSwitch = () => setValue(true);
    return value ? <Component atom={atomB} /> : <Component atom={atomA} />;
  };

  const container = renderElements([<Switch />, <WriteA />, <WriteB />]);
  expect(container.textContent).toEqual('0');
  expect(Component).toHaveBeenCalledTimes(2);

  act(() => updateValueA(1));
  expect(container.textContent).toEqual('1');
  expect(Component).toHaveBeenCalledTimes(3);

  act(() => toggleSwitch());
  expect(container.textContent).toEqual('0');
  expect(Component).toHaveBeenCalledTimes(5); // TODO why not 4?

  // Now update the atom that it used to be subscribed to but should be no longer:
  act(() => updateValueA(2));
  expect(container.textContent).toEqual('0');
  expect(Component).toHaveBeenCalledTimes(5); // Important part: same as before

  // It is subscribed to the atom that it switched to:
  act(() => updateValueB(3));
  expect(container.textContent).toEqual('3');
  expect(Component).toHaveBeenCalledTimes(6);
});

test('Selectors unsubscribe from upstream when they have no subscribers', () => {
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

  const container = renderElements([<Switch />, <WriteA />]);
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
});

test('Unsubscribes happen in case of unmounting of a suspended component', () => {
  const anAtom = counterAtom();
  const [aSelector, selFn] = plusOneSelector(anAtom);
  const [asyncSel, adjustTimeout] = plusOneAsyncSelector(aSelector);
  // FIXME to implement
});

test('Selectors stay up to date if deps are changed while they have no subscribers', () => {
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneSelector(anAtom);

  let setVisible;
  function Switch({children}) {
    const [visible, mySetVisible] = useState(true);
    setVisible = mySetVisible;
    return visible ? children : null;
  }

  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements([
    <Component />,
    <Switch>
      <ReadsAtom atom={aSelector} />
    </Switch>,
  ]);

  act(() => updateValue(1));
  expect(container.textContent).toEqual('2');
  act(() => setVisible(false));
  expect(container.textContent).toEqual('');
  act(() => updateValue(2));
  expect(container.textContent).toEqual('');
  act(() => setVisible(true));
  expect(container.textContent).toEqual('3');
});

test('Selectors can be invertible', () => {
  const anAtom = counterAtom();
  const aSelector = selector({
    key: 'invertible1',
    get: ({get}) => get(anAtom),
    set: ({set}, newValue) => set(anAtom, newValue),
  });

  const [Component, updateValue] = componentThatWritesAtom(aSelector);
  const container = renderElements([
    <Component />,
    <ReadsAtom atom={anAtom} />,
  ]);

  expect(container.textContent).toEqual('0');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('1');
});

test('Selector dependencies can change over time', () => {
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

  const container = renderElements([
    <ComponentA />,
    <ComponentB />,
    <ReadsAtom atom={aSelector} />,
  ]);

  expect(container.textContent).toEqual('0');
  act(() => updateValueA(1337));
  expect(container.textContent).toEqual('0');
  act(() => updateValueB(1));

  expect(container.textContent).toEqual('1');
  act(() => updateValueA(2));
  expect(container.textContent).toEqual('2');
});

test('Selector depedencies are updated transactionally', () => {
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
  renderElements([
    <ComponentA />,
    <ComponentB />,
    <ComponentC />,
    <ReadsAtom atom={aSelector} />,
  ]);

  act(() => {
    ReactDOM.unstable_batchedUpdates(() => {
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

test('Can set an atom during rendering', () => {
  const anAtom = counterAtom();

  function SetsDuringRendering() {
    const [value, setValue] = useRecoilState(anAtom);
    if (value !== 1) {
      setValue(1);
    }
    return null;
  }

  const container = renderElements([
    <SetsDuringRendering />,
    <ReadsAtom atom={anAtom} />,
  ]);

  expect(container.textContent).toEqual('1');
});

test('Does not re-create "setter" function after setting a value', () => {
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

  function Component3() {
    const a = useTwoAtomsCounter > 0 ? anotherAtom : anAtom;
    // setValue fn should change when we use a different atom.
    const [_, setValue] = useRecoilState(a);
    useEffect(() => {
      setValue(1);
      useTwoAtomsCounter += 1;
    }, [setValue]);
    return null;
  }

  renderElements([<Component1 />, <Component2 />, <Component3 />]);

  expect(useRecoilStateCounter).toBe(1);
  expect(useRecoilStateErrorStatesCounter).toBe(1);
  expect(useTwoAtomsCounter).toBe(2);
});

test('Can set atom during post-atom-setting effect (NOT during initial render)', async () => {
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

  const [Comp] = componentThatWritesAtom(anAtom);

  const container = renderElements([
    <SetsDuringEffect />,
    <ReadsAtom atom={anAtom} />,
    <Comp />,
  ]);

  expect(container.textContent).toEqual('1');
});

test('Can set atom during post-atom-setting effect regardless of effect order', async () => {
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
      const container = renderElements([
        <SetsDuringEffect />,
        <ReadsAtom atom={anAtom} />,
        <Comp />,
      ]);
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
});

test('Basic async selector test', () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneAsyncSelector(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements([
    <Component />,
    <ReadsAtom atom={aSelector} />,
  ]);
  // Begins in loading state, then shows initial value:
  expect(container.textContent).toEqual('loading');
  act(() => jest.runAllTimers());
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

test('Ability to not use Suspense', () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneAsyncSelector(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);

  function ReadsAtomWithoutSuspense({atom}) {
    const loadable = useRecoilValueLoadable(atom);
    if (loadable.state === 'loading') {
      return 'loading not with suspense';
    } else if (loadable.state === 'hasValue') {
      return loadable.contents;
    } else {
      throw loadable.contents;
    }
  }

  const container = renderElements([
    <Component />,
    <ReadsAtomWithoutSuspense atom={aSelector} />,
  ]);
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

test('Ability to not use Suspense - with value instead of loadable', () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneAsyncSelector(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);

  function ReadsAtomWithoutSuspense({atom}) {
    return (
      useRecoilValueLoadable(atom).valueMaybe() ?? 'loading not with suspense'
    );
  }

  const container = renderElements([
    <Component />,
    <ReadsAtomWithoutSuspense atom={aSelector} />,
  ]);
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

test('Selector can alternate between synchronous and asynchronous', async () => {
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
  const container = renderElements([
    <Component />,
    <ReadsAtom atom={aSelector} />,
  ]);

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
  expect(container.textContent).toEqual('5');
});

test('Async selectors do not re-query when re-subscribed from having no subscribers', async () => {
  const anAtom = counterAtom();
  const [sel, resolvers] = asyncSelectorThatPushesPromisesOntoArray(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const [Toggle, toggle] = componentThatToggles(<ReadsAtom atom={sel} />, null);
  const container = renderElements([<Component />, <Toggle />]);
  expect(container.textContent).toEqual('loading');
  expect(resolvers.length).toBe(1);
  act(() => updateValue(2));
  await flushPromisesAndTimers();
  expect(resolvers.length).toBe(2);
  resolvers[1][0]('hello');
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('"hello"');

  // Cause sel to have no subscribers:
  act(() => toggle.current());
  expect(container.textContent).toEqual('');

  // Once it's used again, it should not issue another request:
  act(() => toggle.current());
  expect(resolvers.length).toBe(2);
  expect(container.textContent).toEqual('"hello"');
});

test('Selector subscriptions are correct when a selector is unsubscribed the second time', async () => {
  // This regression test would fail by an exception being thrown because subscription refcounts
  // would would fall below zero.
  const anAtom = counterAtom();
  const [sel, _] = plusOneSelector(anAtom);
  const [Toggle, toggle] = componentThatToggles(<ReadsAtom atom={sel} />, null);
  const container = renderElements([<Toggle />]);

  expect(container.textContent).toEqual('1');

  act(() => toggle.current());
  expect(container.textContent).toEqual('');

  act(() => toggle.current());
  expect(container.textContent).toEqual('1');

  act(() => toggle.current());
  expect(container.textContent).toEqual('');
});

test('Can move out of suspense by changing deps', async () => {
  const anAtom = counterAtom();
  const [aSelector, resolvers] = asyncSelectorThatPushesPromisesOntoArray(
    anAtom,
  );
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const container = renderElements([
    <Component />,
    <ReadsAtom atom={aSelector} />,
  ]);
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
  expect(container.textContent).toEqual('"hello"');
});

test('Can use an already-resolved promise', async () => {
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
  const container = renderElements([<Component />, <ReadsAtom atom={sel} />]);
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('1');
  act(() => updateValue(1));
  await flushPromisesAndTimers();
  expect(container.textContent).toEqual('2');
});

test('Resolution of suspense causes render just once', () => {
  jest.useFakeTimers();
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneAsyncSelector(anAtom);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  const ReadComp = componentThatReadsAtom(aSelector);
  renderElements([<Component />, <ReadComp />]);
  // Begins in loading state, then shows initial value:
  act(() => jest.runAllTimers());
  expect(ReadComp).toHaveBeenCalledTimes(3);
  // Changing dependency makes it go back to loading, then to show new value:
  act(() => updateValue(1));
  act(() => jest.runAllTimers());
  expect(ReadComp).toHaveBeenCalledTimes(5);
  // Returning to a seen value does not cause the loading state:
  act(() => updateValue(0));
  expect(ReadComp).toHaveBeenCalledTimes(6);
});

test('Transaction dirty atoms are set', () => {
  const anAtom = counterAtom();
  const [aSelector, _] = plusOneSelector(anAtom);
  const [anAsyncSelector, __] = plusOneAsyncSelector(aSelector);
  const [Component, updateValue] = componentThatWritesAtom(anAtom);
  let dirtyAtoms = {
    size: undefined,
    has: _ => {
      throw new Error();
    },
  };
  renderElements([
    <Component />,
    <ReadsAtom atom={aSelector} />,
    <ReadsAtom atom={anAsyncSelector} />,
    <ObservesTransactions
      fn={({modifiedAtoms}) => {
        dirtyAtoms = modifiedAtoms;
      }}
    />,
  ]);

  // Changing an atom causes everything downstream of it to become dirty:
  act(() => updateValue(1));
  expect(dirtyAtoms.size).toBe(1);
  expect(dirtyAtoms.has(anAtom.key)).toBe(true);

  // Selectors are not stored in dirtyAtoms
  expect(dirtyAtoms.has(aSelector.key)).toBe(false);
  expect(dirtyAtoms.has(anAsyncSelector.key)).toBe(false);
});

test('Can restore persisted values before atom def code is loaded', () => {
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
    const [value] = useRecoilState((getAtom(): any));
    return value;
  }
  const container = renderElements([
    <SetsUnvalidatedAtomValues />,
    <Switch>
      <MyReadsAtom getAtom={() => theAtom} />
    </Switch>,
  ]);
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
});

test('Nonvalidated atoms are included in transaction observation', () => {
  const anAtom = counterAtom({
    type: 'url',
    validator: x => (x: any),
  });

  const [Component, updateValue] = componentThatWritesAtom(anAtom);

  let setUnvalidatedAtomValues;
  function SetsUnvalidatedAtomValues() {
    setUnvalidatedAtomValues = useSetUnvalidatedAtomValues();
    return null;
  }

  let values = new Map();
  renderElements([
    <Component />,
    <SetsUnvalidatedAtomValues />,
    <ObservesTransactions
      fn={({atomValues}) => {
        values = atomValues;
      }}
    />,
  ]);
  act(() => {
    setUnvalidatedAtomValues(new Map().set('someNonvalidatedAtom', 123));
  });
  values = new Map();
  act(() => updateValue(1));
  expect(values.size).toBe(2);
  expect(values.get('someNonvalidatedAtom')).toBe(123);
});
