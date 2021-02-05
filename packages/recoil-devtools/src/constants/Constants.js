/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * This Recoil Plugin adds support for Redux Dev Tools (https://fburl.com/sjb1mvms).
 * It allows you to watch Recoil state changes as they happen.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const ExtensionSource = __DEV__
  ? 'recoil-dev-tools-DEV-MODE'
  : 'recoil-dev-tools';
const ExtensionSourceContentScript = __DEV__
  ? 'recoil-dev-tools-content-script-DEV-MODE'
  : 'recoil-dev-tools-content-script';

const RecoilDevToolsActions = {
  // sent from page
  INIT: 'recoil_devtools_init',
  UPDATE: 'recoil_devtools_update',
  UPLOAD_CHUNK: 'recoil_devtools_chunk',
  // sent from background store to popup
  DISCONNECT: 'recoil_devtools_disconnect',
  CONNECT: 'recoil_devtools_connect',
  UPDATE_STORE: 'recoil_devtools_update_store',
  // sent from popup to background
  SUBSCRIBE_POPUP: 'recoil_devtools_subscribe_popup',
  // sent from background store to page
  GO_TO_SNAPSHOT: 'recoil_devtools_go_to_snapshot',
};

export type MainTabsType = 'Diff' | 'State' | 'Graph';

const MainTabs: MainTabsType[] = ['Diff', 'State', 'Graph'];

const MainTabsTitle: {[MainTabsType]: string} = Object.freeze({
  Diff: 'Modified Values',
  State: 'Known Nodes',
  Graph: 'Registered Dependencies',
});

const MessageChunkSize = 1024 * 1024;

module.exports = {
  ExtensionSource,
  ExtensionSourceContentScript,
  RecoilDevToolsActions,
  MainTabs,
  MainTabsTitle,
  MessageChunkSize,
};
