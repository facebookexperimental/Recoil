/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {RecoilURLSyncOptions} from './RecoilSync_URL';

const {useRecoilURLSync} = require('./RecoilSync_URL');
const React = require('react');
const {useCallback} = require('react');
const err = require('recoil-shared/util/Recoil_err');
const nullthrows = require('recoil-shared/util/Recoil_nullthrows');

export type RecoilURLSyncJSONOptions = $Rest<
  RecoilURLSyncOptions,
  {
    serialize: mixed => string,
    deserialize: string => mixed,
  },
>;

function useRecoilURLSyncJSON(options: RecoilURLSyncJSONOptions): void {
  if (options.location.part === 'href') {
    throw err('"href" location is not supported for JSON encoding');
  }
  const serialize = useCallback(
    x =>
      x === undefined
        ? ''
        : nullthrows(JSON.stringify(x), 'Unable to serialize state with JSON'),
    [],
  );
  const deserialize = useCallback(x => JSON.parse(x), []);
  useRecoilURLSync({...options, serialize, deserialize});
}

function RecoilURLSyncJSON(props: RecoilURLSyncJSONOptions): React.Node {
  useRecoilURLSyncJSON(props);
  return null;
}

module.exports = {useRecoilURLSyncJSON, RecoilURLSyncJSON};
