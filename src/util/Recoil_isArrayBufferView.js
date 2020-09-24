/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */
'use strict';

const ARRAY_BUFFER_VIEW_TYPES = [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  DataView,
];

function isArrayBufferView(value: mixed): boolean {
  for (const type of ARRAY_BUFFER_VIEW_TYPES) {
    if (value instanceof type) {
      return true;
    }
  }
  return false;
}

module.exports = isArrayBufferView;
