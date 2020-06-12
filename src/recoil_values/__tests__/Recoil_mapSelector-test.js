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

import type {Store} from 'Recoil_State';

const {
  getRecoilValueAsLoadable,
  setRecoilValue,
} = require('../../core/Recoil_RecoilValueInterface');
const {makeStore} = require('../../testing/Recoil_TestingUtils');
const atom = require('../Recoil_atom');
const mapSelector = require('../Recoil_mapSelector');

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

describe('mapSelector', () => {
  test('transform', () => {
    const myAtom = atom({key: 'mapSelector', default: 2});
    const multiplyNode = mapSelector(myAtom, x => x * 100);

    expect(get(multiplyNode)).toEqual(200);

    set(myAtom, 3);
    expect(get(multiplyNode)).toEqual(300);
  });
});

describe('map', () => {
  test('transform', () => {
    const myAtom = atom({key: 'map transform', default: 2});
    const multiplyNode = myAtom.map(x => x * 100);

    expect(get(multiplyNode)).toEqual(200);

    set(myAtom, 3);
    expect(get(multiplyNode)).toEqual(300);
  });

  test('slice', () => {
    const myAtom = atom({key: 'map slice', default: {a: 1}});
    const sliceNpde = myAtom.map(x => x.a);

    expect(get(sliceNpde)).toEqual(1);

    set(myAtom, {a: 2});
    expect(get(sliceNpde)).toEqual(2);
  });

  test('with additional dependencies', () => {
    const myAtom = atom({key: 'map multiple', default: 2});
    const multiplierAtom = atom({key: 'map multiple multiplier', default: 10});
    const multiplyNode = myAtom.map(
      (value, {get}) => value * get(multiplierAtom),
    );

    expect(get(multiplyNode)).toEqual(20);

    set(multiplierAtom, 100);
    expect(get(multiplyNode)).toEqual(200);

    set(myAtom, 3);
    expect(get(multiplyNode)).toEqual(300);
  });
});

test('memoization', () => {
  const myAtom = atom({key: 'map memoization', default: 2});

  const map = x => x * 100;

  const mapNodeA = myAtom.map(map);
  const mapNodeB = myAtom.map(map);
  expect(mapNodeA).toEqual(mapNodeB);
});
