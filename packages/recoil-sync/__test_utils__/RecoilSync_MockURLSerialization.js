/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

// TODO UPDATE IMPORTS TO USE PUBLIC INTERFACE

import type {LocationOption} from '../RecoilSync_URL';

const {
  flushPromisesAndTimers,
} = require('../../../packages/recoil/__test_utils__/Recoil_TestingUtils');
const {useRecoilURLSync} = require('../RecoilSync_URL');
const nullthrows = require('../util/RecoilSync_nullthrows');
const React = require('react');

// ////////////////////////////
// // Mock Serialization
// ////////////////////////////

function TestURLSync({
  storeKey,
  location,
}: {
  storeKey?: string,
  location: LocationOption,
}): React.Node {
  useRecoilURLSync({
    storeKey,
    location,
    serialize: items => {
      const str = nullthrows(JSON.stringify(items));
      return location.part === 'href'
        ? `/TEST#${encodeURIComponent(str)}`
        : str;
    },
    deserialize: str => {
      const stateStr =
        location.part === 'href' ? decodeURIComponent(str.split('#')[1]) : str;
      // Skip the default URL parts which don't conform to the serialized standard.
      // 'bar' also doesn't conform, but we want to test coexistence of foreign
      // query parameters.
      if (stateStr == null || stateStr === 'anchor' || stateStr === 'foo=bar') {
        return {};
      }
      return JSON.parse(stateStr);
    },
  });
  return null;
}

function encodeState(obj) {
  return encodeURIComponent(JSON.stringify(obj));
}

function encodeURLPart(href: string, loc: LocationOption, obj): string {
  const url = new URL(href);
  switch (loc.part) {
    case 'href':
      url.pathname = '/TEST';
      url.hash = encodeState(obj);
      break;
    case 'hash':
      url.hash = encodeState(obj);
      break;
    case 'search': {
      url.search = encodeState(obj);
      break;
    }
    case 'queryParams': {
      const {param} = loc;
      const {searchParams} = url;
      if (param != null) {
        searchParams.set(param, JSON.stringify(obj));
      } else {
        for (const [key, value] of Object.entries(obj)) {
          searchParams.set(key, JSON.stringify(value) ?? '');
        }
      }
      url.search = searchParams.toString() || '?';
      break;
    }
  }
  return url.href;
}

function encodeURL(parts: Array<[LocationOption, {...}]>): string {
  let href = window.location.href;
  for (const [loc, obj] of parts) {
    href = encodeURLPart(href, loc, obj);
  }
  return href;
}

function expectURL(parts: Array<[LocationOption, {...}]>) {
  expect(window.location.href).toBe(encodeURL(parts));
}

async function gotoURL(parts: Array<[LocationOption, {...}]>) {
  history.replaceState(null, '', encodeURL(parts));
  history.pushState(null, '', '/POPSTATE');
  history.back();
  await flushPromisesAndTimers();
}

async function goBack() {
  history.back();
  await flushPromisesAndTimers();
}

module.exports = {
  TestURLSync,
  encodeURL,
  expectURL,
  gotoURL,
  goBack,
};
