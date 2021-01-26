/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Deep freeze values. Do not descend into React elements, Immutable structures,
 * or in general things that respond poorly to being frozen. Follows the
 * implementation of deepFreezeValue.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const {isReactNative, isSSR} = require('./Recoil_Environment');
const isNode = require('./Recoil_isNode');
const isPromise = require('./Recoil_isPromise');

function shouldNotBeFrozen(value: mixed): boolean {
  // Primitives and functions:
  if (value === null || typeof value !== 'object') {
    return true;
  }

  // React elements:
  switch (typeof value.$$typeof) {
    case 'symbol':
      return true;
    case 'number':
      return true;
  }

  // Immutable structures:
  if (
    value['@@__IMMUTABLE_ITERABLE__@@'] != null ||
    value['@@__IMMUTABLE_KEYED__@@'] != null ||
    value['@@__IMMUTABLE_INDEXED__@@'] != null ||
    value['@@__IMMUTABLE_ORDERED__@@'] != null ||
    value['@@__IMMUTABLE_RECORD__@@'] != null
  ) {
    return true;
  }

  // DOM nodes:
  if (isNode(value)) {
    return true;
  }

  if (isPromise(value)) {
    return true;
  }

  if (value instanceof Error) {
    return true;
  }

  if (ArrayBuffer.isView(value)) {
    return true;
  }

  // Some environments, just as Jest, don't work with the instanceof check
  if (
    !isSSR &&
    !isReactNative &&
    // $FlowFixMe(site=recoil) Window does not have a FlowType definition https://github.com/facebook/flow/issues/6709
    (value === window || value instanceof Window)
  ) {
    return true;
  }

  return false;
}

// Recursively freeze a value to enforce it is read-only.
// This may also have minimal performance improvements for enumerating
// objects (based on browser implementations, of course)
function deepFreezeValue(value: mixed) {
  if (typeof value !== 'object' || shouldNotBeFrozen(value)) {
    return;
  }

  Object.freeze(value); // Make all properties read-only
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const prop = value[key];
      // Prevent infinite recurssion for circular references.
      if (typeof prop === 'object' && prop != null && !Object.isFrozen(prop)) {
        deepFreezeValue(prop);
      }
    }
  }
  Object.seal(value); // This also makes existing properties non-configurable.
}

module.exports = deepFreezeValue;
