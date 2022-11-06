/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

import type {LocationOption} from '../RecoilSync_URL';

const {atom} = require('Recoil');

const {syncEffect} = require('../RecoilSync');
const {RecoilURLSyncQueryString} = require('../RecoilSync_URLQueryString');
const React = require('react');
const {
  ReadsAtom,
  flushPromisesAndTimers,
  renderElements,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');
const {
  array,
  bool,
  jsonDate,
  literal,
  number,
  object,
  string,
  tuple,
} = require('refine');

const atomUndefined = atom({
  key: 'void',
  default: undefined,
  effects: [syncEffect({refine: literal(undefined), syncDefault: true})],
});
const atomNull = atom({
  key: 'null',
  default: null,
  effects: [syncEffect({refine: literal(null), syncDefault: true})],
});
const atomBoolean = atom({
  key: 'boolean',
  default: true,
  effects: [syncEffect({refine: bool(), syncDefault: true})],
});
const atomNumber = atom({
  key: 'number',
  default: 123,
  effects: [syncEffect({refine: number(), syncDefault: true})],
});
const atomString = atom({
  key: 'string',
  default: 'STRING',
  effects: [syncEffect({refine: string(), syncDefault: true})],
});
const atomArray = atom({
  key: 'array',
  default: [1, 'a'],
  effects: [syncEffect({refine: tuple(number(), string()), syncDefault: true})],
});
const atomDate = atom({
  key: 'date',
  default: new Date('7:00 GMT October 26, 1985'),
  effects: [syncEffect({refine: jsonDate(), syncDefault: true})],
});

async function testQueryString(
  loc: LocationOption,
  contents: string,
  beforeURL: string,
  afterURL: string,
) {
  history.replaceState(null, '', beforeURL);

  const container = renderElements(
    <RecoilURLSyncQueryString
      location={loc}
      queryStringOptions={{
        arrayFormat: 'none',
        parseBooleans: true,
        sort: true,
        skipEmptyString: false,
        skipNull: false,
      }}>
      <ReadsAtom atom={atomUndefined} />
      <ReadsAtom atom={atomNull} />
      <ReadsAtom atom={atomBoolean} />
      <ReadsAtom atom={atomNumber} />
      <ReadsAtom atom={atomString} />
      <ReadsAtom atom={atomArray} />
      <ReadsAtom atom={atomDate} />
    </RecoilURLSyncQueryString>,
  );

  expect(container.textContent).toBe(contents);
  await flushPromisesAndTimers();
  expect(window.location.href).toBe(window.location.origin + afterURL);
}

describe('URL Query-String Encode', () => {
  test('Anchor', async () =>
    testQueryString(
      {part: 'queryParams'},
      'nulltrue123"STRING"[1,"a"]"1985-10-26T07:00:00.000Z"',
      '/path/page.html?foo=bar',
      '/path/page.html?array=1&array=a&boolean=true&date=Sat%20Oct%2026%201985%2000%3A00%3A00%20GMT-0700%20%28Pacific%20Daylight%20Time%29&null&number=123&string=STRING',
    ));
  test('Search', async () =>
    testQueryString(
      {part: 'search'},
      'nulltrue123"STRING"[1,"a"]"1985-10-26T07:00:00.000Z"',
      '/path/page.html#anchor',
      '/path/page.html?array%3D1%26array%3Da%26boolean%3Dtrue%26date%3DSat%2520Oct%252026%25201985%252000%253A00%253A00%2520GMT-0700%2520%2528Pacific%2520Daylight%2520Time%2529%26null%26number%3D123%26string%3DSTRING#anchor',
    ));
  test('Query Params', async () =>
    testQueryString(
      {part: 'queryParams'},
      'nulltrue123"STRING"[1,"a"]"1985-10-26T07:00:00.000Z"',
      '/path/page.html#anchor',
      '/path/page.html?array=1&array=a&boolean=true&date=Sat%20Oct%2026%201985%2000%3A00%3A00%20GMT-0700%20%28Pacific%20Daylight%20Time%29&null&number=123&string=STRING#anchor',
    ));
});

describe('URL Query-String Parse', () => {
  test('Anchor', async () =>
    testQueryString(
      {part: 'hash'},
      'nullfalse456"SET"[2,"b"]"1955-11-05T07:00:00.000Z"',
      '/#array=2&array=b&boolean=false&date=1955-11-05T07%3A00%3A00.000Z&null&number=456&string=SET',
      '/#array%3D2%26array%3Db%26boolean%3Dfalse%26date%3DFri%2520Nov%252004%25201955%252023%253A00%253A00%2520GMT-0800%2520%2528Pacific%2520Daylight%2520Time%2529%26null%26number%3D456%26string%3DSET',
    ));
  test('Search', async () =>
    testQueryString(
      {part: 'search'},
      'nullfalse456"SET"[2,"b"]"1955-11-05T07:00:00.000Z"',
      '/?array=2&array=b&boolean=false&date=1955-11-05T07%3A00%3A00.000Z&null&number=456&string=SET',
      '/?array%3D2%26array%3Db%26boolean%3Dfalse%26date%3DFri%2520Nov%252004%25201955%252023%253A00%253A00%2520GMT-0800%2520%2528Pacific%2520Daylight%2520Time%2529%26null%26number%3D456%26string%3DSET',
    ));
  test('Query Params', async () =>
    testQueryString(
      {part: 'queryParams'},
      'nullfalse456"SET"[2,"b"]"1955-11-05T07:00:00.000Z"',
      '/?array=2&array=b&boolean=false&date=1955-11-05T07%3A00%3A00.000Z&null&number=456&string=SET',
      '/?array=2&array=b&boolean=false&date=Fri%20Nov%2004%201955%2023%3A00%3A00%20GMT-0800%20%28Pacific%20Daylight%20Time%29&null&number=456&string=SET',
    ));
});
