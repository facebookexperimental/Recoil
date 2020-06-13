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

const {getRecoilValueAsLoadable} = require('../../core/Recoil_RecoilValue');
const {makeStore} = require('../../testing/Recoil_TestingUtils');
const constSelector = require('../Recoil_constSelector');

let store;
beforeEach(() => {
  store = makeStore();
});

function get(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue).contents;
}

test('constSelector - string', () => {
  const mySelector = constSelector('HELLO');
  expect(get(mySelector)).toEqual('HELLO');
  expect(get(mySelector)).toBe('HELLO');
});

test('constSelector - number', () => {
  const mySelector = constSelector(42);
  expect(get(mySelector)).toEqual(42);
  expect(get(mySelector)).toBe(42);
});

test('constSelector - null', () => {
  const mySelector = constSelector(null);
  expect(get(mySelector)).toEqual(null);
  expect(get(mySelector)).toBe(null);
});

test('constSelector - boolean', () => {
  const mySelector = constSelector(true);
  expect(get(mySelector)).toEqual(true);
  expect(get(mySelector)).toBe(true);
});
test('constSelector - array', () => {
  const emptyArraySelector = constSelector([]);
  expect(get(emptyArraySelector)).toEqual([]);

  const numberArray = [1, 2, 3];
  const numberArraySelector = constSelector(numberArray);
  expect(get(numberArraySelector)).toEqual([1, 2, 3]);
  expect(get(numberArraySelector)).toBe(numberArray);
});

test('constSelector - object', () => {
  const emptyObjSelector = constSelector({});
  expect(get(emptyObjSelector)).toEqual({});

  const obj = {foo: 'bar'};
  const objSelector = constSelector(obj);
  expect(get(objSelector)).toEqual({foo: 'bar'});
  expect(get(objSelector)).toBe(obj);

  // Calling a second time with same object provides the same selector
  const objSelector2 = constSelector(obj);
  expect(objSelector2).toBe(objSelector);
  expect(get(objSelector2)).toEqual({foo: 'bar'});
  expect(get(objSelector2)).toBe(obj);

  // Calling a third time with similar but different object provides
  // a new selector for the new reference.
  const newObj = {foo: 'bar'};
  const objSelector3 = constSelector(newObj);
  expect(get(objSelector3)).toEqual({foo: 'bar'});
  expect(get(objSelector3)).toBe(newObj);
});
