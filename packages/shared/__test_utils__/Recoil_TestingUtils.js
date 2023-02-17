/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

import type {Store} from '../../recoil/core/Recoil_State';
import type {RecoilState, RecoilValue, RecoilValueReadOnly} from 'Recoil';

// @fb-only: const ReactDOMComet = require('ReactDOMComet');
// @fb-only: const ReactDOM = require('ReactDOMLegacy_DEPRECATED');
const {act} = require('ReactTestUtils');
const {
  RecoilRoot,
  atom,
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
  invalidateDownstreams,
} = require('../../recoil/core/Recoil_RecoilValueInterface');
const {makeEmptyStoreState} = require('../../recoil/core/Recoil_State');
const invariant = require('../util/Recoil_invariant');
const nullthrows = require('../util/Recoil_nullthrows');
const stableStringify = require('../util/Recoil_stableStringify');
const {
  isConcurrentModeEnabled,
  isStrictModeEnabled,
} = require('./Recoil_ReactRenderModes');
const React = require('react');
const {useEffect} = require('react');
const err = require('recoil-shared/util/Recoil_err');

const ReactDOM = require('react-dom'); // @oss-only
const StrictMode = React.StrictMode; // @oss-only

const QUICK_TEST = false;

// @fb-only: const IS_INTERNAL = true;
const IS_INTERNAL = false; // @oss-only

// TODO Use Snapshots for testing instead of this thunk?
function makeStore(): Store {
  const storeState = makeEmptyStoreState();
  const store: Store = {
    storeID: getNextStoreID(),
    getState: () => storeState,
    replaceState: replacer => {
      const currentStoreState = store.getState();
      // FIXME: does not increment state version number
      currentStoreState.currentTree = replacer(currentStoreState.currentTree); // no batching so nextTree is never active
      invalidateDownstreams(store, currentStoreState.currentTree);
      const {reactMode} = require('../../recoil/core/Recoil_ReactMode');
      if (reactMode().early) {
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
  {children: React.Node | null, fallback?: Error => React.Node},
  {hasError: boolean, error?: ?Error},
> {
  state: {hasError: boolean, error?: ?Error} = {hasError: false};

  static getDerivedStateFromError(error: Error): {
    hasError: boolean,
    error?: ?Error,
  } {
    return {hasError: true, error};
  }

  render(): React.Node {
    return this.state.hasError
      ? this.props.fallback != null && this.state.error != null
        ? this.props.fallback(this.state.error)
        : 'error'
      : this.props.children;
  }
}

type ReactAbstractElement<Props> = React.Element<
  React.AbstractComponent<Props>,
>;

function renderLegacyReactRoot<Props>(
  container: HTMLElement,
  contents: ReactAbstractElement<Props>,
) {
  ReactDOM.render(contents, container);
}

// @fb-only: const createRoot = ReactDOMComet.createRoot;
// $FlowFixMe[prop-missing] unstable_createRoot is not part of react-dom typing // @oss-only
const createRoot = ReactDOM.createRoot ?? ReactDOM.unstable_createRoot; // @oss-only

function isConcurrentModeAvailable(): boolean {
  return createRoot != null;
}

function renderConcurrentReactRoot<Props>(
  container: HTMLElement,
  contents: ReactAbstractElement<Props>,
  // $FlowFixMe[missing-local-annot]
) {
  if (!isConcurrentModeAvailable()) {
    throw err(
      'Concurrent rendering is not available with the current version of React.',
    );
  }
  // $FlowFixMe[not-a-function] unstable_createRoot is not part of react-dom typing // @oss-only
  createRoot(container).render(contents);
}

function renderUnwrappedElements(
  elements: ?React.Node,
  container?: ?HTMLDivElement,
): HTMLDivElement {
  const div = container ?? document.createElement('div');
  const renderReactRoot = isConcurrentModeEnabled()
    ? renderConcurrentReactRoot
    : renderLegacyReactRoot;
  act(() => {
    renderReactRoot(
      div,
      isStrictModeEnabled() ? (
        <StrictMode>{elements}</StrictMode>
      ) : (
        <>{elements}</>
      ),
    );
  });
  return div;
}

function renderElements(
  elements: ?React.Node,
  container?: ?HTMLDivElement,
): HTMLDivElement {
  return renderUnwrappedElements(
    <RecoilRoot>
      {/* eslint-disable-next-line fb-www/no-null-fallback-for-error-boundary */}
      <ErrorBoundary>
        <React.Suspense fallback="loading">{elements}</React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>,
    container,
  );
}

function renderElementsWithSuspenseCount(
  elements: React.Node,
): [HTMLDivElement, JestMockFn<[], void>] {
  const suspenseCommit = jest.fn(() => {});
  function Fallback() {
    useEffect(suspenseCommit);
    return 'loading';
  }
  const container = renderUnwrappedElements(
    <RecoilRoot>
      {/* eslint-disable-next-line fb-www/no-null-fallback-for-error-boundary */}
      <ErrorBoundary>
        <React.Suspense fallback={<Fallback />}>{elements}</React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>,
  );
  return [container, suspenseCommit];
}

////////////////////////////////////////
// Useful RecoilValue nodes for testing
////////////////////////////////////////
let id = 0;

function stringAtom(): RecoilState<string> {
  return atom({key: `StringAtom-${id++}`, default: 'DEFAULT'});
}

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
): RecoilValueReadOnly<T> =>
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
  let resolve: (result: Promise<T> | T) => void = () =>
    invariant(false, 'bug in test code'); // make flow happy with initialization
  let reject: (error: mixed) => void = () =>
    invariant(false, 'bug in test code');
  const promise = new Promise<T>((res, rej) => {
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

function ReadsAtom<T>({
  atom, // eslint-disable-line no-shadow
}: {
  atom: RecoilValue<T>,
}): React.Node {
  return stableStringify(useRecoilValue(atom));
}

// Returns a tuple: [
//   Component,
//   setValue(T),
//   resetValue()
// ]
function componentThatReadsAndWritesAtom<T>(
  recoilState: RecoilState<T>,
): [() => React.Node, (T) => void, () => void] {
  let setValue;
  let resetValue;
  const ReadsAndWritesAtom = (): React.Node => {
    setValue = useSetRecoilState(recoilState);
    resetValue = useResetRecoilState(recoilState);
    return stableStringify(useRecoilValue(recoilState));
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
        window.setTimeout(resolve, 100);
        jest.runAllTimers();
      }),
  );
}

type ReloadImports = () => void | (() => void);
type AssertionsFn = ({
  gks: Array<string>,
  strictMode: boolean,
  concurrentMode: boolean,
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
    {gks: additionalGKs = ([]: Array<Array<string>>)}: TestOptions = {gks: []},
  ) => {
    function runTests({
      strictMode,
      concurrentMode,
    }: {
      strictMode: boolean,
      concurrentMode: boolean,
    }) {
      test.each([
        ...[...gks, ...additionalGKs].map(gksToTest => [
          (!gksToTest.length
            ? testDescription
            : `${testDescription} [${gksToTest.join(', ')}]`) +
            (strictMode || concurrentMode
              ? ` [${[
                  strictMode ? 'StrictMode' : null,
                  concurrentMode ? 'ConcurrentMode' : null,
                ]
                  .filter(x => x != null)
                  .join(', ')}]`
              : ''),
          gksToTest,
        ]),
      ])('%s', async (_title, gksToTest) => {
        jest.resetModules();
        const gkx = require('recoil-shared/util/Recoil_gkx');
        gkx.clear(); // @oss-only
        const {
          setStrictMode,
          setConcurrentMode,
        } = require('./Recoil_ReactRenderModes');
        // Setup test environment
        setStrictMode(strictMode);
        setConcurrentMode(concurrentMode);
        // See: https://github.com/reactwg/react-18/discussions/102
        const prevReactActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
        global.IS_REACT_ACT_ENVIRONMENT = true;
        gksToTest.forEach(gkx.setPass);
        const after = reloadImports();

        try {
          await assertionsFn({gks: gksToTest, strictMode, concurrentMode});
        } finally {
          global.IS_REACT_ACT_ENVIRONMENT = prevReactActEnvironment;
          gksToTest.forEach(gkx.setFail);
          after?.();
          setStrictMode(false);
          setConcurrentMode(false);
        }
      });
    }

    if (QUICK_TEST) {
      runTests({strictMode: false, concurrentMode: true});
    } else {
      runTests({strictMode: false, concurrentMode: false});
      runTests({strictMode: true, concurrentMode: false});
      if (isConcurrentModeAvailable()) {
        runTests({strictMode: false, concurrentMode: true});
        // 2020-12-20: The internal <StrictMode> isn't yet enabled to run effects
        // multiple times.  So, rely on GitHub CI actions to test this for now.
        if (!IS_INTERNAL) {
          runTests({strictMode: true, concurrentMode: true});
        }
      }
    }
  };

const WWW_GKS_TO_TEST = QUICK_TEST
  ? [
      [
        'recoil_hamt_2020',
        'recoil_sync_external_store',
        'recoil_memory_managament_2020',
      ],
    ]
  : [
      // OSS for React <18:
      ['recoil_hamt_2020', 'recoil_suppress_rerender_in_callback'], // Also enables early rendering
      // Current internal default:
      ['recoil_hamt_2020', 'recoil_mutable_source'],
      // Internal with suppress, early rendering, and useTransition() support:
      [
        'recoil_hamt_2020',
        'recoil_mutable_source',
        'recoil_suppress_rerender_in_callback', // Also enables early rendering
      ],
      // OSS for React 18, test internally:
      [
        'recoil_hamt_2020',
        'recoil_sync_external_store',
        'recoil_suppress_rerender_in_callback', // Only used for fallback if no useSyncExternalStore()
      ],
      // Latest with GC:
      [
        'recoil_hamt_2020',
        'recoil_sync_external_store',
        'recoil_suppress_rerender_in_callback',
        'recoil_memory_managament_2020',
        'recoil_release_on_cascading_update_killswitch_2021',
      ],
      // Experimental mode for useTransition() support:
      ['recoil_hamt_2020', 'recoil_transition_support'],
    ];

/**
 * GK combinations to exclude in OSS, presumably because these combinations pass
 * in FB internally but not in OSS. Ideally this array would be empty.
 */
const OSS_GK_COMBINATION_EXCLUSIONS = [
  ['recoil_hamt_2020', 'recoil_mutable_source'],
  [
    'recoil_hamt_2020',
    'recoil_mutable_source',
    'recoil_suppress_rerender_in_callback',
  ],
];

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
  renderUnwrappedElements,
  renderElements,
  renderElementsWithSuspenseCount,
  ErrorBoundary,
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  stringAtom,
  errorThrowingAsyncSelector,
  resolvingAsyncSelector,
  loadingAsyncSelector,
  asyncSelector,
  flushPromisesAndTimers,
  getRecoilTestFn,
  IS_INTERNAL,
};
