/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const {createGraph, depsHaveChaged} = require('../GraphUtils');

describe('base cases', () => {
  const emptySet = new Set();
  it('empty snapshot and deps', () => {
    expect(createGraph({})).toEqual({levels: [[]], edges: []});
  });

  it('only snapshot', () => {
    expect(createGraph({a: new Set(), b: new Set()})).toEqual({
      levels: [['a', 'b']],
      edges: [],
    });
  });

  it('snapshot with single dep', () => {
    expect(createGraph({a: emptySet, b: emptySet, c: new Set(['a'])})).toEqual({
      levels: [['a', 'b'], ['c']],
      edges: [
        [
          [0, 0],
          [1, 0],
        ],
      ],
    });
  });

  it('more deps', () => {
    expect(
      createGraph({
        c: new Set(['b']),
        d: new Set(['a', 'b']),
        a: emptySet,
        b: emptySet,
      }),
    ).toEqual({
      levels: [
        ['a', 'b'],
        ['c', 'd'],
      ],
      edges: [
        [
          [0, 1],
          [1, 0],
        ],
        [
          [0, 0],
          [1, 1],
        ],
        [
          [0, 1],
          [1, 1],
        ],
      ],
    });
  });

  it('nested deps', () => {
    expect(
      createGraph({
        a: emptySet,
        b: emptySet,
        e: new Set(['c']),
        c: new Set(['b']),
        d: new Set(['a', 'b']),
      }),
    ).toEqual({
      levels: [['a', 'b'], ['c', 'd'], ['e']],
      edges: [
        [
          [0, 1],
          [1, 0],
        ],
        [
          [0, 0],
          [1, 1],
        ],
        [
          [0, 1],
          [1, 1],
        ],
        [
          [1, 0],
          [2, 0],
        ],
      ],
    });
  });

  it('not found deps are ignored', () => {
    expect(
      createGraph({
        a: emptySet,
        b: emptySet,
        e: new Set(['c']),
        c: new Set(['b']),
        d: new Set(['a', 'b']),
        f: new Set(['g', 'a']),
      }),
    ).toEqual({
      levels: [['a', 'b'], ['c', 'd'], ['e']],
      edges: [
        [
          [0, 1],
          [1, 0],
        ],
        [
          [0, 0],
          [1, 1],
        ],
        [
          [0, 1],
          [1, 1],
        ],
        [
          [1, 0],
          [2, 0],
        ],
      ],
    });
  });
});

describe('depsHaveChaged util', () => {
  const newSet = new Set(['a', 'b']);
  expect(depsHaveChaged(null, newSet)).toBeTruthy();
  expect(depsHaveChaged(new Set(['a']), newSet)).toBeTruthy();
  expect(depsHaveChaged(new Set(['a', 'b', 'c']), newSet)).toBeTruthy();
  expect(depsHaveChaged(new Set(['a', 'b']), newSet)).toBeFalsy();
  expect(depsHaveChaged(new Set(['b', 'a']), newSet)).toBeFalsy();
});
