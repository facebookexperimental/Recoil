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

import type {
  RecoilState,
  RecoilValue,
  RecoilValueReadOnly,
} from '../core/Recoil_RecoilValue';
import type {Store} from '../core/Recoil_State';

// @fb-only: const ReactDOMComet = require('ReactDOMComet');
const ReactDOM = require('ReactDOMLegacy_DEPRECATED');
const {act} = require('ReactTestUtils');

const {graph} = require('../core/Recoil_Graph');
const {
  RecoilRoot,
  notifyComponents_FOR_TESTING,
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
const React = require('react');
const {useEffect} = require('react');

const ReactDOMComet = require('ReactDOMLegacy_DEPRECATED'); // @oss-only

// @fb-only: const IS_INTERNAL = true;
const IS_INTERNAL = false; // @oss-only

// TODO Use Snapshot for testing instead of this thunk?
function makeStore(): Store {
  const storeState = makeEmptyStoreState();
  const store = {
    getState: () => storeState,
    replaceState: replacer => {
      const currentStoreState = store.getState();
      // FIXME: does not increment state version number
      currentStoreState.currentTree = replacer(currentStoreState.currentTree); // no batching so nextTree is never active
      invalidateDownstreams_FOR_TESTING(store, currentStoreState.currentTree);
      const gkx = require('../util/Recoil_gkx');
      if (gkx('recoil_early_rendering_2021')) {
        notifyComponents_FOR_TESTING(
          store,
          currentStoreState,
          currentStoreState.currentTree,
        );
      }
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
      throw new Error(
        'This functionality, should not tested at this level. Use a component to test this functionality: e.g. componentThatReadsAndWritesAtom',
      );
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

function createLegacyReactRoot(container, contents) {
  ReactDOM.render(contents, container);
}

function createConcurrentReactRoot(container, contents) {
  // @fb-only: ReactDOMComet.createRoot(container).render(contents);
  // @oss-only ReactDOMComet.unstable_createRoot(container).render(contents);
}

function renderElementsInternal(
  elements: ?React.Node,
  createReactRoot,
): HTMLDivElement {
  const container = document.createElement('div');
  act(() => {
    createReactRoot(
      container,
      <RecoilRoot>
        {/* eslint-disable-next-line fb-www/no-null-fallback-for-error-boundary */}
        <ErrorBoundary>
          <React.Suspense fallback="loading">{elements}</React.Suspense>
        </ErrorBoundary>
      </RecoilRoot>,
    );
  });
  return container;
}

function renderElements(elements: ?React.Node): HTMLDivElement {
  return renderElementsInternal(elements, createLegacyReactRoot);
}

function renderElementsInConcurrentRoot(elements: ?React.Node): HTMLDivElement {
  return renderElementsInternal(elements, createConcurrentReactRoot);
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
    createLegacyReactRoot(
      container,
      <RecoilRoot>
        {/* eslint-disable-next-line fb-www/no-null-fallback-for-error-boundary */}
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
  // $FlowFixMe[incompatible-type]
): RecoilValueReadOnly<T> | RecoilValueReadOnly<mixed> =>
  selector({
    key: `ResolvingSelector${id++}`,
    get: () => Promise.resolve(value),
  });

const loadingAsyncSelector: () => RecoilValueReadOnly<void> = () =>
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

const testGKs =
  (reloadImports: ReloadImports, gks: Array<Array<string>>): TestFn =>
  (
    testDescription: string,
    assertionsFn: AssertionsFn,
    {gks: additionalGKs = []}: TestOptions = {},
  ) => {
    test.each([
      ...[...gks, ...additionalGKs].map(gksToTest => [
        !gksToTest.length
          ? testDescription
          : `${testDescription} [${gksToTest.join(', ')}]`,
        gksToTest,
      ]),
    ])('%s', async (_title, gksToTest) => {
      jest.resetModules();

      const gkx = require('../util/Recoil_gkx');

      gksToTest.forEach(gkx.setPass);

      const after = reloadImports();
      await assertionsFn(gksToTest);

      gksToTest.forEach(gkx.setFail);

      after?.();
    });
  };

// TODO Remove the recoil_suppress_rerender_in_callback GK checks
const WWW_GKS_TO_TEST = [
  ['recoil_suppress_rerender_in_callback'],
  ['recoil_suppress_rerender_in_callback', 'recoil_early_rendering_2021'],
  ['recoil_suppress_rerender_in_callback', 'recoil_hamt_2020'],
  [
    'recoil_suppress_rerender_in_callback',
    'recoil_memory_managament_2020',
    'recoil_release_on_cascading_update_killswitch_2021',
  ],
  [
    'recoil_suppress_rerender_in_callback',
    'recoil_hamt_2020',
    'recoil_memory_managament_2020',
    'recoil_release_on_cascading_update_killswitch_2021',
  ],
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
  renderElementsInConcurrentRoot,
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  errorThrowingAsyncSelector,
  resolvingAsyncSelector,
  loadingAsyncSelector,
  asyncSelector,
  flushPromisesAndTimers,
  getRecoilTestFn,
  IS_INTERNAL,
};
