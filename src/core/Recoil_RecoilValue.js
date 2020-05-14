/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable} from '../adt/Recoil_Loadable';
import type {DefaultValue} from './Recoil_Node';
import type {NodeKey, Store, TreeState} from './Recoil_State';

const {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  setUnvalidatedAtomValue,
  subscribeComponentToNode,
} = require('./Recoil_FunctionalCore');
const Tracing = require('../util/Recoil_Tracing');

const {RecoilValue, AbstractRecoilValue, RecoilState} = require('./Recoil_RecoilValueClasses');
export type {RecoilValue} from './Recoil_RecoilValueClasses';

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

function isRecoilValue(x: mixed): boolean %checks {
  return x instanceof RecoilState || x instanceof RecoilValueReadOnly;
}

module.exports = {
  AbstractRecoilValue,
  RecoilState,
  RecoilValueReadOnly,
  peekRecoilValueAsLoadable,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
  isRecoilValue,
};
