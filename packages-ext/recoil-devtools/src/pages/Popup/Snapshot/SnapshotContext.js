/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

import type {SetterOrUpdater} from '../../../../../../packages/recoil/hooks/Recoil_Hooks';

import React from 'react';

type SnapshotContext = {
  searchVal: string,
  setSearchVal: SetterOrUpdater<string>,
};

const context: React$Context<SnapshotContext> =
  React.createContext<SnapshotContext>({searchVal: '', setSearchVal: () => {}});

export default context;
