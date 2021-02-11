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

import type {RecoilValue} from './Recoil_RecoilValue';
import type {MutableSnapshot} from './Recoil_Snapshot';
import type {Store, StoreRef, StoreState} from './Recoil_State';

const React = require('React');
const {useContext, useEffect, useMemo, useRef, useState} = require('React');
// @fb-only: const RecoilusagelogEvent = require('RecoilusagelogEvent');
// @fb-only: const RecoilUsageLogFalcoEvent = require('RecoilUsageLogFalcoEvent');
// @fb-only: const URI = require('URI');

const Queue = require('../adt/Recoil_Queue');
const {
  getNextTreeStateVersion,
  makeEmptyStoreState,
} = require('../core/Recoil_State');
const expectationViolation = require('../util/Recoil_expectationViolation');
const gkx = require('../util/Recoil_gkx');
const nullthrows = require('../util/Recoil_nullthrows');
// @fb-only: const recoverableViolation = require('../util/Recoil_recoverableViolation');
const Tracing = require('../util/Recoil_Tracing');
const unionSets = require('../util/Recoil_unionSets');
const {
  cleanUpNode,
  getDownstreamNodes,
  setNodeValue,
  setUnvalidatedAtomValue_DEPRECATED,
} = require('./Recoil_FunctionalCore');
const {graph, saveDependencyMapToStore} = require('./Recoil_Graph');
const {cloneGraph} = require('./Recoil_Graph');
const {applyAtomValueWrites} = require('./Recoil_RecoilValueInterface');
const {releaseScheduledRetainablesNow} = require('./Recoil_Retention');
const {freshSnapshot} = require('./Recoil_Snapshot');

type Props = {
  initializeState_DEPRECATED?: ({
    set: <T>(RecoilValue<T>, T) => void,
    setUnvalidatedAtomValues: (Map<string, mixed>) => void,
  }) => void,
  initializeState?: MutableSnapshot => void,
  store_INTERNAL?: Store,
  children: React.Node,
};

function notInAContext() {
  throw new Error(
    'This component must be used inside a <RecoilRoot> component.',
  );
}

const defaultStore: Store = Object.freeze({
  getState: notInAContext,
  replaceState: notInAContext,
  getGraph: notInAContext,
  subscribeToTransactions: notInAContext,
  addTransactionMetadata: notInAContext,
});

let stateReplacerIsBeingExecuted: boolean = false;

function startNextTreeIfNeeded(storeState: StoreState): void {
  if (stateReplacerIsBeingExecuted) {
    throw new Error(
      'An atom update was triggered within the execution of a state updater function. State updater functions provided to Recoil must be pure functions.',
    );
  }
  if (storeState.nextTree === null) {
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

    // Components that are subscribed to the dirty atom:
    const dependentNodes = getDownstreamNodes(store, treeState, dirtyAtoms);

    for (const key of dependentNodes) {
      const comps = storeState.nodeToComponentSubscriptions.get(key);
      if (comps) {
        for (const [_subID, [_debugName, callback]] of comps) {
          callback(treeState);
        }
      }
    }

    // Wake all suspended components so the right one(s) can try to re-render.
    // We need to wake up components not just when some asynchronous selector
    // resolved, but also when changing synchronous values because this may cause
    // a selector to change from asynchronous to synchronous, in which case there
    // would be no follow-up asynchronous resolution to wake us up.
    // TODO OPTIMIZATION Only wake up related downstream components
    let nodeNames = '[available in dev build]';
    if (__DEV__) {
      nodeNames = Array.from(dirtyAtoms).join(', ');
    }
    storeState.suspendedComponentResolvers.forEach(cb =>
      Tracing.trace('value became available, waking components', nodeNames, cb),
    );
  }

  // Special behavior ONLY invoked by useInterface.
  // FIXME delete queuedComponentCallbacks_DEPRECATED when deleting useInterface.
  storeState.queuedComponentCallbacks_DEPRECATED.forEach(cb => cb(treeState));
  storeState.queuedComponentCallbacks_DEPRECATED.splice(
    0,
    storeState.queuedComponentCallbacks_DEPRECATED.length,
  );
}

/*
 * The purpose of the Batcher is to observe when React batches end so that
 * Recoil state changes can be batched. Whenever Recoil state changes, we call
 * setState on the batcher. Then we wait for that change to be committed, which
 * signifies the end of the batch. That's when we respond to the Recoil change.
 */
function Batcher(props: {setNotifyBatcherOfChange: (() => void) => void}) {
  const storeRef = useStoreRef();

  const [_, setState] = useState([]);
  props.setNotifyBatcherOfChange(() => setState({}));

  useEffect(() => {
    // enqueueExecution runs this function immediately; it is only used to
    // manipulate the order of useEffects during tests, since React seems to
    // call useEffect in an unpredictable order sometimes.
    Queue.enqueueExecution('Batcher', () => {
      const storeState = storeRef.current.getState();
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

      const discardedVersion = nullthrows(storeState.previousTree).version;
      storeState.graphsByVersion.delete(discardedVersion);
      storeState.previousTree = null;

      if (gkx('recoil_memory_managament_2020')) {
        releaseScheduledRetainablesNow(storeRef.current);
      }
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
      const [depMap, writes] = setNodeValue(store, state, atom.key, value);
      const writtenNodes = new Set(writes.keys());

      saveDependencyMapToStore(depMap, store, state.version);

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
function RecoilRoot({
  initializeState_DEPRECATED,
  initializeState,
  store_INTERNAL: storeProp, // For use with React "context bridging"
  children,
}: Props): ReactElement {
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

  let storeState; // eslint-disable-line prefer-const

  const getGraph = version => {
    const graphs = storeState.current.graphsByVersion;
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
    startNextTreeIfNeeded(storeRef.current.getState());
    for (const k of Object.keys(metadata)) {
      nullthrows(storeRef.current.getState().nextTree).transactionMetadata[k] =
        metadata[k];
    }
  };

  const replaceState = replacer => {
    const storeState = storeRef.current.getState();
    startNextTreeIfNeeded(storeState);
    // Use replacer to get the next state:
    const nextTree = nullthrows(storeState.nextTree);
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
    storeState.nextTree = replaced;
    nullthrows(notifyBatcherOfChange.current)();
  };

  const notifyBatcherOfChange = useRef<null | (mixed => void)>(null);
  function setNotifyBatcherOfChange(x: mixed => void) {
    notifyBatcherOfChange.current = x;
  }

  // FIXME T2710559282599660
  const createMutableSource =
    (React: any).createMutableSource ?? // flowlint-line unclear-type:off
    (React: any).unstable_createMutableSource; // flowlint-line unclear-type:off

  const store: Store = storeProp ?? {
    getState: () => storeState.current,
    replaceState,
    getGraph,
    subscribeToTransactions,
    addTransactionMetadata,
  };

  const storeRef = useRef(store);
  storeState = useRef(
    initializeState_DEPRECATED != null
      ? initialStoreState_DEPRECATED(store, initializeState_DEPRECATED)
      : initializeState != null
      ? initialStoreState(initializeState)
      : makeEmptyStoreState(),
  );

  const mutableSource = useMemo(
    () =>
      createMutableSource
        ? createMutableSource(
            storeState,
            () => storeState.current.currentTree.version,
          )
        : null,
    [createMutableSource, storeState],
  );

  // Cleanup when the <RecoilRoot> is unmounted
  useEffect(
    () => () => {
      for (const atomKey of storeRef.current.getState().knownAtoms) {
        cleanUpNode(storeRef.current, atomKey);
      }
    },
    [],
  );

  return (
    <AppContext.Provider value={storeRef}>
      <MutableSourceContext.Provider value={mutableSource}>
        <Batcher setNotifyBatcherOfChange={setNotifyBatcherOfChange} />
        {children}
      </MutableSourceContext.Provider>
    </AppContext.Provider>
  );
}

module.exports = {
  useStoreRef,
  useRecoilMutableSource,
  RecoilRoot,
  sendEndOfBatchNotifications_FOR_TESTING: sendEndOfBatchNotifications,
};
