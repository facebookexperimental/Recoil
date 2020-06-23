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
const {act} = require('ReactTestUtils');

const {DEFAULT_VALUE} = require('../../core/Recoil_Node');
const {
  getRecoilValueAsLoadable,
  setRecoilValue,
} = require('../../core/Recoil_RecoilValueInterface');
const {
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  makeStore,
  renderElements,
} = require('../../testing/Recoil_TestingUtils');
const atom = require('../Recoil_atom');

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

  test('init from other atom', () => {
    const myAtom = atom({
      key: 'atom effect - init from other atom',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        ({setSelf, getSnapshot}) => {
          const snapshot = getSnapshot();
          const otherValue = snapshot.getLoadable(otherAtom).contents;
          expect(otherValue).toEqual('OTHER');
          setSelf(otherValue);
        },
      ],
    });

    const otherAtom = atom({
      key: 'atom effect - other atom',
      default: 'OTHER',
    });

    expect(get(myAtom)).toEqual('OTHER');
  });

  test('async set', async () => {
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

  test('once per root', async () => {
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
});
