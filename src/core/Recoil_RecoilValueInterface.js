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

import type {Loadable} from '../adt/Recoil_Loadable';
import type {DefaultValue} from './Recoil_Node';
import type {RecoilValue} from './Recoil_RecoilValue';
import type {Store, TreeState} from './Recoil_State';

const Tracing = require('../util/Recoil_Tracing');
const {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  setUnvalidatedAtomValue,
  subscribeComponentToNode,
} = require('./Recoil_FunctionalCore');
const {
  AbstractRecoilValue,
  RecoilState,
  RecoilValueReadOnly,
} = require('./Recoil_RecoilValue');

// NOTE: This will not update state with node subscriptions, so use sparingly!!!
function peekRecoilValueAsLoadable<T>(
  store: Store,
  {key}: RecoilValue<T>,
): Loadable<T> {
  const state = store.getState().currentTree; // TODO with useMutableSource should use the tree from the individual component
  return peekNodeLoadable(store, state, key);
}

function getRecoilValueAsLoadable<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
): Loadable<T> {
  let result: Loadable<T>;
  // Save any state changes during read, such as validating atoms,
  // updated selector subscriptions/dependencies, &c.
  Tracing.trace('get RecoilValue', key, () =>
    store.replaceState(
      Tracing.wrap(state => {
        const [newState, loadable] = getNodeLoadable(store, state, key);
        result = loadable;
        return newState;
      }),
    ),
  );
  return (result: any); // flowlint-line unclear-type:off
}

function setRecoilValue<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
  newValue: T | DefaultValue,
): void {
  Tracing.trace('set RecoilValue', key, () =>
    store.replaceState(
      Tracing.wrap(state => {
        const [newState, writtenNodes] = setNodeValue(
          store,
          state,
          key,
          newValue,
        );
        store.fireNodeSubscriptions(writtenNodes, 'enqueue');
        return newState;
      }),
    ),
  );
}

function setUnvalidatedRecoilValue<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
  newValue: T,
): void {
  Tracing.trace('set unvalidated persisted atom', key, () =>
    store.replaceState(
      Tracing.wrap(state => {
        const newState = setUnvalidatedAtomValue(state, key, newValue);
        store.fireNodeSubscriptions(new Set([key]), 'enqueue');
        return newState;
      }),
    ),
  );
}

export type ComponentSubscription = {release: Store => void};
function subscribeToRecoilValue<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
  callback: TreeState => void,
): ComponentSubscription {
  let newState, releaseFn;
  Tracing.trace('subscribe component to RecoilValue', key, () =>
    store.replaceState(
      Tracing.wrap(state => {
        [newState, releaseFn] = subscribeComponentToNode(state, key, callback);
        return newState;
      }),
    ),
  );
  return {release: store => store.replaceState(releaseFn)};
}

module.exports = {
  RecoilValueReadOnly,
  AbstractRecoilValue,
  RecoilState,
  peekRecoilValueAsLoadable,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
};
