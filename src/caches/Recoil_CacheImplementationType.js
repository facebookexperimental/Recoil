/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */

'use strict';

export interface CacheImplementation<K, V> {
  +get: K => ?V;
  +set: (K, V) => void;
  +delete: K => void;
  +clear: () => void;
  +size: () => number;
}
