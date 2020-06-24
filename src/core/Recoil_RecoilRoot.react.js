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

import type {RecoilValue} from '../core/Recoil_RecoilValue';
import type {MutableSnapshot} from '../core/Recoil_Snapshot';
import type {NodeKey, Store, StoreRef, StoreState} from '../core/Recoil_State';

const React = require('React');
const {useContext, useEffect, useRef, useState} = require('React');

const Queue = require('../adt/Recoil_Queue');
const {
  fireNodeSubscriptions,
  setNodeValue,
  setUnvalidatedAtomValue,
} = require('../core/Recoil_FunctionalCore');
const {freshSnapshot} = require('../core/Recoil_Snapshot');
const {makeEmptyStoreState, makeStoreState} = require('../core/Recoil_State');
const nullthrows = require('../util/Recoil_nullthrows');

type Props = {
  initializeState_DEPRECATED?: ({
    set: <T>(RecoilValue<T>, T) => void,
    setUnvalidatedAtomValues: (Map<string, mixed>) => void,
  }) => void,
  initializeState?: MutableSnapshot => void,
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
      const {nextTree} = storeState;

      // Ignore commits that are not because of Recoil transactions -- namely,
      // because something above RecoilRoot re-rendered:
      if (nextTree === null) {
        return;
      }

      // Inform transaction subscribers of the transaction:
      const dirtyAtoms = nextTree.dirtyAtoms;
      if (dirtyAtoms.size) {
        // Execute Node-specific subscribers before global subscribers
        for (const [
          key,
          subscriptions,
        ] of storeState.nodeTransactionSubscriptions) {
          if (dirtyAtoms.has(key)) {
            for (const subscription of subscriptions) {
              subscription(storeRef.current);
            }
          }
        }
        for (const [_, subscription] of storeState.transactionSubscriptions) {
          subscription(storeRef.current);
        }
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
  if (typeof window !== 'undefined' && !window.$recoilDebugStates) {
    window.$recoilDebugStates = [];
  }
}

function initialStoreState_DEPRECATED(store, initializeState): StoreState {
  const initial: StoreState = makeEmptyStoreState();
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
  return initial;
}

function initialStoreState(initializeState): StoreState {
  const snapshot = freshSnapshot().map(initializeState);
  return makeStoreState(snapshot.getStore_INTERNAL().getState().currentTree);
}

let nextID = 0;
function RecoilRoot({
  initializeState_DEPRECATED,
  initializeState,
  children,
}: Props): ReactElement {
  let storeState; // eslint-disable-line prefer-const

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
      // Node-specific transaction subscriptions from onSet() effect
      const {nodeTransactionSubscriptions} = storeRef.current.getState();
      if (!nodeTransactionSubscriptions.has(key)) {
        nodeTransactionSubscriptions.set(key, []);
      }
      nullthrows(nodeTransactionSubscriptions.get(key)).push(callback);
      // We don't currently support canceling onSet() handlers, but can if needed
      return {release: () => {}};
    }
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

  const store = {
    getState: () => storeState.current,
    replaceState,
    subscribeToTransactions,
    addTransactionMetadata,
    fireNodeSubscriptions: fireNodeSubscriptionsForStore,
  };
  const storeRef = useRef(store);
  storeState = useRef(
    initializeState_DEPRECATED != null
      ? initialStoreState_DEPRECATED(store, initializeState_DEPRECATED)
      : initializeState != null
      ? initialStoreState(initializeState)
      : makeEmptyStoreState(),
  );

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
