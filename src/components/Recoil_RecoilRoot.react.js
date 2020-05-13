/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {RecoilValue} from 'Recoil_RecoilValue';
import type {
  NodeKey,
  Store,
  StoreRef,
  StoreState,
  TreeState,
} from 'Recoil_State';

const React = require('React');
const {useContext, useEffect, useRef, useState} = require('React');
const {
  fireNodeSubscriptions,
  setNodeValue,
  setUnvalidatedAtomValue,
} = require('Recoil_FunctionalCore');
const Queue = require('Recoil_Queue');

const nullthrows = require('nullthrows');

type Props = {
  initializeState?: ({
    set: <T>(RecoilValue<T>, T) => void,
    setUnvalidatedAtomValues: (Map<string, mixed>) => void,
  }) => void,
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
  subscribeToTransactions: notInAContext,
  addTransactionMetadata: notInAContext,
  fireNodeSubscriptions: notInAContext,
});

function startNextTreeIfNeeded(storeState: StoreState): void {
  if (storeState.nextTree === null) {
    storeState.nextTree = {
      ...storeState.currentTree,
      dirtyAtoms: new Set(),
      transactionMetadata: {},
    };
  }
}

const AppContext = React.createContext<StoreRef>({current: defaultStore});
const useStoreRef = (): StoreRef => useContext(AppContext);

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
      const {currentTree, nextTree} = storeState;

      // Ignore commits that are not because of Recoil transactions -- namely,
      // because something above RecoilRoot re-rendered:
      if (nextTree === null) {
        return;
      }

      // Inform transaction subscribers of the transaction:
      const dirtyAtoms = nextTree.dirtyAtoms;
      if (dirtyAtoms.size) {
        // NOTE that this passes the committed (current, aka previous) tree,
        // whereas the nextTree is retrieved from storeRef by the transaction subscriber.
        // (This interface can be cleaned up, TODO)
        storeState.transactionSubscriptions.forEach(sub =>
          sub(storeRef.current, currentTree),
        );
      }

      // Inform components that depend on dirty atoms of the transaction:
      // FIXME why is this StoreState but dirtyAtoms is TreeState? Seems like they should be the same.
      storeState.queuedComponentCallbacks.forEach(cb => cb(nextTree));
      storeState.queuedComponentCallbacks.splice(
        0,
        storeState.queuedComponentCallbacks.length,
      );

      // nextTree is now committed -- note that copying and reset occurs when
      // a transaction begins, in startNextTreeIfNeeded:
      storeState.currentTree = nextTree;
      storeState.nextTree = null;
    });
  });

  return null;
}

if (__DEV__) {
  if (!window.$recoilDebugStates) {
    window.$recoilDebugStates = [];
  }
}

function makeEmptyTreeState(): TreeState {
  return {
    isSnapshot: false,
    transactionMetadata: {},
    atomValues: new Map(),
    nonvalidatedAtoms: new Map(),
    dirtyAtoms: new Set(),
    nodeDeps: new Map(),
    nodeToNodeSubscriptions: new Map(),
    nodeToComponentSubscriptions: new Map(),
  };
}

function makeEmptyStoreState(): StoreState {
  return {
    currentTree: makeEmptyTreeState(),
    nextTree: null,
    transactionSubscriptions: new Map(),
    queuedComponentCallbacks: [],
    suspendedComponentResolvers: new Set(),
  };
}

function initialStoreState(store, initializeState) {
  const initial: StoreState = makeEmptyStoreState();
  if (initializeState) {
    initializeState({
      set: (atom, value) => {
        initial.currentTree = setNodeValue(
          store,
          initial.currentTree,
          atom.key,
          value,
        )[0];
      },
      setUnvalidatedAtomValues: atomValues => {
        atomValues.forEach((v, k) => {
          initial.currentTree = setUnvalidatedAtomValue(
            initial.currentTree,
            k,
            v,
          );
        });
      },
    });
  }
  return initial;
}

let nextID = 0;
function RecoilRoot({initializeState, children}: Props): ReactElement {
  let storeState; // eslint-disable-line prefer-const

  const subscribeToTransactions = callback => {
    const id = nextID++;
    storeRef.current.getState().transactionSubscriptions.set(id, callback);
    return {
      release: () => {
        storeRef.current.getState().transactionSubscriptions.delete(id);
      },
    };
  };

  const addTransactionMetadata = (metadata: {...}) => {
    startNextTreeIfNeeded(storeRef.current.getState());
    for (const k of Object.keys(metadata)) {
      nullthrows(storeRef.current.getState().nextTree).transactionMetadata[k] =
        metadata[k];
    }
  };

  function fireNodeSubscriptionsForStore(
    updatedNodes: $ReadOnlySet<NodeKey>,
    when: 'enqueue' | 'now',
  ) {
    fireNodeSubscriptions(storeRef.current, updatedNodes, when);
  }

  const replaceState = replacer => {
    const storeState = storeRef.current.getState();
    startNextTreeIfNeeded(storeState);
    // Use replacer to get the next state:
    const nextTree = nullthrows(storeState.nextTree);
    const replaced = replacer(nextTree);
    if (replaced === nextTree) {
      return;
    }
    // Save changes to nextTree and schedule a React update:
    if (__DEV__) {
      window.$recoilDebugStates.push(replaced); // TODO this shouldn't happen here because it's not batched
    }
    storeState.nextTree = replaced;
    nullthrows(notifyBatcherOfChange.current)();
  };

  const notifyBatcherOfChange = useRef<null | (mixed => void)>(null);
  function setNotifyBatcherOfChange(x: mixed => void) {
    notifyBatcherOfChange.current = x;
  }

  const store = {
    getState: () => storeState.current,
    replaceState,
    subscribeToTransactions,
    addTransactionMetadata,
    fireNodeSubscriptions: fireNodeSubscriptionsForStore,
  };
  const storeRef = useRef(store);
  storeState = useRef(initialStoreState(store, initializeState));

  return (
    <AppContext.Provider value={storeRef}>
      <Batcher setNotifyBatcherOfChange={setNotifyBatcherOfChange} />
      {children}
    </AppContext.Provider>
  );
}

module.exports = {
  useStoreRef,
  RecoilRoot,
};
