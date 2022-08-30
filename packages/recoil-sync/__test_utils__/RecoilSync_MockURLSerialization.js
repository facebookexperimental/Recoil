/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

import type {BrowserInterface, LocationOption} from '../RecoilSync_URL';

const {RecoilURLSync} = require('../RecoilSync_URL');
const React = require('react');
const {useCallback} = require('react');
const {
  flushPromisesAndTimers,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');
const nullthrows = require('recoil-shared/util/Recoil_nullthrows');

// ////////////////////////////
// // Mock Serialization
// ////////////////////////////

function TestURLSync({
  storeKey,
  location,
  browserInterface,
  children = null,
}: {
  storeKey?: string,
  location: LocationOption,
  browserInterface?: BrowserInterface,
  children?: React.Node,
}): React.Node {
  const serialize = useCallback(
    items => {
      const str = nullthrows(JSON.stringify(items));
      return location.part === 'href'
        ? `/TEST#${encodeURIComponent(str)}`
        : str;
    },
    [location.part],
  );
  const deserialize = useCallback(
    str => {
      const stateStr =
        location.part === 'href' ? decodeURIComponent(str.split('#')[1]) : str;
      // Skip the default URL parts which don't conform to the serialized standard.
      // 'bar' also doesn't conform, but we want to test coexistence of foreign
      // query parameters.
      if (stateStr == null || stateStr === 'anchor' || stateStr === 'foo=bar') {
        return {};
      }
      try {
        return JSON.parse(stateStr);
      } catch {
        // Catch errors for open source CI tests which tend to keep previous tests alive so they are
        // still subscribed to URL changes from future tests and may get invalid JSON as a result.
        return {error: 'PARSE ERROR'};
      }
    },
    [location.part],
  );

  return (
    <RecoilURLSync
      {...{
        storeKey,
        location,
        serialize,
        deserialize,
        browserInterface,
      }}>
      {children}
    </RecoilURLSync>
  );
}

function encodeState(obj: {...}) {
  return encodeURIComponent(JSON.stringify(obj));
}

function encodeURLPart(href: string, loc: LocationOption, obj: {...}): string {
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
      url.search = searchParams.toString();
      break;
    }
  }
  return url.href;
}

function encodeURL(
  parts: Array<[LocationOption, {...}]>,
  url: string = window.location.href,
): string {
  let href = url;
  for (const [loc, obj] of parts) {
    href = encodeURLPart(href, loc, obj);
  }
  return href;
}

function expectURL(
  parts: Array<[LocationOption, {...}]>,
  url: string = window.location.href,
) {
  expect(url).toBe(encodeURL(parts, url));
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
