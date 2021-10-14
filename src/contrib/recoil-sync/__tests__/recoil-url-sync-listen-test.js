/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

// TODO UPDATE IMPORTS TO USE PUBLIC INTERFACE

const {act} = require('ReactTestUtils');

const {validateAny} = require('../__test_utils__/recoil-sync_mockValidation');
const {
  TestURLSync,
  encodeURL,
  expectURL,
  gotoURL,
} = require('../__test_utils__/recoil-url-sync_mockSerialization');
const {
  ReadsAtom,
  renderElements,
} = require('../../../__test_utils__/Recoil_TestingUtils');
const atom = require('../../../recoil_values/Recoil_atom');
const {syncEffect} = require('../recoil-sync');
const React = require('react');

test('Listen to URL changes', async () => {
  const locFoo = {part: 'search', queryParam: 'foo'};
  const locBar = {part: 'search', queryParam: 'bar'};

  const atomA = atom({
    key: 'recoil-url-sync listen',
    default: 'DEFAULT',
    effects_UNSTABLE: [syncEffect({syncKey: 'foo', restore: validateAny})],
  });
  const atomB = atom({
    key: 'recoil-url-sync listen to multiple keys',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect({syncKey: 'foo', key: 'KEY A', restore: validateAny}),
      syncEffect({syncKey: 'foo', key: 'KEY B', restore: validateAny}),
    ],
  });
  const atomC = atom({
    key: 'recoil-url-sync listen to multiple storage',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect({syncKey: 'foo', restore: validateAny}),
      syncEffect({syncKey: 'bar', restore: validateAny}),
    ],
  });

  history.replaceState(
    null,
    '',
    encodeURL([
      [
        locFoo,
        {
          'recoil-url-sync listen': 'A',
          'KEY A': 'B',
          'recoil-url-sync listen to multiple storage': 'C',
        },
      ],
    ]),
  );

  const container = renderElements(
    <>
      <TestURLSync syncKey="foo" location={locFoo} />
      <TestURLSync syncKey="bar" location={locBar} />
      <ReadsAtom atom={atomA} />
      <ReadsAtom atom={atomB} />
      <ReadsAtom atom={atomC} />
    </>,
  );

  // Initial load will use the fallback storage for C
  expect(container.textContent).toBe('"A""B""C"');
  expectURL([
    [
      locFoo,
      {
        'recoil-url-sync listen': 'A',
        'KEY A': 'B',
        'recoil-url-sync listen to multiple storage': 'C',
      },
    ],
  ]);

  // Subscribe to new value
  await act(() =>
    gotoURL([
      [
        locFoo,
        {
          'recoil-url-sync listen': 'AA',
          'KEY A': 'B',
          'recoil-url-sync listen to multiple storage': 'C1',
        },
      ],
    ]),
  );
  expect(container.textContent).toBe('"AA""B""C1"');
  // Changing value of C caused it to sync with locBar
  expectURL([
    [
      locFoo,
      {
        'recoil-url-sync listen': 'AA',
        'KEY A': 'B',
        'recoil-url-sync listen to multiple storage': 'C1',
      },
    ],
    [
      locBar,
      {
        'recoil-url-sync listen to multiple storage': 'C1',
      },
    ],
  ]);

  // Subscribe to new value from different key
  await act(() =>
    gotoURL([
      [
        locFoo,
        {
          'recoil-url-sync listen': 'AA',
          'KEY A': 'BB',
          'recoil-url-sync listen to multiple storage': 'C1',
        },
      ],
    ]),
  );
  expectURL([
    [
      locFoo,
      {
        'recoil-url-sync listen': 'AA',
        'KEY A': 'BB',
        'recoil-url-sync listen to multiple storage': 'C1',
      },
    ],
    [
      locBar,
      {
        'recoil-url-sync listen to multiple storage': 'C1',
      },
    ],
  ]);
  expect(container.textContent).toBe('"AA""BB""C1"');
  await act(() =>
    gotoURL([
      [
        locFoo,
        {
          'recoil-url-sync listen': 'AA',
          'KEY A': 'BB',
          'KEY B': 'BBB',
          'recoil-url-sync listen to multiple storage': 'C1',
        },
      ],
    ]),
  );
  expect(container.textContent).toBe('"AA""BBB""C1"');
  await act(() =>
    gotoURL([
      [
        locFoo,
        {
          'recoil-url-sync listen': 'AA',
          'KEY A': 'IGNORE',
          'KEY B': 'BBB',
          'recoil-url-sync listen to multiple storage': 'C1',
        },
      ],
    ]),
  );
  expect(container.textContent).toBe('"AA""BBB""C1"');
  await act(() =>
    gotoURL([
      [
        locFoo,
        {
          'recoil-url-sync listen': 'AA',
          'KEY A': 'BBBB',
          'recoil-url-sync listen to multiple storage': 'C1',
        },
      ],
    ]),
  );
  expect(container.textContent).toBe('"AA""BBBB""C1"');

  // Subscribe to reset
  await act(() =>
    gotoURL([
      [
        locFoo,
        {
          'recoil-url-sync listen to multiple storage': 'C1',
        },
      ],
    ]),
  );
  expect(container.textContent).toBe('"DEFAULT""DEFAULT""C1"');

  // Subscribe to new value from different storage
  await act(() =>
    gotoURL([
      [
        locFoo,
        {
          'recoil-url-sync listen': 'AA',
          'KEY A': 'B',
          'recoil-url-sync listen to multiple storage': 'C1',
        },
      ],
      [locBar, {}],
    ]),
  );
  expect(container.textContent).toBe('"AA""B""DEFAULT"');
  await act(() =>
    gotoURL([
      [
        locFoo,
        {
          'recoil-url-sync listen to multiple storage': 'C1',
        },
      ],
      [
        locBar,
        {
          'recoil-url-sync listen to multiple storage': 'CC2',
        },
      ],
    ]),
  );
  expect(container.textContent).toBe('"DEFAULT""DEFAULT""CC2"');
  await act(() =>
    gotoURL([
      [
        locFoo,
        {
          'recoil-url-sync listen to multiple storage': 'C1',
        },
      ],
      [locBar, {}],
    ]),
  );
  expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');
  await act(() =>
    gotoURL([
      [
        locFoo,
        {
          'recoil-url-sync listen to multiple storage': 'CC1',
        },
      ],
      [locBar, {}],
    ]),
  );
  expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');
});
