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

const React = require('React');

const {useEffect, useRef} = require('react');
// $FlowFixMe recoil-oss only used within Recoil DevTools
const {Snapshot} = require('recoil-oss/core/Recoil_Snapshot');

const {
  useGotoRecoilSnapshot,
  useRecoilSnapshot,
  // $FlowFixMe recoil-oss only used within Recoil DevTools
} = require('recoil-oss/hooks/Recoil_Hooks');
// $FlowFixMe useEffectOnce only used within Recoil DevTools
const useEffectOnce = require('useEffectOnce');
type Props = $ReadOnly<{
  name?: string,
  persitenceLimit?: number,
  initialSnapshot?: ?Snapshot,
  devMode?: ?boolean,
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

  const devTools =
    window.__RECOIL_DEVTOOLS_EXTENSION__ &&
    window.__RECOIL_DEVTOOLS_EXTENSION__.connect &&
    window.__RECOIL_DEVTOOLS_EXTENSION__.connect(props);
  return devTools ?? null;
}

let CONNECTION_INDEX = 0;

/**
 * @explorer-desc
 * Recoil Dev Tools Connector
 */
function Connector({
  name = `Recoil Connection ${CONNECTION_INDEX++}`,
  persitenceLimit = 50,
  devMode = true,
}: Props): React.Node {
  const transactionIdRef = useRef(0);
  const connectionRef = useRef(null);
  const goToSnapshot = useGotoRecoilSnapshot();
  const snapshot = useRecoilSnapshot();

  useEffectOnce(() => {
    connectionRef.current = connect({
      name,
      persitenceLimit,
      devMode,
      goToSnapshot,
      initialSnapshot: snapshot,
    });

    if (connectionRef.current?.disconnect != null) {
      return connectionRef.current?.disconnect;
    }
  });

  useEffect(() => {
    const transactionID = transactionIdRef.current++;
    if (connectionRef.current?.track != null) {
      connectionRef.current.track(transactionID, snapshot);
    }
  }, [snapshot]);

  return null;
}

module.exports = Connector;
