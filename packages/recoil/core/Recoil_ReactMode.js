/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */
'use strict';

import * as React from 'react';
import gkx from 'recoil-shared/util/Recoil_gkx';

export opaque type MutableSource = {};

export const createMutableSource: <StoreState, Version>(
  {current: StoreState},
  () => Version,
) => MutableSource =
  // $FlowExpectedError[prop-missing]
  React.createMutableSource ?? React.unstable_createMutableSource;

export const useMutableSource: <StoreState, T>(
  MutableSource,
  () => T,
  (StoreState, () => void) => () => void,
) => T =
  // $FlowExpectedError[prop-missing]
  React.useMutableSource ?? React.unstable_useMutableSource; // eslint-disable-line fb-www/react-destructure-hooks

// https://github.com/reactwg/react-18/discussions/86
export const useSyncExternalStore: <T>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T,
) => T =
  // $FlowExpectedError[prop-missing]
  React.useSyncExternalStore ?? React.unstable_useSyncExternalStore; // eslint-disable-line fb-www/react-destructure-hooks

type ReactMode =
  | 'CONCURRENT_LEGACY'
  | 'SYNC_EXTERNAL_STORE'
  | 'MUTABLE_SOURCE'
  | 'LEGACY';

/**
 * mode: The React API and approach to use for syncing state with React
 * early: Re-renders from Recoil updates occur:
 *    1) earlier
 *    2) in sync with React updates in the same batch
 *    3) before transaction observers instead of after.
 * concurrent: Is the current mode compatible with Concurrent Mode (i.e. useTransition())
 */
export function reactMode(): {
  mode: ReactMode,
  early: boolean,
  concurrent: boolean,
} {
  // NOTE: This mode is currently broken with some Suspense cases
  // see Recoil_selector-test.js
  if (gkx('recoil_concurrent_legacy')) {
    return {mode: 'CONCURRENT_LEGACY', early: true, concurrent: true};
  }

  if (gkx('recoil_sync_external_store') && useSyncExternalStore != null) {
    return {mode: 'SYNC_EXTERNAL_STORE', early: true, concurrent: false};
  }

  if (
    gkx('recoil_mutable_source') &&
    useMutableSource != null &&
    typeof window !== 'undefined' &&
    !window.$disableRecoilValueMutableSource_TEMP_HACK_DO_NOT_USE
  ) {
    return gkx('recoil_suppress_rerender_in_callback')
      ? {mode: 'MUTABLE_SOURCE', early: true, concurrent: true}
      : {mode: 'MUTABLE_SOURCE', early: false, concurrent: false};
  }

  return gkx('recoil_suppress_rerender_in_callback')
    ? {mode: 'LEGACY', early: true, concurrent: false}
    : {mode: 'LEGACY', early: false, concurrent: false};
}
