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

import type {TransactionInterface} from '../core/Recoil_AtomicUpdates';
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {Store} from '../core/Recoil_State';

import {atomicUpdater} from '../core/Recoil_AtomicUpdates';
import {batchUpdates} from '../core/Recoil_Batching';
import {DEFAULT_VALUE} from '../core/Recoil_Node';
import {useStoreRef} from '../core/Recoil_RecoilRoot';
import {
  refreshRecoilValue,
  setRecoilValue,
} from '../core/Recoil_RecoilValueInterface';
import {Snapshot, cloneSnapshot} from '../core/Recoil_Snapshot';
import {gotoSnapshot} from './Recoil_SnapshotHooks';
import {useCallback} from 'react';
import err from 'recoil-shared/util/Recoil_err';
import invariant from 'recoil-shared/util/Recoil_invariant';
import lazyProxy from 'recoil-shared/util/Recoil_lazyProxy';

export type RecoilCallbackInterface = $ReadOnly<{
  set: <T>(RecoilState<T>, (T => T) | T) => void,
  reset: <T>(RecoilState<T>) => void,
  refresh: <T>(RecoilValue<T>) => void,
  snapshot: Snapshot,
  gotoSnapshot: Snapshot => void,
  transact_UNSTABLE: ((TransactionInterface) => void) => void,
}>;

class Sentinel {}
const SENTINEL = new Sentinel();

export function recoilCallback<
  Args: $ReadOnlyArray<mixed>,
  Return,
  ExtraInterface,
>(
  store: Store,
  fn: ({...ExtraInterface, ...RecoilCallbackInterface}) => (...Args) => Return,
  args: Args,
  extraInterface?: ExtraInterface,
): Return {
  let ret = SENTINEL;
  batchUpdates(() => {
    const errMsg =
      'useRecoilCallback() expects a function that returns a function: ' +
      'it accepts a function of the type (RecoilInterface) => (Args) => ReturnType ' +
      'and returns a callback function (Args) => ReturnType, where RecoilInterface is ' +
      'an object {snapshot, set, ...} and Args and ReturnType are the argument and return ' +
      'types of the callback you want to create.  Please see the docs ' +
      'at recoiljs.org for details.';
    if (typeof fn !== 'function') {
      throw err(errMsg);
    }

    // Clone the snapshot lazily to avoid overhead if the callback does not use it.
    // Note that this means the snapshot may represent later state from when
    // the callback was called if it first accesses the snapshot asynchronously.
    const callbackInterface: {
      ...ExtraInterface,
      ...RecoilCallbackInterface,
    } = lazyProxy(
      {
        ...(extraInterface ?? ({}: any)), // flowlint-line unclear-type:off
        set: <T>(node: RecoilState<T>, newValue: T | (T => T)) =>
          setRecoilValue(store, node, newValue),
        reset: <T>(node: RecoilState<T>) =>
          setRecoilValue(store, node, DEFAULT_VALUE),
        refresh: <T>(node: RecoilValue<T>) => refreshRecoilValue(store, node),
        gotoSnapshot: snapshot => gotoSnapshot(store, snapshot),
        transact_UNSTABLE: transaction => atomicUpdater(store)(transaction),
      },
      {
        snapshot: () => cloneSnapshot(store),
      },
    );

    const callback = fn(callbackInterface);
    if (typeof callback !== 'function') {
      throw err(errMsg);
    }
    ret = callback(...args);
  });
  invariant(
    !(ret instanceof Sentinel),
    'batchUpdates should return immediately',
  );
  return (ret: Return);
}

export function useRecoilCallback<Args: $ReadOnlyArray<mixed>, Return>(
  fn: RecoilCallbackInterface => (...Args) => Return,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => Return {
  const storeRef = useStoreRef();

  return useCallback(
    // $FlowIssue[incompatible-call]
    (...args: Args): Return => {
      return recoilCallback(storeRef.current, fn, args);
    },
    deps != null ? [...deps, storeRef] : undefined, // eslint-disable-line fb-www/react-hooks-deps
  );
}
