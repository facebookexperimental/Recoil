/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict
 * @format
 */
'use strict';

const cacheMostRecent = require('Recoil_cacheMostRecent');

test('cacheMostRecent', () => {
  const cache = cacheMostRecent();
  expect(cache.get('a')).toBe(undefined);
  cache.set('a', 1);
  expect(cache.get('a')).toBe(1);
  expect(cache.get('b')).toBe(undefined);
  cache.set('b', 2);
  expect(cache.get('a')).toBe(undefined);
  expect(cache.get('b')).toBe(2);
});
