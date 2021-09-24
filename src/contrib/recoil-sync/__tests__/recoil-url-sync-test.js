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

const {
  upgrade,
  validateAny,
  validateNumber,
  validateString,
} = require('../__test_utils__/recoil-sync_mockValidation');
const {
  TestURLSync,
  encodeURL,
  expectURL,
} = require('../__test_utils__/recoil-url-sync_mockSerialization');
const atom = require('../../../recoil_values/Recoil_atom');
const {
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers,
  renderElements,
} = require('../../../testing/Recoil_TestingUtils');
const {syncEffect} = require('../recoil-sync');
const {urlSyncEffect} = require('../recoil-url-sync');
const React = require('react');

let atomIndex = 0;
const nextKey = () => `recoil-url-sync/${atomIndex++}`;

describe('Test URL Persistence', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/path/page.html?foo=bar#anchor');
  });

  function testWriteToURL(loc, remainder) {
    const atomA = atom({
      key: nextKey(),
      default: 'DEFAULT',
      effects_UNSTABLE: [urlSyncEffect({key: 'a', restore: validateAny})],
    });
    const atomB = atom({
      key: nextKey(),
      default: 'DEFAULT',
      effects_UNSTABLE: [urlSyncEffect({key: 'b', restore: validateAny})],
    });
    const ignoreAtom = atom({
      key: nextKey(),
      default: 'DEFAULT',
    });

    const [AtomA, setA, resetA] = componentThatReadsAndWritesAtom(atomA);
    const [AtomB, setB] = componentThatReadsAndWritesAtom(atomB);
    const [IgnoreAtom, setIgnore] = componentThatReadsAndWritesAtom(ignoreAtom);
    const container = renderElements(
      <>
        <TestURLSync location={loc} />
        <AtomA />
        <AtomB />
        <IgnoreAtom />
      </>,
    );

    expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');

    act(() => setA('A'));
    act(() => setB('B'));
    act(() => setIgnore('IGNORE'));
    expect(container.textContent).toBe('"A""B""IGNORE"');
    expectURL([[loc, {a: 'A', b: 'B'}]]);

    act(() => resetA());
    act(() => setB('BB'));
    expect(container.textContent).toBe('"DEFAULT""BB""IGNORE"');
    expectURL([[loc, {b: 'BB'}]]);

    remainder();
  }

  test('Write to URL', () =>
    testWriteToURL({part: 'href'}, () => {
      expect(location.search).toBe('');
      expect(location.pathname).toBe('/TEST');
    }));
  test('Write to URL - Anchor Hash', () =>
    testWriteToURL({part: 'hash'}, () => {
      expect(location.search).toBe('?foo=bar');
    }));
  test('Write to URL - Query Search', () =>
    testWriteToURL({part: 'search'}, () => {
      expect(location.hash).toBe('#anchor');
      expect(new URL(location.href).searchParams.get('foo')).toBe(null);
      expect(new URL(location.href).searchParams.get('bar')).toBe(null);
    }));
  test('Write to URL - Query Search Param', () =>
    testWriteToURL({part: 'search', queryParam: 'bar'}, () => {
      expect(location.hash).toBe('#anchor');
      expect(new URL(location.href).searchParams.get('foo')).toBe('bar');
    }));

  test('Write to multiple params', async () => {
    const locA = {part: 'search', queryParam: 'paramA'};
    const locB = {part: 'search', queryParam: 'paramB'};
    const atomA = atom({
      key: 'recoil-url-sync multiple param A',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        syncEffect({syncKey: 'A', key: 'x', restore: validateAny}),
      ],
    });
    const atomB = atom({
      key: 'recoil-url-sync multiple param B',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        syncEffect({syncKey: 'B', key: 'x', restore: validateAny}),
      ],
    });

    const [AtomA, setA] = componentThatReadsAndWritesAtom(atomA);
    const [AtomB, setB] = componentThatReadsAndWritesAtom(atomB);
    renderElements(
      <>
        <TestURLSync syncKey="A" location={locA} />
        <TestURLSync syncKey="B" location={locB} />
        <AtomA />
        <AtomB />
      </>,
    );

    act(() => setA('A'));
    act(() => setB('B'));
    expectURL([
      [locA, {x: 'A'}],
      [locB, {x: 'B'}],
    ]);
  });

  function testReadFromURL(loc) {
    const atomA = atom({
      key: nextKey(),
      default: 'DEFAULT',
      effects_UNSTABLE: [syncEffect({key: 'a', restore: validateAny})],
    });
    const atomB = atom({
      key: nextKey(),
      default: 'DEFAULT',
      effects_UNSTABLE: [syncEffect({key: 'b', restore: validateAny})],
    });
    const atomC = atom({
      key: nextKey(),
      default: 'DEFAULT',
      effects_UNSTABLE: [syncEffect({key: 'c', restore: validateAny})],
    });

    history.replaceState(
      null,
      '',
      encodeURL([
        [
          loc,
          {
            a: 'A',
            b: 'B',
          },
        ],
      ]),
    );

    const container = renderElements(
      <>
        <TestURLSync location={loc} />
        <ReadsAtom atom={atomA} />
        <ReadsAtom atom={atomB} />
        <ReadsAtom atom={atomC} />
      </>,
    );

    expect(container.textContent).toBe('"A""B""DEFAULT"');
  }

  test('Read from URL', () => testReadFromURL({part: 'href'}));
  test('Read from URL - Anchor Hash', () => testReadFromURL({part: 'hash'}));
  test('Read from URL - Search Query', () => testReadFromURL({part: 'search'}));
  test('Read from URL - Search Query Param', () =>
    testReadFromURL({part: 'search', queryParam: 'param'}));
  test('Read from URL - Search Query Param with other param', () =>
    testReadFromURL({part: 'search', queryParam: 'other'}));

  test('Read from URL upgrade', async () => {
    const loc = {part: 'hash'};

    // Fail validation
    const atomA = atom<string>({
      key: 'recoil-url-sync fail validation',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        // No matching sync effect
        syncEffect<string>({restore: validateString}),
      ],
    });

    // Upgrade from number
    const atomB = atom<string>({
      key: 'recoil-url-sync upgrade number',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        // This sync effect is ignored
        syncEffect<string>({restore: upgrade(validateString, () => 'IGNORE')}),
        syncEffect<string>({
          restore: upgrade<number, string>(validateNumber, num => `${num}`),
        }),
        // This sync effect is ignored
        syncEffect<string>({restore: upgrade(validateString, () => 'IGNORE')}),
      ],
    });

    // Upgrade from string
    const atomC = atom<number>({
      key: 'recoil-url-sync upgrade string',
      default: 0,
      effects_UNSTABLE: [
        // This sync effect is ignored
        syncEffect<number>({restore: upgrade(validateNumber, () => 999)}),
        syncEffect<number>({
          restore: upgrade(validateString, str => Number(str)),
        }),
        // This sync effect is ignored
        syncEffect<number>({restore: upgrade(validateNumber, () => 999)}),
      ],
    });

    history.replaceState(
      null,
      '',
      encodeURL([
        [
          loc,
          {
            'recoil-url-sync fail validation': 123,
            'recoil-url-sync upgrade number': 123,
            'recoil-url-sync upgrade string': '123',
          },
        ],
      ]),
    );

    const container = renderElements(
      <>
        <TestURLSync location={loc} />
        <ReadsAtom atom={atomA} />
        <ReadsAtom atom={atomB} />
        <ReadsAtom atom={atomC} />
      </>,
    );

    expect(container.textContent).toBe('"DEFAULT""123"123');
  });

  test('Read/Write from URL with upgrade', async () => {
    const loc1 = {part: 'search', queryParam: 'param1'};
    const loc2 = {part: 'search', queryParam: 'param2'};

    const atomA = atom<string>({
      key: 'recoil-url-sync read/write upgrade type',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        syncEffect<string>({
          restore: upgrade<number, string>(validateNumber, num => `${num}`),
        }),
        syncEffect<string>({restore: validateString}),
      ],
    });
    const atomB = atom({
      key: 'recoil-url-sync read/write upgrade key',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        syncEffect({key: 'OLD KEY', restore: validateAny}),
        syncEffect({key: 'NEW KEY', restore: validateAny}),
      ],
    });
    const atomC = atom({
      key: 'recoil-url-sync read/write upgrade storage',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        syncEffect({restore: validateAny}),
        syncEffect({syncKey: 'SYNC_2', restore: validateAny}),
      ],
    });

    history.replaceState(
      null,
      '',
      encodeURL([
        [
          loc1,
          {
            'recoil-url-sync read/write upgrade type': 123,
            'OLD KEY': 'OLD',
            'recoil-url-sync read/write upgrade storage': 'STR1',
          },
        ],
        [
          loc2,
          {
            'recoil-url-sync read/write upgrade storage': 'STR2',
          },
        ],
      ]),
    );

    const [AtomA, setA, resetA] = componentThatReadsAndWritesAtom(atomA);
    const [AtomB, setB, resetB] = componentThatReadsAndWritesAtom(atomB);
    const [AtomC, setC, resetC] = componentThatReadsAndWritesAtom(atomC);
    const container = renderElements(
      <>
        <TestURLSync location={loc1} />
        <TestURLSync location={loc2} syncKey="SYNC_2" />
        <AtomA />
        <AtomB />
        <AtomC />
      </>,
    );

    expect(container.textContent).toBe('"123""OLD""STR2"');

    act(() => setA('A'));
    act(() => setB('B'));
    act(() => setC('C'));
    expect(container.textContent).toBe('"A""B""C"');
    expectURL([
      [
        loc1,
        {
          'recoil-url-sync read/write upgrade type': 'A',
          'OLD KEY': 'B',
          'NEW KEY': 'B',
          'recoil-url-sync read/write upgrade storage': 'C',
        },
      ],
      [
        loc2,
        {
          'recoil-url-sync read/write upgrade storage': 'C',
        },
      ],
    ]);

    act(() => resetA());
    act(() => resetB());
    act(() => resetC());
    expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');
    expectURL([
      [loc1, {}],
      [loc2, {}],
    ]);
  });

  test('Persist default on read', async () => {
    const loc = {part: 'hash'};

    const atomA = atom({
      key: 'recoil-url-sync persist on read default',
      default: 'DEFAULT',
      effects_UNSTABLE: [syncEffect({restore: validateAny, syncDefault: true})],
    });
    const atomB = atom({
      key: 'recoil-url-sync persist on read init',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        ({setSelf}) => setSelf('INIT_BEFORE'),
        syncEffect({restore: validateAny, syncDefault: true}),
        ({setSelf}) => setSelf('INIT_AFTER'),
      ],
    });

    const container = renderElements(
      <>
        <TestURLSync location={loc} />
        <ReadsAtom atom={atomA} />
        <ReadsAtom atom={atomB} />
      </>,
    );

    await flushPromisesAndTimers();
    expect(container.textContent).toBe('"DEFAULT""INIT_AFTER"');
    expectURL([
      [
        loc,
        {
          'recoil-url-sync persist on read default': 'DEFAULT',
          'recoil-url-sync persist on read init': 'INIT_AFTER',
        },
      ],
    ]);
  });
});
