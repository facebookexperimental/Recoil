/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict
 * @format
 */
'use strict';

export type CacheImplementation<T> = {
  +get: mixed => T | void,
  +set: (mixed, T) => CacheImplementation<T>,
  ...
};

module.exports = ({}: {...});
