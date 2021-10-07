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
  const loadable = loadableWithError(ERROR);
  expect(loadable.state).toBe('hasError');
  expect(loadable.contents).toBe(ERROR);
  expect(() => loadable.getValue()).toThrow(ERROR);
  await expect(loadable.toPromise()).rejects.toBe(ERROR);
  expect(loadable.valueMaybe()).toBe(undefined);
  expect(() => loadable.valueOrThrow()).toThrow();
  expect(loadable.errorMaybe()).toBe(ERROR);
  expect(loadable.errorOrThrow()).toBe(ERROR);
  expect(loadable.promiseMaybe()).toBe(undefined);
  expect(() => loadable.promiseOrThrow()).toThrow();
});

test('Pending Value Loadable', async () => {
  const promise = Promise.resolve('VALUE');
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
    const loadable = loadableWithValue('VALUE').map(x => 'MAPPED ' + x);
    expect(loadable.state).toBe('hasValue');
    expect(loadable.contents).toBe('MAPPED VALUE');
  });

  test('Loadable mapping value to error', () => {
    const loadable = loadableWithValue('VALUE').map(() => {
      throw ERROR;
    });
    expect(loadable.state).toBe('hasError');
    expect(loadable.contents).toBe(ERROR);
  });

  test('Loadable mapping value to Promise', async () => {
    const loadable = loadableWithValue('VALUE').map(value =>
      Promise.resolve('MAPPED ' + value),
    );
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).resolves.toBe('MAPPED VALUE');
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
    const loadable = loadableWithPromise(Promise.resolve('VALUE')).map(
      x => 'MAPPED ' + x,
    );
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).resolves.toBe('MAPPED VALUE');
  });

  test('Loadable mapping promise value to reject', async () => {
    const loadable = loadableWithPromise(Promise.resolve('VALUE')).map(() =>
      Promise.reject(ERROR),
    );
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).rejects.toBe(ERROR);
  });
  test('Loadable mapping promise value to error', async () => {
    const loadable = loadableWithPromise(Promise.resolve('VALUE')).map(() => {
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

  test('Loadable mapping to loadable', () => {
    const loadable = loadableWithValue('VALUE').map(value =>
      loadableWithValue(value),
    );
    expect(loadable.state).toBe('hasValue');
    expect(loadable.contents).toBe('VALUE');
  });

  test('Loadable mapping promise to loadable value', async () => {
    const loadable = loadableWithPromise(Promise.resolve('VALUE')).map(value =>
      loadableWithValue('MAPPED ' + value),
    );
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).resolves.toBe('MAPPED VALUE');
  });

  test('Loadable mapping promise to loadable error', async () => {
    const loadable = loadableWithPromise(Promise.resolve('VALUE')).map(() =>
      loadableWithError(ERROR),
    );
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).rejects.toBe(ERROR);
  });

  test('Loadable mapping promise to loadable promise', async () => {
    const loadable = loadableWithPromise(Promise.resolve('VALUE')).map(value =>
      loadableWithPromise(Promise.resolve('MAPPED ' + value)),
    );
    expect(loadable.state).toBe('loading');
    await expect(loadable.toPromise()).resolves.toBe('MAPPED VALUE');
  });
});
