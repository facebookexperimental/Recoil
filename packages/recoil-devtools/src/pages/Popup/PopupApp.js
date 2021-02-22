/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {TransactionType} from '../../types/DevtoolsTypes';
import type Store from '../../utils/Store';

const {RecoilDevToolsActions} = require('../../constants/Constants');

const PopupComponent = require('./PopupComponent');

const ConnectionContext = require('./ConnectionContext');
const React = require('react');
const {useEffect, useState, useRef} = require('react');
const {debug} = require('../../utils/Logger');

type AppProps = {
  store: Store,
};

function PopupApp({store}: AppProps) {
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
    // $FlowFixMe: chrome types
    port.current = chrome.extension.connect({name: 'Recoil Devtools Popup'});

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
