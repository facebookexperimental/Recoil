/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

// TODO UPDATE IMPORTS TO USE PUBLIC INTERFACE
// TODO PUBLIC LOADABLE INTERFACE

import type {Loadable} from '../../../adt/Recoil_Loadable';
import type {LocationOption} from '../recoil-url-sync';

const {act} = require('ReactTestUtils');

const {loadableWithValue} = require('../../../adt/Recoil_Loadable');
const atom = require('../../../recoil_values/Recoil_atom');
const {
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  renderElements,
} = require('../../../testing/Recoil_TestingUtils');
const {syncEffect} = require('../recoil-sync');
const {urlSyncEffect, useRecoilURLSync} = require('../recoil-url-sync');
const React = require('react');

let atomIndex = 0;
const nextKey = () => `recoil-url-sync/${atomIndex++}`;

////////////////////////////
// Mock validation library
////////////////////////////
const validateAny = loadableWithValue;
const validateString = x =>
  typeof x === 'string' ? loadableWithValue(x) : null;
const validateNumber = x =>
  typeof x === 'number' ? loadableWithValue(x) : null;
function upgrade<From, To>(
  validate: mixed => ?Loadable<From>,
  upgrader: From => To,
): mixed => ?Loadable<To> {
  return x => validate(x)?.map(upgrader);
}

// ////////////////////////////
// // Mock Serialization
// ////////////////////////////
// Object.fromEntries() is not available in GitHub's version of Node.js (9/21/2021)
const mapToObj = map => {
  const obj = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj;
};
function TestURLSync({
  syncKey,
  location,
}: {
  syncKey?: string,
  location: LocationOption,
}) {
  useRecoilURLSync({
    syncKey,
    location,
    serialize: items =>
      `${location.part === 'href' ? '/TEST#' : ''}${encodeURI(
        JSON.stringify(mapToObj(items)),
      )}`,
    deserialize: str => {
      const stateStr = location.part === 'href' ? str.split('#')[1] : str;
      // Skip the default URL parts which don't conform to the serialized standard
      if (
        stateStr == null ||
        stateStr === 'anchor' ||
        stateStr === 'foo=bar' ||
        stateStr === 'bar'
      ) {
        return new Map();
      }
      return new Map(Object.entries(JSON.parse(decodeURI(stateStr))));
    },
  });
  return null;
}

function encodeState(obj) {
  return `${encodeURI(JSON.stringify(obj))}`;
}

function encodeURL(loc: LocationOption, obj) {
  const encoded = encodeState(obj);
  const url = new URL(window.location);
  switch (loc.part) {
    case 'href':
      url.pathname = '/TEST';
      url.hash = encoded;
      break;
    case 'hash':
      url.hash = encoded;
      break;
    case 'search': {
      const {queryParam} = loc;
      if (queryParam == null) {
        url.search = encoded;
      } else {
        const searchParams = url.searchParams;
        searchParams.set(queryParam, encoded);
        url.search = searchParams.toString();
      }
      break;
    }
  }
  return url.href;
}

function expectURL(loc, obj) {
  expect(window.location.href).toBe(encodeURL(loc, obj));
}

///////////////////////
// Tests
///////////////////////
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

    expectURL(loc, {});
    expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');

    act(() => setA('A'));
    act(() => setB('B'));
    act(() => setIgnore('IGNORE'));
    expect(container.textContent).toBe('"A""B""IGNORE"');
    expectURL(loc, {a: 'A', b: 'B'});

    act(() => resetA());
    act(() => setB('BB'));
    expect(container.textContent).toBe('"DEFAULT""BB""IGNORE"');
    expectURL(loc, {b: 'BB'});

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
    }));
  test('Write to URL - Query Search Param', () =>
    testWriteToURL({part: 'search', queryParam: 'bar'}, () => {
      expect(location.hash).toBe('#anchor');
      expect(new URL(location.href).searchParams.get('foo')).toBe('bar');
    }));

  test('Write to multiple params', async () => {
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
        <TestURLSync
          syncKey="A"
          location={{part: 'search', queryParam: 'foo'}}
        />
        <TestURLSync
          syncKey="B"
          location={{part: 'search', queryParam: 'bar'}}
        />
        <AtomA />
        <AtomB />
      </>,
    );

    act(() => setA('A'));
    act(() => setB('B'));
    const url = new URL(location.href);
    url.searchParams.set('foo', encodeState({x: 'A'}));
    url.searchParams.set('bar', encodeState({x: 'B'}));
    expect(location.href).toBe(url.href);
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
      encodeURL(loc, {
        a: 'A',
        b: 'B',
      }),
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
    testReadFromURL({part: 'search', queryParam: 'foo'}));
  test('Read from URL - Search Query Param with other param', () =>
    testReadFromURL({part: 'search', queryParam: 'bar'}));

  test('Read from URL upgrade', async () => {
    const loc = {part: 'hash'};

    // Fail validation
    const atomA = atom<string>({
      key: 'recoil-url-sync fail validation',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        // No matching sync effect
        syncEffect({restore: validateString}),
      ],
    });

    // Upgrade from number
    const atomB = atom<string>({
      key: 'recoil-url-sync upgrade number',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        // This sync effect is ignored
        syncEffect<string>({restore: upgrade(validateString, () => 'IGNORE')}),
        syncEffect<string>({restore: upgrade(validateNumber, num => `${num}`)}),
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
      encodeURL(loc, {
        'recoil-url-sync fail validation': 123,
        'recoil-url-sync upgrade number': 123,
        'recoil-url-sync upgrade string': '123',
      }),
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
    const loc1 = {part: 'search', queryParam: 'foo'};
    const loc2 = {part: 'search', queryParam: 'bar'};

    const atomA = atom<string>({
      key: 'recoil-url-sync read/write upgrade type',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        syncEffect<string>({restore: upgrade(validateNumber, num => `${num}`)}),
        syncEffect({restore: validateString}),
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
      `/test?foo=${encodeState({
        'recoil-url-sync read/write upgrade type': 123,
        'OLD KEY': 'OLD',
        'recoil-url-sync read/write upgrade storage': 'STR1',
      })}&bar=${encodeState({
        'recoil-url-sync read/write upgrade storage': 'STR2',
      })}`,
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
    expect(location.search).toEqual(
      `?foo=${encodeURIComponent(
        encodeState({
          'recoil-url-sync read/write upgrade type': 'A',
          'OLD KEY': 'B',
          'NEW KEY': 'B',
          'recoil-url-sync read/write upgrade storage': 'C',
        }),
      )}&bar=${encodeURIComponent(
        encodeState({
          'recoil-url-sync read/write upgrade storage': 'C',
        }),
      )}`,
    );

    act(() => resetA());
    act(() => resetB());
    act(() => resetC());
    expect(container.textContent).toBe('"DEFAULT""DEFAULT""DEFAULT"');
    expect(location.search).toEqual(
      `?foo=${encodeURIComponent(encodeState({}))}&bar=${encodeURIComponent(
        encodeState({}),
      )}`,
    );
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

    expect(container.textContent).toBe('"DEFAULT""INIT_AFTER"');
    expectURL(loc, {
      'recoil-url-sync persist on read default': 'DEFAULT',
      'recoil-url-sync persist on read init': 'INIT_AFTER',
    });
  });
});
