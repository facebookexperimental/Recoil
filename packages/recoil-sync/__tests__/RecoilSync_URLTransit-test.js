/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const {atom, selector} = require('Recoil');

const {
  ReadsAtom,
  flushPromisesAndTimers,
  renderElements,
} = require('../../../packages/recoil/__test_utils__/Recoil_TestingUtils');
const {syncEffect} = require('../RecoilSync');
const {RecoilURLSyncTransit} = require('../RecoilSync_URLTransit');
const React = require('react');
const {
  array,
  boolean,
  custom,
  date,
  literal,
  map,
  number,
  object,
  set,
  string,
  tuple,
} = require('refine');

class MyClass {
  prop;
  constructor(msg: string) {
    this.prop = msg;
  }
}

const atomNull = atom({
  key: 'null',
  default: null,
  effects_UNSTABLE: [syncEffect({refine: literal(null), syncDefault: true})],
});
const atomBoolean = atom({
  key: 'boolean',
  default: true,
  effects_UNSTABLE: [syncEffect({refine: boolean(), syncDefault: true})],
});
const atomNumber = atom({
  key: 'number',
  default: 123,
  effects_UNSTABLE: [syncEffect({refine: number(), syncDefault: true})],
});
const atomString = atom({
  key: 'string',
  default: 'STRING',
  effects_UNSTABLE: [syncEffect({refine: string(), syncDefault: true})],
});
const atomArray = atom({
  key: 'array',
  default: [1, 'a'],
  effects_UNSTABLE: [
    syncEffect({refine: tuple(number(), string()), syncDefault: true}),
  ],
});
const atomObject = atom({
  key: 'object',
  default: {foo: [1, 2]},
  effects_UNSTABLE: [
    syncEffect({refine: object({foo: array(number())}), syncDefault: true}),
  ],
});
const atomSet = atom({
  key: 'set',
  default: new Set([1, 2]),
  effects_UNSTABLE: [syncEffect({refine: set(number()), syncDefault: true})],
});
const atomMap = atom({
  key: 'map',
  default: new Map([[1, 'a']]),
  effects_UNSTABLE: [
    syncEffect({refine: map(number(), string()), syncDefault: true}),
  ],
});
const atomDate = atom({
  key: 'date',
  default: new Date('October 26, 1985'),
  effects_UNSTABLE: [syncEffect({refine: date(), syncDefault: true})],
});
const atomUser = atom({
  key: 'user',
  default: new MyClass('CUSTOM'),
  effects_UNSTABLE: [
    syncEffect({
      refine: custom(x => (x instanceof MyClass ? x : null)),
      syncDefault: true,
    }),
  ],
});
const atomWithFallback = atom({
  key: 'withFallback',
  default: selector({key: 'fallback selector', get: () => 'FALLBACK'}),
  effects_UNSTABLE: [syncEffect({refine: string(), syncDefault: true})],
});

const HANDLERS = [
  {
    tag: 'USER',
    class: MyClass,
    write: x => [x.prop],
    read: ([x]) => new MyClass(x),
  },
];

async function testTransit(loc, atoms, contents, beforeURL, afterURL) {
  history.replaceState(null, '', beforeURL);

  const container = renderElements(
    <>
      <RecoilURLSyncTransit location={loc} handlers={HANDLERS} />
      {atoms.map(testAtom => (
        <ReadsAtom atom={testAtom} />
      ))}
    </>,
  );
  expect(container.textContent).toBe(contents);
  await flushPromisesAndTimers();
  expect(window.location.href).toBe(window.location.origin + afterURL);
}

describe('URL Transit Encode', () => {
  test('Anchor - primitives', async () =>
    testTransit(
      {part: 'hash'},
      [atomNull, atomBoolean, atomNumber, atomString],
      'nulltrue123"STRING"',
      '/path/page.html?foo=bar',
      '/path/page.html?foo=bar#%5B%22%5E%20%22%2C%22null%22%2Cnull%2C%22boolean%22%2Ctrue%2C%22number%22%2C123%2C%22string%22%2C%22STRING%22%5D',
    ));
  test('Search - primitives', async () =>
    testTransit(
      {part: 'search'},
      [atomNull, atomBoolean, atomNumber, atomString],
      'nulltrue123"STRING"',
      '/path/page.html#anchor',
      '/path/page.html?%5B%22%5E%20%22%2C%22null%22%2Cnull%2C%22boolean%22%2Ctrue%2C%22number%22%2C123%2C%22string%22%2C%22STRING%22%5D#anchor',
    ));
  test('Query Param - primitives', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomNull, atomBoolean, atomNumber, atomString],
      'nulltrue123"STRING"',
      '/path/page.html?foo=bar#anchor',
      '/path/page.html?foo=bar&param=%5B%22%5E+%22%2C%22null%22%2Cnull%2C%22boolean%22%2Ctrue%2C%22number%22%2C123%2C%22string%22%2C%22STRING%22%5D#anchor',
    ));
  test('Query Params - primitives', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomNull, atomBoolean, atomNumber, atomString],
      'nulltrue123"STRING"',
      '/path/page.html#anchor',
      '/path/page.html?null=%5B%22%7E%23%27%22%2Cnull%5D&boolean=%5B%22%7E%23%27%22%2Ctrue%5D&number=%5B%22%7E%23%27%22%2C123%5D&string=%5B%22%7E%23%27%22%2C%22STRING%22%5D#anchor',
    ));

  test('Query Param - objects', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomArray, atomObject],
      '[1,"a"]{"foo":[1,2]}',
      '/path/page.html?foo=bar#anchor',
      '/path/page.html?foo=bar&param=%5B%22%5E+%22%2C%22array%22%2C%5B1%2C%22a%22%5D%2C%22object%22%2C%5B%22%5E+%22%2C%22foo%22%2C%5B1%2C2%5D%5D%5D#anchor',
    ));
  test('Query Params - objects', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomArray, atomObject],
      '[1,"a"]{"foo":[1,2]}',
      '/path/page.html#anchor',
      '/path/page.html?array=%5B1%2C%22a%22%5D&object=%5B%22%5E+%22%2C%22foo%22%2C%5B1%2C2%5D%5D#anchor',
    ));

  test('Query Param - containers', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomSet, atomMap],
      '[1,2]{"1":"a"}',
      '/path/page.html?foo=bar#anchor',
      '/path/page.html?foo=bar&param=%5B%22%5E+%22%2C%22set%22%2C%5B%22%7E%23Set%22%2C%5B1%2C2%5D%5D%2C%22map%22%2C%5B%22%7E%23Map%22%2C%5B%5B1%2C%22a%22%5D%5D%5D%5D#anchor',
    ));
  test('Query Params - containers', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomSet, atomMap],
      '[1,2]{"1":"a"}',
      '/path/page.html#anchor',
      '/path/page.html?set=%5B%22%7E%23Set%22%2C%5B1%2C2%5D%5D&map=%5B%22%7E%23Map%22%2C%5B%5B1%2C%22a%22%5D%5D%5D#anchor',
    ));

  test('Query Param - classes', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomDate, atomUser],
      '"1985-10-26T07:00:00.000Z"{"prop":"CUSTOM"}',
      '/path/page.html?foo=bar#anchor',
      '/path/page.html?foo=bar&param=%5B%22%5E+%22%2C%22date%22%2C%5B%22%7E%23Date%22%2C%221985-10-26T07%3A00%3A00.000Z%22%5D%2C%22user%22%2C%5B%22%7E%23USER%22%2C%5B%22CUSTOM%22%5D%5D%5D#anchor',
    ));
  test('Query Params - classes', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomDate, atomUser],
      '"1985-10-26T07:00:00.000Z"{"prop":"CUSTOM"}',
      '/path/page.html#anchor',
      '/path/page.html?date=%5B%22%7E%23Date%22%2C%221985-10-26T07%3A00%3A00.000Z%22%5D&user=%5B%22%7E%23USER%22%2C%5B%22CUSTOM%22%5D%5D#anchor',
    ));

  test('Query Param - fallback', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomWithFallback],
      '"FALLBACK"',
      '/path/page.html?foo=bar#anchor',
      '/path/page.html?foo=bar&param=%5B%22%5E+%22%2C%22withFallback%22%2C%5B%22%7E%23__DV%22%2C0%5D%5D#anchor',
    ));
  test('Query Params - fallback', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomWithFallback],
      '"FALLBACK"',
      '/path/page.html#anchor',
      '/path/page.html?withFallback=%5B%22%7E%23__DV%22%2C0%5D#anchor',
    ));
});

describe('URL Transit Parse', () => {
  test('Anchor - primitives', async () =>
    testTransit(
      {part: 'hash'},
      [atomNull, atomBoolean, atomNumber, atomString],
      'nullfalse456"SET"',
      '/#["^ ","null",null,"boolean",false,"number",456,"string","SET"]',
      '/#%5B%22%5E%20%22%2C%22null%22%2Cnull%2C%22boolean%22%2Cfalse%2C%22number%22%2C456%2C%22string%22%2C%22SET%22%5D',
    ));
  test('Search - primitives', async () =>
    testTransit(
      {part: 'search'},
      [atomNull, atomBoolean, atomNumber, atomString],
      'nullfalse456"SET"',
      '/?["^ ","null",null,"boolean",false,"number",456,"string","SET"]',
      '/?%5B%22%5E%20%22%2C%22null%22%2Cnull%2C%22boolean%22%2Cfalse%2C%22number%22%2C456%2C%22string%22%2C%22SET%22%5D',
    ));
  test('Query Param - primitives', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomNull, atomBoolean, atomNumber, atomString],
      'nullfalse456"SET"',
      '/?param=["^ ","null",null,"boolean",false,"number",456,"string","SET"]',
      '/?param=%5B%22%5E+%22%2C%22null%22%2Cnull%2C%22boolean%22%2Cfalse%2C%22number%22%2C456%2C%22string%22%2C%22SET%22%5D',
    ));
  test('Query Params - primitives', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomNull, atomBoolean, atomNumber, atomString],
      'nullfalse456"SET"',
      '/?null=["~%23\'",null]&boolean=["~%23\'",false]&number=["~%23\'",456]&string=["~%23\'","SET"]',
      '/?null=%5B%22%7E%23%27%22%2Cnull%5D&boolean=%5B%22%7E%23%27%22%2Cfalse%5D&number=%5B%22%7E%23%27%22%2C456%5D&string=%5B%22%7E%23%27%22%2C%22SET%22%5D',
    ));

  test('Query Param - objects', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomArray, atomObject],
      '[2,"b"]{"foo":[]}',
      '/?param=["^ ","array",[2,"b"],"object",["^ ","foo",[]]]',
      '/?param=%5B%22%5E+%22%2C%22array%22%2C%5B2%2C%22b%22%5D%2C%22object%22%2C%5B%22%5E+%22%2C%22foo%22%2C%5B%5D%5D%5D',
    ));
  test('Query Params - objects', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomArray, atomObject],
      '[2,"b"]{"foo":[]}',
      '/?array=[2,"b"]&object=["^+","foo",[]]',
      '/?array=%5B2%2C%22b%22%5D&object=%5B%22%5E+%22%2C%22foo%22%2C%5B%5D%5D',
    ));

  test('Query Param - containers', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomSet, atomMap],
      '[3,4]{"2":"b"}',
      '/?param=["^+","set",["~%23Set",[3,4]],"map",["~%23Map",[[2,"b"]]]]',
      '/?param=%5B%22%5E+%22%2C%22set%22%2C%5B%22%7E%23Set%22%2C%5B3%2C4%5D%5D%2C%22map%22%2C%5B%22%7E%23Map%22%2C%5B%5B2%2C%22b%22%5D%5D%5D%5D',
    ));
  test('Query Params - containers', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomSet, atomMap],
      '[3,4]{"2":"b"}',
      '/?set=["~%23Set",[3,4]]&map=["~%23Map",[[2,"b"]]]',
      '/?set=%5B%22%7E%23Set%22%2C%5B3%2C4%5D%5D&map=%5B%22%7E%23Map%22%2C%5B%5B2%2C%22b%22%5D%5D%5D',
    ));

  test('Query Param - classes', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomDate, atomUser],
      '"1955-11-05T07:00:00.000Z"{"prop":"PROP"}',
      '/?param=["^ ","date",["~%23Date","1955-11-05T07:00:00.000Z"],"user",["~%23USER",["PROP"]]]',
      '/?param=%5B%22%5E+%22%2C%22date%22%2C%5B%22%7E%23Date%22%2C%221955-11-05T07%3A00%3A00.000Z%22%5D%2C%22user%22%2C%5B%22%7E%23USER%22%2C%5B%22PROP%22%5D%5D%5D',
    ));
  test('Query Params - classes', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomDate, atomUser],
      '"1955-11-05T07:00:00.000Z"{"prop":"PROP"}',
      '/?date=["~%23Date","1955-11-05T07:00:00.000Z"]&user=["~%23USER",["PROP"]]',
      '/?date=%5B%22%7E%23Date%22%2C%221955-11-05T07%3A00%3A00.000Z%22%5D&user=%5B%22%7E%23USER%22%2C%5B%22PROP%22%5D%5D',
    ));

  test('Query Param - fallback', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomWithFallback],
      '"SET"',
      '/?param=["^ ","withFallback","SET"]',
      '/?param=%5B%22%5E+%22%2C%22withFallback%22%2C%22SET%22%5D',
    ));
  test('Query Params - fallback', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomWithFallback],
      '"SET"',
      '/?withFallback="SET"',
      '/?withFallback=%5B%22%7E%23%27%22%2C%22SET%22%5D',
    ));
});
