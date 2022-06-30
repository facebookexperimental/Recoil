/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 * @oncall recoil
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
function lazyProxy<Base: {[string]: any}, Factories: {[string]: () => any}>(
  base: Base,
  factories: Factories,
): {
  ...Base,
  ...$ObjMap<Factories, <F>(() => F) => F>,
} {
  const proxy = new Proxy(base, {
    // Compute and cache lazy property if not already done.
    get: (target, prop) => {
      if (!(prop in target) && prop in factories) {
        target[prop] = factories[prop]();
      }

      return target[prop];
    },

    // This method allows user to iterate keys as normal
    ownKeys: target => {
      // Materialize all lazy properties.  This appears to be necessary for
      // onKeys to work properly, the object must actually have the properties
      // that it reports to have.
      for (const lazyProp in factories) {
        // Call this for side-effect to materialize lazy property
        // $FlowExpectedError[prop-missing]
        proxy[lazyProp];
      }
      return Object.keys(target);
    },
  });

  // $FlowIssue[incompatible-return]
  return proxy;
}

module.exports = lazyProxy;
