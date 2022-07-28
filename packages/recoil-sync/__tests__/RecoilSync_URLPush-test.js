/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

const {act} = require('ReactTestUtils');
const {atom} = require('Recoil');

const {
  TestURLSync,
  expectURL,
  goBack,
} = require('../__test_utils__/RecoilSync_MockURLSerialization');
const {urlSyncEffect} = require('../RecoilSync_URL');
const React = require('react');
const {
  componentThatReadsAndWritesAtom,
  renderElements,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');
const {string} = require('refine');

test('Push URLs in browser history', async () => {
  const loc = {part: 'queryParams'};

  const atomA = atom({
    key: 'recoil-url-sync replace',
    default: 'DEFAULT',
    effects: [urlSyncEffect({refine: string(), history: 'replace'})],
  });
  const atomB = atom({
    key: 'recoil-url-sync push',
    default: 'DEFAULT',
    effects: [urlSyncEffect({refine: string(), history: 'push'})],
  });
  const atomC = atom({
    key: 'recoil-url-sync push 2',
    default: 'DEFAULT',
    effects: [urlSyncEffect({refine: string(), history: 'push'})],
  });

  const [AtomA, setA, resetA] = componentThatReadsAndWritesAtom(atomA);
  const [AtomB, setB, resetB] = componentThatReadsAndWritesAtom(atomB);
  const [AtomC, setC] = componentThatReadsAndWritesAtom(atomC);
  const container = renderElements(
    <TestURLSync location={loc}>
      <AtomA />
      <AtomB />
      <AtomC />
    </TestURLSync>,
  );

  expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');
  const baseHistory = history.length;

  // Replace A
  // 1: A__
  act(() => setA('A'));
  expect(container.textContent).toBe('"A""DEFAULT""DEFAULT"');
  expectURL([
    [
      loc,
      {
        'recoil-url-sync replace': 'A',
      },
    ],
  ]);
  expect(history.length).toBe(baseHistory);

  // Push B
  // 1: A__
  // 2: AB_
  act(() => setB('B'));
  expect(container.textContent).toBe('"A""B""DEFAULT"');
  expectURL([
    [
      loc,
      {
        'recoil-url-sync replace': 'A',
        'recoil-url-sync push': 'B',
      },
    ],
  ]);

  // Push C
  // 1: A__
  // 2: AB_
  // 3: ABC
  act(() => setC('C'));
  expect(container.textContent).toBe('"A""B""C"');
  expectURL([
    [
      loc,
      {
        'recoil-url-sync replace': 'A',
        'recoil-url-sync push': 'B',
        'recoil-url-sync push 2': 'C',
      },
    ],
  ]);

  // Pop and confirm C is reset
  // 1: A__
  // 2: AB_
  await act(goBack);
  expect(container.textContent).toBe('"A""B""DEFAULT"');
  expectURL([
    [
      loc,
      {
        'recoil-url-sync replace': 'A',
        'recoil-url-sync push': 'B',
      },
    ],
  ]);

  // Replace Reset A
  // 1: A__
  // 2: _B_
  act(resetA);
  expect(container.textContent).toBe('"DEFAULT""B""DEFAULT"');
  expectURL([
    [
      loc,
      {
        'recoil-url-sync push': 'B',
      },
    ],
  ]);

  // Push a Reset
  // 1: A__
  // 2: _B_
  // 3: ___
  act(resetB);
  expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');
  expectURL([[loc, {}]]);

  // Push BB
  // 1: A__
  // 2: _B_
  // 3: ___
  // 4: _BB_
  act(() => setB('BB'));
  expect(container.textContent).toBe('"DEFAULT""BB""DEFAULT"');
  expectURL([
    [
      loc,
      {
        'recoil-url-sync push': 'BB',
      },
    ],
  ]);

  // Replace AA
  // 1: A__
  // 2: _B_
  // 3: ___
  // 4: AABB_
  act(() => setA('AA'));
  expect(container.textContent).toBe('"AA""BB""DEFAULT"');
  expectURL([
    [
      loc,
      {
        'recoil-url-sync replace': 'AA',
        'recoil-url-sync push': 'BB',
      },
    ],
  ]);

  // Replace AAA
  // 1: A__
  // 2: _B_
  // 3: ___
  // 4: AAABB_
  act(() => setA('AAA'));
  expect(container.textContent).toBe('"AAA""BB""DEFAULT"');
  expectURL([
    [
      loc,
      {
        'recoil-url-sync replace': 'AAA',
        'recoil-url-sync push': 'BB',
      },
    ],
  ]);

  // Pop
  // 1: A__
  // 2: _B_
  // 3: ___
  await act(goBack);
  expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');
  expectURL([[loc, {}]]);

  // Pop
  // 1: A__
  // 2: _B_
  await act(goBack);
  expect(container.textContent).toBe('"DEFAULT""B""DEFAULT"');
  expectURL([
    [
      loc,
      {
        'recoil-url-sync push': 'B',
      },
    ],
  ]);

  // Pop
  // 1: A__
  await act(goBack);
  expect(container.textContent).toBe('"A""DEFAULT""DEFAULT"');
  expectURL([
    [
      loc,
      {
        'recoil-url-sync replace': 'A',
      },
    ],
  ]);
});
