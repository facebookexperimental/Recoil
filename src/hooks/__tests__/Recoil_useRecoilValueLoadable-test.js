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

const {getRecoilTestFn} = require('../../testing/Recoil_TestingUtils');

let React,
  act,
  constSelector,
  errorSelector,
  asyncSelector,
  renderElements,
  useRecoilValueLoadable;

const testRecoil = getRecoilTestFn(() => {
  React = require('React');
  ({act} = require('ReactTestUtils'));
  constSelector = require('../../recoil_values/Recoil_constSelector');
  errorSelector = require('../../recoil_values/Recoil_errorSelector');
  ({
    asyncSelector,
    renderElements,
  } = require('../../testing/Recoil_TestingUtils'));
  ({useRecoilValueLoadable} = require('../Recoil_Hooks'));
});

// These tests should cover the Loadable interface returned by useRecoilValueLoadable.
// It is also used by useRecoilStateNoThrow, waitForNone, and waitForAny

testRecoil('useRecoilValueLoadable - loadable with value', async () => {
  const valueSel = constSelector('VALUE');
  let promise;
  function ReadLoadable() {
    const loadable = useRecoilValueLoadable(valueSel);
    expect(loadable.state).toBe('hasValue');
    expect(loadable.contents).toBe('VALUE');
    expect(loadable.getValue()).toBe('VALUE');
    // eslint-disable-next-line jest/valid-expect
    promise = expect(loadable.toPromise()).resolves.toBe('VALUE');
    expect(loadable.valueMaybe()).toBe('VALUE');
    expect(loadable.valueOrThrow()).toBe('VALUE');
    expect(loadable.errorMaybe()).toBe(undefined);
    expect(() => loadable.errorOrThrow()).toThrow(Error);
    expect(loadable.promiseMaybe()).toBe(undefined);
    expect(() => loadable.promiseOrThrow()).toThrow(Error);
    return loadable.valueOrThrow();
  }
  const c = renderElements(<ReadLoadable />);
  expect(c.textContent).toEqual('VALUE');
  await promise;
});

testRecoil('useRecoilValueLoadable - loadable with error', async () => {
  const valueSel = errorSelector('ERROR');
  let promise;
  function ReadLoadable() {
    const loadable = useRecoilValueLoadable(valueSel);
    expect(loadable.state).toBe('hasError');
    expect(loadable.contents).toBeInstanceOf(Error);
    expect(() => loadable.getValue()).toThrow('ERROR');
    // eslint-disable-next-line jest/valid-expect
    promise = expect(loadable.toPromise()).rejects.toBeInstanceOf(Error);
    expect(loadable.valueMaybe()).toBe(undefined);
    expect(() => loadable.valueOrThrow()).toThrow(Error);
    expect(String(loadable.errorMaybe() ?? {})).toContain('ERROR');
    expect(loadable.errorOrThrow()).toBeInstanceOf(Error);
    expect(String(loadable.errorOrThrow())).toContain('ERROR');
    expect(loadable.promiseMaybe()).toBe(undefined);
    expect(() => loadable.promiseOrThrow()).toThrow(Error);
    return 'VALUE';
  }
  const c = renderElements(<ReadLoadable />);
  expect(c.textContent).toEqual('VALUE');
  await promise;
});

testRecoil('useRecoilValueLoadable - loading loadable', async () => {
  const [valueSel, resolve] = asyncSelector();
  let resolved = false;
  const promises = [];
  function ReadLoadable() {
    const loadable = useRecoilValueLoadable(valueSel);
    if (!resolved) {
      expect(loadable.state).toBe('loading');
      expect(loadable.contents).toBeInstanceOf(Promise);
      expect(() => loadable.getValue()).toThrow();
      try {
        loadable.getValue();
      } catch (promise) {
        promises.push(promise);
      }
      promises.push(loadable.toPromise());
      expect(loadable.valueMaybe()).toBe(undefined);
      expect(() => loadable.valueOrThrow()).toThrow(Error);
      expect(loadable.errorMaybe()).toBe(undefined);
      expect(() => loadable.errorOrThrow()).toThrow(Error);
      expect(loadable.promiseMaybe()).toBeInstanceOf(Promise);
      promises.push(loadable.promiseMaybe());
      return 'LOADING';
    } else {
      expect(loadable.state).toBe('hasValue');
      expect(loadable.contents).toBe('VALUE');
      expect(loadable.getValue()).toBe('VALUE');
      promises.push(loadable.toPromise());
      expect(loadable.valueMaybe()).toBe('VALUE');
      expect(loadable.valueOrThrow()).toBe('VALUE');
      expect(loadable.errorMaybe()).toBe(undefined);
      expect(() => loadable.errorOrThrow()).toThrow(Error);
      expect(loadable.promiseMaybe()).toBe(undefined);
      expect(() => loadable.promiseOrThrow()).toThrow(Error);
      return loadable.valueOrThrow();
    }
  }
  const c = renderElements(<ReadLoadable />);
  expect(c.textContent).toEqual('LOADING');
  resolve('VALUE');
  resolved = true;
  act(() => jest.runAllTimers());
  expect(c.textContent).toEqual('VALUE');
  await Promise.all(
    promises.map(async promise => {
      if (!(promise instanceof Promise)) {
        // for flow
        throw new Error('Expected a promise');
      }

      const res = await promise;
      const val = typeof res === 'string' ? res : res.__value;

      expect(val).toBe('VALUE');
    }),
  );
});
