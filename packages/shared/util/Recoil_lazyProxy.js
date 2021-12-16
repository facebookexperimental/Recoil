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

/**
 * Return a proxy object based on the provided base and factories objects.
 * The proxy will include all properties of the base object as-is.
 * The factories object contains callbacks to obtain the values of the properies
 * for its keys.
 *
 * This is useful for providing users an object where some properties may be
 * lazily computed only on first access.
 */
// $FlowIssue[unclear-type]
function lazyProxy<Base, Factories: {[string]: () => any}>(
  base: Base,
  factories: Factories,
): {...Base, ...$ObjMap<Factories, <F>(() => F) => F>} {
  // $FlowIssue[incompatible-return]
  return new Proxy(base, {
    get: (target, prop) => {
      if (prop in factories) {
        // $FlowIssue[incompatible-use]
        target[prop] = factories[prop]();
      }
      // $FlowIssue[incompatible-use]
      return target[prop];
    },
  });
}

module.exports = lazyProxy;
