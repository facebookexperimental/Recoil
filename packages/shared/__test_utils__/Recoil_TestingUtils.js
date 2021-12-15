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

import type {RecoilState, RecoilValue, RecoilValueReadOnly} from 'Recoil';
import type {Store} from '../../recoil/core/Recoil_State';

// @fb-only: const ReactDOMComet = require('ReactDOMComet');
const ReactDOM = require('ReactDOMLegacy_DEPRECATED');
const {act} = require('ReactTestUtils');
const {
  RecoilRoot,
  selector,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState,
} = require('Recoil');
// @fb-only: const StrictMode = require('StrictMode');

const {graph} = require('../../recoil/core/Recoil_Graph');
const {getNextStoreID} = require('../../recoil/core/Recoil_Keys');
const {
  notifyComponents_FOR_TESTING,
  sendEndOfBatchNotifications_FOR_TESTING,
} = require('../../recoil/core/Recoil_RecoilRoot');
const {
  invalidateDownstreams_FOR_TESTING,
} = require('../../recoil/core/Recoil_RecoilValueInterface');
const {makeEmptyStoreState} = require('../../recoil/core/Recoil_State');
const invariant = require('../util/Recoil_invariant');
const nullthrows = require('../util/Recoil_nullthrows');
const stableStringify = require('../util/Recoil_stableStringify');
const {isStrictModeEnabled} = require('./Recoil_StrictMode');
const React = require('react');
const {useEffect} = require('react');

const ReactDOMComet = require('ReactDOMLegacy_DEPRECATED'); // @oss-only
const StrictMode = React.StrictMode; // @oss-only

// @fb-only: const IS_INTERNAL = true;
const IS_INTERNAL = false; // @oss-only

// TODO Use Snapshot for testing instead of this thunk?
function makeStore(): Store {
  const storeState = makeEmptyStoreState();
  const store: Store = {
    storeID: getNextStoreID(),
    getState: () => storeState,
    replaceState: replacer => {
      const currentStoreState = store.getState();
      // FIXME: does not increment state version number
      currentStoreState.currentTree = replacer(currentStoreState.currentTree); // no batching so nextTree is never active
      invalidateDownstreams_FOR_TESTING(store, currentStoreState.currentTree);
      const gkx = require('recoil-shared/util/Recoil_gkx');
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
  ReactDOM.unstable_createRoot(container).render(contents); // @oss-only
}

function renderElementsInternal(
  elements: ?React.Node,
  createReactRoot,
): HTMLDivElement {
  const container = document.createElement('div');
  const Content = () => (
    <RecoilRoot>
      {/* eslint-disable-next-line fb-www/no-null-fallback-for-error-boundary */}
      <ErrorBoundary>
        <React.Suspense fallback="loading">{elements}</React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
  act(() => {
    createReactRoot(
      container,
      isStrictModeEnabled() ? (
        <StrictMode>
          <Content />
        </StrictMode>
      ) : (
        <Content />
      ),
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
  const Content = () => (
    <RecoilRoot>
      {/* eslint-disable-next-line fb-www/no-null-fallback-for-error-boundary */}
      <ErrorBoundary>
        <React.Suspense fallback={<Fallback />}>{elements}</React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
  act(() => {
    createLegacyReactRoot(
      container,
      isStrictModeEnabled() ? (
        <StrictMode>
          <Content />
        </StrictMode>
      ) : (
        <Content />
      ),
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
type AssertionsFn = ({
  gks: Array<string>,
  strictMode: boolean,
}) => ?Promise<mixed>;
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
    function runTests(strictMode: boolean) {
      test.each([
        ...[...gks, ...additionalGKs].map(gksToTest => [
          (!gksToTest.length
            ? testDescription
            : `${testDescription} [${gksToTest.join(', ')}]`) +
            (strictMode ? ' [StrictMode]' : ''),
          gksToTest,
        ]),
      ])('%s', async (_title, gksToTest) => {
        jest.resetModules();

        const gkx = require('recoil-shared/util/Recoil_gkx');
        const {setStrictMode} = require('./Recoil_StrictMode');
        setStrictMode(strictMode);

        gksToTest.forEach(gkx.setPass);

        const after = reloadImports();
        await assertionsFn({gks: gksToTest, strictMode});

        gksToTest.forEach(gkx.setFail);

        after?.();
        setStrictMode(false);
      });
    }

    // Run tests with Strict mode enabled and disabled
    runTests(true);
    runTests(false);
  };

// TODO Remove the recoil_suppress_rerender_in_callback GK checks
const WWW_GKS_TO_TEST = [
  ['recoil_hamt_2020'],
  [
    'recoil_suppress_rerender_in_callback',
    'recoil_early_rendering_2021', // coupled with recoil_suppress_rerender_in_callback in Recoil_gkx_early_rendering.js
    'recoil_hamt_2020',
  ],
  [
    'recoil_suppress_rerender_in_callback',
    'recoil_early_rendering_2021', // coupled with recoil_suppress_rerender_in_callback in Recoil_gkx_early_rendering.js
    'recoil_hamt_2020',
    'recoil_memory_managament_2020',
    'recoil_release_on_cascading_update_killswitch_2021',
  ],
];

/**
 * GK combinations to exclude in OSS, presumably because these combinations pass
 * in FB internally but not in OSS. Ideally this array would be empty.
 */
const OSS_GK_COMBINATION_EXCLUSIONS = [['recoil_hamt_2020']];

// eslint-disable-next-line no-unused-vars
const OSS_GKS_TO_TEST = WWW_GKS_TO_TEST.filter(
  gkCombination =>
    !OSS_GK_COMBINATION_EXCLUSIONS.some(
      exclusion =>
        exclusion.every(gk => gkCombination.includes(gk)) &&
        gkCombination.every(gk => exclusion.includes(gk)),
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
