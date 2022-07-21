/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 * @oncall recoil
 */

import type {SetterOrUpdater} from '../../../../../../packages/recoil/hooks/Recoil_Hooks';

import React from 'react';

type SearchContext = {
  searchVal: string,
  setSearchVal: SetterOrUpdater<string>,
};

const context: React$Context<SearchContext> =
  React.createContext<SearchContext>({searchVal: '', setSearchVal: () => {}});

export default context;
