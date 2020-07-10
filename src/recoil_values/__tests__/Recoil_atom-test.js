/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {Store} from 'Recoil_State';

const React = require('React');
const {useEffect} = require('React');
const {act} = require('ReactTestUtils');

const {DEFAULT_VALUE, DefaultValue} = require('../../core/Recoil_Node');
const {
  getRecoilValueAsLoadable,
  setRecoilValue,
} = require('../../core/Recoil_RecoilValueInterface');
const {
  useRecoilState,
  useRecoilTransactionObserver,
  useResetRecoilState,
} = require('../../hooks/Recoil_Hooks');
const {
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers,
  makeStore,
  renderElements,
} = require('../../testing/Recoil_TestingUtils');
const atom = require('../Recoil_atom');
const immutable = require('immutable');

let store: Store;
beforeEach(() => {
  store = makeStore();
});

function get(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue).contents;
}

function set(recoilValue, value) {
  setRecoilValue(store, recoilValue, value);
}

function reset(recoilValue) {
  setRecoilValue(store, recoilValue, DEFAULT_VALUE);
}

test('atom can read and write value', () => {
  const myAtom = atom<string>({
    key: 'atom with default',
    default: 'DEFAULT',
  });
  expect(get(myAtom)).toBe('DEFAULT');
  act(() => set(myAtom, 'VALUE'));
  expect(get(myAtom)).toBe('VALUE');
});

describe('Valid values', () => {
  test('atom can store null and undefined', () => {
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

  test('atom can store a circular reference object', () => {
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

test("Updating with same value doesn't rerender", () => {
  const myAtom = atom({key: 'atom same value rerender', default: 'DEFAULT'});

  let setAtom;
  let resetAtom;
  let renders = 0;
  function AtomComponent() {
    useEffect(() => {
      renders++;
    });
    const [value, setValue] = useRecoilState(myAtom);
    const resetValue = useResetRecoilState(myAtom);
    setAtom = setValue;
    resetAtom = resetValue;
    return value;
  }
  expect(renders).toEqual(0);
  const c = renderElements(<AtomComponent />);

  expect(renders).toEqual(2);
  expect(c.textContent).toEqual('DEFAULT');

  act(() => setAtom('SET'));
  expect(renders).toEqual(3);
  expect(c.textContent).toEqual('SET');

  act(() => setAtom('SET'));
  expect(renders).toEqual(3);
  expect(c.textContent).toEqual('SET');

  act(() => setAtom('CHANGE'));
  expect(renders).toEqual(4);
  expect(c.textContent).toEqual('CHANGE');

  act(resetAtom);
  expect(renders).toEqual(5);
  expect(c.textContent).toEqual('DEFAULT');

  act(resetAtom);
  expect(renders).toEqual(5);
  expect(c.textContent).toEqual('DEFAULT');
});

describe('Effects', () => {
  test('effect', () => {
    let inited = false;
    const myAtom = atom({
      key: 'atom effect',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        ({node, trigger, setSelf}) => {
          inited = true;
          expect(trigger).toEqual('get');
          expect(node).toBe(myAtom);
          setSelf('EFFECT');
        },
      ],
    });
    expect(get(myAtom)).toEqual('EFFECT');
    expect(inited).toEqual(true);
  });

  test('order of effects', () => {
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

  test('reset during init', () => {
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

  test('init to undefined', () => {
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

  test('init on set', () => {
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

  test('async set', () => {
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

  test('set promise', async () => {
    let resolveAtom;
    let validated;
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
  });

  // NOTE: This test throws an expected error
  test('reject promise', async () => {
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

  test('overwrite promise', async () => {
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

  test('abort promise init', async () => {
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
            expect(value).toBeInstanceOf(DefaultValue);
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

  test('once per root', () => {
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

  test('onSet', () => {
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

  test('onSet ordering', () => {
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

  test('onSet History', () => {
    const history: Array<() => void> = []; // Array of undo functions

    function historyEffect({setSelf, onSet}) {
      let ignore = false;
      onSet((_, oldValue) => {
        if (ignore) {
          ignore = false;
          return;
        }
        history.push(() => {
          ignore = true;
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
});

test('object is frozen when stored in atom', () => {
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
