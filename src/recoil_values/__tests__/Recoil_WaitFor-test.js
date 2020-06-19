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

import type {LoadablePromise} from 'Recoil_Loadable';
import type {RecoilValue} from 'Recoil_RecoilValue';

const gkx = require('../../util/Recoil_gkx');
gkx.setPass('recoil_async_selector_refactor');

const {act} = require('ReactTestUtils');
const {
  loadableWithError,
  loadableWithValue,
} = require('../../adt/Recoil_Loadable');
const {
  getRecoilValueAsLoadable,
} = require('../../core/Recoil_RecoilValueInterface');
const {asyncSelector, makeStore} = require('../../testing/Recoil_TestingUtils');
const {
  noWait,
  waitForAll,
  waitForAny,
  waitForNone,
} = require('../Recoil_WaitFor');

/* eslint-disable jest/valid-expect */

let store;
beforeEach(() => {
  store = makeStore();
});

function get(atom) {
  return getRecoilValueAsLoadable(store, atom).contents;
}

function getValue<T>(recoilValue: RecoilValue<T>): T {
  const loadable = getRecoilValueAsLoadable(store, recoilValue);
  if (loadable.state !== 'hasValue') {
    throw new Error(`expected atom "${recoilValue.key}" to have a value`);
  }
  return loadable.contents;
}

function getPromise<T>(recoilValue: RecoilValue<T>): LoadablePromise<T> {
  const loadable = getRecoilValueAsLoadable(store, recoilValue);
  if (loadable.state !== 'loading') {
    throw new Error(`expected atom "${recoilValue.key}" to be a promise`);
  }
  return loadable.contents;
}

test('noWait - resolve', async () => {
  const [dep, resolve] = asyncSelector();

  const pTest = expect(
    getValue(noWait(dep)).toPromise(),
  ).resolves.toHaveProperty('value', 42);

  expect(getValue(noWait(dep)).contents).toBeInstanceOf(Promise);
  resolve(42);
  act(() => jest.runAllTimers());
  expect(getValue(noWait(dep)).contents).toBe(42);
  await pTest;
});

test('noWait - reject', async () => {
  const [dep, _resolve, reject] = asyncSelector();
  class MyError extends Error {}

  const pTest = expect(
    getValue(noWait(dep)).toPromise(),
  ).rejects.toBeInstanceOf(MyError);
  expect(getValue(noWait(dep)).contents).toBeInstanceOf(Promise);
  reject(new MyError());
  act(() => jest.runAllTimers());
  expect(getValue(noWait(dep)).contents).toBeInstanceOf(MyError);
  await pTest;
});

// TRUTH TABLE
//  Dependencies      waitForNone         waitForAny        waitForAll
// [loading, loading]  [Promise, Promise]  Promise           Promise
// [value, loading]    [value, Promise]    [value, Promise]  Promise
// [value, value]      [value, value]      [value, value]    [value, value]
test('waitFor - resolve to values', async () => {
  const [depA, resolveA] = asyncSelector();
  const [depB, resolveB] = asyncSelector();
  const deps = [depA, depB];

  // Test for initial values
  // watiForNone returns loadables with promises that resolve to their values
  expect(getValue(waitForNone(deps)).every(r => r.state === 'loading')).toBe(
    true,
  );
  const depTest0 = expect(
    getValue(waitForNone(deps))[0].promiseMaybe(),
  ).resolves.toHaveProperty('value', 0);
  const depTest1 = expect(
    getValue(waitForNone(deps))[1].promiseMaybe(),
  ).resolves.toHaveProperty('value', 1);
  // waitForAny returns a promise that resolves to the state with the next
  // resolved value.  So, that includes the first value and a promise for the second.
  expect(get(waitForAny(deps))).toBeInstanceOf(Promise);

  const anyTest0 = expect(
    getPromise(waitForAny(deps)).then(r => {
      const {value} = r;

      expect(value[0].valueMaybe()).toEqual(0);
      return value[0].valueMaybe();
    }),
  ).resolves.toEqual(0);

  const anyTest1 = expect(
    getPromise(waitForAny(deps)).then(r => {
      const {value} = r;

      expect(value[1].promiseMaybe()).toBeInstanceOf(Promise);
      return value[1].promiseMaybe();
    }),
  ).resolves.toHaveProperty('value', 1);

  // waitForAll returns a promise that resolves to the actual values
  expect(get(waitForAll(deps))).toBeInstanceOf(Promise);
  const allTest0 = expect(
    get(waitForAll(deps)),
  ).resolves.toHaveProperty('value', [0, 1]);

  // Resolve the first dep
  resolveA(0);
  act(() => jest.runAllTimers());
  expect(getValue(waitForNone(deps))[0].contents).toBe(0);
  expect(getValue(waitForNone(deps))[1].contents).toBeInstanceOf(Promise);
  expect(getValue(waitForAny(deps))[0].contents).toBe(0);
  expect(getValue(waitForAny(deps))[1].contents).toBeInstanceOf(Promise);
  expect(get(waitForAll(deps))).toBeInstanceOf(Promise);

  const allTest1 = expect(
    get(waitForAll(deps)),
  ).resolves.toHaveProperty('value', [0, 1]);

  // Resolve the second dep
  resolveB(1);
  act(() => jest.runAllTimers());
  expect(getValue(waitForNone(deps))[0].contents).toBe(0);
  expect(getValue(waitForNone(deps))[1].contents).toBe(1);
  expect(getValue(waitForAny(deps))[0].contents).toBe(0);
  expect(getValue(waitForAny(deps))[1].contents).toBe(1);
  expect(getValue(waitForAll(deps))[0]).toBe(0);
  expect(getValue(waitForAll(deps))[1]).toBe(1);

  await depTest0;
  await depTest1;
  await anyTest0;
  await anyTest1;
  await allTest0;
  await allTest1;
});

// TRUTH TABLE
//  Dependencies      waitForNone         waitForAny   waitForAll
// [loading, loading]  [Promise, Promise]  Promise      Promise
// [error, loading]    [Error, Promise]    Promise      Error
// [error, error]      [Error, Error]      Error        Error
test('waitFor - rejected', async () => {
  const [depA, _resolveA, rejectA] = asyncSelector();
  const [depB, _resolveB, rejectB] = asyncSelector();
  const deps = [depA, depB];
  get(waitForNone(deps));

  class Error1 extends Error {}
  class Error2 extends Error {}

  // We already tested for the initial values in the last test.
  // But, test that the initial returned promises here resolve to their
  // appropriate errors here.
  expect(get(waitForAny(deps))).toBeInstanceOf(Promise);
  const anyTest0 = expect(
    getPromise(waitForAny(deps)).then(r => {
      expect(r[0].errorMaybe()).toBeInstanceOf(Error1);
      return r[0].errorMaybe();
    }),
  ).rejects.toBeInstanceOf(Error1);
  const anyTest1 = expect(
    getPromise(waitForAny(deps)).then(r => {
      expect(r[1].promiseMaybe()).toBeInstanceOf(Promise);
      return r[1].promiseMaybe();
    }),
  ).rejects.toBeInstanceOf(Error1);
  const allTest = expect(get(waitForAll(deps))).rejects.toBeInstanceOf(Error1);

  rejectA(new Error1());
  act(() => jest.runAllTimers());
  expect(getValue(waitForNone(deps))[0].contents).toBeInstanceOf(Error1);
  expect(getValue(waitForNone(deps))[1].contents).toBeInstanceOf(Promise);
  expect(get(waitForAny(deps))).toBeInstanceOf(Promise);
  const anyTest2 = expect(get(waitForAny(deps))).rejects.toBeInstanceOf(Error1);
  expect(get(waitForAll(deps))).toBeInstanceOf(Error1);

  rejectB(new Error2());
  act(() => jest.runAllTimers());
  expect(getValue(waitForNone(deps))[0].contents).toBeInstanceOf(Error1);
  expect(getValue(waitForNone(deps))[1].contents).toBeInstanceOf(Error2);
  expect(get(waitForAny(deps))).toBeInstanceOf(Error1);
  expect(get(waitForAll(deps))).toBeInstanceOf(Error1);

  await anyTest0;
  await anyTest1;
  await anyTest2;
  await allTest;
});

// TRUTH TABLE
//  Dependencies       waitForNone        waitForAny        waitForAll
// [loading, loading]  [Promise, Promise]  Promise           Promise
// [value, loading]    [value, Promise]    [value, Promise]  Promise
// [value, error]      [value, Error]      [value, Error]    Error
test('waitFor - resolve then reject', async () => {
  const [depA, resolveA] = asyncSelector();
  const [depB, _resolveB, rejectB] = asyncSelector();
  const deps = [depA, depB];
  get(waitForNone(deps));

  class Error2 extends Error {}

  // Previous tests covered the initial values and resolving the initial value
  // But, test that waitForAll resolves to the second error.
  resolveA(0);
  const allTest = expect(get(waitForAll(deps))).rejects.toBeInstanceOf(Error2);

  rejectB(new Error2());
  act(() => jest.runAllTimers());
  expect(getValue(waitForNone(deps))[0].contents).toBe(0);
  expect(getValue(waitForNone(deps))[1].contents).toBeInstanceOf(Error2);
  expect(getValue(waitForAny(deps))[0].contents).toBe(0);
  expect(getValue(waitForAny(deps))[1].contents).toBeInstanceOf(Error2);
  expect(get(waitForAll(deps))).toBeInstanceOf(Error2);

  await allTest;
});

// TRUTH TABLE
//  Dependencies      waitForNone         waitForAny      waitForAll
// [loading, loading]  [Promise, Promise]  Promise         Promise
// [error, loading]    [Error, Promise]    Promise         Error
// [error, value]      [Error, value]      [Error, value]  Error
test('waitFor - reject then resolve', async () => {
  const [depA, _resolveA, rejectA] = asyncSelector();
  const [depB, resolveB] = asyncSelector();
  const deps = [depA, depB];
  get(waitForNone(deps));

  class Error1 extends Error {}

  const anyTest0 = expect(
    get(waitForAny(deps)),
  ).resolves.toHaveProperty('value', [
    loadableWithError(new Error1()),
    loadableWithValue(1),
  ]);

  act(() => jest.runAllTimers());

  // Previous tests covered the initial values and the first rejection.  But,
  // test that the waitForAny provides the next state with the error and value
  rejectA(new Error1());
  expect(get(waitForAny(deps))).toBeInstanceOf(Promise);

  const anyTest1 = expect(
    get(waitForAny(deps)),
  ).resolves.toHaveProperty('value', [
    loadableWithError(new Error1()),
    loadableWithValue(1),
  ]);

  const allTest = expect(get(waitForAll(deps))).rejects.toBeInstanceOf(Error1);
  act(() => jest.runAllTimers());

  resolveB(1);
  act(() => jest.runAllTimers());
  expect(getValue(waitForNone(deps))[0].contents).toBeInstanceOf(Error1);
  expect(getValue(waitForNone(deps))[1].contents).toBe(1);
  expect(getValue(waitForAny(deps))[0].contents).toBeInstanceOf(Error1);
  expect(getValue(waitForAny(deps))[1].contents).toBe(1);
  expect(get(waitForAll(deps))).toBeInstanceOf(Error1);

  await anyTest0;
  await anyTest1;
  await allTest;
});

// Similar as the first test that resolves both dependencies, but with named dependencies.
test('waitFor - named dependency version', async () => {
  const [depA, resolveA] = asyncSelector();
  const [depB, resolveB] = asyncSelector();
  const deps = {a: depA, b: depB};

  expect(getValue(waitForNone(deps)).a.promiseMaybe()).toBeInstanceOf(Promise);
  expect(getValue(waitForNone(deps)).b.promiseMaybe()).toBeInstanceOf(Promise);

  const depTest0 = expect(
    getValue(waitForNone(deps)).a.promiseMaybe(),
  ).resolves.toHaveProperty('value', 0);

  const depTest1 = expect(
    getValue(waitForNone(deps)).b.promiseMaybe(),
  ).resolves.toHaveProperty('value', 1);

  expect(get(waitForAny(deps))).toBeInstanceOf(Promise);

  const anyTest0 = expect(
    getPromise(waitForAny(deps)).then(r => {
      const {value} = r;

      expect(value.a.valueMaybe()).toEqual(0);

      return value.a.valueMaybe();
    }),
  ).resolves.toEqual(0);

  const anyTest1 = expect(
    getPromise(waitForAny(deps)).then(r => {
      const {value} = r;

      expect(value.b.promiseMaybe()).toBeInstanceOf(Promise);

      return value.b.promiseMaybe();
    }),
  ).resolves.toHaveProperty('value', 1);

  expect(get(waitForAll(deps))).toBeInstanceOf(Promise);

  const allTest0 = expect(
    get(waitForAll(deps)),
  ).resolves.toHaveProperty('value', {a: 0, b: 1});

  resolveA(0);
  act(() => jest.runAllTimers());
  expect(getValue(waitForNone(deps)).a.contents).toBe(0);
  expect(getValue(waitForNone(deps)).b.contents).toBeInstanceOf(Promise);
  expect(getValue(waitForAny(deps)).a.contents).toBe(0);
  expect(getValue(waitForAny(deps)).b.contents).toBeInstanceOf(Promise);
  expect(get(waitForAll(deps))).toBeInstanceOf(Promise);

  const allTest1 = expect(
    get(waitForAll(deps)),
  ).resolves.toHaveProperty('value', {a: 0, b: 1});

  resolveB(1);
  act(() => jest.runAllTimers());
  expect(getValue(waitForNone(deps)).a.contents).toBe(0);
  expect(getValue(waitForNone(deps)).b.contents).toBe(1);
  expect(getValue(waitForAny(deps)).a.contents).toBe(0);
  expect(getValue(waitForAny(deps)).b.contents).toBe(1);
  expect(getValue(waitForAll(deps)).a).toBe(0);
  expect(getValue(waitForAll(deps)).b).toBe(1);

  await depTest0;
  await depTest1;
  await anyTest0;
  await anyTest1;
  await allTest0;
  await allTest1;
});

/* eslint-enable jest/valid-expect */
