/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+obviz
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable, RecoilState, RecoilValue} from '../../Recoil_index';

const {atom, selector} = require('../../Recoil_index');
const {
  getRecoilValueAsLoadable,
  setRecoilValue,
} = require('../Recoil_RecoilValueInterface');
const {performance} = require('perf_hooks');
const {makeStore} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

const ITERATIONS = [1]; // Avoid iterating for automated testing
// const ITERATIONS = [2, 2];
// const ITERATIONS = [10, 100, 1000];
// const ITERATIONS = [10, 100, 1000, 10000];
// const ITERATIONS = [10, 100, 1000, 10000, 100000];

function testPerf(name: string, fn: number => void) {
  test.each(ITERATIONS)(name, iterations => {
    store = makeStore();
    const BEGIN = performance.now();
    fn(iterations);
    const END = performance.now();
    console.log(`${name}(${iterations})`, END - BEGIN);
  });
}

let store = makeStore();

function getNodeLoadable<T>(recoilValue: RecoilValue<T>): Loadable<T> {
  return getRecoilValueAsLoadable(store, recoilValue);
}

function getNodeValue<T>(recoilValue: RecoilValue<T>): T {
  return getNodeLoadable(recoilValue).getValue();
}

function setNode(recoilValue, value: mixed) {
  setRecoilValue(store, recoilValue, value);
  // $FlowFixMe[unsafe-addition]
  // $FlowFixMe[cannot-write]
  store.getState().currentTree.version++;
}

let nextAtomKey = 0;

function createAtoms(num): Array<RecoilState<string>> {
  const atoms = Array(num);
  const atomKey = nextAtomKey++;
  for (let i = 0; i < num; i++) {
    atoms[i] = atom({
      key: `PERF-${atomKey}-${i}`,
      default: 'DEFAULT',
    });
  }
  return atoms;
}

const helpersSelector = () =>
  selector({
    key: `PERF-helpers-${nextAtomKey++}`,
    get: ({getCallback}) => ({
      getSnapshot: getCallback(
        ({snapshot}) =>
          () =>
            snapshot,
      ),
    }),
  });
const getHelpers = () => getNodeValue(helpersSelector());

testPerf('creating n atoms', iterations => {
  createAtoms(iterations);
});

testPerf('getting n atoms', iterations => {
  const atoms = createAtoms(iterations);
  for (const node of atoms) {
    getNodeValue(node);
  }
});

testPerf('setting n atoms', iterations => {
  const atoms = createAtoms(iterations);
  for (const node of atoms) {
    setNode(node, 'SET');
  }
});

testPerf('cloning n snapshots', iterations => {
  const atoms = createAtoms(iterations);
  const {getSnapshot} = getHelpers();
  for (const node of atoms) {
    // Set node to avoid hitting cached snapshots
    setNode(node, 'SET');
    const snapshot = getSnapshot();
    expect(getNodeValue(node)).toBe('SET');
    expect(snapshot.getLoadable(node).contents).toBe('SET');
  }
});
