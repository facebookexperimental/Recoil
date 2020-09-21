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

const isArrayBufferView = require('../Recoil_isArrayBufferView');

describe('isArrayBufferView', () => {
  test('Int8Array is instance of ArrayBufferView', () => {
    expect(isArrayBufferView(new Int8Array(new ArrayBuffer(8), 1, 4))).toEqual(
      true,
    );
  });
  test('Uint8Array is instance of ArrayBufferView', () => {
    expect(isArrayBufferView(new Uint8Array(new ArrayBuffer(8), 1, 4))).toEqual(
      true,
    );
  });
  test('Uint8ClampedArray is instance of ArrayBufferView', () => {
    expect(
      isArrayBufferView(new Uint8ClampedArray(new ArrayBuffer(8), 1, 4)),
    ).toEqual(true);
  });
  test('Int16Array is instance of ArrayBufferView', () => {
    expect(isArrayBufferView(new Int16Array(new ArrayBuffer(8), 0, 4))).toEqual(
      true,
    );
  });
  test('Uint16Array is instance of ArrayBufferView', () => {
    expect(
      isArrayBufferView(new Uint16Array(new ArrayBuffer(8), 0, 4)),
    ).toEqual(true);
  });
  test('Int32Array is instance of ArrayBufferView', () => {
    expect(
      isArrayBufferView(new Int32Array(new ArrayBuffer(16), 0, 4)),
    ).toEqual(true);
  });
  test('Uint32Array is instance of ArrayBufferView', () => {
    expect(
      isArrayBufferView(new Uint32Array(new ArrayBuffer(16), 0, 4)),
    ).toEqual(true);
  });
  test('Float32Array is instance of ArrayBufferView', () => {
    expect(
      isArrayBufferView(new Float32Array(new ArrayBuffer(16), 0, 4)),
    ).toEqual(true);
  });
  test('Float64Array is instance of ArrayBufferView', () => {
    expect(
      isArrayBufferView(new Float64Array(new ArrayBuffer(32), 0, 4)),
    ).toEqual(true);
  });
  test('DataView is instance of ArrayBufferView', () => {
    expect(isArrayBufferView(new DataView(new ArrayBuffer(16), 0))).toEqual(
      true,
    );
  });
  test('primitives are not instance of ArrayBufferView', () => {
    expect(isArrayBufferView(42)).toEqual(false);
    expect(isArrayBufferView('foo')).toEqual(false);
    expect(isArrayBufferView(true)).toEqual(false);
    expect(isArrayBufferView(Symbol('foo'))).toEqual(false);
    expect(isArrayBufferView(null)).toEqual(false);
    expect(isArrayBufferView(undefined)).toEqual(false);
  });
  test('object is not instance of ArrayBufferView', () => {
    expect(isArrayBufferView([1, 2, 3])).toEqual(false);
    expect(isArrayBufferView({})).toEqual(false);
    expect(isArrayBufferView(() => console.log('foo'))).toEqual(false);
  });
});
