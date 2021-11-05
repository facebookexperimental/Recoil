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
const err = require('./util/RecoilSync_err');
const React = require('react');
const {useCallback, useMemo} = require('react');
// $FlowExpectedError[untyped-import]
const transit = require('transit-js');

type RecoilURLSyncTrnsitOptions = $Rest<
  RecoilURLSyncOptions,
  {
    serialize: mixed => string,
    deserialize: string => mixed,
  },
>;

function useRecoilURLSyncTransit(options: RecoilURLSyncTrnsitOptions): void {
  if (options.location.part === 'href') {
    throw err('"href" location is not supported for Transit encoding');
  }

  const writer = useMemo(() => transit.writer('json'), []);
  const serialize = useCallback(x => writer.write(x), [writer]);
  const reader = useMemo(
    () =>
      transit.reader('json', {
        mapBuilder: {
          init: () => ({}),
          add: (ret, key, val) => {
            ret[key] = val;
            return ret;
          },
          finalize: ret => ret,
        },
      }),
    [],
  );
  const deserialize = useCallback(x => reader.read(x), [reader]);

  useRecoilURLSync({...options, serialize, deserialize});
}

function RecoilURLSyncTransit(props: RecoilURLSyncTrnsitOptions): React.Node {
  useRecoilURLSyncTransit(props);
  return null;
}

module.exports = {useRecoilURLSyncTransit, RecoilURLSyncTransit};
