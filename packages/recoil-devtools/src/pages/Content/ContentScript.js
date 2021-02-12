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

/* global chrome */
import type {DevToolsOptions, PostMessageData} from '../../types/DevtoolsTypes';

const {
  ExtensionSource,
  ExtensionSourceContentScript,
  RecoilDevToolsActions,
  MessageChunkSize,
} = require('../../constants/Constants');
const {debug, warn} = require('../../utils/Logger');
const nullthrows = require('nullthrows');

// Init message listeners
function initContentScriptListeners() {
  let connected = false;
  let bg = null;
  window.addEventListener('message', (message: MessageEvent) => {
    // $FlowFixMe: get message type
    const data = ((message.data: mixed): PostMessageData);
    if (data.source !== ExtensionSource) {
      return;
    }
    if (data.action === RecoilDevToolsActions.INIT) {
      connect(data.props);
    } else {
      send(data);
    }
  });

  function connect(props: ?DevToolsOptions) {
    // Connect to the background script
    connected = true;

    // TODO: set devToolsExtensionID?
    // $FlowFixMe: chrome types
    bg = chrome.runtime.connect(window.devToolsExtensionID, {
      name: props?.name ?? '',
    });

    send({
      action: RecoilDevToolsActions.INIT,
      props: props ? {...props} : undefined,
    });

    bg.onDisconnect.addListener(() => {
      connected = false;
      bg = null;
    });

    bg.onMessage.addListener(msg => {
      window.postMessage({
        source: ExtensionSourceContentScript,
        ...msg,
      });
    });
  }

  function send(data: PostMessageData) {
    if (bg !== null && connected) {
      try {
        bg.postMessage(data);
      } catch (err) {
        if (err.message === 'Message length exceeded maximum allowed length.') {
          sendInChunks(data);
        } else {
          warn(`Transaction ignored in Recoil DevTools: ${err.message}`);
        }
      }
    }
  }

  function sendInChunks(data: PostMessageData) {
    if (bg == null || !connected) {
      return;
    }

    const encoded = JSON.stringify(data);
    const len = encoded.length;
    for (let i = 0; i < len; i = i + MessageChunkSize) {
      const chunk = encoded.slice(i, i + MessageChunkSize);
      try {
        bg.postMessage({
          action: RecoilDevToolsActions.UPLOAD_CHUNK,
          txID: data.txID ?? -1,
          chunk,
          isFinalChunk: i + MessageChunkSize >= len,
        });
      } catch (err) {
        warn(`Transaction ignored in Recoil DevTools: ${err.message}`);
      }
    }
  }
}

// - Load page script so it can access the window object
function initPageScript() {
  const pageScript = document.createElement('script');
  pageScript.type = 'text/javascript';

  // $FlowFixMe
  pageScript.src = chrome.extension.getURL('pageScript.bundle.js');
  // remove the pageScript node after it has run
  pageScript.onload = function () {
    this.parentNode.removeChild(this);
  };
  nullthrows(document.head ?? document.documentElement).appendChild(pageScript);
}

initContentScriptListeners();
initPageScript();

module.exports = {initContentScriptListeners};
