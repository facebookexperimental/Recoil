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

async function testTransit(loc, contents, beforeURL, afterURL) {
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
      <ReadsAtom atom={atomBoolean} />
      <ReadsAtom atom={atomNumber} />
      <ReadsAtom atom={atomString} />
      <ReadsAtom atom={atomArray} />
      <ReadsAtom atom={atomObject} />
      <ReadsAtom atom={atomUser} />
    </>,
  );
  expect(container.textContent).toBe(contents);
  await flushPromisesAndTimers();
  expect(window.location.href).toBe(window.location.origin + afterURL);
}

describe('URL Transit Encode', () => {
  test('Anchor', async () =>
    testTransit(
      {part: 'hash'},
      'true123"STRING"[1,"a"]{"foo":[1,2]}{"prop":"CUSTOM"}',
      '/path/page.html?foo=bar',
      '/path/page.html?foo=bar#%5B%22%5E%20%22%2C%22boolean%22%2Ctrue%2C%22number%22%2C123%2C%22string%22%2C%22STRING%22%2C%22array%22%2C%5B1%2C%22a%22%5D%2C%22object%22%2C%5B%22%5E%20%22%2C%22foo%22%2C%5B1%2C2%5D%5D%2C%22user%22%2C%5B%22~%23USER%22%2C%5B%22CUSTOM%22%5D%5D%5D',
    ));
  test('Search', async () =>
    testTransit(
      {part: 'search'},
      'true123"STRING"[1,"a"]{"foo":[1,2]}{"prop":"CUSTOM"}',
      '/path/page.html#anchor',
      '/path/page.html?%5B%22%5E%20%22%2C%22boolean%22%2Ctrue%2C%22number%22%2C123%2C%22string%22%2C%22STRING%22%2C%22array%22%2C%5B1%2C%22a%22%5D%2C%22object%22%2C%5B%22%5E%20%22%2C%22foo%22%2C%5B1%2C2%5D%5D%2C%22user%22%2C%5B%22~%23USER%22%2C%5B%22CUSTOM%22%5D%5D%5D#anchor',
    ));
  test('Query Params', async () =>
    testTransit(
      {part: 'queryParams'},
      'true123"STRING"[1,"a"]{"foo":[1,2]}{"prop":"CUSTOM"}',
      '/path/page.html#anchor',
      '/path/page.html?boolean=%5B%22%7E%23%27%22%2Ctrue%5D&number=%5B%22%7E%23%27%22%2C123%5D&string=%5B%22%7E%23%27%22%2C%22STRING%22%5D&array=%5B1%2C%22a%22%5D&object=%5B%22%5E+%22%2C%22foo%22%2C%5B1%2C2%5D%5D&user=%5B%22%7E%23USER%22%2C%5B%22CUSTOM%22%5D%5D#anchor',
    ));
  test('Query Param', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      'true123"STRING"[1,"a"]{"foo":[1,2]}{"prop":"CUSTOM"}',
      '/path/page.html?foo=bar#anchor',
      '/path/page.html?foo=bar&param=%5B%22%5E+%22%2C%22boolean%22%2Ctrue%2C%22number%22%2C123%2C%22string%22%2C%22STRING%22%2C%22array%22%2C%5B1%2C%22a%22%5D%2C%22object%22%2C%5B%22%5E+%22%2C%22foo%22%2C%5B1%2C2%5D%5D%2C%22user%22%2C%5B%22%7E%23USER%22%2C%5B%22CUSTOM%22%5D%5D%5D#anchor',
    ));
});

describe('URL Transit Parse', () => {
  test('Anchor', async () =>
    testTransit(
      {part: 'hash'},
      'false456"SET"[2,"b"]{"foo":[]}{"prop":"PROP"}',
      '/#["^ ","boolean",false,"number",456,"string","SET","array",[2,"b"],"object",["^ ","foo",[]],"user",["~#USER",["PROP"]]]',
      '/#%5B%22%5E%20%22%2C%22boolean%22%2Cfalse%2C%22number%22%2C456%2C%22string%22%2C%22SET%22%2C%22array%22%2C%5B2%2C%22b%22%5D%2C%22object%22%2C%5B%22%5E%20%22%2C%22foo%22%2C%5B%5D%5D%2C%22user%22%2C%5B%22~%23USER%22%2C%5B%22PROP%22%5D%5D%5D',
    ));
  test('Search', async () =>
    testTransit(
      {part: 'search'},
      'false456"SET"[2,"b"]{"foo":[]}{"prop":"PROP"}',
      // '/?["^ ","boolean",false,"number",456,"string","SET","array",[2,"b"],"object",["^ ","foo",[]]]',
      '/?["^ ","boolean",false,"number",456,"string","SET","array",[2,"b"],"object",["^ ","foo",[]],"user",["~%23USER",["PROP"]]]',
      '/?%5B%22%5E%20%22%2C%22boolean%22%2Cfalse%2C%22number%22%2C456%2C%22string%22%2C%22SET%22%2C%22array%22%2C%5B2%2C%22b%22%5D%2C%22object%22%2C%5B%22%5E%20%22%2C%22foo%22%2C%5B%5D%5D%2C%22user%22%2C%5B%22~%23USER%22%2C%5B%22PROP%22%5D%5D%5D',
    ));
  test('Query Params', async () =>
    testTransit(
      {part: 'queryParams'},
      'false456"SET"[2,"b"]{"foo":[]}{"prop":"PROP"}',
      '/?boolean=%5B%22%7E%23%27%22%2Cfalse%5D&number=%5B%22%7E%23%27%22%2C456%5D&string=%5B%22%7E%23%27%22%2C%22SET%22%5D&array=%5B2%2C%22b%22%5D&object=%5B%22%5E+%22%2C%22foo%22%2C%5B%5D%5D&user=%5B%22%7E%23USER%22%2C%5B%22PROP%22%5D%5D',
      '/?boolean=%5B%22%7E%23%27%22%2Cfalse%5D&number=%5B%22%7E%23%27%22%2C456%5D&string=%5B%22%7E%23%27%22%2C%22SET%22%5D&array=%5B2%2C%22b%22%5D&object=%5B%22%5E+%22%2C%22foo%22%2C%5B%5D%5D&user=%5B%22%7E%23USER%22%2C%5B%22PROP%22%5D%5D',
    ));
  test('Query Param', async () =>
    testTransit(
      {part: 'queryParams', param: 'param'},
      'false456"SET"[2,"b"]{"foo":[]}{"prop":"PROP"}',
      '/?param=["^ ","boolean",false,"number",456,"string","SET","array",[2,"b"],"object",["^ ","foo",[]],"user",["~%23USER",["PROP"]]]',
      '/?param=%5B%22%5E+%22%2C%22boolean%22%2Cfalse%2C%22number%22%2C456%2C%22string%22%2C%22SET%22%2C%22array%22%2C%5B2%2C%22b%22%5D%2C%22object%22%2C%5B%22%5E+%22%2C%22foo%22%2C%5B%5D%5D%2C%22user%22%2C%5B%22%7E%23USER%22%2C%5B%22PROP%22%5D%5D%5D',
    ));
});
