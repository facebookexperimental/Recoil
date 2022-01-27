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

const lazyProxy = require('../Recoil_lazyProxy');

test('lazyProxy', () => {
  const lazyProp = jest.fn(() => 456);
  const proxy = lazyProxy(
    {
      foo: 123,
    },
    {
      bar: lazyProp,
    },
  );

  expect(proxy.foo).toBe(123);
  expect(proxy.bar).toBe(456);
  expect(lazyProp).toHaveBeenCalledTimes(1);

  expect(proxy.bar).toBe(456);
  expect(lazyProp).toHaveBeenCalledTimes(1);
});

test('lazyProxy - keys', () => {
  const proxy = lazyProxy(
    {
      foo: 123,
    },
    {
      bar: () => 456,
    },
  );

  expect(Object.keys(proxy)).toEqual(['foo', 'bar']);
  expect('foo' in proxy).toBe(true);
  expect('bar' in proxy).toBe(true);

  const keys = [];
  for (const key in proxy) {
    keys.push(key);
  }
  expect(keys).toEqual(['foo', 'bar']);
});
