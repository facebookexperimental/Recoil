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
const {useEffect} = require('React');
const ReactDOM = require('ReactDOM');
const {act} = require('ReactTestUtils');

const {graph} = require('../core/Recoil_Graph');
const {
  RecoilRoot,
  sendEndOfBatchNotifications_FOR_TESTING,
} = require('../core/Recoil_RecoilRoot.react');
const {makeEmptyStoreState} = require('../core/Recoil_State');
const {
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState,
} = require('../hooks/Recoil_Hooks');
const selector = require('../recoil_values/Recoil_selector');
const invariant = require('../util/Recoil_invariant');
const nullthrows = require('../util/Recoil_nullthrows');
const stableStringify = require('../util/Recoil_stableStringify');

// TODO Use Snapshot for testing instead of this thunk?
function makeStore(): Store {
  const storeState = makeEmptyStoreState();
  const store = {
    getState: () => storeState,
    replaceState: replacer => {
      const storeState = store.getState();
      storeState.currentTree = replacer(storeState.currentTree); // no batching so nextTree is never active
      sendEndOfBatchNotifications_FOR_TESTING(store);
    },
    getGraph: version => {
      const graphs = storeState.graphsByVersion;
      if (graphs.has(version)) {
        return nullthrows(graphs.get(version));
      }
      const newGraph = graph();
      graphs.set(version, newGraph);
      return newGraph;
    },
    subscribeToTransactions: () => {
      throw new Error('not tested at this level');
    },
    addTransactionMetadata: () => {
      throw new Error('not implemented');
    },
    mutableSource: null,
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

function createReactRoot(container, contents) {
  // To test in Concurrent Mode replace with:
  // ReactDOM.createRoot(container).render(contents);
  ReactDOM.render(contents, container);
}

function renderElements(elements: ?React.Node): HTMLDivElement {
  const container = document.createElement('div');
  act(() => {
    createReactRoot(
      container,
      <RecoilRoot>
        <ErrorBoundary>
          <React.Suspense fallback="loading">{elements}</React.Suspense>
        </ErrorBoundary>
      </RecoilRoot>,
    );
  });
  return container;
}

function renderElementsWithSuspenseCount(
  elements: ?React.Node,
): [HTMLDivElement, JestMockFn<[], void>] {
  const container = document.createElement('div');
  const suspenseCommit = jest.fn(() => {});
  function Fallback() {
    useEffect(suspenseCommit);
    return 'loading';
  }
  act(() => {
    createReactRoot(
      container,
      <RecoilRoot>
        <ErrorBoundary>
          <React.Suspense fallback={<Fallback />}>{elements}</React.Suspense>
        </ErrorBoundary>
      </RecoilRoot>,
    );
  });
  return [container, suspenseCommit];
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

// Async util function that calls predicate multiple times until it returns `true`
// or throws if predicate never returned `true` and the function reached its timeout
// Example:
//    let x = 0;
//    setTimeout(() => x = 1, 1000);
//    await waitFor(() => x === 1);
async function waitFor(
  fn: () => boolean,
  message?: string,
  timeout: number = 1000,
) {
  const error = new Error(
    message != null
      ? message
      : 'Expected the function to start returning "true" but it never did',
  );
  const startTime = Date.now();
  while (!Boolean(fn())) {
    if (Date.now() - startTime > timeout) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

module.exports = {
  makeStore,
  renderElements,
  renderElementsWithSuspenseCount,
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  errorThrowingAsyncSelector,
  resolvingAsyncSelector,
  loadingAsyncSelector,
  asyncSelector,
  flushPromisesAndTimers,
  waitFor,
};
