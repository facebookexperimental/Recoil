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
export type {RecoilValue} from './Recoil_RecoilValueClasses';
import type {Store, TreeState} from './Recoil_State';
import type {ValueOrUpdater} from '../recoil_values/Recoil_selector';

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
} = require('./Recoil_RecoilValueClasses');
const {RecoilValueNotReady} = require('./Recoil_Node');

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

function valueFromValueOrUpdater<T>(
  store: Store,
  {key}: RecoilState<T>,
  valueOrUpdater: ValueOrUpdater<T>,
): T | DefaultValue {
  if (typeof valueOrUpdater === 'function') {
    // Updater form: pass in the current value. Throw if the current value
    // is unavailable (namely when updating an async selector that's
    // pending or errored):
    const storeState = store.getState();
    const state = storeState.nextTree ?? storeState.currentTree;
    // NOTE: This will not update state with node subscriptions.
    const current = peekNodeLoadable(store, state, key);
    if (current.state === 'loading') {
      throw new RecoilValueNotReady(key);
    } else if (current.state === 'hasError') {
      throw current.contents;
    }
    // T itself may be a function, so our refinement is not sufficient:
    return (valueOrUpdater: any)(current.contents); // flowlint-line unclear-type:off
  } else {
    return valueOrUpdater;
  }
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

function isRecoilValue(x: mixed): boolean %checks {
  return x instanceof RecoilState || x instanceof RecoilValueReadOnly;
}

module.exports = {
  RecoilValueReadOnly,
  AbstractRecoilValue,
  RecoilState,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
  valueFromValueOrUpdater,
  subscribeToRecoilValue,
  isRecoilValue,
};
