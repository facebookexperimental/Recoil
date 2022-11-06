/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

import type {RecoilURLSyncOptions} from './RecoilSync_URL';
import type {ItemSnapshot} from './RecoilSync';

const {RecoilURLSync} = require('./RecoilSync_URL');
const React = require('react');
const {useCallback} = require('react');
const err = require('recoil-shared/util/Recoil_err');
const nullthrows = require('recoil-shared/util/Recoil_nullthrows');
const queryString = require('query-string');

export type QueryStringOptions = {
  //https://github.com/sindresorhus/query-string

  // for .parse()
  arrayFormat:
    | 'none'
    | 'bracket'
    | 'index'
    | 'comma'
    | 'separator'
    | 'bracket-separator'
    | 'colon-list-separator',
  sort: boolean,

  // for stringify()
  skipEmptyString: boolean,
  skipNull: boolean,
};

export type RecoilURLSyncQueryStringOptions = $Rest<
  RecoilURLSyncOptions,
  {
    serialize: mixed => string,
    deserialize: string => mixed,
    isQueryString: boolean,
    queryStringOptions: QueryStringOptions,
  },
>;

function RecoilURLSyncQueryString(
  options: RecoilURLSyncQueryStringOptions,
): React.Node {
  if (options.location.part === 'href') {
    throw err('"href" location is not supported for query-string encoding');
  }
  if (options.location.param) {
    throw err('"param" location is not supported for query-string encoding');
  }
  const serialize = useCallback((x: ItemSnapshot) => {
    if (x === undefined) {
      return '';
    }
    return nullthrows(
      queryString.stringify(Object.fromEntries(x), {
        skipEmptyString: options.queryStringOptions.skipEmptyString,
        skipNull: options.queryStringOptions.skipNull,
      }),
      'Unable to serialize state with query-string',
    );
  }, []);
  const deserialize = useCallback((x: string) => {
    return queryString.parse(x, {
      arrayFormat: options.queryStringOptions.arrayFormat,
      parseBooleans: true,
      parseNumbers: true,
      sort: options.queryStringOptions.sort,
    });
  }, []);

  return (
    <RecoilURLSync
      {...{
        ...options,
        serialize,
        deserialize,
        isQueryString: true,
      }}
    />
  );
}

module.exports = {RecoilURLSyncQueryString};
