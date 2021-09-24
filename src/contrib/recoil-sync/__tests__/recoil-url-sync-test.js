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

// import type {Loadable} from '../../../adt/Recoil_Loadable';
import type {LocationOption} from '../recoil-url-sync';

const {act} = require('ReactTestUtils');

const {loadableWithValue} = require('../../../adt/Recoil_Loadable');
const atom = require('../../../recoil_values/Recoil_atom');
const {
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
// const validateString = x =>
//   typeof x === 'string' ? loadableWithValue(x) : null;
// const validateNumber = x =>
//   typeof x === 'number' ? loadableWithValue(x) : null;
// function upgrade<From, To>(
//   validate: mixed => ?Loadable<From>,
//   upgrade: From => To,
// ): mixed => ?Loadable<To> {
//   return x => validate(x)?.map(upgrade);
// }

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
  });
  return null;
}

function encodeState(obj) {
  return `${encodeURI(JSON.stringify(obj))}`;
}

function encodeURL(loc, obj) {
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
        // const searchParams = new URLSearchParams(location.search);
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
});
