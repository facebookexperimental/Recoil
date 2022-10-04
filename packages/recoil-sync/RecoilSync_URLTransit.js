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

const {DefaultValue} = require('Recoil');

const {RecoilURLSync} = require('./RecoilSync_URL');
const React = require('react');
const {useCallback, useEffect, useMemo} = require('react');
const err = require('recoil-shared/util/Recoil_err');
const expectationViolation = require('recoil-shared/util/Recoil_expectationViolation');
const usePrevious = require('recoil-shared/util/Recoil_usePrevious');
const transit = require('transit-js');

export type TransitHandler<T, S> = {
  tag: string,
  class: Class<T>,
  write: T => S,
  read: S => T,
};

export type RecoilURLSyncTransitOptions = $Rest<
  {
    ...RecoilURLSyncOptions,
    // $FlowIssue[unclear-type]
    handlers?: $ReadOnlyArray<TransitHandler<any, any>>,
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
    /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
     * Flow's LTI update could not be added via codemod */
    write: x => x.toISOString(),
    read: (str: $FlowFixMe) => new Date(str),
  },
  {
    tag: 'Set',
    class: Set,
    /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
     * Flow's LTI update could not be added via codemod */
    write: x => Array.from(x),
    read: (arr: $FlowFixMe) => new Set(arr),
  },
  {
    tag: 'Map',
    class: Map,
    /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
     * Flow's LTI update could not be added via codemod */
    write: x => Array.from(x.entries()),
    read: (arr: $FlowFixMe) => new Map(arr),
  },
  {
    tag: '__DV',
    class: DefaultValue,
    write: () => 0, // number encodes the smallest in URL
    read: () => new DefaultValue(),
  },
];

function RecoilURLSyncTransit({
  handlers: handlersProp,
  ...options
}: RecoilURLSyncTransitOptions): React.Node {
  if (options.location.part === 'href') {
    throw err('"href" location is not supported for Transit encoding');
  }

  const previousHandlers = usePrevious(handlersProp);
  useEffect(() => {
    if (__DEV__) {
      if (previousHandlers != null && previousHandlers !== handlersProp) {
        const message = `<RecoilURLSyncTransit> 'handlers' prop was detected to be unstable.
          It is important that this is a stable or memoized array instance.
          Otherwise you may miss URL changes as the listener is re-subscribed.
        `;

        expectationViolation(message);
      }
    }
  }, [previousHandlers, handlersProp]);

  const handlers = useMemo(
    () => [...BUILTIN_HANDLERS, ...(handlersProp ?? [])],
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
        handlers: handlers.reduce<{
          [string]: ($FlowFixMe) => $FlowFixMe,
        }>((c, {tag, read}) => {
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

  return <RecoilURLSync {...{...options, serialize, deserialize}} />;
}

module.exports = {RecoilURLSyncTransit};
