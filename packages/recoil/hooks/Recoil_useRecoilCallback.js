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
import type {RecoilState} from '../core/Recoil_RecoilValue';

const {atomicUpdater} = require('../core/Recoil_AtomicUpdates');
const {batchUpdates} = require('../core/Recoil_Batching');
const {DEFAULT_VALUE} = require('../core/Recoil_Node');
const {useStoreRef} = require('../core/Recoil_RecoilRoot.react');
const {setRecoilValue} = require('../core/Recoil_RecoilValueInterface');
const {Snapshot, cloneSnapshot} = require('../core/Recoil_Snapshot');
const err = require('../util/Recoil_err');
const invariant = require('../util/Recoil_invariant');
const {useGotoRecoilSnapshot} = require('./Recoil_SnapshotHooks');
const {useCallback} = require('react');

export type RecoilCallbackInterface = $ReadOnly<{
  set: <T>(RecoilState<T>, (T => T) | T) => void,
  reset: <T>(RecoilState<T>) => void,
  snapshot: Snapshot,
  gotoSnapshot: Snapshot => void,
  transact_UNSTABLE: ((TransactionInterface) => void) => void,
}>;

class Sentinel {}
const SENTINEL = new Sentinel();

function useRecoilCallback<Args: $ReadOnlyArray<mixed>, Return>(
  fn: RecoilCallbackInterface => (...Args) => Return,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => Return {
  const storeRef = useStoreRef();
  const gotoSnapshot = useGotoRecoilSnapshot();

  return useCallback(
    (...args): Return => {
      function set<T>(
        recoilState: RecoilState<T>,
        newValueOrUpdater: (T => T) | T,
      ) {
        setRecoilValue(storeRef.current, recoilState, newValueOrUpdater);
      }

      function reset<T>(recoilState: RecoilState<T>) {
        setRecoilValue(storeRef.current, recoilState, DEFAULT_VALUE);
      }

      // Use currentTree for the snapshot to show the currently committed state
      const snapshot = cloneSnapshot(storeRef.current); // FIXME massive gains from doing this lazily

      const atomicUpdate = atomicUpdater(storeRef.current);

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
          set,
          reset,
          snapshot,
          gotoSnapshot,
          transact_UNSTABLE: atomicUpdate,
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
    },
    deps != null ? [...deps, storeRef] : undefined, // eslint-disable-line fb-www/react-hooks-deps
  );
}

module.exports = useRecoilCallback;
