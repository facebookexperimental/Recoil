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

const isPromise = require('./Recoil_isPromise');

const TIME_WARNING_THRESHOLD_MS = 15;

type Options = $ReadOnly<{allowFunctions?: boolean}>;

function stringify(x: mixed, opt: Options, key?: string): string {
  // A optimization to avoid the more expensive JSON.stringify() for simple strings
  // This may lose protection for u2028 and u2029, though.
  if (typeof x === 'string' && !x.includes('"') && !x.includes('\\')) {
    return `"${x}"`;
  }

  // Handle primitive types
  switch (typeof x) {
    case 'undefined':
      return ''; // JSON.stringify(undefined) returns undefined, but we always want to return a string
    case 'boolean':
      return x ? 'true' : 'false';
    case 'number':
    case 'symbol':
      // case 'bigint': // BigInt is not supported in www
      return String(x);
    case 'string':
      // Add surrounding quotes and escape internal quotes
      return JSON.stringify(x);
    case 'function':
      if (opt?.allowFunctions !== true) {
        throw new Error('Attempt to serialize function in a Recoil cache key');
      }
      return `__FUNCTION(${x.name})__`;
  }

  if (x === null) {
    return 'null';
  }
  // Fallback case for unknown types
  if (typeof x !== 'object') {
    return JSON.stringify(x) ?? '';
  }

  // Deal with all promises as equivalent for now.
  if (isPromise(x)) {
    return '__PROMISE__';
  }

  // Arrays handle recursive stringification
  if (Array.isArray(x)) {
    return `[${x.map((v, i) => stringify(v, opt, i.toString()))}]`;
  }

  // If an object defines a toJSON() method, then use that to override the
  // serialization.  This matches the behavior of JSON.stringify().
  // Pass the key for compatibility.
  // Immutable.js collections define this method to allow us to serialize them.
  if (typeof x.toJSON === 'function') {
    // flowlint-next-line unclear-type: off
    return stringify((x: any).toJSON(key), opt, key);
  }

  // For built-in Maps, sort the keys in a stable order instead of the
  // default insertion order.  Support non-string keys.
  if (x instanceof Map) {
    const obj = {};
    for (const [k, v] of x) {
      // Stringify will escape any nested quotes
      obj[typeof k === 'string' ? k : stringify(k, opt)] = v;
    }
    return stringify(obj, opt, key);
  }

  // For built-in Sets, sort the keys in a stable order instead of the
  // default insertion order.
  if (x instanceof Set) {
    return stringify(
      Array.from(x).sort((a, b) =>
        stringify(a, opt).localeCompare(stringify(b, opt)),
      ),
      opt,
      key,
    );
  }

  // Anything else that is iterable serialize as an Array.
  if (
    Symbol !== undefined &&
    x[Symbol.iterator] != null &&
    typeof x[Symbol.iterator] === 'function'
  ) {
    // flowlint-next-line unclear-type: off
    return stringify(Array.from((x: any)), opt, key);
  }

  // For all other Objects, sort the keys in a stable order.
  return `{${Object.keys(x)
    .filter(key => x[key] !== undefined)
    .sort()
    // stringify the key to add quotes and escape any nested slashes or quotes.
    .map(key => `${stringify(key, opt)}:${stringify(x[key], opt, key)}`)
    .join(',')}}`;
}

// Utility similar to JSON.stringify() except:
// * Serialize built-in Sets as an Array
// * Serialize built-in Maps as an Object.  Supports non-string keys.
// * Serialize other iterables as arrays
// * Sort the keys of Objects and Maps to have a stable order based on string conversion.
//    This overrides their default insertion order.
// * Still uses toJSON() of any object to override serialization
// * Support Symbols (though don't guarantee uniqueness)
// * We could support BigInt, but Flow doesn't seem to like it.
// See Recoil_stableStringify-test.js for examples
function stableStringify(
  x: mixed,
  opt: Options = {allowFunctions: false},
): string {
  if (__DEV__) {
    if (typeof window !== 'undefined') {
      const startTime = window.performance ? window.performance.now() : 0;

      const str = stringify(x, opt);

      const endTime = window.performance ? window.performance.now() : 0;

      if (endTime - startTime > TIME_WARNING_THRESHOLD_MS) {
        /* eslint-disable fb-www/no-console */
        console.groupCollapsed(
          `Recoil: Spent ${endTime - startTime}ms computing a cache key`,
        );
        console.warn(x, str);
        console.groupEnd();
        /* eslint-enable fb-www/no-console */
      }

      return str;
    }
  }

  return stringify(x, opt);
}

module.exports = stableStringify;
