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

/**
 * HACK: doing this as a way to map given cache to corresponding tree cache.
 * Current implementation does not allow custom cache implementations. Custom
 * caches have a type 'custom' and fall back to reference equality.
 */
export type CacheImplementationType =
  | 'reference'
  | 'value'
  | 'mostRecent'
  | 'custom';

// eslint-disable-next-line fb-www/flow-readonly-object
export type CacheImplementation<T> = {
  +type: CacheImplementationType,
  +get: mixed => T | void,
  +set: (mixed, T) => CacheImplementation<T>,
  +delete: mixed => CacheImplementation<T>,
  ...
};

module.exports = ({}: {...});
