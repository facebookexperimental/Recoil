/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {RecoilState, RecoilValue} from 'Recoil_RecoilValue';
import type {Store, StoreState, TreeState} from 'Recoil_State';

const React = require('React');
const ReactDOM = require('ReactDOM');
const {act} = require('ReactTestUtils');
const {fireNodeSubscriptions} = require('Recoil_FunctionalCore');
const {
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState,
} = require('Recoil_Hooks');
const invariant = require('Recoil_invariant');
const {RecoilRoot} = require('Recoil_RecoilRoot.react');
const selector = require('Recoil_selector');
const stableStringify = require('Recoil_stableStringify');

// This isn't a test but is used in tests so Jest will be present:
declare var jest: JestObjectType;

function makeTreeState(): TreeState {
  return {
    isSnapshot: false,
    atomValues: new Map(),
    nonvalidatedAtoms: new Map(),
    dirtyAtoms: new Set(),
    nodeDeps: new Map(),
    nodeToNodeSubscriptions: new Map(),
    nodeToComponentSubscriptions: new Map(),
    transactionMetadata: {},
  };
}

function makeStoreState(): StoreState {
  return {
    currentTree: makeTreeState(),
    nextTree: null,
    transactionSubscriptions: new Map(),
    queuedComponentCallbacks: [],
    suspendedComponentResolvers: new Set(),
  };
}

function makeStore(): Store {
  const state = makeStoreState();
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
  {children: ?React.Node, ...},
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
  makeTreeState,
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
