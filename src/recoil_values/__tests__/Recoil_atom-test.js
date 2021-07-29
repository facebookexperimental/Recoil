/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const {getRecoilTestFn} = require('../../testing/Recoil_TestingUtils');

let React,
  useState,
  Profiler,
  ReactDOM,
  act,
  DEFAULT_VALUE,
  DefaultValue,
  RecoilRoot,
  getRecoilValueAsLoadable,
  setRecoilValue,
  useRecoilState,
  useRecoilCallback,
  useRecoilValue,
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
  const {makeStore} = require('../../testing/Recoil_TestingUtils');

  React = require('react');
  ({useState, Profiler} = require('react'));
  ReactDOM = require('ReactDOMLegacy_DEPRECATED');
  ({act} = require('ReactTestUtils'));

  ({DEFAULT_VALUE, DefaultValue} = require('../../core/Recoil_Node'));
  ({RecoilRoot} = require('../../core/Recoil_RecoilRoot.react'));
  ({
    getRecoilValueAsLoadable,
    setRecoilValue,
  } = require('../../core/Recoil_RecoilValueInterface'));
  ({
    useRecoilState,
    useRecoilTransactionObserver,
    useResetRecoilState,
    useRecoilCallback,
    useRecoilValue,
  } = require('../../hooks/Recoil_Hooks'));
  ({
    ReadsAtom,
    componentThatReadsAndWritesAtom,
    flushPromisesAndTimers,
    renderElements,
  } = require('../../testing/Recoil_TestingUtils'));
  atom = require('../Recoil_atom');
  selector = require('../Recoil_selector');
  immutable = require('immutable');

  store = makeStore();
});

function get(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue).contents;
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
  expect(get(myAtom)).toBe('DEFAULT');
  act(() => set(myAtom, 'VALUE'));
  expect(get(myAtom)).toBe('VALUE');
});

describe('Valid values', () => {
  testRecoil('atom can store null and undefined', () => {
    const myAtom = atom<?string>({
      key: 'atom with default for null and undefined',
      default: 'DEFAULT',
    });
    expect(get(myAtom)).toBe('DEFAULT');
    act(() => set(myAtom, 'VALUE'));
    expect(get(myAtom)).toBe('VALUE');
    act(() => set(myAtom, null));
    expect(get(myAtom)).toBe(null);
    act(() => set(myAtom, undefined));
    expect(get(myAtom)).toBe(undefined);
    act(() => set(myAtom, 'VALUE'));
    expect(get(myAtom)).toBe('VALUE');
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
    expect(get(myAtom)).toBe(undefined);
    act(() => set(myAtom, circular));
    expect(get(myAtom)).toBe(circular);
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

    const [
      ReadsWritesAtom,
      setAtom,
      resetAtom,
    ] = componentThatReadsAndWritesAtom(myAtom);
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
  testRecoil('initialization', () => {
    let inited = false;
    const myAtom = atom({
      key: 'atom effect',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        ({node, trigger, setSelf}) => {
          inited = true;
          expect(trigger).toEqual('get');
          expect(node).toBe(myAtom);
          setSelf('INIT');
        },
      ],
    });
    expect(get(myAtom)).toEqual('INIT');
    expect(inited).toEqual(true);
  });

  testRecoil('async default', () => {
    let inited = false;
    const myAtom = atom<string>({
      key: 'atom effect async default',
      default: Promise.resolve('RESOLVE'),
      effects_UNSTABLE: [
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

    const [ReadsWritesAtom, _, reset] = componentThatReadsAndWritesAtom(myAtom);
    const c = renderElements(<ReadsWritesAtom />);
    expect(inited).toEqual(true);
    expect(c.textContent).toEqual('"INIT"');

    act(reset);
    expect(c.textContent).toEqual('loading');
    act(() => jest.runAllTimers());
    expect(c.textContent).toEqual('"RESOLVE"');
  });

  testRecoil('order of effects', () => {
    const myAtom = atom({
      key: 'atom effect order',
      default: 'DEFAULT',
      effects_UNSTABLE: [
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
    expect(get(myAtom)).toEqual('EFFECT 2');
  });

  testRecoil('reset during init', () => {
    const myAtom = atom({
      key: 'atom effect reset',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        ({setSelf}) => setSelf('INIT'),
        ({resetSelf}) => resetSelf(),
      ],
    });
    expect(get(myAtom)).toEqual('DEFAULT');
  });

  testRecoil('init to undefined', () => {
    const myAtom = atom({
      key: 'atom effect init undefined',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        ({setSelf}) => setSelf('INIT'),
        ({setSelf}) => setSelf(),
      ],
    });
    expect(get(myAtom)).toEqual(undefined);
  });

  testRecoil('init on set', () => {
    let inited = 0;
    const myAtom = atom({
      key: 'atom effect - init on set',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        ({setSelf, trigger}) => {
          inited++;
          setSelf('INIT');
          expect(trigger).toEqual('set');
        },
      ],
    });
    set(myAtom, 'SET');
    expect(get(myAtom)).toEqual('SET');
    expect(inited).toEqual(1);
    reset(myAtom);
    expect(get(myAtom)).toEqual('DEFAULT');
    expect(inited).toEqual(1);
  });

  testRecoil('async set', () => {
    let setAtom, resetAtom;

    const myAtom = atom({
      key: 'atom effect init set',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        ({setSelf, resetSelf}) => {
          setAtom = setSelf;
          resetAtom = resetSelf;
          setSelf(x => {
            expect(x).toEqual('DEFAULT');
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
      effects_UNSTABLE: [
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
      effects_UNSTABLE: [
        ({onSet}) => {
          onSet(onSetHandler);
        },
      ],
    });

    const [ReadsWritesAtom, set, reset] = componentThatReadsAndWritesAtom(
      myAtom,
    );
    const c = renderElements(<ReadsWritesAtom />);
    expect(c.textContent).toEqual('loading');

    act(() => resolveDefault?.('RESOLVE_DEFAULT'));
    await flushPromisesAndTimers();
    expect(c.textContent).toEqual('"RESOLVE_DEFAULT"');
    expect(onSetHandler).toHaveBeenCalledTimes(1);

    setValue = 'SET';
    act(() => set('SET'));
    expect(c.textContent).toEqual('"SET"');
    expect(onSetHandler).toHaveBeenCalledTimes(2);

    setValue = 'RESOLVE_DEFAULT';
    act(reset);
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
        effects_UNSTABLE: [
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

      const [ReadsWritesAtom, set] = componentThatReadsAndWritesAtom(myAtom);

      const c = renderElements(<ReadsWritesAtom />);
      expect(c.textContent).toEqual('"DEFAULT"');
      act(() => set(valueToSet1));
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
      effects_UNSTABLE: [
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
      effects_UNSTABLE: [
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
      effects_UNSTABLE: [
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

  testRecoil('once per root', () => {
    let inited = 0;
    const myAtom = atom({
      key: 'atom effect once per root',
      default: 'DEFAULT',
      effects_UNSTABLE: [
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

    expect(inited).toEqual(2);
  });

  testRecoil('onSet', () => {
    const sets = {a: 0, b: 0};
    const observer = key => (newValue, oldValue) => {
      expect(oldValue).toEqual(sets[key]);
      sets[key]++;
      expect(newValue).toEqual(sets[key]);
    };

    const atomA = atom({
      key: 'atom effect onSet A',
      default: 0,
      effects_UNSTABLE: [({onSet}) => onSet(observer('a'))],
    });

    const atomB = atom({
      key: 'atom effect onSet B',
      default: 0,
      effects_UNSTABLE: [({onSet}) => onSet(observer('b'))],
    });

    expect(sets).toEqual({a: 0, b: 0});

    const [AtomA, setA] = componentThatReadsAndWritesAtom(atomA);
    const [AtomB, setB] = componentThatReadsAndWritesAtom(atomB);
    const c = renderElements(
      <>
        <AtomA />
        <AtomB />
      </>,
    );

    act(() => setA(1));
    expect(sets).toEqual({a: 1, b: 0});

    act(() => setA(2));
    expect(sets).toEqual({a: 2, b: 0});

    act(() => setB(1));
    expect(sets).toEqual({a: 2, b: 1});
    expect(c.textContent).toEqual('21');
  });

  testRecoil('onSet ordering', () => {
    let set1 = false;
    let set2 = false;
    let globalObserver = false;

    const myAtom = atom({
      key: 'atom effect onSet ordering',
      default: 'DEFAULT',
      effects_UNSTABLE: [
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
      effects_UNSTABLE: [historyEffect],
    });
    const atomB = atom({
      key: 'atom effect onSte history B',
      default: 'DEFAULT_B',
      effects_UNSTABLE: [historyEffect],
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
      effects_UNSTABLE: [
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
      effects_UNSTABLE: [
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

    const c = document.createElement('div');
    act(() => {
      ReactDOM.render(<App />, c);
    });

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
  });

  // Test that effects can initialize state when an atom is first used after an
  // action that also updated another atom's state.
  // This corner case was reported by multiple customers.
  testRecoil('initialze concurrent with state update', () => {
    const myAtom = atom({
      key: 'atom effect - concurrent update',
      default: 'DEFAULT',
      effects_UNSTABLE: [({setSelf}) => setSelf('INIT')],
    });
    const otherAtom = atom({
      key: 'atom effect - concurrent update / other atom',
      default: 'OTHER_DEFAULT',
    });

    const [OtherAtom, setOtherAtom] = componentThatReadsAndWritesAtom(
      otherAtom,
    );

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
    () => {
      let numTimesEffectInit = 0;
      let latestSetSelf = a => a;

      const atomWithEffect = atom({
        key: 'atomWithEffect',
        default: 0,
        effects_UNSTABLE: [
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

        const val = useRecoilValue(selThatDependsOnAtom); // second initialization;

        return val;
      };

      const c = renderElements(<Component />);

      expect(c.textContent).toBe('1');

      act(() => latestSetSelf(100));

      expect(c.textContent).toBe('100');

      expect(numTimesEffectInit).toBe(2);
    },
  );
});

testRecoil('object is frozen when stored in atom', () => {
  const anAtom = atom<{x: mixed, ...}>({key: 'anAtom', default: {x: 0}});

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
});
