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

import type {Snapshot} from '../../core/Recoil_Snapshot';

import {
  useGotoRecoilSnapshot,
  useRecoilSnapshot,
} from '../../hooks/Recoil_SnapshotHooks';
import * as React from 'react';
import {useEffect, useRef} from 'react';

type Props = $ReadOnly<{
  name?: string,
  persistenceLimit?: number,
  initialSnapshot?: ?Snapshot,
  devMode?: ?boolean,
  maxDepth?: number,
  maxItems?: number,
  serializeFn?: (mixed, string) => mixed,
}>;

type ConnectProps = $ReadOnly<{
  ...Props,
  goToSnapshot: Snapshot => void,
}>;

function connect(props: ConnectProps): ?{
  track: (transactionId: number, snapshot: Snapshot) => void,
  disconnect: () => void,
} {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.__RECOIL_DEVTOOLS_EXTENSION__?.connect?.(props);
}

let CONNECTION_INDEX = 0;

/**
 * @explorer-desc
 * Recoil Dev Tools Connector
 */
export default function Connector({
  name = `Recoil Connection ${CONNECTION_INDEX++}`,
  persistenceLimit = 50,
  maxDepth,
  maxItems,
  serializeFn,
  devMode = true,
}: Props): React.Node {
  const transactionIdRef = useRef(0);
  const connectionRef = useRef(null);
  const goToSnapshot = useGotoRecoilSnapshot();
  const snapshot = useRecoilSnapshot();
  const release = snapshot.retain();

  useEffect(() => {
    if (connectionRef.current == null) {
      connectionRef.current = connect({
        name,
        persistenceLimit,
        devMode,
        goToSnapshot,
        maxDepth,
        maxItems,
        serializeFn,
      });
    }

    return () => {
      connectionRef.current?.disconnect();
      connectionRef.current = null;
    };
  }, [
    devMode,
    goToSnapshot,
    maxDepth,
    maxItems,
    name,
    persistenceLimit,
    serializeFn,
  ]);

  useEffect(() => {
    const transactionID = transactionIdRef.current++;
    connectionRef.current?.track?.(transactionID, snapshot);
    release();
  }, [snapshot, release]);

  return null;
}
