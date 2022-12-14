/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

const {
  memoizeOneWithArgsHash,
  memoizeOneWithArgsHashAndInvalidation,
  memoizeWithArgsHash,
} = require('../Recoil_Memoize');

describe('memoizeWithArgsHash', () => {
  it('caches functions based on the hash function', () => {
    let i = 0;
    const f = jest.fn<$ReadOnlyArray<$FlowFixMe>, _>(() => i++);
    const mem = memoizeWithArgsHash<$ReadOnlyArray<$FlowFixMe>, _>(
      f,
      (_a, _b, c) => String(c),
    );
    expect(mem()).toBe(0);
    expect(mem(1, 2, 3)).toBe(1);
    expect(mem(0, 0, 3)).toBe(1);
    expect(f.mock.calls.length).toBe(2);
  });
  it('handles "hasOwnProperty" as a hash key with no errors', () => {
    let i = 0;
    const f = jest.fn<$ReadOnlyArray<$FlowFixMe>, _>(() => i++);
    const mem = memoizeWithArgsHash<$ReadOnlyArray<$FlowFixMe>, _>(
      f,
      () => 'hasOwnProperty',
    );
    expect(mem()).toBe(0);
    expect(() => mem()).not.toThrow();
    expect(mem(1)).toBe(0);
    expect(f.mock.calls.length).toBe(1);
  });
});

describe('memoizeOneWithArgsHash', () => {
  it('caches functions based on the arguments', () => {
    let i = 0;
    const f = jest.fn<$ReadOnlyArray<$FlowFixMe>, _>(() => i++);
    const mem = memoizeOneWithArgsHash<$ReadOnlyArray<$FlowFixMe>, _>(
      f,
      (a, b, c) => String(a) + String(b) + String(c),
    );
    expect(mem()).toBe(0);
    expect(mem(1, 2, 3)).toBe(1);
    expect(mem(0, 0, 3)).toBe(2);
    expect(mem(0, 0, 3)).toBe(2);
    expect(mem(1, 2, 3)).toBe(3);
    expect(f.mock.calls.length).toBe(4);
  });
  it('caches functions based on partial arguments', () => {
    let i = 0;
    const f = jest.fn<$ReadOnlyArray<$FlowFixMe>, _>(() => i++);
    const mem = memoizeOneWithArgsHash<$ReadOnlyArray<$FlowFixMe>, _>(
      f,
      (_a, _b, c) => String(c),
    );
    expect(mem()).toBe(0);
    expect(mem(1, 2, 3)).toBe(1);
    expect(mem(0, 0, 3)).toBe(1);
    expect(mem(0, 0, 3)).toBe(1);
    expect(mem(1, 2, 3)).toBe(1);
    expect(mem(1, 2, 4)).toBe(2);
    expect(f.mock.calls.length).toBe(3);
  });
});

describe('memoizeOneWithArgsHashAndInvalidation', () => {
  it('caches functions based on the arguments', () => {
    let i = 0;
    const f = jest.fn<$ReadOnlyArray<$FlowFixMe>, _>(() => i++);
    const [mem, invalidate] = memoizeOneWithArgsHashAndInvalidation<
      $ReadOnlyArray<$FlowFixMe>,
      _,
    >(f, (a, b, c) => String(a) + String(b) + String(c));
    expect(mem()).toBe(0);
    expect(mem(1, 2, 3)).toBe(1);
    expect(mem(0, 0, 3)).toBe(2);
    expect(mem(0, 0, 3)).toBe(2);
    expect(mem(1, 2, 3)).toBe(3);
    expect(mem(1, 2, 3)).toBe(3);
    invalidate();
    expect(mem(1, 2, 3)).toBe(4);
    expect(mem(1, 2, 3)).toBe(4);
    expect(f.mock.calls.length).toBe(5);
  });
  it('caches functions based on partial arguments', () => {
    let i = 0;
    const f = jest.fn<$ReadOnlyArray<$FlowFixMe>, _>(() => i++);
    const [mem, invalidate] = memoizeOneWithArgsHashAndInvalidation<
      $ReadOnlyArray<$FlowFixMe>,
      _,
    >(f, (_a, _b, c) => String(c));
    expect(mem()).toBe(0);
    expect(mem(1, 2, 3)).toBe(1);
    expect(mem(0, 0, 3)).toBe(1);
    expect(mem(0, 0, 3)).toBe(1);
    expect(mem(1, 2, 3)).toBe(1);
    expect(mem(1, 2, 4)).toBe(2);
    expect(mem(1, 2, 4)).toBe(2);
    invalidate();
    expect(mem(1, 2, 4)).toBe(3);
    expect(mem(1, 2, 4)).toBe(3);
    expect(f.mock.calls.length).toBe(4);
  });
});
