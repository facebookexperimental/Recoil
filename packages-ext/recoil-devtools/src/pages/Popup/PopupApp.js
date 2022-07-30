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
import type Connection from '../../utils/Connection';

import type Store from '../../utils/Store';

const {RecoilDevToolsActions} = require('../../constants/Constants');
const ConnectionContext = require('./ConnectionContext');
const PopupComponent = require('./PopupComponent');
const React = require('react');
const {useEffect, useRef, useState} = require('react');

type AppProps = {
  store: Store,
};

function PopupApp({
  store,
}: AppProps): React$Element<
  React$ComponentType<{children?: React$Node, value: ?Connection, ...}>,
> {
  const tabId = chrome.devtools?.inspectedWindow?.tabId ?? null;
  const [selectedConnection, setSelectedConnection] = useState(tabId);
  const [maxTransactionId, setMaxTransactionId] = useState(
    store.getConnection(selectedConnection)?.transactions.getLast(),
  );

  const port = useRef(null);

  // Subscribing to store events
  useEffect(() => {
    if (port.current !== null) {
      port.current.disconnect();
    }
    port.current = chrome.runtime.connect();

    port.current.postMessage({
      action: RecoilDevToolsActions.SUBSCRIBE_POPUP,
    });
    port.current?.onMessage.addListener(msg => {
      if (
        msg.action === RecoilDevToolsActions.CONNECT &&
        tabId != null &&
        msg.connectionId === tabId
      ) {
        setSelectedConnection(tabId);
      } else if (msg.connectionId === selectedConnection) {
        if (msg.action === RecoilDevToolsActions.UPDATE_STORE) {
          setMaxTransactionId(msg.msgId);
        } else if (msg.action === RecoilDevToolsActions.DISCONNECT) {
          setSelectedConnection(null);
        }
      }
    });
  }, [selectedConnection, tabId]);

  return (
    <ConnectionContext.Provider value={store.getConnection(selectedConnection)}>
      <PopupComponent maxTransactionId={maxTransactionId ?? 0} />
    </ConnectionContext.Provider>
  );
}

module.exports = PopupApp;
