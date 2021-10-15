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

const deepFreezeValue = require('../Recoil_deepFreezeValue');

describe('deepFreezeValue', () => {
  test('Do not freeze Promises', () => {
    const obj = {test: new Promise(() => {})};
    deepFreezeValue(obj);
    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj.test)).toBe(false);
  });

  test('Do not freeze Errors', () => {
    const obj = {test: new Error()};
    deepFreezeValue(obj);
    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj.test)).toBe(false);
  });

  test('check no error: object with ArrayBufferView property', () => {
    expect(() => deepFreezeValue({test: new Int8Array(4)})).not.toThrow();
    expect(() => deepFreezeValue({test: new Uint8Array(4)})).not.toThrow();
    expect(() =>
      deepFreezeValue({test: new Uint8ClampedArray(4)}),
    ).not.toThrow();
    expect(() => deepFreezeValue({test: new Uint16Array(4)})).not.toThrow();
    expect(() => deepFreezeValue({test: new Int32Array(4)})).not.toThrow();
    expect(() => deepFreezeValue({test: new Uint32Array(4)})).not.toThrow();
    expect(() => deepFreezeValue({test: new Float32Array(4)})).not.toThrow();
    expect(() => deepFreezeValue({test: new Float64Array(4)})).not.toThrow();
    expect(() =>
      deepFreezeValue({test: new DataView(new ArrayBuffer(16), 0)}),
    ).not.toThrow();
  });

  test('check no error: object with Window property', () => {
    if (typeof window === 'undefined') {
      return;
    }
    expect(() => deepFreezeValue({test: window})).not.toThrow();
  });
  // TODO add test of other pattern
});
