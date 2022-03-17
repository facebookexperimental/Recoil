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

const React = require('react');
const gkx = require('recoil-shared/util/Recoil_gkx');

export opaque type MutableSource = {};

const createMutableSource: <StoreState, Version>(
  {current: StoreState},
  () => Version,
) => MutableSource =
  // flowlint-next-line unclear-type:off
  (React: any).createMutableSource ?? (React: any).unstable_createMutableSource;

const useMutableSource: <StoreState, T>(
  MutableSource,
  () => T,
  (StoreState, () => void) => () => void,
) => T =
  // flowlint-next-line unclear-type:off
  (React: any).useMutableSource ?? (React: any).unstable_useMutableSource;

// https://github.com/reactwg/react-18/discussions/86
const useSyncExternalStore: <T>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T,
) => T =
  // flowlint-next-line unclear-type:off
  (React: any).useSyncExternalStore ??
  // flowlint-next-line unclear-type:off
  (React: any).unstable_useSyncExternalStore;

type ReactMode =
  | 'TRANSITION_SUPPORT'
  | 'SYNC_EXTERNAL_STORE'
  | 'MUTABLE_SOURCE'
  | 'LEGACY';

/**
 * mode: The React API and approach to use for syncing state with React
 * early: Re-renders from Recoil updates occur:
 *    1) earlier
 *    2) in sync with React updates in the same batch
 *    3) before transaction observers instead of after.
 * concurrent: Is the current mode compatible with Concurrent Mode and useTransition()
 */
function reactMode(): {mode: ReactMode, early: boolean, concurrent: boolean} {
  // NOTE: This mode is currently broken with some Suspense cases
  // see Recoil_selector-test.js
  if (gkx('recoil_transition_support')) {
    return {mode: 'TRANSITION_SUPPORT', early: true, concurrent: true};
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

// TODO Need to figure out if there is a standard/open-source equivalent to see if hot module replacement is happening:
function isFastRefreshEnabled(): boolean {
  // @fb-only: const {isAcceptingUpdate} = require('__debug');
  // @fb-only: return typeof isAcceptingUpdate === 'function' && isAcceptingUpdate();
  return false; // @oss-only
}

module.exports = {
  createMutableSource,
  useMutableSource,
  useSyncExternalStore,
  reactMode,
  isFastRefreshEnabled,
};
