/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */
'use strict';

type CssMap = {
  [string]: string | number,
};

function getEntries<T>(obj: {[string]: T}): Array<[string, T]> {
  const keys: string[] = Object.keys(obj);
  return keys.map(key => [key, obj[key]]);
}

export const getStyle = (
  source: {[key: string]: CssMap},
  entries: {[string]: boolean},
): {...} | {[string]: number | string} => {
  const classNameMap = getEntries<boolean>(entries);
  return classNameMap.reduce<CssMap>((acc, [key, val]) => {
    let nextAcc = {...acc};
    if (Boolean(val)) {
      nextAcc = {...nextAcc, ...source[key]};
    }

    return nextAcc;
  }, {});
};
