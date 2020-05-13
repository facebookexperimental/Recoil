/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

const cacheWithValueEquality = require('Recoil_cacheWithValueEquality');

const {List} = require('immutable');

test('cacheWithValueEquality - set string', () => {
  const cache = cacheWithValueEquality();
  expect(cache.get('a')).toBe(undefined);

  cache.set('a', 1);
  expect(cache.get('a')).toBe(1);
  expect(cache.get('b')).toBe(undefined);

  cache.set('b', 2);
  expect(cache.get('a')).toBe(1);
  expect(cache.get('b')).toBe(2);
});

test('cacheWithValueEquality - set object', () => {
  const cache = cacheWithValueEquality();
  expect(cache.get({foo: 'a'})).toBe(undefined);

  cache.set({foo: 'a'}, 1);
  expect(cache.get({foo: 'a'})).toBe(1);

  // Override with a new instance of an object with value equality
  cache.set({foo: 'a'}, 2);
  expect(cache.get({foo: 'a'})).toBe(2);
});

test('cacheWithValueEquality - Immutable List', () => {
  const cache = cacheWithValueEquality();
  expect(cache.get({foo: List(['a'])})).toBe(undefined);

  cache.set({foo: List(['a'])}, 1);
  expect(cache.get({foo: List(['a'])})).toBe(1);

  // Override with a new instance of an object with value equality
  cache.set({foo: List(['a'])}, 2);
  expect(cache.get({foo: List(['a'])})).toBe(2);

  // Ensure that we have value equality for immutable objects that may
  // have internal metadata that is different (e.g. __ownerID, __hash, etc.)
  cache.set({foo: List(['a']).asMutable()}, 3);
  expect(cache.get({foo: List(['a'])})).toBe(3);
});
