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

const stableStringify = require('../Recoil_stableStringify');
const immutable = require('immutable');

test('stableStringify', () => {
  // undefined
  expect(stableStringify()).toBe('');

  // Primitives
  expect(stableStringify(undefined)).toBe('');
  expect(stableStringify(null)).toBe('null');
  expect(stableStringify(true)).toBe('true');
  expect(stableStringify(42)).toBe('42');
  expect(stableStringify('hello world')).toBe('"hello world"');
  expect(stableStringify('contains \\ backslash')).toBe(
    '"contains \\\\ backslash"',
  );
  expect(stableStringify('nested "quotes"')).toBe('"nested \\"quotes\\""');
  expect(stableStringify('nested escaped \\" quote')).toBe(
    '"nested escaped \\\\\\" quote"',
  );
  // expect(stableStringify(BigInt(42))).toBe('42'); // BigInt is not supported in www

  // Array
  expect(stableStringify([1, 2])).toBe('[1,2]');

  // Object with stable key order
  expect(stableStringify({foo: 2, bar: 1})).toBe('{"bar":1,"foo":2}');
  expect(stableStringify({bar: 1, foo: 2})).toBe('{"bar":1,"foo":2}');
  // Object with quote in key
  expect(stableStringify({'key with "quotes"': 'value'})).toBe(
    '{"key with \\"quotes\\"":"value"}',
  );
  // Object with undefined values
  expect(stableStringify({foo: undefined, bar: 2})).toBe('{"bar":2}');

  // Nested objects
  expect(stableStringify({arr: [1, 2]})).toBe('{"arr":[1,2]}');
  expect(stableStringify([{foo: 1}, {bar: 2}])).toBe('[{"foo":1},{"bar":2}]');

  // Built-in Set with stable order
  expect(stableStringify(new Set([1, 2]))).toBe('[1,2]');
  expect(stableStringify(new Set([2, 1]))).toBe('[1,2]');
  expect(stableStringify(new Set([{foo: 2, bar: 1}]))).toBe(
    '[{"bar":1,"foo":2}]',
  );
  expect(stableStringify(new Set([{bar: 1, foo: 2}]))).toBe(
    '[{"bar":1,"foo":2}]',
  );

  // Built-in Map with stable key order
  expect(
    stableStringify(
      new Map([
        ['foo', 2],
        ['bar', 1],
      ]),
    ),
  ).toBe('{"bar":1,"foo":2}');
  expect(
    stableStringify(
      new Map([
        ['bar', 1],
        ['foo', 2],
      ]),
    ),
  ).toBe('{"bar":1,"foo":2}');

  // Built-in Map with non-string keys with stable key order
  expect(
    stableStringify(
      new Map([
        [{bar: 1}, 1],
        [{foo: 2}, 2],
      ]),
    ),
  ).toBe('{"{\\"bar\\":1}":1,"{\\"foo\\":2}":2}');
  expect(
    stableStringify(
      new Map([
        [{foo: 2}, 2],
        [{bar: 1}, 1],
      ]),
    ),
  ).toBe('{"{\\"bar\\":1}":1,"{\\"foo\\":2}":2}');

  // Nested Maps/Sets
  expect(
    stableStringify(
      new Set([
        new Map([
          ['foo', 2],
          ['bar', 1],
        ]),
      ]),
    ),
  ).toBe('[{"bar":1,"foo":2}]');
  expect(stableStringify(new Map([['arr', new Set([2, 1])]]))).toBe(
    '{"arr":[1,2]}',
  );
});

test('stableStringify Immutable', () => {
  // List
  expect(stableStringify(immutable.List([1, 2]))).toBe('[1,2]');
  expect(stableStringify(immutable.List([2, 1]))).toBe('[2,1]');

  // List with mutated internal metadata (e.g. __hash or __ownerID)
  expect(stableStringify(immutable.List([1, 2]).asMutable())).toBe('[1,2]');

  // Set - JSON conversion is handled by Immutable's toJSON(), which produces
  // an array, so the keys are not sorted
  expect(stableStringify(immutable.Set(['a', 'b']))).toBe('["a","b"]');
  expect(stableStringify(immutable.Set(['b', 'a']))).toBe('["b","a"]');
  // OrderedSet is handled the same as Set

  // Map
  expect(stableStringify(immutable.Map({foo: 2, bar: 1}))).toBe(
    '{"bar":1,"foo":2}',
  );
  expect(stableStringify(immutable.Map({bar: 1, foo: 2}))).toBe(
    '{"bar":1,"foo":2}',
  );
  // OrderedMap is handled the same as Map, so ordering is lost

  // Record
  const R = immutable.Record({foo: undefined});
  const r = R({foo: 1});
  expect(stableStringify(r)).toBe('{"foo":1}');

  // Nested Immutable
  expect(stableStringify([immutable.List([1, 2])])).toBe('[[1,2]]');
  expect(
    stableStringify({foo: immutable.List([2]), bar: immutable.List([1])}),
  ).toBe('{"bar":[1],"foo":[2]}');
});
