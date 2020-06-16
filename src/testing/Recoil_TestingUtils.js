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

import type {RecoilState, RecoilValue} from 'Recoil_RecoilValue';
import type {Store} from 'Recoil_State';

const React = require('React');
const ReactDOM = require('ReactDOM');
const {act} = require('ReactTestUtils');

const {fireNodeSubscriptions} = require('../core/Recoil_FunctionalCore');
const {RecoilRoot} = require('../core/Recoil_RecoilRoot.react');
const {makeEmptyStoreState} = require('../core/Recoil_State');
const {
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState,
} = require('../hooks/Recoil_Hooks');
const selector = require('../recoil_values/Recoil_selector');
const invariant = require('../util/Recoil_invariant');
const stableStringify = require('../util/Recoil_stableStringify');

// TODO Use Snapshot for testing instead of this thunk?
function makeStore(): Store {
  const state = makeEmptyStoreState();
  const store = {
    getState: () => state,
    replaceState: replacer => {
      const storeState = store.getState();
      storeState.currentTree = replacer(storeState.currentTree); // no batching so nextTree is never active
      storeState.queuedComponentCallbacks.forEach(cb =>
        cb(storeState.currentTree),
      );
      storeState.queuedComponentCallbacks.splice(
        0,
        storeState.queuedComponentCallbacks.length,
      );
    },
    subscribeToTransactions: () => {
      throw new Error('not tested at this level');
    },
    addTransactionMetadata: () => {
      throw new Error('not implemented');
    },
    fireNodeSubscriptions: (updatedNodes, when) =>
      fireNodeSubscriptions(store, updatedNodes, when),
  };
  return store;
}

class ErrorBoundary extends React.Component<
  {children: React.Node | null, ...},
  {hasError: boolean, ...},
> {
  state = {hasError: false};

  static getDerivedStateFromError(_error) {
    return {hasError: true};
  }

  render() {
    return this.state.hasError ? 'error' : this.props.children;
  }
}

function renderElements(elements: ?React.Node): HTMLDivElement {
  const container = document.createElement('div');
  act(() => {
    ReactDOM.render(
      <RecoilRoot>
        <ErrorBoundary>
          <React.Suspense fallback="loading">{elements}</React.Suspense>
        </ErrorBoundary>
      </RecoilRoot>,
      container,
    );
  });
  return container;
}

////////////////////////////////////////
// Useful RecoilValue nodes for testing
////////////////////////////////////////
let id = 0;

const errorThrowingAsyncSelector: <T, S>(
  string,
  ?RecoilValue<S>,
) => RecoilValue<T> = <T, S>(msg, dep: ?RecoilValue<S>) =>
  selector<T>({
    key: `AsyncErrorThrowingSelector${id++}`,
    get: ({get}) => {
      if (dep != null) {
        get(dep);
      }
      return Promise.reject(new Error(msg));
    },
  });

const resolvingAsyncSelector: <T>(T) => RecoilValue<T> = <T>(value: T) =>
  selector({
    key: `ResolvingSelector${id++}`,
    get: () => Promise.resolve(value),
  });

const loadingAsyncSelector: () => RecoilValue<void> = () =>
  selector({
    key: `LoadingSelector${id++}`,
    get: () => new Promise(() => {}),
  });

function asyncSelector<T, S>(
  dep?: RecoilValue<S>,
): [RecoilValue<T>, (T) => void, (Error) => void] {
  let resolve = () => invariant(false, 'bug in test code'); // make flow happy with initialization
  let reject = () => invariant(false, 'bug in test code');
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const sel = selector({
    key: `AsyncSelector${id++}`,
    get: ({get}) => {
      if (dep != null) {
        get(dep);
      }
      return promise;
    },
  });
  return [sel, resolve, reject];
}

//////////////////////////////////
// Useful Components for testing
//////////////////////////////////

function ReadsAtom<T>({atom}: {atom: RecoilValue<T>}): React.Node {
  return stableStringify(useRecoilValue(atom));
}

// Returns a tuple: [
//   Component,
//   setValue(T),
//   resetValue()
// ]
function componentThatReadsAndWritesAtom<T>(
  atom: RecoilState<T>,
): [() => React.Node, (T) => void, () => void] {
  let setValue;
  let resetValue;
  const Component = (): React.Node => {
    setValue = useSetRecoilState(atom);
    resetValue = useResetRecoilState(atom);
    return stableStringify(useRecoilValue(atom));
  };
  return [Component, (value: T) => setValue(value), () => resetValue()];
}

function flushPromisesAndTimers(): Promise<mixed> {
  return new Promise(resolve => {
    // eslint-disable-next-line no-restricted-globals
    setTimeout(resolve, 100);
    act(() => jest.runAllTimers());
  });
}

module.exports = {
  makeStore,
  renderElements,
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  errorThrowingAsyncSelector,
  resolvingAsyncSelector,
  loadingAsyncSelector,
  asyncSelector,
  flushPromisesAndTimers,
};
