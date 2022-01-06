/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {RecoilValue} from '../../core/Recoil_RecoilValue';

const {
  getRecoilTestFn,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

let React,
  useState,
  Profiler,
  act,
  DEFAULT_VALUE,
  DefaultValue,
  RecoilRoot,
  getRecoilValueAsLoadable,
  setRecoilValue,
  useRecoilState,
  useRecoilCallback,
  useRecoilValue,
  useRecoilStoreID,
  selector,
  useRecoilTransactionObserver,
  useResetRecoilState,
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers,
  renderElements,
  atom,
  immutable,
  store;

const testRecoil = getRecoilTestFn(() => {
  const {
    makeStore,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

  React = require('react');
  ({useState, Profiler} = require('react'));
  ({act} = require('ReactTestUtils'));

  ({DEFAULT_VALUE, DefaultValue} = require('../../core/Recoil_Node'));
  ({RecoilRoot, useRecoilStoreID} = require('../../core/Recoil_RecoilRoot'));
  ({
    getRecoilValueAsLoadable,
    setRecoilValue,
  } = require('../../core/Recoil_RecoilValueInterface'));
  ({
    useRecoilState,
    useResetRecoilState,
    useRecoilValue,
  } = require('../../hooks/Recoil_Hooks'));
  ({
    useRecoilTransactionObserver,
  } = require('../../hooks/Recoil_SnapshotHooks'));
  ({useRecoilCallback} = require('../../hooks/Recoil_useRecoilCallback'));
  ({
    ReadsAtom,
    componentThatReadsAndWritesAtom,
    flushPromisesAndTimers,
    renderElements,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  atom = require('../Recoil_atom');
  selector = require('../Recoil_selector');
  immutable = require('immutable');

  store = makeStore();
});

function getValue<T>(recoilValue: RecoilValue<T>): T {
  return (getRecoilValueAsLoadable(store, recoilValue).contents: any); // flowlint-line unclear-type:off
}

function getRecoilStateLoadable(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue);
}

function getRecoilStatePromise(recoilValue) {
  return getRecoilStateLoadable(recoilValue).promiseOrThrow();
}

function set(recoilValue, value: mixed) {
  setRecoilValue(store, recoilValue, value);
}

function reset(recoilValue) {
  setRecoilValue(store, recoilValue, DEFAULT_VALUE);
}

testRecoil('atom can read and write value', () => {
  const myAtom = atom<string>({
    key: 'atom with default',
    default: 'DEFAULT',
  });
  expect(getValue(myAtom)).toBe('DEFAULT');
  act(() => set(myAtom, 'VALUE'));
  expect(getValue(myAtom)).toBe('VALUE');
});

describe('Valid values', () => {
  testRecoil('atom can store null and undefined', () => {
    const myAtom = atom<?string>({
      key: 'atom with default for null and undefined',
      default: 'DEFAULT',
    });
    expect(getValue(myAtom)).toBe('DEFAULT');
    act(() => set(myAtom, 'VALUE'));
    expect(getValue(myAtom)).toBe('VALUE');
    act(() => set(myAtom, null));
    expect(getValue(myAtom)).toBe(null);
    act(() => set(myAtom, undefined));
    expect(getValue(myAtom)).toBe(undefined);
    act(() => set(myAtom, 'VALUE'));
    expect(getValue(myAtom)).toBe('VALUE');
  });

  testRecoil('atom can store a circular reference object', () => {
    class Circular {
      self: Circular;

      constructor() {
        this.self = this;
      }
    }
    const circular = new Circular();
    const myAtom = atom<?Circular>({
      key: 'atom',
      default: undefined,
    });
    expect(getValue(myAtom)).toBe(undefined);
    act(() => set(myAtom, circular));
    expect(getValue(myAtom)).toBe(circular);
  });
});

describe('Async Defaults', () => {
  testRecoil('default promise', async () => {
    const myAtom = atom<string>({
      key: 'atom async default',
      default: Promise.resolve('RESOLVE'),
    });
    const container = renderElements(<ReadsAtom atom={myAtom} />);

    expect(container.textContent).toEqual('loading');
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('"RESOLVE"');
  });

  testRecoil('default promise overwritten before resolution', () => {
    let resolveAtom;
    const myAtom = atom<string>({
      key: 'atom async default overwritten',
      default: new Promise(resolve => {
        resolveAtom = resolve;
      }),
    });

    const [ReadsWritesAtom, setAtom, resetAtom] =
      componentThatReadsAndWritesAtom(myAtom);
    const container = renderElements(<ReadsWritesAtom />);

    expect(container.textContent).toEqual('loading');

    act(() => setAtom('SET'));
    act(() => jest.runAllTimers());
    expect(container.textContent).toEqual('"SET"');

    act(() => resolveAtom('RESOLVE'));
    expect(container.textContent).toEqual('"SET"');

    act(() => resetAtom());
    act(() => jest.runAllTimers());
    expect(container.textContent).toEqual('"RESOLVE"');
  });

  // NOTE: This test intentionally throws an error
  testRecoil('default promise rejection', async () => {
    const myAtom = atom<string>({
      key: 'atom async default',
      default: Promise.reject('REJECT'),
    });
    const container = renderElements(<ReadsAtom atom={myAtom} />);

    expect(container.textContent).toEqual('loading');
    act(() => jest.runAllTimers());
    await flushPromisesAndTimers();
    expect(container.textContent).toEqual('error');
  });
});

testRecoil("Updating with same value doesn't rerender", () => {
  const myAtom = atom({key: 'atom same value rerender', default: 'DEFAULT'});

  let setAtom;
  let resetAtom;
  let renders = 0;
  function AtomComponent() {
    const [value, setValue] = useRecoilState(myAtom);
    const resetValue = useResetRecoilState(myAtom);
    setAtom = setValue;
    resetAtom = resetValue;
    return value;
  }
  expect(renders).toEqual(0);
  const c = renderElements(
    <Profiler
      id="test"
      onRender={() => {
        renders++;
      }}>
      <AtomComponent />
    </Profiler>,
  );

  // Initial render happens one time in www and 2 times in oss.
  // resetting the counter to 1 after the initial render to make them
  // the same in both repos. 2 renders probably need to be looked into.
  renders = 1;

  expect(c.textContent).toEqual('DEFAULT');

  act(() => setAtom('SET'));
  expect(renders).toEqual(2);
  expect(c.textContent).toEqual('SET');

  act(() => setAtom('SET'));
  expect(renders).toEqual(2);
  expect(c.textContent).toEqual('SET');

  act(() => setAtom('CHANGE'));
  expect(renders).toEqual(3);
  expect(c.textContent).toEqual('CHANGE');

  act(resetAtom);
  expect(renders).toEqual(4);
  expect(c.textContent).toEqual('DEFAULT');

  act(resetAtom);
  expect(renders).toEqual(4);
  expect(c.textContent).toEqual('DEFAULT');
});

describe('Effects', () => {
  testRecoil('effect error', () => {
    const ERROR = new Error('ERROR');
    const myAtom = atom({
      key: 'atom effect error',
      default: 'DEFAULT',
      effects: [
        () => {
          throw ERROR;
        },
      ],
    });
    const mySelector = selector({
      key: 'atom effect error selector',
      get: ({get}) => {
        try {
          return get(myAtom);
        } catch (e) {
          return e.message;
        }
      },
    });
    const container = renderElements(<ReadsAtom atom={mySelector} />);
    expect(container.textContent).toEqual('"ERROR"');
  });

  testRecoil('initialization', () => {
    let inited = false;
    const myAtom = atom({
      key: 'atom effect',
      default: 'DEFAULT',
      effects: [
        ({node, trigger, setSelf}) => {
          inited = true;
          expect(trigger).toEqual('get');
          expect(node).toBe(myAtom);
          setSelf('INIT');
        },
      ],
    });
    expect(getValue(myAtom)).toEqual('INIT');
    expect(inited).toEqual(true);
  });

  testRecoil('async default', () => {
    let inited = false;
    const myAtom = atom<string>({
      key: 'atom effect async default',
      default: Promise.resolve('RESOLVE'),
      effects: [
        ({setSelf, onSet}) => {
          inited = true;
          setSelf('INIT');
          onSet(newValue => {
            expect(newValue).toBe('RESOLVE');
          });
        },
      ],
    });

    expect(inited).toEqual(false);

    const [ReadsWritesAtom, _, resetAtom] =
      componentThatReadsAndWritesAtom(myAtom);
    const c = renderElements(<ReadsWritesAtom />);
    expect(inited).toEqual(true);
    expect(c.textContent).toEqual('"INIT"');

    act(resetAtom);
    expect(c.textContent).toEqual('loading');
    act(() => jest.runAllTimers());
    expect(c.textContent).toEqual('"RESOLVE"');
  });

  testRecoil('order of effects', () => {
    const myAtom = atom({
      key: 'atom effect order',
      default: 'DEFAULT',
      effects: [
        ({setSelf}) => {
          setSelf(x => {
            expect(x).toEqual('DEFAULT');
            return 'EFFECT 1a';
          });
          setSelf(x => {
            expect(x).toEqual('EFFECT 1a');
            return 'EFFECT 1b';
          });
        },
        ({setSelf}) => {
          setSelf(x => {
            expect(x).toEqual('EFFECT 1b');
            return 'EFFECT 2';
          });
        },
        () => {},
      ],
    });
    expect(getValue(myAtom)).toEqual('EFFECT 2');
  });

  testRecoil('reset during init', () => {
    const myAtom = atom({
      key: 'atom effect reset',
      default: 'DEFAULT',
      effects: [({setSelf}) => setSelf('INIT'), ({resetSelf}) => resetSelf()],
    });
    expect(getValue(myAtom)).toEqual('DEFAULT');
  });

  testRecoil('init to undefined', () => {
    const myAtom = atom({
      key: 'atom effect init undefined',
      default: 'DEFAULT',
      effects: [({setSelf}) => setSelf('INIT'), ({setSelf}) => setSelf()],
    });
    expect(getValue(myAtom)).toEqual(undefined);
  });

  testRecoil('init on set', () => {
    let inited = 0;
    const myAtom = atom({
      key: 'atom effect - init on set',
      default: 'DEFAULT',
      effects: [
        ({setSelf, trigger}) => {
          inited++;
          setSelf('INIT');
          expect(trigger).toEqual('set');
        },
      ],
    });
    set(myAtom, 'SET');
    expect(getValue(myAtom)).toEqual('SET');
    expect(inited).toEqual(1);
    reset(myAtom);
    expect(getValue(myAtom)).toEqual('DEFAULT');
    expect(inited).toEqual(1);
  });

  testRecoil('async set', () => {
    let setAtom, resetAtom;
    let effectRan = false;

    const myAtom = atom({
      key: 'atom effect init set',
      default: 'DEFAULT',
      effects: [
        ({setSelf, resetSelf}) => {
          setAtom = setSelf;
          resetAtom = resetSelf;
          setSelf(x => {
            expect(x).toEqual(effectRan ? 'INIT' : 'DEFAULT');
            effectRan = true;
            return 'INIT';
          });
        },
      ],
    });

    const c = renderElements(<ReadsAtom atom={myAtom} />);

    expect(c.textContent).toEqual('"INIT"');

    // Test async set
    act(() =>
      setAtom(value => {
        expect(value).toEqual('INIT');
        return 'SET';
      }),
    );
    expect(c.textContent).toEqual('"SET"');

    // Test async change
    act(() =>
      setAtom(value => {
        expect(value).toEqual('SET');
        return 'CHANGE';
      }),
    );
    expect(c.textContent).toEqual('"CHANGE"');

    // Test reset
    act(resetAtom);
    expect(c.textContent).toEqual('"DEFAULT"');

    // Test setting to undefined
    act(() =>
      setAtom(value => {
        expect(value).toEqual('DEFAULT');
        return undefined;
      }),
    );
    expect(c.textContent).toEqual('');
  });

  testRecoil('set promise', async () => {
    let resolveAtom;
    let validated;
    const onSetForSameEffect = jest.fn(() => {});
    const myAtom = atom({
      key: 'atom effect init set promise',
      default: 'DEFAULT',
      effects: [
        ({setSelf, onSet}) => {
          setSelf(
            new Promise(resolve => {
              resolveAtom = resolve;
            }),
          );
          onSet(onSetForSameEffect);
        },
        ({onSet}) => {
          onSet(value => {
            expect(value).toEqual('RESOLVE');
            validated = true;
          });
        },
      ],
    });

    const c = renderElements(<ReadsAtom atom={myAtom} />);
    expect(c.textContent).toEqual('loading');

    act(() => resolveAtom?.('RESOLVE'));
    await flushPromisesAndTimers();
    act(() => undefined);
    expect(c.textContent).toEqual('"RESOLVE"');
    expect(validated).toEqual(true);

    // onSet() should not be called for this hook's setSelf()
    expect(onSetForSameEffect).toHaveBeenCalledTimes(0);
  });

  testRecoil('set default promise', async () => {
    let setValue = 'RESOLVE_DEFAULT';
    const onSetHandler = jest.fn(newValue => {
      expect(newValue).toBe(setValue);
    });

    let resolveDefault;
    const myAtom = atom({
      key: 'atom effect default promise',
      default: new Promise(resolve => {
        resolveDefault = resolve;
      }),
      effects: [
        ({onSet}) => {
          onSet(onSetHandler);
        },
      ],
    });

    const [ReadsWritesAtom, setAtom, resetAtom] =
      componentThatReadsAndWritesAtom(myAtom);
    const c = renderElements(<ReadsWritesAtom />);
    expect(c.textContent).toEqual('loading');

    act(() => resolveDefault?.('RESOLVE_DEFAULT'));
    await flushPromisesAndTimers();
    expect(c.textContent).toEqual('"RESOLVE_DEFAULT"');
    expect(onSetHandler).toHaveBeenCalledTimes(1);

    setValue = 'SET';
    act(() => setAtom('SET'));
    expect(c.textContent).toEqual('"SET"');
    expect(onSetHandler).toHaveBeenCalledTimes(2);

    setValue = 'RESOLVE_DEFAULT';
    act(resetAtom);
    expect(c.textContent).toEqual('"RESOLVE_DEFAULT"');
    expect(onSetHandler).toHaveBeenCalledTimes(3);
  });

  testRecoil(
    'when setSelf is called in onSet, then onSet is not triggered again',
    () => {
      let set1 = false;
      const valueToSet1 = 'value#1';
      const transformedBySetSelf = 'transformed after value#1';

      const myAtom = atom({
        key: 'atom setSelf with set-updater',
        default: 'DEFAULT',
        effects: [
          ({setSelf, onSet}) => {
            onSet(newValue => {
              expect(set1).toBe(false);
              if (newValue === valueToSet1) {
                setSelf(transformedBySetSelf);
                set1 = true;
              }
            });
          },
        ],
      });

      const [ReadsWritesAtom, setAtom] =
        componentThatReadsAndWritesAtom(myAtom);

      const c = renderElements(<ReadsWritesAtom />);
      expect(c.textContent).toEqual('"DEFAULT"');
      act(() => setAtom(valueToSet1));
      expect(c.textContent).toEqual(`"${transformedBySetSelf}"`);
    },
  );

  // NOTE: This test throws an expected error
  testRecoil('reject promise', async () => {
    let rejectAtom;
    let validated = false;
    const myAtom = atom({
      key: 'atom effect init reject promise',
      default: 'DEFAULT',
      effects: [
        ({setSelf, onSet}) => {
          setSelf(
            new Promise((_resolve, reject) => {
              rejectAtom = reject;
            }),
          );
          onSet(() => {
            validated = true;
          });
        },
      ],
    });

    const c = renderElements(<ReadsAtom atom={myAtom} />);
    expect(c.textContent).toEqual('loading');

    act(() => rejectAtom?.(new Error('REJECT')));
    await flushPromisesAndTimers();
    act(() => undefined);
    expect(c.textContent).toEqual('error');
    expect(validated).toEqual(false);
  });

  testRecoil('overwrite promise', async () => {
    let resolveAtom;
    let validated;
    const myAtom = atom({
      key: 'atom effect init overwrite promise',
      default: 'DEFAULT',
      effects: [
        ({setSelf, onSet}) => {
          setSelf(
            new Promise(resolve => {
              resolveAtom = resolve;
            }),
          );
          onSet(value => {
            expect(value).toEqual('OVERWRITE');
            validated = true;
          });
        },
      ],
    });

    const [ReadsWritesAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);
    const c = renderElements(<ReadsWritesAtom />);
    expect(c.textContent).toEqual('loading');

    act(() => setAtom('OVERWRITE'));
    await flushPromisesAndTimers();
    expect(c.textContent).toEqual('"OVERWRITE"');

    // Resolving after atom is set to another value will be ignored.
    act(() => resolveAtom?.('RESOLVE'));
    await flushPromisesAndTimers();
    expect(c.textContent).toEqual('"OVERWRITE"');
    expect(validated).toEqual(true);
  });

  testRecoil('abort promise init', async () => {
    let resolveAtom;
    let validated;
    const myAtom = atom({
      key: 'atom effect abort promise init',
      default: 'DEFAULT',
      effects: [
        ({setSelf, onSet}) => {
          setSelf(
            new Promise(resolve => {
              resolveAtom = resolve;
            }),
          );
          onSet(value => {
            expect(value).toBe('DEFAULT');
            validated = true;
          });
        },
      ],
    });

    const c = renderElements(<ReadsAtom atom={myAtom} />);
    expect(c.textContent).toEqual('loading');

    act(() => resolveAtom?.(new DefaultValue()));
    await flushPromisesAndTimers();
    act(() => undefined);
    expect(c.textContent).toEqual('"DEFAULT"');
    expect(validated).toEqual(true);
  });

  testRecoil('once per root', ({strictMode, concurrentMode}) => {
    let inited = 0;
    const myAtom = atom({
      key: 'atom effect once per root',
      default: 'DEFAULT',
      effects: [
        ({setSelf}) => {
          inited++;
          setSelf('INIT');
        },
      ],
    });

    const [ReadsWritesAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);

    // effect is called once per <RecoilRoot>
    const c1 = renderElements(<ReadsWritesAtom />);
    const c2 = renderElements(<ReadsAtom atom={myAtom} />);

    expect(c1.textContent).toEqual('"INIT"');
    expect(c2.textContent).toEqual('"INIT"');

    act(() => setAtom('SET'));

    expect(c1.textContent).toEqual('"SET"');
    expect(c2.textContent).toEqual('"INIT"');

    expect(inited).toEqual(strictMode && concurrentMode ? 4 : 2);
  });

  testRecoil('onSet', () => {
    const oldSets = {a: 0, b: 0};
    const newSets = {a: 0, b: 0};
    const observer = key => (newValue, oldValue, isReset) => {
      expect(oldValue).toEqual(oldSets[key]);
      expect(newValue).toEqual(newSets[key]);
      expect(isReset).toEqual(newValue === 0);
      oldSets[key] = newValue;
    };

    const atomA = atom({
      key: 'atom effect onSet A',
      default: 0,
      effects: [({onSet}) => onSet(observer('a'))],
    });

    const atomB = atom({
      key: 'atom effect onSet B',
      default: 0,
      effects: [({onSet}) => onSet(observer('b'))],
    });

    const [AtomA, setA, resetA] = componentThatReadsAndWritesAtom(atomA);
    const [AtomB, setB] = componentThatReadsAndWritesAtom(atomB);
    const c = renderElements(
      <>
        <AtomA />
        <AtomB />
      </>,
    );
    expect(oldSets).toEqual({a: 0, b: 0});
    expect(c.textContent).toEqual('00');

    newSets.a = 1;
    act(() => setA(1));
    expect(c.textContent).toEqual('10');

    newSets.a = 2;
    act(() => setA(2));
    expect(c.textContent).toEqual('20');

    newSets.b = 1;
    act(() => setB(1));
    expect(c.textContent).toEqual('21');

    newSets.a = 0;
    act(() => resetA());
    expect(c.textContent).toEqual('01');
  });

  testRecoil('onSet ordering', () => {
    let set1 = false;
    let set2 = false;
    let globalObserver = false;

    const myAtom = atom({
      key: 'atom effect onSet ordering',
      default: 'DEFAULT',
      effects: [
        ({onSet}) => {
          onSet(() => {
            expect(set2).toBe(false);
            set1 = true;
          });
          onSet(() => {
            expect(set1).toBe(true);
            set2 = true;
          });
        },
      ],
    });

    function TransactionObserver({callback}) {
      useRecoilTransactionObserver(callback);
      return null;
    }

    const [AtomA, setA] = componentThatReadsAndWritesAtom(myAtom);
    const c = renderElements(
      <>
        <AtomA />
        <TransactionObserver
          callback={() => {
            expect(set1).toBe(true);
            expect(set2).toBe(true);
            globalObserver = true;
          }}
        />
      </>,
    );

    expect(set1).toEqual(false);
    expect(set2).toEqual(false);
    act(() => setA(1));
    expect(set1).toEqual(true);
    expect(set2).toEqual(true);
    expect(globalObserver).toEqual(true);
    expect(c.textContent).toEqual('1');
  });

  testRecoil('onSet History', () => {
    const history: Array<() => void> = []; // Array of undo functions

    function historyEffect({setSelf, onSet}) {
      onSet((_, oldValue) => {
        history.push(() => {
          setSelf(oldValue);
        });
      });
    }

    const atomA = atom({
      key: 'atom effect onSte history A',
      default: 'DEFAULT_A',
      effects: [historyEffect],
    });
    const atomB = atom({
      key: 'atom effect onSte history B',
      default: 'DEFAULT_B',
      effects: [historyEffect],
    });

    const [AtomA, setA, resetA] = componentThatReadsAndWritesAtom(atomA);
    const [AtomB, setB] = componentThatReadsAndWritesAtom(atomB);
    const c = renderElements(
      <>
        <AtomA />
        <AtomB />
      </>,
    );

    expect(c.textContent).toEqual('"DEFAULT_A""DEFAULT_B"');
    act(() => setA('SET_A'));
    expect(c.textContent).toEqual('"SET_A""DEFAULT_B"');
    act(() => setB('SET_B'));
    expect(c.textContent).toEqual('"SET_A""SET_B"');
    act(() => setB('CHANGE_B'));
    expect(c.textContent).toEqual('"SET_A""CHANGE_B"');
    act(resetA);
    expect(c.textContent).toEqual('"DEFAULT_A""CHANGE_B"');

    expect(history.length).toEqual(4);

    act(() => history.pop()());
    expect(c.textContent).toEqual('"SET_A""CHANGE_B"');
    act(() => history.pop()());
    expect(c.textContent).toEqual('"SET_A""SET_B"');
    act(() => history.pop()());
    expect(c.textContent).toEqual('"SET_A""DEFAULT_B"');
    act(() => history.pop()());
    expect(c.textContent).toEqual('"DEFAULT_A""DEFAULT_B"');
  });

  testRecoil('Cleanup Handlers - when root unmounted', () => {
    const refCountsA = [0, 0];
    const refCountsB = [0, 0];

    const atomA = atom({
      key: 'atom effect cleanup - A',
      default: 'A',
      effects: [
        () => {
          refCountsA[0]++;
          return () => {
            refCountsA[0]--;
          };
        },
        () => {
          refCountsA[1]++;
          return () => {
            refCountsA[1]--;
          };
        },
      ],
    });

    const atomB = atom({
      key: 'atom effect cleanup - B',
      default: 'B',
      effects: [
        () => {
          refCountsB[0]++;
          return () => {
            refCountsB[0]--;
          };
        },
        () => {
          refCountsB[1]++;
          return () => {
            refCountsB[1]--;
          };
        },
      ],
    });

    let setNumRoots;
    function App() {
      const [numRoots, _setNumRoots] = useState(0);
      setNumRoots = _setNumRoots;
      return (
        <div>
          {Array(numRoots)
            .fill(null)
            .map((_, idx) => (
              <RecoilRoot key={idx}>
                <ReadsAtom atom={atomA} />
                <ReadsAtom atom={atomB} />
              </RecoilRoot>
            ))}
        </div>
      );
    }

    const c = renderElements(<App />);

    expect(c.textContent).toBe('');
    expect(refCountsA).toEqual([0, 0]);
    expect(refCountsB).toEqual([0, 0]);

    act(() => setNumRoots(1));
    expect(c.textContent).toBe('"A""B"');
    expect(refCountsA).toEqual([1, 1]);
    expect(refCountsB).toEqual([1, 1]);

    act(() => setNumRoots(2));
    expect(c.textContent).toBe('"A""B""A""B"');
    expect(refCountsA).toEqual([2, 2]);
    expect(refCountsB).toEqual([2, 2]);

    act(() => setNumRoots(1));
    expect(c.textContent).toBe('"A""B"');
    expect(refCountsA).toEqual([1, 1]);
    expect(refCountsB).toEqual([1, 1]);

    act(() => setNumRoots(0));
    expect(c.textContent).toBe('');
    expect(refCountsA).toEqual([0, 0]);
    expect(refCountsB).toEqual([0, 0]);

    act(() => setNumRoots(1));
    expect(c.textContent).toBe('"A""B"');
    expect(refCountsA).toEqual([1, 1]);
    expect(refCountsB).toEqual([1, 1]);

    act(() => setNumRoots(0));
    expect(c.textContent).toBe('');
    expect(refCountsA).toEqual([0, 0]);
    expect(refCountsB).toEqual([0, 0]);
  });

  testRecoil('onSet unsubscribes', () => {
    let onSetRan = 0;
    const myAtom = atom({
      key: 'atom effects onSet unsubscribe',
      default: 'DEFAULT',
      effects: [
        ({onSet}) => {
          onSet(() => {
            onSetRan++;
          });
        },
      ],
    });

    let setMount = _ => {
      throw new Error('Test Error');
    };
    const [ReadWriteAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);
    function Component() {
      const [mount, setState] = useState(false);
      setMount = setState;
      return mount ? (
        <RecoilRoot>
          <ReadWriteAtom />
        </RecoilRoot>
      ) : (
        'UNMOUNTED'
      );
    }

    const c = renderElements(<Component />);
    expect(c.textContent).toBe('UNMOUNTED');
    expect(onSetRan).toBe(0);

    act(() => setMount(true));
    expect(c.textContent).toBe('"DEFAULT"');
    expect(onSetRan).toBe(0);

    act(() => setAtom('SET'));
    expect(c.textContent).toBe('"SET"');
    expect(onSetRan).toBe(1);

    act(() => setMount(false));
    expect(c.textContent).toBe('UNMOUNTED');
    expect(onSetRan).toBe(1);

    // onSet() handler not called after store is unmounted and effects cleanedup
    act(() => setAtom('SET INVALID'));
    expect(c.textContent).toBe('UNMOUNTED');
    expect(onSetRan).toBe(1);

    act(() => setMount(true));
    expect(c.textContent).toBe('"DEFAULT"');
    expect(onSetRan).toBe(1);

    act(() => setAtom('SET2'));
    expect(c.textContent).toBe('"SET2"');
    expect(onSetRan).toBe(2);
  });

  // Test that effects can initialize state when an atom is first used after an
  // action that also updated another atom's state.
  // This corner case was reported by multiple customers.
  testRecoil('initialize concurrent with state update', () => {
    const myAtom = atom({
      key: 'atom effect - concurrent update',
      default: 'DEFAULT',
      effects: [({setSelf}) => setSelf('INIT')],
    });
    const otherAtom = atom({
      key: 'atom effect - concurrent update / other atom',
      default: 'OTHER_DEFAULT',
    });

    const [OtherAtom, setOtherAtom] =
      componentThatReadsAndWritesAtom(otherAtom);

    function NewPage() {
      return <ReadsAtom atom={myAtom} />;
    }

    let renderPage;
    function App() {
      const [showPage, setShowPage] = useState(false);
      renderPage = () => setShowPage(true);
      return (
        <>
          <OtherAtom />
          {showPage && <NewPage />}
        </>
      );
    }

    const c = renderElements(<App />);

    // <NewPage> is not yet rendered
    expect(c.textContent).toEqual('"OTHER_DEFAULT"');

    // Render <NewPage> which initializes myAtom via effect while also
    // updating an unrelated atom.
    act(() => {
      renderPage();
      setOtherAtom('OTHER');
    });
    expect(c.textContent).toEqual('"OTHER""INIT"');
  });

  /**
   * See github issue #1107 item #1
   */
  testRecoil(
    'atom effect runs twice when selector that depends on that atom is read from a snapshot and the atom is read for first time in that snapshot',
    ({strictMode, concurrentMode}) => {
      let numTimesEffectInit = 0;
      let latestSetSelf = a => a;

      const atomWithEffect = atom({
        key: 'atomWithEffect',
        default: 0,
        effects: [
          ({setSelf}) => {
            latestSetSelf = setSelf;

            setSelf(1); // to accurately reproduce minimal reproducible example based on GitHub issue

            numTimesEffectInit++;
          },
        ],
      });

      const selThatDependsOnAtom = selector({
        key: 'selThatDependsOnAtom',
        get: ({get}) => get(atomWithEffect),
      });

      const Component = () => {
        const readSelFromSnapshot = useRecoilCallback(({snapshot}) => () => {
          snapshot.getLoadable(selThatDependsOnAtom);
        });

        readSelFromSnapshot(); // first initialization;

        return useRecoilValue(selThatDependsOnAtom); // second initialization;
      };

      const c = renderElements(<Component />);
      expect(c.textContent).toBe('1');
      expect(numTimesEffectInit).toBe(strictMode && concurrentMode ? 3 : 2);

      act(() => latestSetSelf(100));
      expect(c.textContent).toBe('100');
      expect(numTimesEffectInit).toBe(strictMode && concurrentMode ? 3 : 2);

      act(() => latestSetSelf(200));
      expect(c.textContent).toBe('200');
      expect(numTimesEffectInit).toBe(strictMode && concurrentMode ? 3 : 2);
    },
  );

  describe('Other Atoms', () => {
    testRecoil('init from other atom', () => {
      const myAtom = atom({
        key: 'atom effect - init from other atom',
        default: 'DEFAULT',
        effects: [
          ({node, setSelf, getLoadable, getInfo_UNSTABLE}) => {
            const otherValue = getLoadable(otherAtom).contents;
            expect(otherValue).toEqual('OTHER');
            expect(getInfo_UNSTABLE(node).isSet).toBe(false);
            expect(getInfo_UNSTABLE(otherAtom).isSet).toBe(false);
            expect(getInfo_UNSTABLE(otherAtom).loadable?.contents).toBe(
              'OTHER',
            );
            setSelf(otherValue);
          },
        ],
      });

      const otherAtom = atom({
        key: 'atom effect - other atom',
        default: 'OTHER',
      });

      expect(getValue(myAtom)).toEqual('OTHER');
    });

    testRecoil('init from other atom async', async () => {
      const myAtom = atom({
        key: 'atom effect - init from other atom async',
        default: 'DEFAULT',
        effects: [
          ({setSelf, getPromise}) => {
            const otherValue = getPromise(otherAtom);
            setSelf(otherValue);
          },
        ],
      });

      const otherAtom = atom({
        key: 'atom effect - other atom async',
        default: Promise.resolve('OTHER'),
      });

      await expect(
        getRecoilStateLoadable(myAtom).promiseOrThrow(),
      ).resolves.toEqual('OTHER');
    });

    testRecoil('async get other atoms', async () => {
      let initTest1 = null;
      let initTest2 = null;
      let initTest3 = null;
      let initTest4 = null;
      let initTest5 = null;
      let initTest6 = null;
      let setTest = null;

      // StrictMode will render twice
      let firstRender = true;

      const myAtom = atom({
        key: 'atom effect - async get',
        default: 'DEFAULT',
        effects: [
          // Test we can get default values
          ({node, getLoadable, getPromise, getInfo_UNSTABLE}) => {
            expect(getLoadable(node).contents).toEqual(
              firstRender ? 'DEFAULT' : 'INIT',
            );
            expect(getInfo_UNSTABLE(node).isSet).toBe(!firstRender);
            expect(getInfo_UNSTABLE(node).loadable?.contents).toBe(
              firstRender ? 'DEFAULT' : 'INIT',
            );
            // eslint-disable-next-line jest/valid-expect
            initTest1 = expect(getPromise(asyncAtom)).resolves.toEqual('ASYNC');
          },
          ({setSelf}) => {
            setSelf('INIT');
          },
          // Test we can get value from previous initialization
          ({node, getLoadable, getInfo_UNSTABLE}) => {
            expect(getLoadable(node).contents).toEqual('INIT');
            expect(getInfo_UNSTABLE(node).isSet).toBe(true);
            expect(getInfo_UNSTABLE(node).loadable?.contents).toBe('INIT');
          },
          // Test we can asynchronously get "current" values of both self and other atoms
          // This will be executed when myAtom is set, but checks both atoms.
          ({onSet, getLoadable, getPromise, getInfo_UNSTABLE}) => {
            onSet(x => {
              expect(x).toEqual('SET_ATOM');
              expect(getLoadable(myAtom).contents).toEqual(x);
              expect(getInfo_UNSTABLE(myAtom).isSet).toBe(true);
              expect(getInfo_UNSTABLE(myAtom).loadable?.contents).toBe(
                'SET_ATOM',
              );
              // eslint-disable-next-line jest/valid-expect
              setTest = expect(getPromise(asyncAtom)).resolves.toEqual(
                'SET_OTHER',
              );
            });
          },
          () => {
            firstRender = false;
          },
        ],
      });

      const asyncAtom = atom({
        key: 'atom effect - other atom async get',
        default: Promise.resolve('ASYNC_DEFAULT'),
        effects: [
          ({setSelf}) => void setSelf(Promise.resolve('ASYNC')),
          ({getPromise, getInfo_UNSTABLE}) => {
            expect(getInfo_UNSTABLE(asyncAtom).isSet).toBe(true);
            // eslint-disable-next-line jest/valid-expect
            initTest2 = expect(
              getInfo_UNSTABLE(asyncAtom).loadable?.toPromise(),
            ).resolves.toBe('ASYNC');
            // eslint-disable-next-line jest/valid-expect
            initTest3 = expect(getPromise(asyncAtom)).resolves.toEqual('ASYNC');
          },

          // Test that we can read default for an aborted initialization
          ({setSelf}) => void setSelf(Promise.resolve(new DefaultValue())),
          ({getPromise, getInfo_UNSTABLE}) => {
            expect(getInfo_UNSTABLE(asyncAtom).isSet).toBe(true); // TODO sketchy...
            // eslint-disable-next-line jest/valid-expect
            initTest4 = expect(
              getInfo_UNSTABLE(asyncAtom).loadable?.toPromise(),
            ).resolves.toBe('ASYNC_DEFAULT');
            // eslint-disable-next-line jest/valid-expect
            initTest5 = expect(getPromise(asyncAtom)).resolves.toEqual(
              'ASYNC_DEFAULT',
            );
          },

          // Test initializing to async value and other atom can read it
          ({setSelf}) => void setSelf(Promise.resolve('ASYNC')),

          // Test we can also read it ourselves
          ({getInfo_UNSTABLE}) => {
            expect(getInfo_UNSTABLE(asyncAtom).isSet).toBe(true);
            // eslint-disable-next-line jest/valid-expect
            initTest6 = expect(
              getInfo_UNSTABLE(asyncAtom).loadable?.toPromise(),
            ).resolves.toBe('ASYNC');
          },
        ],
      });

      const [MyAtom, setMyAtom] = componentThatReadsAndWritesAtom(myAtom);
      const [AsyncAtom, setAsyncAtom] =
        componentThatReadsAndWritesAtom(asyncAtom);
      const c = renderElements(
        <>
          <MyAtom />
          <AsyncAtom />
        </>,
      );

      await flushPromisesAndTimers();
      expect(c.textContent).toBe('"INIT""ASYNC"');
      expect(initTest1).not.toBe(null);
      await initTest1;
      expect(initTest2).not.toBe(null);
      await initTest2;
      expect(initTest3).not.toBe(null);
      await initTest3;
      expect(initTest4).not.toBe(null);
      await initTest4;
      expect(initTest5).not.toBe(null);
      await initTest5;
      expect(initTest6).not.toBe(null);
      await initTest6;

      act(() => setAsyncAtom('SET_OTHER'));
      act(() => setMyAtom('SET_ATOM'));
      expect(setTest).not.toBe(null);
      await setTest;
    });
  });

  testRecoil('storeID matches <RecoilRoot>', async () => {
    let effectStoreID;
    const myAtom = atom({
      key: 'atom effect - storeID',
      default: 'DEFAULT',
      effects: [
        ({storeID, setSelf}) => {
          effectStoreID = storeID;
          setSelf('INIT');
        },
      ],
    });

    let rootStoreID;
    function StoreID() {
      rootStoreID = useRecoilStoreID();
      return null;
    }

    const c = renderElements(
      <div>
        <StoreID />
        <ReadsAtom atom={myAtom} />
      </div>,
    );

    expect(c.textContent).toEqual('"INIT"');
    expect(effectStoreID).not.toEqual(undefined);
    expect(effectStoreID).toEqual(rootStoreID);
  });
});

testRecoil('object is frozen when stored in atom', async () => {
  const devStatus = window.__DEV__;
  window.__DEV__ = true;

  const anAtom = atom<{x: mixed, ...}>({key: 'atom frozen', default: {x: 0}});

  function valueAfterSettingInAtom<T>(value: T): T {
    act(() => set(anAtom, value));
    return value;
  }

  function isFrozen(value, getter = x => x) {
    const object = valueAfterSettingInAtom({x: value});
    return Object.isFrozen(getter(object.x));
  }

  expect(isFrozen({y: 0})).toBe(true);

  // React elements are not deep-frozen (they are already shallow-frozen on creation):
  const element = {
    ...(<div />),
    _owner: {ifThisWereAReactFiberItShouldNotBeFrozen: true},
  };
  expect(isFrozen(element, x => (x: any)._owner)).toBe(false); // flowlint-line unclear-type:off

  // Immutable stuff is not frozen:
  expect(isFrozen(immutable.List())).toBe(false);
  expect(isFrozen(immutable.Map())).toBe(false);
  expect(isFrozen(immutable.OrderedMap())).toBe(false);
  expect(isFrozen(immutable.Set())).toBe(false);
  expect(isFrozen(immutable.OrderedSet())).toBe(false);
  expect(isFrozen(immutable.Seq())).toBe(false);
  expect(isFrozen(immutable.Stack())).toBe(false);
  expect(isFrozen(immutable.Range())).toBe(false);
  expect(isFrozen(immutable.Repeat())).toBe(false);
  expect(isFrozen(new (immutable.Record({}))())).toBe(false);

  // Default values are frozen
  const defaultFrozenAtom = atom({
    key: 'atom frozen default',
    default: {state: 'frozen', nested: {state: 'frozen'}},
  });
  expect(Object.isFrozen(getValue(defaultFrozenAtom))).toBe(true);
  expect(Object.isFrozen(getValue(defaultFrozenAtom).nested)).toBe(true);

  // Async Default values are frozen
  const defaultFrozenAsyncAtom = atom({
    key: 'atom frozen default async',
    default: Promise.resolve({state: 'frozen', nested: {state: 'frozen'}}),
  });
  await expect(
    getRecoilStatePromise(defaultFrozenAsyncAtom).then(x => Object.isFrozen(x)),
  ).resolves.toBe(true);
  expect(Object.isFrozen(getValue(defaultFrozenAsyncAtom).nested)).toBe(true);

  // Initialized values are frozen
  const initializedValueInAtom = atom({
    key: 'atom frozen initialized',
    default: {nested: 'DEFAULT'},
    effects: [
      ({setSelf}) => setSelf({state: 'frozen', nested: {state: 'frozen'}}),
    ],
  });
  expect(Object.isFrozen(getValue(initializedValueInAtom))).toBe(true);
  expect(Object.isFrozen(getValue(initializedValueInAtom).nested)).toBe(true);

  // Async Initialized values are frozen
  const initializedAsyncValueInAtom = atom<{state: string, nested: {...}, ...}>(
    {
      key: 'atom frozen initialized async',
      default: {state: 'DEFAULT', nested: {state: 'DEFAULT'}},
      effects: [
        ({setSelf}) =>
          setSelf(
            Promise.resolve({state: 'frozen', nested: {state: 'frozen'}}),
          ),
      ],
    },
  );
  await expect(
    getRecoilStatePromise(initializedAsyncValueInAtom).then(x =>
      Object.isFrozen(x),
    ),
  ).resolves.toBe(true);
  expect(Object.isFrozen(getValue(initializedAsyncValueInAtom).nested)).toBe(
    true,
  );
  expect(getValue(initializedAsyncValueInAtom).nested).toEqual({
    state: 'frozen',
  });

  // dangerouslyAllowMutability
  const thawedAtom = atom({
    key: 'atom frozen thawed',
    default: {state: 'thawed', nested: {state: 'thawed'}},
    dangerouslyAllowMutability: true,
  });
  expect(Object.isFrozen(getValue(thawedAtom))).toBe(false);
  expect(Object.isFrozen(getValue(thawedAtom).nested)).toBe(false);

  window.__DEV__ = devStatus;
});

testRecoil('Required options are provided when creating atoms', () => {
  const devStatus = window.__DEV__;
  window.__DEV__ = true;

  // $FlowExpectedError[prop-missing]
  expect(() => atom({default: undefined})).toThrow();
  // $FlowExpectedError[prop-missing]
  expect(() => atom({key: 'MISSING DEFAULT'})).toThrow();

  window.__DEV__ = devStatus;
});
