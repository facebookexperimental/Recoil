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
import type {ValueOrUpdater} from '../recoil_values/Recoil_selector';
import type {DefaultValue} from './Recoil_Node';
import type {Store, TreeState} from './Recoil_State';

const Tracing = require('../util/Recoil_Tracing');
const {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  setUnvalidatedAtomValue,
  subscribeComponentToNode,
} = require('./Recoil_FunctionalCore');
const {RecoilValueNotReady} = require('./Recoil_Node');
const {
  AbstractRecoilValue,
  RecoilState,
  RecoilValueReadOnly,
} = require('./Recoil_RecoilValue');

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
      true,
    ),
  );
  return (result: any); // flowlint-line unclear-type:off
}

function valueFromValueOrUpdater<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
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

function setRecoilValue<T>(
  store: Store,
  recoilValue: AbstractRecoilValue<T>,
  valueOrUpdater: T | DefaultValue | (T => T | DefaultValue),
): void {
  const {key} = recoilValue;
  Tracing.trace('set RecoilValue', key, () =>
    store.replaceState(
      Tracing.wrap(state => {
        const newValue = valueFromValueOrUpdater(
          store,
          recoilValue,
          valueOrUpdater,
        );

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
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
};
