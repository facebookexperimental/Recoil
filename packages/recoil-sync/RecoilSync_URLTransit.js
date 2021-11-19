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
const transit = require('transit-js');

type Handler<T, S> = {
  tag: string,
  class: Class<T>,
  write: T => S,
  read: S => T,
};

type RecoilURLSyncTrnsitOptions = $Rest<
  {
    ...RecoilURLSyncOptions,
    // $FlowIssue[unclear-type]
    handlers?: $ReadOnlyArray<Handler<any, any>>,
  },
  {
    serialize: mixed => string,
    deserialize: string => mixed,
  },
>;

const BUILTIN_HANDLERS = [
  {
    tag: 'Date',
    class: Date,
    write: x => x.toISOString(),
    read: str => new Date(str),
  },
];

function useRecoilURLSyncTransit({
  handlers: handlersProp = [],
  ...options
}: RecoilURLSyncTrnsitOptions): void {
  if (options.location.part === 'href') {
    throw err('"href" location is not supported for Transit encoding');
  }

  const handlers = useMemo(
    () => [...BUILTIN_HANDLERS, ...handlersProp],
    [handlersProp],
  );

  const writer = useMemo(
    () =>
      transit.writer('json', {
        handlers: transit.map(
          handlers
            .map(handler => [
              handler.class,
              transit.makeWriteHandler({
                tag: () => handler.tag,
                rep: handler.write,
              }),
            ])
            .flat(1),
        ),
      }),
    [handlers],
  );
  const serialize = useCallback(x => writer.write(x), [writer]);

  const reader = useMemo(
    () =>
      transit.reader('json', {
        handlers: handlers.reduce((c, {tag, read}) => {
          c[tag] = read;
          return c;
        }, {}),
        mapBuilder: {
          init: () => ({}),
          add: (ret, key, val) => {
            ret[key] = val;
            return ret;
          },
          finalize: ret => ret,
        },
      }),
    [handlers],
  );
  const deserialize = useCallback(x => reader.read(x), [reader]);

  useRecoilURLSync({...options, serialize, deserialize});
}

function RecoilURLSyncTransit(props: RecoilURLSyncTrnsitOptions): React.Node {
  useRecoilURLSyncTransit(props);
  return null;
}

module.exports = {useRecoilURLSyncTransit, RecoilURLSyncTransit};
