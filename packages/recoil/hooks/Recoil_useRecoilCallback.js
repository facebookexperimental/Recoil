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

const {atomicUpdater} = require('../core/Recoil_AtomicUpdates');
const {batchUpdates} = require('../core/Recoil_Batching');
const {DEFAULT_VALUE} = require('../core/Recoil_Node');
const {useStoreRef} = require('../core/Recoil_RecoilRoot');
const {
  refreshRecoilValue,
  setRecoilValue,
} = require('../core/Recoil_RecoilValueInterface');
const {Snapshot, cloneSnapshot} = require('../core/Recoil_Snapshot');
const {gotoSnapshot} = require('./Recoil_SnapshotHooks');
const {useCallback} = require('react');
const err = require('recoil-shared/util/Recoil_err');
const invariant = require('recoil-shared/util/Recoil_invariant');

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

function recoilCallback<
  Args: $ReadOnlyArray<mixed>,
  Return,
  ExtraInterface: {...},
>(
  store: Store,
  fn: ({...ExtraInterface, ...RecoilCallbackInterface}) => (...Args) => Return,
  args: Args,
  extraInterface?: ExtraInterface,
): Return {
  let ret = SENTINEL;
  batchUpdates(() => {
    const errMsg =
      'useRecoilCallback expects a function that returns a function: ' +
      'it accepts a function of the type (RecoilInterface) => T = R ' +
      'and returns a callback function T => R, where RecoilInterface is an ' +
      'object {snapshot, set, ...} and T and R are the argument and return ' +
      'types of the callback you want to create.  Please see the docs ' +
      'at recoiljs.org for details.';
    if (typeof fn !== 'function') {
      throw err(errMsg);
    }
    // flowlint-next-line unclear-type:off
    const cb = (fn: any)({
      ...(extraInterface ?? {}),
      set: (node, newValue) => setRecoilValue(store, node, newValue),
      reset: node => setRecoilValue(store, node, DEFAULT_VALUE),
      refresh: node => refreshRecoilValue(store, node),
      // TODO Good potential optimization to compute this lazily
      snapshot: cloneSnapshot(store),
      gotoSnapshot: snapshot => gotoSnapshot(store, snapshot),
      transact_UNSTABLE: transaction => atomicUpdater(store)(transaction),
    });
    if (typeof cb !== 'function') {
      throw err(errMsg);
    }
    ret = cb(...args);
  });
  invariant(
    !(ret instanceof Sentinel),
    'batchUpdates should return immediately',
  );
  return (ret: Return);
}

function useRecoilCallback<Args: $ReadOnlyArray<mixed>, Return>(
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

module.exports = {recoilCallback, useRecoilCallback};
