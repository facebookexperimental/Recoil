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
const React = require('react');

// ////////////////////////////
// // Mock Serialization
// ////////////////////////////

function TestURLSync({
  syncKey,
  location,
}: {
  syncKey?: string,
  location: LocationOption,
}): React.Node {
  useRecoilURLSync({
    syncKey,
    location,
    serialize: items => {
      const str = JSON.stringify(items);
      return location.part === 'href'
        ? `/TEST#${encodeURIComponent(str)}`
        : str;
    },
    deserialize: str => {
      const stateStr =
        location.part === 'href' ? decodeURIComponent(str.split('#')[1]) : str;
      // Skip the default URL parts which don't conform to the serialized standard
      if (
        stateStr == null ||
        stateStr === 'anchor' ||
        stateStr === 'foo=bar' ||
        stateStr === 'bar'
      ) {
        return {};
      }
      try {
        return JSON.parse(stateStr);
      } catch (e) {
        // eslint-disable-next-line fb-www/no-console
        console.error(
          'Error parsing: ',
          location,
          stateStr,
          decodeURI(stateStr),
        );
        throw e;
      }
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
      const {queryParam} = loc;
      if (queryParam == null) {
        url.search = encodeState(obj);
      } else {
        const searchParams = url.searchParams;
        searchParams.set(queryParam, JSON.stringify(obj));
        url.search = searchParams.toString();
      }
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
