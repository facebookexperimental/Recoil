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

import type {RecoilValueReadOnly} from '../core/Recoil_RecoilValue';
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {Store} from '../core/Recoil_State';

const React = require('React');
const {useEffect} = require('React');
const ReactDOM = require('ReactDOM');
const {act} = require('ReactTestUtils');

const {graph} = require('../core/Recoil_Graph');
const {
  RecoilRoot,
  sendEndOfBatchNotifications_FOR_TESTING,
} = require('../core/Recoil_RecoilRoot.react');
const {
  invalidateDownstreams_FOR_TESTING,
} = require('../core/Recoil_RecoilValueInterface');
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
      // FIXME: does not increment state version number
      storeState.currentTree = replacer(storeState.currentTree); // no batching so nextTree is never active
      invalidateDownstreams_FOR_TESTING(store, storeState.currentTree);
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
) => RecoilValue<T> = <T, S>(
  msg,
  dep: ?RecoilValue<S>,
): RecoilValueReadOnly<T> =>
  selector<T>({
    key: `AsyncErrorThrowingSelector${id++}`,
    get: ({get}) => {
      if (dep != null) {
        get(dep);
      }
      return Promise.reject(new Error(msg));
    },
  });

const resolvingAsyncSelector: <T>(T) => RecoilValue<T> = <T>(
  value: T,
): RecoilValueReadOnly<T> | RecoilValueReadOnly<mixed> =>
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
  const ReadsAndWritesAtom = (): React.Node => {
    setValue = useSetRecoilState(atom);
    resetValue = useResetRecoilState(atom);
    return stableStringify(useRecoilValue(atom));
  };
  return [
    ReadsAndWritesAtom,
    (value: T) => setValue(value),
    () => resetValue(),
  ];
}

function flushPromisesAndTimers(): Promise<void> {
  // Wrap flush with act() to avoid warning that only shows up in OSS environment
  return act(
    () =>
      new Promise(resolve => {
        // eslint-disable-next-line no-restricted-globals
        setTimeout(resolve, 100);
        jest.runAllTimers();
      }),
  );
}

type ReloadImports = () => void | (() => void);
type AssertionsFn = (gks: Array<string>) => ?Promise<mixed>;
type TestOptions = {
  gks?: Array<Array<string>>,
};
type TestFn = (string, AssertionsFn, TestOptions | void) => void;

const testGKs = (
  reloadImports: ReloadImports,
  gks: Array<Array<string>>,
): TestFn => (
  testDescription: string,
  assertionsFn: AssertionsFn,
  {gks: additionalGKs = []}: TestOptions = {},
) => {
  test.each([
    ...[...gks, ...additionalGKs].map(gks => [
      !gks.length ? testDescription : `${testDescription} [${gks.join(', ')}]`,
      gks,
    ]),
  ])('%s', async (_title, gks) => {
    jest.resetModules();

    const gkx = require('../util/Recoil_gkx');

    gks.forEach(gkx.setPass);

    const after = reloadImports();
    await assertionsFn(gks);

    gks.forEach(gkx.setFail);

    after?.();
  });
};

const WWW_GKS_TO_TEST = [
  ['recoil_async_selector_refactor'],
  ['recoil_suppress_rerender_in_callback'],
  ['recoil_async_selector_refactor', 'recoil_suppress_rerender_in_callback'],
  ['recoil_hamt_2020'],
  ['recoil_memory_managament_2020'],
  ['recoil_async_selector_refactor', 'recoil_memory_managament_2020'],
  ['recoil_async_selector_refactor', 'recoil_hamt_2020'],
];

/**
 * GK combinations to exclude in OSS, presumably because these combinations pass
 * in FB internally but not in OSS. Ideally this array would be empty.
 */
const OSS_GK_COMBINATION_EXCLUSIONS = [];

// eslint-disable-next-line no-unused-vars
const OSS_GKS_TO_TEST = WWW_GKS_TO_TEST.filter(
  gkCombination =>
    !OSS_GK_COMBINATION_EXCLUSIONS.some(exclusion =>
      exclusion.every(gk => gkCombination.includes(gk)),
    ),
);

const getRecoilTestFn = (reloadImports: ReloadImports): TestFn =>
  testGKs(
    reloadImports,
    // @fb-only: WWW_GKS_TO_TEST,
    OSS_GKS_TO_TEST, // @oss-only
  );

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
  getRecoilTestFn,
};
