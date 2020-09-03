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

const {Graph} = require('../Recoil_Graph');

test('setGraphNodeParents sets children correctly across versions', () => {
  const g0 = new Graph();
  const g1 = new Graph(g0);

  g0.setParentsOfNode('a', new Set(['0']));

  expect(g0.parentsOfNode('a')).toEqual(new Set(['0']));
  expect(g1.parentsOfNode('a')).toEqual(new Set(['0']));
  expect(g0.childrenOfNode('0')).toEqual(new Set(['a']));
  expect(g1.childrenOfNode('0')).toEqual(new Set(['a']));

  g1.setParentsOfNode('a', new Set(['1']));
  expect(g0.parentsOfNode('a')).toEqual(new Set(['0']));
  expect(g1.parentsOfNode('a')).toEqual(new Set(['1']));
  expect(g0.childrenOfNode('0')).toEqual(new Set(['a']));
  expect(g1.childrenOfNode('0')).toEqual(new Set([]));
  expect(g0.childrenOfNode('1')).toEqual(new Set([]));
  expect(g1.childrenOfNode('1')).toEqual(new Set(['a']));
});

test('compactOlderGraphs', () => {
  const g0 = new Graph();
  const g1 = new Graph(g0);
  const g2 = new Graph(g1);
  const g3 = new Graph(g2);
  const g4 = new Graph(g3);
  const g5 = new Graph(g4);

  g0.setParentsOfNode('a', new Set(['0']));
  g0.setParentsOfNode('b', new Set(['0']));
  g1.setParentsOfNode('b', new Set(['1']));
  g1.setParentsOfNode('c', new Set(['1']));

  expect(g5.parentsOfNode('a')).toEqual(new Set(['0']));
  expect(g5.parentsOfNode('b')).toEqual(new Set(['1']));
  expect(g5.parentsOfNode('c')).toEqual(new Set(['1']));

  g5.compactOlderGraphs();

  expect(g5.parentsOfNode('a')).toEqual(new Set(['0']));
  expect(g5.parentsOfNode('b')).toEqual(new Set(['1']));
  expect(g5.parentsOfNode('c')).toEqual(new Set(['1']));

  // flowlint-next-line unclear-type:off
  expect((g1: any).baseGraph).toEqual(null);
});
