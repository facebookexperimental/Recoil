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

const {Snapshot} = require('../../core/Recoil_Snapshot');
const {
  useGotoRecoilSnapshot,
  useRecoilSnapshot,
} = require('../../hooks/Recoil_Hooks');
const React = require('react');
const {useEffect, useRef} = require('react');

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

function connect(
  props: ConnectProps,
): ?{
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
function Connector({
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

  useEffect(() => {
    connectionRef.current = connect({
      name,
      persistenceLimit,
      devMode,
      goToSnapshot,
      maxDepth,
      maxItems,
      serializeFn,
      initialSnapshot: snapshot,
    });

    return connectionRef.current?.disconnect;
  }, []);

  useEffect(() => {
    const transactionID = transactionIdRef.current++;
    connectionRef.current?.track?.(transactionID, snapshot);
  }, [snapshot]);

  return null;
}

module.exports = Connector;
