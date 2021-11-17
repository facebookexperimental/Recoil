/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const {atom} = require('Recoil');

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
  literal,
  number,
  object,
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

async function testTransit(loc, atoms, contents, beforeURL, afterURL) {
  history.replaceState(null, '', beforeURL);

  const container = renderElements(
    <>
      <RecoilURLSyncTransit
        location={loc}
        handlers={[
          {
            tag: 'USER',
            class: MyClass,
            write: x => [x.prop],
            read: ([x]) => new MyClass(x),
          },
        ]}
      />
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
  test('Query Param - containers', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomArray, atomObject],
      '[1,"a"]{"foo":[1,2]}',
      '/path/page.html?foo=bar#anchor',
      '/path/page.html?foo=bar&param=%5B%22%5E+%22%2C%22array%22%2C%5B1%2C%22a%22%5D%2C%22object%22%2C%5B%22%5E+%22%2C%22foo%22%2C%5B1%2C2%5D%5D%5D#anchor',
    ));
  test('Query Params - containers', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomArray, atomObject],
      '[1,"a"]{"foo":[1,2]}',
      '/path/page.html#anchor',
      '/path/page.html?array=%5B1%2C%22a%22%5D&object=%5B%22%5E+%22%2C%22foo%22%2C%5B1%2C2%5D%5D#anchor',
    ));
  test('Query Param - classes', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomUser],
      '{"prop":"CUSTOM"}',
      '/path/page.html?foo=bar#anchor',
      '/path/page.html?foo=bar&param=%5B%22%5E+%22%2C%22user%22%2C%5B%22%7E%23USER%22%2C%5B%22CUSTOM%22%5D%5D%5D#anchor',
    ));
  test('Query Params - classes', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomUser],
      '{"prop":"CUSTOM"}',
      '/path/page.html#anchor',
      '/path/page.html?user=%5B%22%7E%23USER%22%2C%5B%22CUSTOM%22%5D%5D#anchor',
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
      '/?null=%5B%22%7E%23%27%22%2Cnull%5D&boolean=%5B%22%7E%23%27%22%2Cfalse%5D&number=%5B%22%7E%23%27%22%2C456%5D&string=%5B%22%7E%23%27%22%2C%22SET%22%5D',
      '/?null=%5B%22%7E%23%27%22%2Cnull%5D&boolean=%5B%22%7E%23%27%22%2Cfalse%5D&number=%5B%22%7E%23%27%22%2C456%5D&string=%5B%22%7E%23%27%22%2C%22SET%22%5D',
    ));
  test('Query Param - containers', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomArray, atomObject],
      '[2,"b"]{"foo":[]}',
      '/?param=["^ ","array",[2,"b"],"object",["^ ","foo",[]]]',
      '/?param=%5B%22%5E+%22%2C%22array%22%2C%5B2%2C%22b%22%5D%2C%22object%22%2C%5B%22%5E+%22%2C%22foo%22%2C%5B%5D%5D%5D',
    ));
  test('Query Params - containers', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomArray, atomObject],
      '[2,"b"]{"foo":[]}',
      '/?array=%5B2%2C%22b%22%5D&object=%5B%22%5E+%22%2C%22foo%22%2C%5B%5D%5D',
      '/?array=%5B2%2C%22b%22%5D&object=%5B%22%5E+%22%2C%22foo%22%2C%5B%5D%5D',
    ));
  test('Query Param - classes', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      [atomUser],
      '{"prop":"PROP"}',
      '/?param=["^ ","user",["~%23USER",["PROP"]]]',
      '/?param=%5B%22%5E+%22%2C%22user%22%2C%5B%22%7E%23USER%22%2C%5B%22PROP%22%5D%5D%5D',
    ));
  test('Query Params - classes', async () =>
    testTransit(
      {part: 'queryParams'},
      [atomUser],
      '{"prop":"PROP"}',
      '/?user=%5B%22%7E%23USER%22%2C%5B%22PROP%22%5D%5D',
      '/?user=%5B%22%7E%23USER%22%2C%5B%22PROP%22%5D%5D',
    ));
});
