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

import type {StoreID} from './Recoil_Keys';
import type {RecoilValue} from './Recoil_RecoilValue';
import type {MutableSnapshot} from './Recoil_Snapshot';
import type {Store, StoreRef, StoreState, TreeState} from './Recoil_State';

// @fb-only: const RecoilusagelogEvent = require('RecoilusagelogEvent');
// @fb-only: const RecoilUsageLogFalcoEvent = require('RecoilUsageLogFalcoEvent');
// @fb-only: const URI = require('URI');

const Queue = require('../adt/Recoil_Queue');
const {
  getNextTreeStateVersion,
  makeEmptyStoreState,
} = require('../core/Recoil_State');
const {
  cleanUpNode,
  getDownstreamNodes,
  reinitializeNode,
  setNodeValue,
  setUnvalidatedAtomValue_DEPRECATED,
} = require('./Recoil_FunctionalCore');
const {graph} = require('./Recoil_Graph');
const {cloneGraph} = require('./Recoil_Graph');
const {getNextStoreID} = require('./Recoil_Keys');
const {applyAtomValueWrites} = require('./Recoil_RecoilValueInterface');
const {releaseScheduledRetainablesNow} = require('./Recoil_Retention');
const {freshSnapshot} = require('./Recoil_Snapshot');
const React = require('react');
const {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} = require('react');
const err = require('recoil-shared/util/Recoil_err');
const expectationViolation = require('recoil-shared/util/Recoil_expectationViolation');
const gkx = require('recoil-shared/util/Recoil_gkx');
const nullthrows = require('recoil-shared/util/Recoil_nullthrows');
const recoverableViolation = require('recoil-shared/util/Recoil_recoverableViolation');
const unionSets = require('recoil-shared/util/Recoil_unionSets');
const useRefInitOnce = require('recoil-shared/util/Recoil_useRefInitOnce');

type InternalProps = {
  initializeState_DEPRECATED?: ({
    set: <T>(RecoilValue<T>, T) => void,
    setUnvalidatedAtomValues: (Map<string, mixed>) => void,
  }) => void,
  initializeState?: MutableSnapshot => void,
  store_INTERNAL?: Store,
  children: React.Node,
};

function notInAContext() {
  throw err('This component must be used inside a <RecoilRoot> component.');
}

const defaultStore: Store = Object.freeze({
  storeID: getNextStoreID(),
  getState: notInAContext,
  replaceState: notInAContext,
  getGraph: notInAContext,
  subscribeToTransactions: notInAContext,
  addTransactionMetadata: notInAContext,
});

let stateReplacerIsBeingExecuted: boolean = false;

function startNextTreeIfNeeded(store: Store): void {
  if (stateReplacerIsBeingExecuted) {
    throw err(
      'An atom update was triggered within the execution of a state updater function. State updater functions provided to Recoil must be pure functions.',
    );
  }
  const storeState = store.getState();
  if (storeState.nextTree === null) {
    if (
      gkx('recoil_memory_managament_2020') &&
      gkx('recoil_release_on_cascading_update_killswitch_2021')
    ) {
      // If this is a cascading update (that is, rendering due to one state change
      // invokes a second state change), we won't have cleaned up retainables yet
      // because this normally happens after notifying components. Do it before
      // proceeding with the cascading update so that it remains predictable:
      if (storeState.commitDepth > 0) {
        releaseScheduledRetainablesNow(store);
      }
    }
    const version = storeState.currentTree.version;
    const nextVersion = getNextTreeStateVersion();
    storeState.nextTree = {
      ...storeState.currentTree,
      version: nextVersion,
      stateID: nextVersion,
      dirtyAtoms: new Set(),
      transactionMetadata: {},
    };
    storeState.graphsByVersion.set(
      nextVersion,
      cloneGraph(nullthrows(storeState.graphsByVersion.get(version))),
    );
  }
}

const AppContext = React.createContext<StoreRef>({current: defaultStore});
const useStoreRef = (): StoreRef => useContext(AppContext);

const MutableSourceContext = React.createContext<mixed>(null); // TODO T2710559282599660
function useRecoilMutableSource(): mixed {
  const mutableSource = useContext(MutableSourceContext);
  if (mutableSource == null) {
    expectationViolation(
      'Attempted to use a Recoil hook outside of a <RecoilRoot>. ' +
        '<RecoilRoot> must be an ancestor of any component that uses ' +
        'Recoil hooks.',
    );
  }
  return mutableSource;
}

function notifyComponents(
  store: Store,
  storeState: StoreState,
  treeState: TreeState,
): void {
  const dependentNodes = getDownstreamNodes(
    store,
    treeState,
    treeState.dirtyAtoms,
  );
  for (const key of dependentNodes) {
    const comps = storeState.nodeToComponentSubscriptions.get(key);
    if (comps) {
      for (const [_subID, [_debugName, callback]] of comps) {
        callback(treeState);
      }
    }
  }
}

function sendEndOfBatchNotifications(store: Store) {
  const storeState = store.getState();
  const treeState = storeState.currentTree;

  // Inform transaction subscribers of the transaction:
  const dirtyAtoms = treeState.dirtyAtoms;
  if (dirtyAtoms.size) {
    // Execute Node-specific subscribers before global subscribers
    for (const [
      key,
      subscriptions,
    ] of storeState.nodeTransactionSubscriptions) {
      if (dirtyAtoms.has(key)) {
        for (const [_, subscription] of subscriptions) {
          subscription(store);
        }
      }
    }

    for (const [_, subscription] of storeState.transactionSubscriptions) {
      subscription(store);
    }

    if (
      !gkx('recoil_early_rendering_2021') ||
      storeState.suspendedComponentResolvers.size
    ) {
      // Notifying components is needed to wake from suspense, even when using
      // early rendering.
      notifyComponents(store, storeState, treeState);
      // Wake all suspended components so the right one(s) can try to re-render.
      // We need to wake up components not just when some asynchronous selector
      // resolved, but also when changing synchronous values because this may cause
      // a selector to change from asynchronous to synchronous, in which case there
      // would be no follow-up asynchronous resolution to wake us up.
      // TODO OPTIMIZATION Only wake up related downstream components
      storeState.suspendedComponentResolvers.forEach(cb => cb());
      storeState.suspendedComponentResolvers.clear();
    }
  }

  // Special behavior ONLY invoked by useInterface.
  // FIXME delete queuedComponentCallbacks_DEPRECATED when deleting useInterface.
  storeState.queuedComponentCallbacks_DEPRECATED.forEach(cb => cb(treeState));
  storeState.queuedComponentCallbacks_DEPRECATED.splice(
    0,
    storeState.queuedComponentCallbacks_DEPRECATED.length,
  );
}

function endBatch(storeRef) {
  const storeState = storeRef.current.getState();
  storeState.commitDepth++;
  try {
    const {nextTree} = storeState;

    // Ignore commits that are not because of Recoil transactions -- namely,
    // because something above RecoilRoot re-rendered:
    if (nextTree === null) {
      return;
    }

    // nextTree is now committed -- note that copying and reset occurs when
    // a transaction begins, in startNextTreeIfNeeded:
    storeState.previousTree = storeState.currentTree;
    storeState.currentTree = nextTree;
    storeState.nextTree = null;

    sendEndOfBatchNotifications(storeRef.current);

    if (storeState.previousTree != null) {
      storeState.graphsByVersion.delete(storeState.previousTree.version);
    } else {
      recoverableViolation(
        'Ended batch with no previous state, which is unexpected',
        'recoil',
      );
    }
    storeState.previousTree = null;

    if (gkx('recoil_memory_managament_2020')) {
      releaseScheduledRetainablesNow(storeRef.current);
    }
  } finally {
    storeState.commitDepth--;
  }
}

/*
 * The purpose of the Batcher is to observe when React batches end so that
 * Recoil state changes can be batched. Whenever Recoil state changes, we call
 * setState on the batcher. Then we wait for that change to be committed, which
 * signifies the end of the batch. That's when we respond to the Recoil change.
 */
function Batcher({
  setNotifyBatcherOfChange,
}: {
  setNotifyBatcherOfChange: (() => void) => void,
}) {
  const storeRef = useStoreRef();

  const [, setState] = useState([]);
  setNotifyBatcherOfChange(() => setState({}));
  useEffect(() => {
    setNotifyBatcherOfChange(() => setState({}));

    // If an asynchronous selector resolves after the Batcher is unmounted,
    // notifyBatcherOfChange will still be called. An error gets thrown whenever
    // setState is called after a component is already unmounted, so this sets
    // notifyBatcherOfChange to be a no-op.
    return () => {
      setNotifyBatcherOfChange(() => {});
    };
  }, [setNotifyBatcherOfChange]);

  useEffect(() => {
    // enqueueExecution runs this function immediately; it is only used to
    // manipulate the order of useEffects during tests, since React seems to
    // call useEffect in an unpredictable order sometimes.
    Queue.enqueueExecution('Batcher', () => {
      endBatch(storeRef);
    });
  });

  return null;
}

if (__DEV__) {
  if (typeof window !== 'undefined' && !window.$recoilDebugStates) {
    window.$recoilDebugStates = [];
  }
}

// When removing this deprecated function, remove stateBySettingRecoilValue
// which will no longer be needed.
function initialStoreState_DEPRECATED(store, initializeState): StoreState {
  const initial: StoreState = makeEmptyStoreState();
  initializeState({
    // $FlowFixMe[escaped-generic]
    set: (atom, value) => {
      const state = initial.currentTree;
      const writes = setNodeValue(store, state, atom.key, value);
      const writtenNodes = new Set(writes.keys());

      const nonvalidatedAtoms = state.nonvalidatedAtoms.clone();
      for (const n of writtenNodes) {
        nonvalidatedAtoms.delete(n);
      }

      initial.currentTree = {
        ...state,
        dirtyAtoms: unionSets(state.dirtyAtoms, writtenNodes),
        atomValues: applyAtomValueWrites(state.atomValues, writes), // NB: PLEASE un-export applyAtomValueWrites when deleting this code
        nonvalidatedAtoms,
      };
    },
    setUnvalidatedAtomValues: atomValues => {
      // FIXME replace this with a mutative loop
      atomValues.forEach((v, k) => {
        initial.currentTree = setUnvalidatedAtomValue_DEPRECATED(
          initial.currentTree,
          k,
          v,
        );
      });
    },
  });
  return initial;
}

function initialStoreState(initializeState): StoreState {
  const snapshot = freshSnapshot().map(initializeState);
  return snapshot.getStore_INTERNAL().getState();
}

let nextID = 0;
function RecoilRoot_INTERNAL({
  initializeState_DEPRECATED,
  initializeState,
  store_INTERNAL: storeProp, // For use with React "context bridging"
  children,
}: InternalProps): React.Node {
  // prettier-ignore
  // @fb-only: useEffect(() => {
    // @fb-only: if (gkx('recoil_usage_logging')) {
      // @fb-only: try {
        // @fb-only: RecoilUsageLogFalcoEvent.log(() => ({
          // @fb-only: type: RecoilusagelogEvent.RECOIL_ROOT_MOUNTED,
          // @fb-only: path: URI.getRequestURI().getPath(),
        // @fb-only: }));
      // @fb-only: } catch {
        // @fb-only: recoverableViolation(
          // @fb-only: 'Error when logging Recoil Usage event',
          // @fb-only: 'recoil',
        // @fb-only: );
      // @fb-only: }
    // @fb-only: }
  // @fb-only: }, []);

  let storeStateRef: {current: StoreState}; // eslint-disable-line prefer-const

  const getGraph = version => {
    const graphs = storeStateRef.current.graphsByVersion;
    if (graphs.has(version)) {
      return nullthrows(graphs.get(version));
    }
    const newGraph = graph();
    graphs.set(version, newGraph);
    return newGraph;
  };

  const subscribeToTransactions = (callback, key) => {
    if (key == null) {
      // Global transaction subscriptions
      const {transactionSubscriptions} = storeRef.current.getState();
      const id = nextID++;
      transactionSubscriptions.set(id, callback);
      return {
        release: () => {
          transactionSubscriptions.delete(id);
        },
      };
    } else {
      // Node-specific transaction subscriptions:
      const {nodeTransactionSubscriptions} = storeRef.current.getState();
      if (!nodeTransactionSubscriptions.has(key)) {
        nodeTransactionSubscriptions.set(key, new Map());
      }
      const id = nextID++;
      nullthrows(nodeTransactionSubscriptions.get(key)).set(id, callback);
      return {
        release: () => {
          const subs = nodeTransactionSubscriptions.get(key);
          if (subs) {
            subs.delete(id);
            if (subs.size === 0) {
              nodeTransactionSubscriptions.delete(key);
            }
          }
        },
      };
    }
  };

  const addTransactionMetadata = (metadata: {...}) => {
    startNextTreeIfNeeded(storeRef.current);
    for (const k of Object.keys(metadata)) {
      nullthrows(storeRef.current.getState().nextTree).transactionMetadata[k] =
        metadata[k];
    }
  };

  const replaceState = replacer => {
    startNextTreeIfNeeded(storeRef.current);
    // Use replacer to get the next state:
    const nextTree = nullthrows(storeStateRef.current.nextTree);
    let replaced;
    try {
      stateReplacerIsBeingExecuted = true;
      replaced = replacer(nextTree);
    } finally {
      stateReplacerIsBeingExecuted = false;
    }
    if (replaced === nextTree) {
      return;
    }

    if (__DEV__) {
      if (typeof window !== 'undefined') {
        window.$recoilDebugStates.push(replaced); // TODO this shouldn't happen here because it's not batched
      }
    }

    // Save changes to nextTree and schedule a React update:
    storeStateRef.current.nextTree = replaced;
    if (gkx('recoil_early_rendering_2021')) {
      notifyComponents(storeRef.current, storeStateRef.current, replaced);
    }
    nullthrows(notifyBatcherOfChange.current)();
  };

  const notifyBatcherOfChange = useRef<null | (mixed => void)>(null);
  const setNotifyBatcherOfChange = useCallback(
    (x: mixed => void) => {
      notifyBatcherOfChange.current = x;
    },
    [notifyBatcherOfChange],
  );

  const storeRef = useRefInitOnce(
    () =>
      storeProp ?? {
        storeID: getNextStoreID(),
        getState: () => storeStateRef.current,
        replaceState,
        getGraph,
        subscribeToTransactions,
        addTransactionMetadata,
      },
  );
  if (storeProp != null) {
    storeRef.current = storeProp;
  }

  storeStateRef = useRefInitOnce(() =>
    initializeState_DEPRECATED != null
      ? initialStoreState_DEPRECATED(
          storeRef.current,
          initializeState_DEPRECATED,
        )
      : initializeState != null
      ? initialStoreState(initializeState)
      : makeEmptyStoreState(),
  );

  // FIXME T2710559282599660
  const createMutableSource =
    (React: any).createMutableSource ?? // flowlint-line unclear-type:off
    (React: any).unstable_createMutableSource; // flowlint-line unclear-type:off

  const mutableSource = useMemo(
    () =>
      createMutableSource
        ? createMutableSource(
            storeStateRef,
            () => storeStateRef.current.currentTree.version,
          )
        : null,
    [createMutableSource, storeStateRef],
  );

  // Cleanup when the <RecoilRoot> is unmounted
  useEffect(() => {
    // React is free to call effect cleanup handlers and effects at will, the
    // deps array is only an optimization.  For example, React strict mode
    // will execute each effect twice for testing.  Therefore, we need symmetry
    // to re-initialize all known atoms after they were cleaned up.
    const store = storeRef.current;
    for (const atomKey of new Set(store.getState().knownAtoms)) {
      reinitializeNode(store, atomKey);
    }

    return () => {
      for (const atomKey of store.getState().knownAtoms) {
        cleanUpNode(store, atomKey);
      }
    };
  }, [storeRef]);

  return (
    <AppContext.Provider value={storeRef}>
      <MutableSourceContext.Provider value={mutableSource}>
        <Batcher setNotifyBatcherOfChange={setNotifyBatcherOfChange} />
        {children}
      </MutableSourceContext.Provider>
    </AppContext.Provider>
  );
}

type Props =
  | {
      initializeState_DEPRECATED?: ({
        set: <T>(RecoilValue<T>, T) => void,
        setUnvalidatedAtomValues: (Map<string, mixed>) => void,
      }) => void,
      initializeState?: MutableSnapshot => void,
      store_INTERNAL?: Store,
      override?: true,
      children: React.Node,
    }
  | {
      store_INTERNAL?: Store,
      /**
       * Defaults to true. If override is true, this RecoilRoot will create a
       * new Recoil scope. If override is false and this RecoilRoot is nested
       * within another RecoilRoot, this RecoilRoot will perform no function.
       * Children of this RecoilRoot will access the Recoil values of the
       * nearest ancestor RecoilRoot.
       */
      override: false,
      children: React.Node,
    };

function RecoilRoot(props: Props): React.Node {
  const {override, ...propsExceptOverride} = props;

  const ancestorStoreRef = useStoreRef();
  if (override === false && ancestorStoreRef.current !== defaultStore) {
    // If ancestorStoreRef.current !== defaultStore, it means that this
    // RecoilRoot is not nested within another.
    return props.children;
  }

  return <RecoilRoot_INTERNAL {...propsExceptOverride} />;
}

function useRecoilStoreID(): StoreID {
  return useStoreRef().current.storeID;
}

module.exports = {
  RecoilRoot,
  useStoreRef,
  useRecoilMutableSource,
  useRecoilStoreID,
  notifyComponents_FOR_TESTING: notifyComponents,
  sendEndOfBatchNotifications_FOR_TESTING: sendEndOfBatchNotifications,
};
