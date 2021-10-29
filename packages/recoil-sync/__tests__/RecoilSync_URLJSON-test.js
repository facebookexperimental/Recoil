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
const {RecoilURLSyncJSON} = require('../RecoilSync_URLJSON');
const React = require('react');
const {array, boolean, number, object, string, tuple} = require('refine');

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

async function testJSON(loc, contents, beforeURL, afterURL) {
  history.replaceState(null, '', beforeURL);

  const container = renderElements(
    <>
      <RecoilURLSyncJSON location={loc} />
      <ReadsAtom atom={atomBoolean} />
      <ReadsAtom atom={atomNumber} />
      <ReadsAtom atom={atomString} />
      <ReadsAtom atom={atomArray} />
      <ReadsAtom atom={atomObject} />
    </>,
  );
  expect(container.textContent).toBe(contents);
  await flushPromisesAndTimers();
  expect(window.location.href).toBe(window.location.origin + afterURL);
}

describe('URL JSON Encode', () => {
  test('Anchor', async () =>
    testJSON(
      {part: 'hash'},
      'true123"STRING"[1,"a"]{"foo":[1,2]}',
      '/path/page.html?foo=bar',
      '/path/page.html?foo=bar#%7B%22boolean%22%3Atrue%2C%22number%22%3A123%2C%22string%22%3A%22STRING%22%2C%22array%22%3A%5B1%2C%22a%22%5D%2C%22object%22%3A%7B%22foo%22%3A%5B1%2C2%5D%7D%7D',
    ));
  test('Search', async () =>
    testJSON(
      {part: 'search'},
      'true123"STRING"[1,"a"]{"foo":[1,2]}',
      '/path/page.html#anchor',
      '/path/page.html?%7B%22boolean%22%3Atrue%2C%22number%22%3A123%2C%22string%22%3A%22STRING%22%2C%22array%22%3A%5B1%2C%22a%22%5D%2C%22object%22%3A%7B%22foo%22%3A%5B1%2C2%5D%7D%7D#anchor',
    ));
  test('Query Params', async () =>
    testJSON(
      {part: 'queryParams'},
      'true123"STRING"[1,"a"]{"foo":[1,2]}',
      '/path/page.html#anchor',
      '/path/page.html?boolean=true&number=123&string=%22STRING%22&array=%5B1%2C%22a%22%5D&object=%7B%22foo%22%3A%5B1%2C2%5D%7D#anchor',
    ));
  test('Query Param', async () =>
    testJSON(
      {part: 'queryParams', param: 'param'},
      'true123"STRING"[1,"a"]{"foo":[1,2]}',
      '/path/page.html?foo=bar#anchor',
      '/path/page.html?foo=bar&param=%7B%22boolean%22%3Atrue%2C%22number%22%3A123%2C%22string%22%3A%22STRING%22%2C%22array%22%3A%5B1%2C%22a%22%5D%2C%22object%22%3A%7B%22foo%22%3A%5B1%2C2%5D%7D%7D#anchor',
    ));
});

describe('URL JSON Parse', () => {
  test('Anchor', async () =>
    testJSON(
      {part: 'hash'},
      'false456"SET"[2,"b"]{"foo":[]}',
      '/#{"boolean":false,"number":456,"string":"SET","array":[2,"b"],"object":{"foo":[]}}',
      '/#%7B%22boolean%22%3Afalse%2C%22number%22%3A456%2C%22string%22%3A%22SET%22%2C%22array%22%3A%5B2%2C%22b%22%5D%2C%22object%22%3A%7B%22foo%22%3A%5B%5D%7D%7D',
    ));
  test('Search', async () =>
    testJSON(
      {part: 'search'},
      'false456"SET"[2,"b"]{"foo":[]}',
      '/?{"boolean":false,"number":456,"string":"SET","array":[2,"b"],"object":{"foo":[]}}',
      '/?%7B%22boolean%22%3Afalse%2C%22number%22%3A456%2C%22string%22%3A%22SET%22%2C%22array%22%3A%5B2%2C%22b%22%5D%2C%22object%22%3A%7B%22foo%22%3A%5B%5D%7D%7D',
    ));
  test('Query Params', async () =>
    testJSON(
      {part: 'queryParams'},
      'false456"SET"[2,"b"]{"foo":[]}',
      '/?boolean=false&number=456&string="SET"&array=[2,"b"]&object={"foo":[]}',
      '/?boolean=false&number=456&string=%22SET%22&array=%5B2%2C%22b%22%5D&object=%7B%22foo%22%3A%5B%5D%7D',
    ));
  test('Query Param', async () =>
    testJSON(
      {part: 'queryParams', param: 'param'},
      'false456"SET"[2,"b"]{"foo":[]}',
      '/?param={"boolean":false,"number":456,"string":"SET","array":[2,"b"],"object":{"foo":[]}}',
      '/?param=%7B%22boolean%22%3Afalse%2C%22number%22%3A456%2C%22string%22%3A%22SET%22%2C%22array%22%3A%5B2%2C%22b%22%5D%2C%22object%22%3A%7B%22foo%22%3A%5B%5D%7D%7D',
    ));
});
