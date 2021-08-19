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

const {
  loadableWithError,
  loadableWithPromise,
  loadableWithValue,
} = require('../Recoil_Loadable');

const ERROR = new Error('ERROR');

test('Value Loadable', async () => {
  const loadable = loadableWithValue('VALUE');
  expect(loadable.state).toBe('hasValue');
  expect(loadable.contents).toBe('VALUE');
  expect(loadable.getValue()).toBe('VALUE');
  await expect(loadable.toPromise()).resolves.toBe('VALUE');
  expect(loadable.valueMaybe()).toBe('VALUE');
  expect(loadable.valueOrThrow()).toBe('VALUE');
  expect(loadable.errorMaybe()).toBe(undefined);
  expect(() => loadable.errorOrThrow()).toThrow();
  expect(loadable.promiseMaybe()).toBe(undefined);
  expect(() => loadable.promiseOrThrow()).toThrow();
});

test('Error Loadable', async () => {
  const error = new Error('ERROR');
  const loadable = loadableWithError(error);
  expect(loadable.state).toBe('hasError');
  expect(loadable.contents).toBe(error);
  expect(() => loadable.getValue()).toThrow(error);
  await expect(loadable.toPromise()).rejects.toBe(error);
  expect(loadable.valueMaybe()).toBe(undefined);
  expect(() => loadable.valueOrThrow()).toThrow();
  expect(loadable.errorMaybe()).toBe(error);
  expect(loadable.errorOrThrow()).toBe(error);
  expect(loadable.promiseMaybe()).toBe(undefined);
  expect(() => loadable.promiseOrThrow()).toThrow();
});

test('Pending Value Loadable', async () => {
  // TODO update API to avoid wrapping
  const promise = Promise.resolve({__value: 'VALUE'});
  const loadable = loadableWithPromise(promise);
  expect(loadable.state).toBe('loading');
  expect(loadable.contents).toBe(promise);
  expect(() => loadable.getValue()).toThrow();
  await expect(loadable.toPromise()).resolves.toBe('VALUE');
  expect(loadable.valueMaybe()).toBe(undefined);
  expect(() => loadable.valueOrThrow()).toThrow();
  expect(loadable.errorMaybe()).toBe(undefined);
  expect(() => loadable.errorOrThrow()).toThrow();
  await expect(loadable.promiseMaybe()).resolves.toBe('VALUE');
  await expect(loadable.promiseOrThrow()).resolves.toBe('VALUE');
});

describe('Loadable mapping', () => {
  test('Loadable mapping value', () => {
    const loadable = loadableWithValue('VALUE').map(x => 'MAPPED_' + x);
    expect(loadable.state).toBe('hasValue');
    expect(loadable.contents).toBe('MAPPED_VALUE');
  });

  test('Loadable mapping value to error', () => {
    const loadable = loadableWithValue('VALUE').map(() => {
      throw ERROR;
    });
    expect(loadable.state).toBe('hasError');
    expect(loadable.contents).toBe(ERROR);
  });

  test('Loadable mapping value to Promise', async () => {
    const loadable = loadableWithValue('VALUE').map(() =>
      Promise.resolve('MAPPED'),
    );
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).resolves.toBe('MAPPED');
  });

  test('Loadable mapping value to reject', async () => {
    const loadable = loadableWithValue('VALUE').map(() =>
      Promise.reject(ERROR),
    );
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).rejects.toBe(ERROR);
  });

  test('Loadable mapping error', () => {
    const loadable = loadableWithError(ERROR).map(() => 'NOT_USED');
    expect(loadable.state).toBe('hasError');
    expect(loadable.contents).toBe(ERROR);
  });

  test('Loadable mapping promise value', async () => {
    // TODO update API to avoid wrapping
    const loadable = loadableWithPromise(
      Promise.resolve({__value: 'VALUE'}),
    ).map(x => 'MAPPED_' + x);
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).resolves.toBe('MAPPED_VALUE');
  });

  test('Loadable mapping promise value to reject', async () => {
    // TODO update API to avoid wrapping
    const loadable = loadableWithPromise(
      Promise.resolve({__value: 'VALUE'}),
    ).map(() => Promise.reject(ERROR));
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).rejects.toBe(ERROR);
  });
  test('Loadable mapping promise value to error', async () => {
    // TODO update API to avoid wrapping
    const loadable = loadableWithPromise(
      Promise.resolve({__value: 'VALUE'}),
    ).map(() => {
      throw ERROR;
    });
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).rejects.toBe(ERROR);
  });

  test('Loadable mapping promise error', async () => {
    const loadable = loadableWithPromise(Promise.reject(ERROR)).map(
      () => 'NOT_USED',
    );
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).rejects.toBe(ERROR);
  });
});
