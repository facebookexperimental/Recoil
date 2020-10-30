'use strict';

Object.defineProperty(exports, '__esModule', {value: true});

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var react = _interopDefault(require('react'));
var reactDom = _interopDefault(require('react-dom'));

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */

function sprintf(format, ...args) {
  let index = 0;
  return format.replace(/%s/g, () => String(args[index++]));
}

var sprintf_1 = sprintf;

function expectationViolation(format, ...args) {
  {
    const message = sprintf_1.call(null, format, ...args);
    const error = new Error(message);
    error.name = 'Expectation Violation';
    console.error(error);
  }
}

var expectationViolation_1 = expectationViolation;

// @oss-only

var Recoil_expectationViolation = expectationViolation_1;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */

function recoverableViolation(message, projectName, {error} = {}) {
  {
    console.error(message, error);
  }

  return null;
}

var recoverableViolation_1 = recoverableViolation;

// @oss-only

var Recoil_recoverableViolation = recoverableViolation_1;

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */

// eslint-disable-next-line no-unused-vars
class AbstractRecoilValue {
  constructor(newKey) {
    _defineProperty(this, 'key', void 0);

    this.key = newKey;
  }
}

class RecoilState extends AbstractRecoilValue {}

class RecoilValueReadOnly extends AbstractRecoilValue {}

function isRecoilValue(x) {
  return x instanceof RecoilState || x instanceof RecoilValueReadOnly;
}

var Recoil_RecoilValue = {
  AbstractRecoilValue,
  RecoilState,
  RecoilValueReadOnly,
  isRecoilValue,
};

var Recoil_RecoilValue_1 = Recoil_RecoilValue.AbstractRecoilValue;
var Recoil_RecoilValue_2 = Recoil_RecoilValue.RecoilState;
var Recoil_RecoilValue_3 = Recoil_RecoilValue.RecoilValueReadOnly;
var Recoil_RecoilValue_4 = Recoil_RecoilValue.isRecoilValue;

var Recoil_RecoilValue$1 = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  AbstractRecoilValue: Recoil_RecoilValue_1,
  RecoilState: Recoil_RecoilValue_2,
  RecoilValueReadOnly: Recoil_RecoilValue_3,
  isRecoilValue: Recoil_RecoilValue_4,
});

class DefaultValue {}

const DEFAULT_VALUE = new DefaultValue();

class RecoilValueNotReady extends Error {
  constructor(key) {
    super(
      `Tried to set the value of Recoil selector ${key} using an updater function, but it is an async selector in a pending or error state; this is not supported.`,
    );
  }
}

// flowlint-next-line unclear-type:off
const nodes = new Map(); // flowlint-next-line unclear-type:off

const recoilValues = new Map();
/* eslint-disable no-redeclare */

function registerNode(node) {
  if (nodes.has(node.key)) {
    const message = `Duplicate atom key "${node.key}". This is a FATAL ERROR in
      production. But it is safe to ignore this warning if it occurred because of
      hot module replacement.`; // TODO Need to figure out if there is a standard/open-source equivalent to see if hot module replacement is happening:
    // prettier-ignore
    // @fb-only: if (__DEV__) {
    // @fb-only: const isAcceptingUpdate = require('__debug').isAcceptingUpdate;
    // prettier-ignore
    // @fb-only: if (typeof isAcceptingUpdate !== 'function' || !isAcceptingUpdate()) {
    // @fb-only: expectationViolation(message, 'recoil');
    // @fb-only: }
    // prettier-ignore
    // @fb-only: } else {

    Recoil_recoverableViolation(message); // @fb-only: }
  }

  nodes.set(node.key, node);
  const recoilValue =
    node.set == null
      ? new Recoil_RecoilValue$1.RecoilValueReadOnly(node.key)
      : new Recoil_RecoilValue$1.RecoilState(node.key);
  recoilValues.set(node.key, recoilValue);
  return recoilValue;
}
/* eslint-enable no-redeclare */

class NodeMissingError extends Error {} // flowlint-next-line unclear-type:off

function getNode(key) {
  const node = nodes.get(key);

  if (node == null) {
    throw new NodeMissingError(`Missing definition for RecoilValue: "${key}""`);
  }

  return node;
} // flowlint-next-line unclear-type:off

function getNodeMaybe(key) {
  return nodes.get(key);
}

var Recoil_Node = {
  nodes,
  recoilValues,
  registerNode,
  getNode,
  getNodeMaybe,
  NodeMissingError,
  DefaultValue,
  DEFAULT_VALUE,
  RecoilValueNotReady,
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */

function enqueueExecution(s, f) {
  f();
}

var Recoil_Queue = {
  enqueueExecution,
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Utilities for working with built-in Maps and Sets without mutating them.
 *
 * @emails oncall+recoil
 *
 * @format
 */

function setByAddingToSet(set, v) {
  const next = new Set(set);
  next.add(v);
  return next;
}

function setByDeletingFromSet(set, v) {
  const next = new Set(set);
  next.delete(v);
  return next;
}

function mapBySettingInMap(map, k, v) {
  const next = new Map(map);
  next.set(k, v);
  return next;
}

function mapByUpdatingInMap(map, k, updater) {
  const next = new Map(map);
  next.set(k, updater(next.get(k)));
  return next;
}

function mapByDeletingFromMap(map, k) {
  const next = new Map(map);
  next.delete(k);
  return next;
}

function mapByDeletingMultipleFromMap(map, ks) {
  const next = new Map(map);
  ks.forEach(k => next.delete(k));
  return next;
}

var Recoil_CopyOnWrite = {
  setByAddingToSet,
  setByDeletingFromSet,
  mapBySettingInMap,
  mapByUpdatingInMap,
  mapByDeletingFromMap,
  mapByDeletingMultipleFromMap,
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */

function nullthrows(x, message) {
  if (x != null) {
    return x;
  }

  throw new Error(
    message !== null && message !== void 0
      ? message
      : 'Got unexpected null or undefined',
  );
}

var Recoil_nullthrows = nullthrows;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Interface for `scheduler/tracing` to aid in profiling Recoil and Recoil apps.
 *
 * @emails oncall+recoil
 *
 * @format
 */

// flowlint-next-line untyped-import:off
// @fb-only: const SchedulerTracing = require('SchedulerTracing');
function trace(message, node, fn) {
  // prettier-ignore
  // @fb-only: if (__DEV__) {
  // prettier-ignore
  // @fb-only: if (
  // prettier-ignore
  // @fb-only: SchedulerTracing.unstable_trace !== undefined &&
  // prettier-ignore
  // @fb-only: window.performance !== undefined
  // prettier-ignore
  // @fb-only: ) {
  // prettier-ignore
  // @fb-only: return SchedulerTracing.unstable_trace(
  // prettier-ignore
  // @fb-only: `Recoil: ${message} for node: ${
  // prettier-ignore
  // @fb-only: typeof node === 'string' ? node : node.key
  // prettier-ignore
  // @fb-only: }`,
  // prettier-ignore
  // @fb-only: window.performance.now(),
  // prettier-ignore
  // @fb-only: fn,
  // prettier-ignore
  // @fb-only: );
  // prettier-ignore
  // @fb-only: }
  // prettier-ignore
  // @fb-only: }
  return fn();
}

function wrap(fn) {
  // prettier-ignore
  // @fb-only: if (__DEV__) {
  // prettier-ignore
  // @fb-only: if (SchedulerTracing.unstable_wrap !== undefined) {
  // prettier-ignore
  // @fb-only: return SchedulerTracing.unstable_wrap(fn);
  // prettier-ignore
  // @fb-only: }
  // prettier-ignore
  // @fb-only: }
  return fn;
}

var Recoil_Tracing = {
  trace,
  wrap,
};

const {
  mapByDeletingFromMap: mapByDeletingFromMap$1,
  mapBySettingInMap: mapBySettingInMap$1,
  setByAddingToSet: setByAddingToSet$1,
} = Recoil_CopyOnWrite;

const {getNode: getNode$1, getNodeMaybe: getNodeMaybe$1} = Recoil_Node; // flowlint-next-line unclear-type:off

const emptySet = Object.freeze(new Set());

class ReadOnlyRecoilValueError extends Error {} // Get the current value loadable of a node and update the state.
// Update dependencies and subscriptions for selectors.
// Update saved value validation for atoms.

function getNodeLoadable(store, state, key) {
  return getNode$1(key).get(store, state);
} // Peek at the current value loadable for a node.
// NOTE: Only use in contexts where you don't need to update the store with
//       new dependencies for the node!

function peekNodeLoadable(store, state, key) {
  return getNodeLoadable(store, state, key)[1];
} // Write value directly to state bypassing the Node interface as the node
// definitions may not have been loaded yet when processing the initial snapshot.

function setUnvalidatedAtomValue(state, key, newValue) {
  var _node$invalidate;

  const node = getNodeMaybe$1(key);
  node === null || node === void 0
    ? void 0
    : (_node$invalidate = node.invalidate) === null ||
      _node$invalidate === void 0
    ? void 0
    : _node$invalidate.call(node);
  return {
    ...state,
    atomValues: mapByDeletingFromMap$1(state.atomValues, key),
    nonvalidatedAtoms: mapBySettingInMap$1(
      state.nonvalidatedAtoms,
      key,
      newValue,
    ),
    dirtyAtoms: setByAddingToSet$1(state.dirtyAtoms, key),
  };
} // Return the discovered dependencies and values to be written by setting
// a node value. (Multiple values may be written due to selectors getting to
// set upstreams; deps may be discovered because of reads in updater functions.)

function setNodeValue(store, state, key, newValue) {
  const node = getNode$1(key);

  if (node.set == null) {
    throw new ReadOnlyRecoilValueError(
      `Attempt to set read-only RecoilValue: ${key}`,
    );
  }

  return node.set(store, state, newValue);
}

function graphForTreeState(store, treeState) {
  return Recoil_nullthrows(
    store.getState().graphsByVersion.get(treeState.version),
  );
} // Find all of the recursively dependent nodes

function getDownstreamNodes(store, state, keys) {
  const dependentNodes = new Set();
  const visitedNodes = new Set();
  const visitingNodes = Array.from(keys);

  for (let key = visitingNodes.pop(); key; key = visitingNodes.pop()) {
    var _graphForTreeState$no;

    dependentNodes.add(key);
    visitedNodes.add(key);
    const subscribedNodes =
      (_graphForTreeState$no = graphForTreeState(
        store,
        state,
      ).nodeToNodeSubscriptions.get(key)) !== null &&
      _graphForTreeState$no !== void 0
        ? _graphForTreeState$no
        : emptySet;

    for (const downstreamNode of subscribedNodes) {
      if (!visitedNodes.has(downstreamNode)) {
        visitingNodes.push(downstreamNode);
      }
    }
  }

  return dependentNodes;
} // Fire or enqueue callbacks to rerender components that are subscribed to
// nodes affected by the updatedNodes

function fireNodeSubscriptions(store, updatedNodes, when) {
  var _store$getState$nextT;

  /*
  This is called in two conditions: When an atom is set (with 'enqueue') and
  when an async selector resolves (with 'now'). When an atom is set, we want
  to use the latest dependencies that may have become dependencies due to
  earlier changes in a batch. But if an async selector happens to resolve during
  a batch, it should use the currently rendered output, and then the end of the
  batch will trigger any further subscriptions due to new deps in the new state.
  */
  const state =
    when === 'enqueue'
      ? (_store$getState$nextT = store.getState().nextTree) !== null &&
        _store$getState$nextT !== void 0
        ? _store$getState$nextT
        : store.getState().currentTree
      : store.getState().currentTree;
  const callOrQueue =
    when === 'enqueue'
      ? cb => store.getState().queuedComponentCallbacks.push(cb)
      : cb => cb(state);
  const dependentNodes = getDownstreamNodes(store, state, updatedNodes);

  for (const key of dependentNodes) {
    var _store$getState$nodeT;

    const subscribers =
      (_store$getState$nodeT = store
        .getState()
        .nodeToComponentSubscriptions.get(key)) !== null &&
      _store$getState$nodeT !== void 0
        ? _store$getState$nodeT
        : [];
    subscribers.forEach(([_debugName, cb]) => callOrQueue(cb));
  } // Wake all suspended components so the right one(s) can try to re-render.
  // We need to wake up components not just when some asynchronous selector
  // resolved (when === 'now'), but also when changing synchronous values because
  // they may cause a selector to change from asynchronous to synchronous, in
  // which case there would be no follow-up asynchronous resolution to wake us up.
  // TODO OPTIMIZATION Only wake up related downstream components

  const nodeNames = Array.from(updatedNodes).join(', ');
  const resolvers = store.getState().suspendedComponentResolvers;
  resolvers.forEach(cb =>
    callOrQueue(_state =>
      Recoil_Tracing.trace(
        'value became available, waking components',
        nodeNames,
        cb,
      ),
    ),
  );
}

var Recoil_FunctionalCore = {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  setUnvalidatedAtomValue,
  fireNodeSubscriptions,
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */
/**
 * Returns a set containing all of the values from the first set that are not
 * present in any of the subsequent sets.
 *
 * Note: this is written procedurally (i.e., without filterSet) for performant
 * use in tight loops.
 */

function differenceSets(set, ...setsWithValuesToRemove) {
  const ret = new Set();

  FIRST: for (const value of set) {
    for (const otherSet of setsWithValuesToRemove) {
      if (otherSet.has(value)) {
        continue FIRST;
      }
    }

    ret.add(value);
  }

  return ret;
}

var Recoil_differenceSets = differenceSets;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */
/**
 * Returns a new Map object with the same keys as the original, but with the
 * values replaced with the output of the given callback function.
 */

function mapMap(map, callback) {
  const result = new Map();
  map.forEach((value, key) => {
    result.set(key, callback(value, key));
  });
  return result;
}

var Recoil_mapMap = mapMap;

function graph() {
  return {
    nodeDeps: new Map(),
    nodeToNodeSubscriptions: new Map(),
  };
}

function cloneGraph(graph) {
  return {
    nodeDeps: Recoil_mapMap(graph.nodeDeps, s => new Set(s)),
    nodeToNodeSubscriptions: Recoil_mapMap(
      graph.nodeToNodeSubscriptions,
      s => new Set(s),
    ),
  };
} // Note that this overwrites the deps of existing nodes, rather than unioning
// the new deps with the old deps.

function mergeDepedencyMapIntoGraph(deps, graph) {
  const {nodeDeps, nodeToNodeSubscriptions} = graph;
  deps.forEach((upstreams, downstream) => {
    const existingUpstreams = nodeDeps.get(downstream); // Update nodeDeps:

    nodeDeps.set(downstream, new Set(upstreams)); // Add new deps to nodeToNodeSubscriptions:

    const addedUpstreams =
      existingUpstreams == null
        ? upstreams
        : Recoil_differenceSets(upstreams, existingUpstreams);
    addedUpstreams.forEach(upstream => {
      if (!nodeToNodeSubscriptions.has(upstream)) {
        nodeToNodeSubscriptions.set(upstream, new Set());
      }

      const existing = Recoil_nullthrows(nodeToNodeSubscriptions.get(upstream));
      existing.add(downstream);
    }); // Remove removed deps from nodeToNodeSubscriptions:

    if (existingUpstreams) {
      const removedUpstreams = Recoil_differenceSets(
        existingUpstreams,
        upstreams,
      );
      removedUpstreams.forEach(upstream => {
        if (!nodeToNodeSubscriptions.has(upstream)) {
          return;
        }

        const existing = Recoil_nullthrows(
          nodeToNodeSubscriptions.get(upstream),
        );
        existing.delete(downstream);

        if (existing.size === 0) {
          nodeToNodeSubscriptions.delete(upstream);
        }
      });
    }
  });
}

function saveDependencyMapToStore(dependencyMap, store, version) {
  // Merge the dependencies discovered into the store's dependency map
  // for the version that was read:
  const depsByVersion = store.getState().graphsByVersion;

  if (!depsByVersion.has(version)) {
    depsByVersion.set(version, graph());
  }

  const existingMap = Recoil_nullthrows(depsByVersion.get(version));
  mergeDepedencyMapIntoGraph(dependencyMap, existingMap);
}

function mergeDepsIntoDependencyMap(from, into) {
  from.forEach((downstreams, upstream) => {
    if (!into.has(upstream)) {
      into.set(upstream, new Set());
    }

    const set = Recoil_nullthrows(into.get(upstream));
    downstreams.forEach(d => set.add(d));
  });
}

function addToDependencyMap(downstream, upstream, dependencyMap) {
  if (!dependencyMap.has(downstream)) {
    dependencyMap.set(downstream, new Set());
  }

  Recoil_nullthrows(dependencyMap.get(downstream)).add(upstream);
}

var Recoil_Graph = {
  addToDependencyMap,
  cloneGraph,
  graph,
  mergeDepsIntoDependencyMap,
  saveDependencyMapToStore,
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */

function unionSets(...sets) {
  const result = new Set();

  for (const set of sets) {
    for (const value of set) {
      result.add(value);
    }
  }

  return result;
}

var Recoil_unionSets = unionSets;

const {
  mapByDeletingMultipleFromMap: mapByDeletingMultipleFromMap$1,
} = Recoil_CopyOnWrite;

const {
  getNodeLoadable: getNodeLoadable$1,
  peekNodeLoadable: peekNodeLoadable$1,
  setNodeValue: setNodeValue$1,
  setUnvalidatedAtomValue: setUnvalidatedAtomValue$1,
} = Recoil_FunctionalCore;

const {saveDependencyMapToStore: saveDependencyMapToStore$1} = Recoil_Graph;

const {
  DefaultValue: DefaultValue$1,
  RecoilValueNotReady: RecoilValueNotReady$1,
} = Recoil_Node;

const {
  AbstractRecoilValue: AbstractRecoilValue$1,
  RecoilState: RecoilState$1,
  RecoilValueReadOnly: RecoilValueReadOnly$1,
  isRecoilValue: isRecoilValue$1,
} = Recoil_RecoilValue$1;

function getRecoilValueAsLoadable(store, {key}) {
  // FIXME, should be the tree of the individual component when useMutableSource is in use
  const treeState = store.getState().currentTree;
  const version = treeState.version;
  const [dependencyMap, loadable] = getNodeLoadable$1(store, treeState, key);
  saveDependencyMapToStore$1(dependencyMap, store, version);
  return loadable;
}

function applyAtomValueWrites(atomValues, writes) {
  const result = Recoil_mapMap(atomValues, v => v);
  writes.forEach((v, k) => {
    if (v.state === 'hasValue' && v.contents instanceof DefaultValue$1) {
      result.delete(k);
    } else {
      result.set(k, v);
    }
  });
  return result;
}

function valueFromValueOrUpdater(store, {key}, valueOrUpdater) {
  if (typeof valueOrUpdater === 'function') {
    var _storeState$nextTree;

    // Updater form: pass in the current value. Throw if the current value
    // is unavailable (namely when updating an async selector that's
    // pending or errored):
    const storeState = store.getState();
    const state =
      (_storeState$nextTree = storeState.nextTree) !== null &&
      _storeState$nextTree !== void 0
        ? _storeState$nextTree
        : storeState.currentTree; // NOTE: This will not update state with node subscriptions.

    const current = peekNodeLoadable$1(store, state, key);

    if (current.state === 'loading') {
      throw new RecoilValueNotReady$1(key);
    } else if (current.state === 'hasError') {
      throw current.contents;
    } // T itself may be a function, so our refinement is not sufficient:

    return valueOrUpdater(current.contents); // flowlint-line unclear-type:off
  } else {
    return valueOrUpdater;
  }
}

function setRecoilValue(store, recoilValue, valueOrUpdater) {
  const {key} = recoilValue;
  Recoil_Tracing.trace('set RecoilValue', key, () =>
    store.replaceState(
      Recoil_Tracing.wrap(state => {
        const newValue = valueFromValueOrUpdater(
          store,
          recoilValue,
          valueOrUpdater,
        );
        const [depMap, writes] = setNodeValue$1(store, state, key, newValue);
        const writtenNodes = new Set(writes.keys());
        store.fireNodeSubscriptions(writtenNodes, 'enqueue');
        saveDependencyMapToStore$1(depMap, store, state.version);
        const nonvalidatedAtoms = mapByDeletingMultipleFromMap$1(
          state.nonvalidatedAtoms,
          writtenNodes,
        );
        return {
          ...state,
          dirtyAtoms: Recoil_unionSets(state.dirtyAtoms, writtenNodes),
          atomValues: applyAtomValueWrites(state.atomValues, writes),
          nonvalidatedAtoms,
        };
      }),
    ),
  );
}

function setUnvalidatedRecoilValue(store, {key}, newValue) {
  Recoil_Tracing.trace('set unvalidated persisted atom', key, () =>
    store.replaceState(
      Recoil_Tracing.wrap(state => {
        const newState = setUnvalidatedAtomValue$1(state, key, newValue);
        store.fireNodeSubscriptions(new Set([key]), 'enqueue');
        return newState;
      }),
    ),
  );
}

let subscriptionID = 0;

function subscribeToRecoilValue(store, {key}, callback) {
  const subID = subscriptionID++;
  const storeState = store.getState();

  if (!storeState.nodeToComponentSubscriptions.has(key)) {
    storeState.nodeToComponentSubscriptions.set(key, new Map());
  }

  Recoil_nullthrows(storeState.nodeToComponentSubscriptions.get(key)).set(
    subID,
    ['TODO debug name', callback],
  );
  return {
    release: () => {
      const storeState = store.getState();
      const subs = storeState.nodeToComponentSubscriptions.get(key);

      if (subs === undefined || !subs.has(subID)) {
        Recoil_recoverableViolation(
          `Subscription missing at release time for atom ${key}. This is a bug in Recoil.`,
        );
        return;
      }

      subs.delete(subID);

      if (subs.size === 0) {
        storeState.nodeToComponentSubscriptions.delete(key);
      }
    },
  };
}

var Recoil_RecoilValueInterface = {
  RecoilValueReadOnly: RecoilValueReadOnly$1,
  AbstractRecoilValue: AbstractRecoilValue$1,
  RecoilState: RecoilState$1,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
  isRecoilValue: isRecoilValue$1,
  applyAtomValueWrites, // TODO Remove export when deprecating initialStoreState_DEPRECATED in RecoilRoot
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */
/**
 * Creates a new iterable whose output is generated by passing the input
 * iterable's values through the mapper function.
 */

function mapIterable(iterable, callback) {
  // Use generator to create iterable/iterator
  return (function* () {
    let index = 0;

    for (const value of iterable) {
      yield callback(value, index++);
    }
  })();
}

var Recoil_mapIterable = mapIterable;

const {graph: graph$1} = Recoil_Graph; // flowlint-next-line unclear-type:off

function makeEmptyTreeState() {
  return {
    version: 0,
    transactionMetadata: {},
    dirtyAtoms: new Set(),
    atomValues: new Map(),
    nonvalidatedAtoms: new Map(),
  };
}

function makeStoreState(treeState) {
  return {
    currentTree: treeState,
    nextTree: null,
    knownAtoms: new Set(),
    knownSelectors: new Set(),
    transactionSubscriptions: new Map(),
    nodeTransactionSubscriptions: new Map(),
    queuedComponentCallbacks: [],
    suspendedComponentResolvers: new Set(),
    nodeToComponentSubscriptions: new Map(),
    graphsByVersion: new Map().set(treeState.version, graph$1()),
    versionsUsedByComponent: new Map(),
  };
}

function makeEmptyStoreState() {
  return makeStoreState(makeEmptyTreeState());
}

var Recoil_State = {
  makeEmptyTreeState,
  makeEmptyStoreState,
  makeStoreState,
};

const {
  DEFAULT_VALUE: DEFAULT_VALUE$1,
  recoilValues: recoilValues$1,
} = Recoil_Node;

const {
  getRecoilValueAsLoadable: getRecoilValueAsLoadable$1,
  setRecoilValue: setRecoilValue$1,
} = Recoil_RecoilValueInterface;

const {
  makeEmptyTreeState: makeEmptyTreeState$1,
  makeStoreState: makeStoreState$1,
} = Recoil_State; // TODO Temporary until Snapshots only contain state

function makeSnapshotStore(treeState) {
  const storeState = makeStoreState$1(treeState);
  const store = {
    getState: () => storeState,
    replaceState: replacer => {
      storeState.currentTree = replacer(storeState.currentTree); // no batching so nextTree is never active
    },
    subscribeToTransactions: () => ({
      release: () => {},
    }),
    addTransactionMetadata: () => {
      throw new Error('Cannot subscribe to Snapshots');
    },
    fireNodeSubscriptions: () => {},
  };
  return store;
} // A "Snapshot" is "read-only" and captures a specific set of values of atoms.
// However, the data-flow-graph and selector values may evolve as selector
// evaluation functions are executed and async selectors resolve.

class Snapshot {
  constructor(treeState) {
    _defineProperty(this, '_store', void 0);

    _defineProperty(this, 'getLoadable', recoilValue =>
      getRecoilValueAsLoadable$1(this._store, recoilValue),
    );

    _defineProperty(this, 'getPromise', recoilValue =>
      this.getLoadable(recoilValue).toPromise(),
    );

    _defineProperty(this, 'getNodes_UNSTABLE', opt => {
      // TODO Deal with modified selectors
      if ((opt === null || opt === void 0 ? void 0 : opt.dirty) === true) {
        const state = this._store.getState().currentTree;

        return Recoil_mapIterable(state.dirtyAtoms, key =>
          Recoil_nullthrows(recoilValues$1.get(key)),
        );
      }

      return recoilValues$1.values();
    });

    _defineProperty(this, 'getDeps_UNSTABLE', recoilValue => {
      var _storeState$graphsByV;

      this.getLoadable(recoilValue); // Evaluate node to ensure deps are up-to-date

      const storeState = this._store.getState();

      const deps =
        (_storeState$graphsByV = storeState.graphsByVersion.get(
          storeState.currentTree.version,
        )) === null || _storeState$graphsByV === void 0
          ? void 0
          : _storeState$graphsByV.nodeDeps.get(recoilValue.key);
      return (function* () {
        for (const key of deps !== null && deps !== void 0 ? deps : []) {
          yield Recoil_nullthrows(recoilValues$1.get(key));
        }
      })();
    });

    _defineProperty(this, 'map', mapper => {
      const mutableSnapshot = new MutableSnapshot(
        this._store.getState().currentTree,
      );
      mapper(mutableSnapshot);
      const newState = mutableSnapshot.getStore_INTERNAL().getState()
        .currentTree;
      return cloneSnapshot(newState);
    });

    _defineProperty(this, 'asyncMap', async mapper => {
      const mutableSnapshot = new MutableSnapshot(
        this._store.getState().currentTree,
      );
      await mapper(mutableSnapshot);
      const newState = mutableSnapshot.getStore_INTERNAL().getState()
        .currentTree;
      return cloneSnapshot(newState);
    });

    this._store = makeSnapshotStore(treeState);
  }

  getStore_INTERNAL() {
    return this._store;
  }
}

function cloneTreeState(treeState) {
  return {
    version: treeState.version,
    transactionMetadata: {...treeState.transactionMetadata},
    dirtyAtoms: new Set(treeState.dirtyAtoms),
    atomValues: new Map(treeState.atomValues),
    nonvalidatedAtoms: new Map(treeState.nonvalidatedAtoms),
  };
} // Factory to build a fresh snapshot

function freshSnapshot() {
  return new Snapshot(makeEmptyTreeState$1());
} // Factory to clone a snapahot state

function cloneSnapshot(treeState) {
  return new Snapshot(cloneTreeState(treeState));
}

class MutableSnapshot extends Snapshot {
  constructor(treeState) {
    super(cloneTreeState(treeState));

    _defineProperty(this, 'set', (recoilState, newValueOrUpdater) => {
      const store = this.getStore_INTERNAL();
      setRecoilValue$1(store, recoilState, newValueOrUpdater);
    });

    _defineProperty(this, 'reset', recoilState =>
      setRecoilValue$1(this.getStore_INTERNAL(), recoilState, DEFAULT_VALUE$1),
    );
  } // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
}

var Recoil_Snapshot = {
  Snapshot,
  MutableSnapshot,
  freshSnapshot,
  cloneSnapshot,
};

var Recoil_Snapshot_1 = Recoil_Snapshot.Snapshot;
var Recoil_Snapshot_2 = Recoil_Snapshot.MutableSnapshot;
var Recoil_Snapshot_3 = Recoil_Snapshot.freshSnapshot;
var Recoil_Snapshot_4 = Recoil_Snapshot.cloneSnapshot;

var Recoil_Snapshot$1 = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  Snapshot: Recoil_Snapshot_1,
  MutableSnapshot: Recoil_Snapshot_2,
  freshSnapshot: Recoil_Snapshot_3,
  cloneSnapshot: Recoil_Snapshot_4,
});

const {useContext, useEffect, useRef, useState} = react;

const {
  fireNodeSubscriptions: fireNodeSubscriptions$1,
  setNodeValue: setNodeValue$2,
  setUnvalidatedAtomValue: setUnvalidatedAtomValue$2,
} = Recoil_FunctionalCore;

const {saveDependencyMapToStore: saveDependencyMapToStore$2} = Recoil_Graph;

const {cloneGraph: cloneGraph$1} = Recoil_Graph;

const {
  applyAtomValueWrites: applyAtomValueWrites$1,
} = Recoil_RecoilValueInterface;

const {freshSnapshot: freshSnapshot$1} = Recoil_Snapshot$1;

const {
  makeEmptyStoreState: makeEmptyStoreState$1,
  makeStoreState: makeStoreState$2,
} = Recoil_State;

const {
  mapByDeletingMultipleFromMap: mapByDeletingMultipleFromMap$2,
} = Recoil_CopyOnWrite;

function notInAContext() {
  throw new Error(
    'This component must be used inside a <RecoilRoot> component.',
  );
}

const defaultStore = Object.freeze({
  getState: notInAContext,
  replaceState: notInAContext,
  subscribeToTransactions: notInAContext,
  addTransactionMetadata: notInAContext,
  fireNodeSubscriptions: notInAContext,
});

function startNextTreeIfNeeded(storeState) {
  if (storeState.nextTree === null) {
    const version = storeState.currentTree.version;
    storeState.nextTree = {
      ...storeState.currentTree,
      version: version + 1,
      dirtyAtoms: new Set(),
      transactionMetadata: {},
    };
    storeState.graphsByVersion.set(
      version + 1,
      cloneGraph$1(Recoil_nullthrows(storeState.graphsByVersion.get(version))),
    );
  }
}

const AppContext = react.createContext({
  current: defaultStore,
});

const useStoreRef = () => useContext(AppContext);
/*
 * The purpose of the Batcher is to observe when React batches end so that
 * Recoil state changes can be batched. Whenever Recoil state changes, we call
 * setState on the batcher. Then we wait for that change to be committed, which
 * signifies the end of the batch. That's when we respond to the Recoil change.
 */

function Batcher(props) {
  const storeRef = useStoreRef();
  const [_, setState] = useState([]);
  props.setNotifyBatcherOfChange(() => setState({}));
  useEffect(() => {
    // enqueueExecution runs this function immediately; it is only used to
    // manipulate the order of useEffects during tests, since React seems to
    // call useEffect in an unpredictable order sometimes.
    Recoil_Queue.enqueueExecution('Batcher', () => {
      const storeState = storeRef.current.getState();
      const {nextTree} = storeState; // Ignore commits that are not because of Recoil transactions -- namely,
      // because something above RecoilRoot re-rendered:

      if (nextTree === null) {
        return;
      } // Inform transaction subscribers of the transaction:

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
      } // Inform components that depend on dirty atoms of the transaction:
      // FIXME why is this StoreState but dirtyAtoms is TreeState? Seems like they should be the same.

      storeState.queuedComponentCallbacks.forEach(cb => cb(nextTree));
      storeState.queuedComponentCallbacks.splice(
        0,
        storeState.queuedComponentCallbacks.length,
      ); // nextTree is now committed -- note that copying and reset occurs when
      // a transaction begins, in startNextTreeIfNeeded:

      storeState.currentTree = nextTree;
      storeState.nextTree = null;
    });
  });
  return null;
}

{
  if (typeof window !== 'undefined' && !window.$recoilDebugStates) {
    window.$recoilDebugStates = [];
  }
} // When removing this deprecated function, remove stateBySettingRecoilValue
// which will no longer be needed.

function initialStoreState_DEPRECATED(store, initializeState) {
  const initial = makeEmptyStoreState$1();
  initializeState({
    set: (atom, value) => {
      const state = initial.currentTree;
      const [depMap, writes] = setNodeValue$2(store, state, atom.key, value);
      const writtenNodes = new Set(writes.keys());
      saveDependencyMapToStore$2(depMap, store, state.version);
      const nonvalidatedAtoms = mapByDeletingMultipleFromMap$2(
        state.nonvalidatedAtoms,
        writtenNodes,
      );
      initial.currentTree = {
        ...state,
        dirtyAtoms: Recoil_unionSets(state.dirtyAtoms, writtenNodes),
        atomValues: applyAtomValueWrites$1(state.atomValues, writes),
        // NB: PLEASE un-export applyAtomValueWrites when deleting this code
        nonvalidatedAtoms,
      };
    },
    setUnvalidatedAtomValues: atomValues => {
      atomValues.forEach((v, k) => {
        initial.currentTree = setUnvalidatedAtomValue$2(
          initial.currentTree,
          k,
          v,
        );
      });
    },
  });
  return initial;
}

function initialStoreState(initializeState) {
  const snapshot = freshSnapshot$1().map(initializeState);
  return makeStoreState$2(snapshot.getStore_INTERNAL().getState().currentTree);
}

let nextID = 0;

function RecoilRoot({initializeState_DEPRECATED, initializeState, children}) {
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

      Recoil_nullthrows(nodeTransactionSubscriptions.get(key)).push(callback); // We don't currently support canceling onSet() handlers, but can if needed

      return {
        release: () => {},
      };
    }
  };

  const addTransactionMetadata = metadata => {
    startNextTreeIfNeeded(storeRef.current.getState());

    for (const k of Object.keys(metadata)) {
      Recoil_nullthrows(
        storeRef.current.getState().nextTree,
      ).transactionMetadata[k] = metadata[k];
    }
  };

  function fireNodeSubscriptionsForStore(updatedNodes, when) {
    fireNodeSubscriptions$1(storeRef.current, updatedNodes, when);
  }

  const replaceState = replacer => {
    const storeState = storeRef.current.getState();
    startNextTreeIfNeeded(storeState); // Use replacer to get the next state:

    const nextTree = Recoil_nullthrows(storeState.nextTree);
    const replaced = replacer(nextTree);

    if (replaced === nextTree) {
      return;
    }

    {
      if (typeof window !== 'undefined') {
        window.$recoilDebugStates.push(replaced); // TODO this shouldn't happen here because it's not batched
      }
    } // Save changes to nextTree and schedule a React update:

    storeState.nextTree = replaced;
    Recoil_nullthrows(notifyBatcherOfChange.current)();
  };

  const notifyBatcherOfChange = useRef(null);

  function setNotifyBatcherOfChange(x) {
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
      : makeEmptyStoreState$1(),
  );
  return /*#__PURE__*/ react.createElement(
    AppContext.Provider,
    {
      value: storeRef,
    },
    /*#__PURE__*/ react.createElement(Batcher, {
      setNotifyBatcherOfChange: setNotifyBatcherOfChange,
    }),
    children,
  );
}

var Recoil_RecoilRoot_react = {
  useStoreRef,
  RecoilRoot,
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */
/**
 * Returns a map containing all of the keys + values from the original map where
 * the given callback returned true.
 */

function filterMap(map, callback) {
  const result = new Map();

  for (const [key, value] of map) {
    if (callback(value, key)) {
      result.set(key, value);
    }
  }

  return result;
}

var Recoil_filterMap = filterMap;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

var invariant_1 = invariant;

// @oss-only

var Recoil_invariant = invariant_1;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */

function mergeMaps(...maps) {
  const result = new Map();

  for (let i = 0; i < maps.length; i++) {
    const iterator = maps[i].keys();
    let nextKey;

    while (!(nextKey = iterator.next()).done) {
      // $FlowFixMe - map/iterator knows nothing about flow types
      result.set(nextKey.value, maps[i].get(nextKey.value));
    }
  }
  /* $FlowFixMe(>=0.66.0 site=www,mobile) This comment suppresses an error
   * found when Flow v0.66 was deployed. To see the error delete this comment
   * and run Flow. */

  return result;
}

var Recoil_mergeMaps = mergeMaps;

const {
  useCallback,
  useEffect: useEffect$1,
  useMemo,
  useRef: useRef$1,
  useState: useState$1,
} = react;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$2,
  getNode: getNode$2,
  nodes: nodes$1,
} = Recoil_Node;

const {useStoreRef: useStoreRef$1} = Recoil_RecoilRoot_react;

const {isRecoilValue: isRecoilValue$2} = Recoil_RecoilValue$1;

const {
  AbstractRecoilValue: AbstractRecoilValue$2,
  getRecoilValueAsLoadable: getRecoilValueAsLoadable$2,
  setRecoilValue: setRecoilValue$2,
  setUnvalidatedRecoilValue: setUnvalidatedRecoilValue$1,
  subscribeToRecoilValue: subscribeToRecoilValue$1,
} = Recoil_RecoilValueInterface;

const {
  Snapshot: Snapshot$1,
  cloneSnapshot: cloneSnapshot$1,
} = Recoil_Snapshot$1;

const {setByAddingToSet: setByAddingToSet$2} = Recoil_CopyOnWrite;

function handleLoadable(loadable, atom, storeRef) {
  // We can't just throw the promise we are waiting on to Suspense.  If the
  // upstream dependencies change it may produce a state in which the component
  // can render, but it would still be suspended on a Promise that may never resolve.
  if (loadable.state === 'hasValue') {
    return loadable.contents;
  } else if (loadable.state === 'loading') {
    const promise = new Promise(resolve => {
      storeRef.current.getState().suspendedComponentResolvers.add(resolve);
    });
    throw promise;
  } else if (loadable.state === 'hasError') {
    throw loadable.contents;
  } else {
    throw new Error(`Invalid value of loadable atom "${atom.key}"`);
  }
}

function validateRecoilValue(recoilValue, hookName) {
  if (!isRecoilValue$2(recoilValue)) {
    throw new Error(
      `Invalid argument to ${hookName}: expected an atom or selector but got ${String(
        recoilValue,
      )}`,
    );
  }
}

function useInterface() {
  const storeRef = useStoreRef$1();
  const [_, forceUpdate] = useState$1([]);
  const recoilValuesUsed = useRef$1(new Set());
  recoilValuesUsed.current = new Set(); // Track the RecoilValues used just during this render

  const previousSubscriptions = useRef$1(new Set());
  const subscriptions = useRef$1(new Map());
  const unsubscribeFrom = useCallback(
    key => {
      const sub = subscriptions.current.get(key);

      if (sub) {
        sub.release(storeRef.current);
        subscriptions.current.delete(key);
      }
    },
    [storeRef, subscriptions],
  );
  useEffect$1(() => {
    const store = storeRef.current;

    function updateState(_state, key) {
      if (!subscriptions.current.has(key)) {
        return;
      }

      forceUpdate([]);
    }

    Recoil_differenceSets(
      recoilValuesUsed.current,
      previousSubscriptions.current,
    ).forEach(key => {
      if (subscriptions.current.has(key)) {
        Recoil_expectationViolation(
          `Double subscription to RecoilValue "${key}"`,
        );
        return;
      }

      const sub = subscribeToRecoilValue$1(
        store,
        new AbstractRecoilValue$2(key),
        state => {
          Recoil_Tracing.trace('RecoilValue subscription fired', key, () => {
            updateState(state, key);
          });
        },
      );
      subscriptions.current.set(key, sub);
      Recoil_Tracing.trace('initial update on subscribing', key, () => {
        /**
         * Since we're subscribing in an effect we need to update to the latest
         * value of the atom since it may have changed since we rendered. We can
         * go ahead and do that now, unless we're in the middle of a batch --
         * in which case we should do it at the end of the batch, due to the
         * following edge case: Suppose an atom is updated in another useEffect
         * of this same component. Then the following sequence of events occur:
         * 1. Atom is updated and subs fired (but we may not be subscribed
         *    yet depending on order of effects, so we miss this) Updated value
         *    is now in nextTree, but not currentTree.
         * 2. This effect happens. We subscribe and update.
         * 3. From the update we re-render and read currentTree, with old value.
         * 4. Batcher's effect sets currentTree to nextTree.
         * In this sequence we miss the update. To avoid that, add the update
         * to queuedComponentCallback if a batch is in progress.
         */
        const state = store.getState();

        if (state.nextTree) {
          store.getState().queuedComponentCallbacks.push(
            Recoil_Tracing.wrap(() => {
              updateState(store.getState(), key);
            }),
          );
        } else {
          updateState(store.getState(), key);
        }
      });
    });
    Recoil_differenceSets(
      previousSubscriptions.current,
      recoilValuesUsed.current,
    ).forEach(key => {
      unsubscribeFrom(key);
    });
    previousSubscriptions.current = recoilValuesUsed.current;
  });
  useEffect$1(() => {
    const subs = subscriptions.current;
    return () => subs.forEach((_, key) => unsubscribeFrom(key));
  }, [unsubscribeFrom]);
  return useMemo(() => {
    function useSetRecoilState(recoilState) {
      {
        validateRecoilValue(recoilState, 'useSetRecoilState');
      }

      return newValueOrUpdater => {
        setRecoilValue$2(storeRef.current, recoilState, newValueOrUpdater);
      };
    }

    function useResetRecoilState(recoilState) {
      {
        validateRecoilValue(recoilState, 'useResetRecoilState');
      }

      return () =>
        setRecoilValue$2(storeRef.current, recoilState, DEFAULT_VALUE$2);
    }

    function useRecoilValueLoadable(recoilValue) {
      {
        validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
      }

      if (!recoilValuesUsed.current.has(recoilValue.key)) {
        recoilValuesUsed.current = setByAddingToSet$2(
          recoilValuesUsed.current,
          recoilValue.key,
        );
      } // TODO Restore optimization to memoize lookup

      return getRecoilValueAsLoadable$2(storeRef.current, recoilValue);
    }

    function useRecoilValue(recoilValue) {
      {
        validateRecoilValue(recoilValue, 'useRecoilValue');
      }

      const loadable = useRecoilValueLoadable(recoilValue);
      return handleLoadable(loadable, recoilValue, storeRef);
    }

    function useRecoilState(recoilState) {
      {
        validateRecoilValue(recoilState, 'useRecoilState');
      }

      return [useRecoilValue(recoilState), useSetRecoilState(recoilState)];
    }

    function useRecoilStateLoadable(recoilState) {
      {
        validateRecoilValue(recoilState, 'useRecoilStateLoadable');
      }

      return [
        useRecoilValueLoadable(recoilState),
        useSetRecoilState(recoilState),
      ];
    }

    return {
      getRecoilValue: useRecoilValue,
      getRecoilValueLoadable: useRecoilValueLoadable,
      getRecoilState: useRecoilState,
      getRecoilStateLoadable: useRecoilStateLoadable,
      getSetRecoilState: useSetRecoilState,
      getResetRecoilState: useResetRecoilState,
    };
  }, [recoilValuesUsed, storeRef]);
}
/**
  Returns the value represented by the RecoilValue.
  If the value is pending, it will throw a Promise to suspend the component,
  if the value is an error it will throw it for the nearest React error boundary.
  This will also subscribe the component for any updates in the value.
  */

function useRecoilValue(recoilValue) {
  return useInterface().getRecoilValue(recoilValue);
}
/**
  Like useRecoilValue(), but either returns the value if available or
  just undefined if not available for any reason, such as pending or error.
*/

function useRecoilValueLoadable(recoilValue) {
  return useInterface().getRecoilValueLoadable(recoilValue);
}
/**
  Returns a function that allows the value of a RecoilState to be updated, but does
  not subscribe the component to changes to that RecoilState.
*/

function useSetRecoilState(recoilState) {
  return useCallback(useInterface().getSetRecoilState(recoilState), [
    recoilState,
  ]);
}
/**
  Returns a function that will reset the value of a RecoilState to its default
*/

function useResetRecoilState(recoilState) {
  return useCallback(useInterface().getResetRecoilState(recoilState), [
    recoilState,
  ]);
}
/**
  Equivalent to useState(). Allows the value of the RecoilState to be read and written.
  Subsequent updates to the RecoilState will cause the component to re-render. If the
  RecoilState is pending, this will suspend the component and initiate the
  retrieval of the value. If evaluating the RecoilState resulted in an error, this will
  throw the error so that the nearest React error boundary can catch it.
*/

function useRecoilState(recoilState) {
  const recoilInterface = useInterface();
  const [value] = recoilInterface.getRecoilState(recoilState);
  const setValue = useCallback(recoilInterface.getSetRecoilState(recoilState), [
    recoilState,
  ]);
  return [value, setValue];
}
/**
  Like useRecoilState(), but does not cause Suspense or React error handling. Returns
  an object that indicates whether the RecoilState is available, pending, or
  unavailable due to an error.
*/

function useRecoilStateLoadable(recoilState) {
  const recoilInterface = useInterface();
  const [value] = recoilInterface.getRecoilStateLoadable(recoilState);
  const setValue = useCallback(recoilInterface.getSetRecoilState(recoilState), [
    recoilState,
  ]);
  return [value, setValue];
}

function useTransactionSubscription(callback) {
  const storeRef = useStoreRef$1();
  useEffect$1(() => {
    const sub = storeRef.current.subscribeToTransactions(callback);
    return sub.release;
  }, [callback, storeRef]);
}

function externallyVisibleAtomValuesInState(state) {
  const atomValues = state.atomValues;
  const persistedAtomContentsValues = Recoil_mapMap(
    Recoil_filterMap(atomValues, (v, k) => {
      var _node$options;

      const node = getNode$2(k);
      const persistence =
        (_node$options = node.options) === null || _node$options === void 0
          ? void 0
          : _node$options.persistence_UNSTABLE;
      return (
        persistence != null &&
        persistence.type !== 'none' &&
        v.state === 'hasValue'
      );
    }),
    v => v.contents,
  ); // Merge in nonvalidated atoms; we may not have defs for them but they will
  // all have persistence on or they wouldn't be there in the first place.

  return Recoil_mergeMaps(state.nonvalidatedAtoms, persistedAtomContentsValues);
}

/**
  Calls the given callback after any atoms have been modified and the consequent
  component re-renders have been committed. This is intended for persisting
  the values of the atoms to storage. The stored values can then be restored
  using the useSetUnvalidatedAtomValues hook.

  The callback receives the following info:

  atomValues: The current value of every atom that is both persistable (persistence
              type not set to 'none') and whose value is available (not in an
              error or loading state).

  previousAtomValues: The value of every persistable and available atom before
               the transaction began.

  atomInfo: A map containing the persistence settings for each atom. Every key
            that exists in atomValues will also exist in atomInfo.

  modifiedAtoms: The set of atoms that were written to during the transaction.

  transactionMetadata: Arbitrary information that was added via the
          useSetUnvalidatedAtomValues hook. Useful for ignoring the useSetUnvalidatedAtomValues
          transaction, to avoid loops.
*/
function useTransactionObservation_DEPRECATED(callback) {
  useTransactionSubscription(
    useCallback(
      store => {
        const previousState = store.getState().currentTree;
        let nextState = store.getState().nextTree;

        if (!nextState) {
          Recoil_recoverableViolation(
            'Transaction subscribers notified without a next tree being present -- this is a bug in Recoil',
          );
          nextState = store.getState().currentTree; // attempt to trundle on
        }

        const atomValues = externallyVisibleAtomValuesInState(nextState);
        const previousAtomValues = externallyVisibleAtomValuesInState(
          previousState,
        );
        const atomInfo = Recoil_mapMap(nodes$1, node => {
          var _node$options$persist,
            _node$options2,
            _node$options2$persis,
            _node$options$persist2,
            _node$options3,
            _node$options3$persis;

          return {
            persistence_UNSTABLE: {
              type:
                (_node$options$persist =
                  (_node$options2 = node.options) === null ||
                  _node$options2 === void 0
                    ? void 0
                    : (_node$options2$persis =
                        _node$options2.persistence_UNSTABLE) === null ||
                      _node$options2$persis === void 0
                    ? void 0
                    : _node$options2$persis.type) !== null &&
                _node$options$persist !== void 0
                  ? _node$options$persist
                  : 'none',
              backButton:
                (_node$options$persist2 =
                  (_node$options3 = node.options) === null ||
                  _node$options3 === void 0
                    ? void 0
                    : (_node$options3$persis =
                        _node$options3.persistence_UNSTABLE) === null ||
                      _node$options3$persis === void 0
                    ? void 0
                    : _node$options3$persis.backButton) !== null &&
                _node$options$persist2 !== void 0
                  ? _node$options$persist2
                  : false,
            },
          };
        });
        const modifiedAtoms = new Set(nextState.dirtyAtoms);
        callback({
          atomValues,
          previousAtomValues,
          atomInfo,
          modifiedAtoms,
          transactionMetadata: {...nextState.transactionMetadata},
        });
      },
      [callback],
    ),
  );
}

function useRecoilTransactionObserver(callback) {
  useTransactionSubscription(
    useCallback(
      store => {
        const previousState = store.getState().currentTree;
        let nextState = store.getState().nextTree;

        if (!nextState) {
          Recoil_recoverableViolation(
            'Transaction subscribers notified without a next tree being present -- this is a bug in Recoil',
          );
          nextState = previousState; // attempt to trundle on
        }

        callback({
          snapshot: cloneSnapshot$1(nextState),
          previousSnapshot: cloneSnapshot$1(previousState),
        });
      },
      [callback],
    ),
  );
} // Return a snapshot of the current state and subscribe to all state changes

function useRecoilSnapshot() {
  const store = useStoreRef$1();
  const [snapshot, setSnapshot] = useState$1(() =>
    cloneSnapshot$1(store.current.getState().currentTree),
  );
  useTransactionSubscription(
    useCallback(store => {
      var _store$getState$nextT;

      return setSnapshot(
        cloneSnapshot$1(
          (_store$getState$nextT = store.getState().nextTree) !== null &&
            _store$getState$nextT !== void 0
            ? _store$getState$nextT
            : store.getState().currentTree,
        ),
      );
    }, []),
  );
  return snapshot;
}

function useGotoRecoilSnapshot() {
  const storeRef = useStoreRef$1();
  return useCallback(
    snapshot => {
      reactDom.unstable_batchedUpdates(() => {
        storeRef.current.replaceState(prevState => {
          const nextState = snapshot.getStore_INTERNAL().getState().currentTree; // Fire subscriptions for any atoms that changed values

          const updatedKeys = new Set(); // Going through both seems to be more efficient than constructing a union set of keys

          for (const keys of [
            prevState.atomValues.keys(),
            nextState.atomValues.keys(),
          ]) {
            for (const key of keys) {
              var _prevState$atomValues, _nextState$atomValues;

              if (
                ((_prevState$atomValues = prevState.atomValues.get(key)) ===
                  null || _prevState$atomValues === void 0
                  ? void 0
                  : _prevState$atomValues.contents) !==
                ((_nextState$atomValues = nextState.atomValues.get(key)) ===
                  null || _nextState$atomValues === void 0
                  ? void 0
                  : _nextState$atomValues.contents)
              ) {
                updatedKeys.add(key);
              }
            }
          }

          storeRef.current.fireNodeSubscriptions(updatedKeys, 'enqueue');
          return nextState;
        });
      });
    },
    [storeRef],
  );
}

function useSetUnvalidatedAtomValues() {
  const storeRef = useStoreRef$1();
  return (values, transactionMetadata = {}) => {
    reactDom.unstable_batchedUpdates(() => {
      storeRef.current.addTransactionMetadata(transactionMetadata);
      values.forEach((value, key) =>
        setUnvalidatedRecoilValue$1(
          storeRef.current,
          new AbstractRecoilValue$2(key),
          value,
        ),
      );
    });
  };
}

class Sentinel {}

const SENTINEL = new Sentinel();

function useRecoilCallback(fn, deps) {
  const storeRef = useStoreRef$1();
  const gotoSnapshot = useGotoRecoilSnapshot();
  return useCallback(
    (...args) => {
      // Use currentTree for the snapshot to show the currently committed stable state
      const snapshot = cloneSnapshot$1(storeRef.current.getState().currentTree);

      function set(recoilState, newValueOrUpdater) {
        setRecoilValue$2(storeRef.current, recoilState, newValueOrUpdater);
      }

      function reset(recoilState) {
        setRecoilValue$2(storeRef.current, recoilState, DEFAULT_VALUE$2);
      }

      let ret = SENTINEL;
      reactDom.unstable_batchedUpdates(() => {
        // flowlint-next-line unclear-type:off
        ret = fn({
          set,
          reset,
          snapshot,
          gotoSnapshot,
        })(...args);
      });
      !!(ret instanceof Sentinel)
        ? Recoil_invariant(
            false,
            'unstable_batchedUpdates should return immediately',
          )
        : void 0;
      return ret;
    },
    deps != null ? [...deps, storeRef] : undefined, // eslint-disable-line fb-www/react-hooks-deps
  );
}

var Recoil_Hooks = {
  useRecoilCallback,
  useRecoilValue,
  useRecoilValueLoadable,
  useRecoilState,
  useRecoilStateLoadable,
  useSetRecoilState,
  useResetRecoilState,
  useRecoilInterface: useInterface,
  useTransactionSubscription_DEPRECATED: useTransactionSubscription,
  useTransactionObservation_DEPRECATED,
  useRecoilTransactionObserver,
  useRecoilSnapshot,
  useGotoRecoilSnapshot,
  useSetUnvalidatedAtomValues,
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */

// Split declaration and implementation to allow this function to pretend to
// check for actual instance of Promise instead of something with a `then`
// method.
// eslint-disable-next-line no-redeclare
function isPromise(p) {
  return !!p && typeof p.then === 'function';
}

var Recoil_isPromise = isPromise;

// TODO Convert Loadable to a Class to allow for runtime type detection.
// Containing static factories of withValue(), withError(), withPromise(), and all()

const loadableAccessors = {
  getValue() {
    if (this.state !== 'hasValue') {
      throw this.contents; // Throw Error, or Promise for the loading state
    }

    return this.contents;
  },

  toPromise() {
    return this.state === 'hasValue'
      ? Promise.resolve(this.contents)
      : this.state === 'hasError'
      ? Promise.reject(this.contents)
      : this.contents;
  },

  valueMaybe() {
    return this.state === 'hasValue' ? this.contents : undefined;
  },

  valueOrThrow() {
    if (this.state !== 'hasValue') {
      throw new Error(`Loadable expected value, but in "${this.state}" state`);
    }

    return this.contents;
  },

  errorMaybe() {
    return this.state === 'hasError' ? this.contents : undefined;
  },

  errorOrThrow() {
    if (this.state !== 'hasError') {
      throw new Error(`Loadable expected error, but in "${this.state}" state`);
    }

    return this.contents;
  },

  promiseMaybe() {
    return this.state === 'loading' ? this.contents : undefined;
  },

  promiseOrThrow() {
    if (this.state !== 'loading') {
      throw new Error(
        `Loadable expected promise, but in "${this.state}" state`,
      );
    }

    return this.contents;
  },

  // TODO Unit tests
  // TODO Convert Loadable to a Class to better support chaining
  //      by returning a Loadable from a map function
  map(map) {
    if (this.state === 'hasError') {
      return this;
    }

    if (this.state === 'hasValue') {
      try {
        const next = map(this.contents); // TODO if next instanceof Loadable, then return next

        return Recoil_isPromise(next)
          ? loadableWithPromise(next)
          : loadableWithValue(next);
      } catch (e) {
        return Recoil_isPromise(e) // If we "suspended", then try again.
          ? // errors and subsequent retries will be handled in 'loading' case
            loadableWithPromise(e.next(() => map(this.contents)))
          : loadableWithError(e);
      }
    }

    if (this.state === 'loading') {
      return loadableWithPromise(
        this.contents // TODO if map returns a loadable, then return the value or promise or throw the error
          .then(map)
          .catch(e => {
            if (Recoil_isPromise(e)) {
              // we were "suspended," try again
              return e.then(() => map(this.contents));
            }

            throw e;
          }),
      );
    }

    throw new Error('Invalid Loadable state');
  },
};

function loadableWithValue(value) {
  // Build objects this way since Flow doesn't support disjoint unions for class properties
  return Object.freeze({
    state: 'hasValue',
    contents: value,
    ...loadableAccessors,
  });
}

function loadableWithError(error) {
  return Object.freeze({
    state: 'hasError',
    contents: error,
    ...loadableAccessors,
  });
}

function loadableWithPromise(promise) {
  return Object.freeze({
    state: 'loading',
    contents: promise,
    ...loadableAccessors,
  });
}

function loadableLoading() {
  return loadableWithPromise(new Promise(() => {}));
}

function loadableAll(inputs) {
  return inputs.every(i => i.state === 'hasValue')
    ? loadableWithValue(inputs.map(i => i.contents))
    : inputs.some(i => i.state === 'hasError')
    ? loadableWithError(
        // $FlowIssue #44070740 Array.find should refine parameter
        Recoil_nullthrows(
          inputs.find(i => i.state === 'hasError'),
          'Invalid loadable passed to loadableAll',
        ).contents,
      )
    : loadableWithPromise(Promise.all(inputs.map(i => i.contents)));
}

var Recoil_Loadable = {
  loadableWithValue,
  loadableWithError,
  loadableWithPromise,
  loadableLoading,
  loadableAll,
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 */

function isNode(object) {
  var _ownerDocument, _doc$defaultView;

  if (typeof window === 'undefined') {
    return false;
  }

  const doc =
    object != null
      ? (_ownerDocument = object.ownerDocument) !== null &&
        _ownerDocument !== void 0
        ? _ownerDocument
        : object
      : document;
  const defaultView =
    (_doc$defaultView = doc.defaultView) !== null && _doc$defaultView !== void 0
      ? _doc$defaultView
      : window;
  return !!(
    object != null &&
    (typeof defaultView.Node === 'function'
      ? object instanceof defaultView.Node
      : typeof object === 'object' &&
        typeof object.nodeType === 'number' &&
        typeof object.nodeName === 'string')
  );
}

var Recoil_isNode = isNode;

function shouldNotBeFrozen(value) {
  // Primitives and functions:
  if (value === null || typeof value !== 'object') {
    return true;
  } // React elements:

  switch (typeof value.$$typeof) {
    case 'symbol':
      return true;

    case 'number':
      return true;
  } // Immutable structures:

  if (
    value['@@__IMMUTABLE_ITERABLE__@@'] != null ||
    value['@@__IMMUTABLE_KEYED__@@'] != null ||
    value['@@__IMMUTABLE_INDEXED__@@'] != null ||
    value['@@__IMMUTABLE_ORDERED__@@'] != null ||
    value['@@__IMMUTABLE_RECORD__@@'] != null
  ) {
    return true;
  } // DOM nodes:

  if (Recoil_isNode(value)) {
    return true;
  }

  if (Recoil_isPromise(value)) {
    return true;
  }

  return false;
} // Recursively freeze a value to enforce it is read-only.
// This may also have minimal performance improvements for enumerating
// objects (based on browser implementations, of course)

function deepFreezeValue(value) {
  if (typeof value !== 'object' || shouldNotBeFrozen(value)) {
    return;
  }

  Object.freeze(value); // Make all properties read-only

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const prop = value[key]; // Prevent infinite recurssion for circular references.

      if (typeof prop === 'object' && prop != null && !Object.isFrozen(prop)) {
        deepFreezeValue(prop);
      }
    }
  }

  Object.seal(value); // This also makes existing properties non-configurable.
}

var Recoil_deepFreezeValue = deepFreezeValue;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Implements (a subset of) the interface of built-in Map but supports arrays as
 * keys. Two keys are equal if corresponding elements are equal according to the
 * equality semantics of built-in Map. Operations are at worst O(n*b) where n is
 * the array length and b is the complexity of the built-in operation.
 *
 * @emails oncall+recoil
 *
 * @format
 */

const LEAF = Symbol('ArrayKeyedMap');
const emptyMap = new Map();

class ArrayKeyedMap {
  // @fb-only: _base: Map<any, any> = new Map();
  constructor(existing) {
    // $FlowOSSFixMe
    this._base = new Map(); // @oss-only

    if (existing instanceof ArrayKeyedMap) {
      for (const [k, v] of existing.entries()) {
        this.set(k, v);
      }
    } else if (existing) {
      for (const [k, v] of existing) {
        this.set(k, v);
      }
    }

    return this;
  }

  get(key) {
    const ks = Array.isArray(key) ? key : [key]; // $FlowOSSFixMe

    let map = this._base;
    ks.forEach(k => {
      var _map$get;

      map =
        (_map$get = map.get(k)) !== null && _map$get !== void 0
          ? _map$get
          : emptyMap;
    });
    return map === undefined ? undefined : map.get(LEAF);
  }

  set(key, value) {
    const ks = Array.isArray(key) ? key : [key]; // $FlowOSSFixMe

    let map = this._base;
    let next = map;
    ks.forEach(k => {
      next = map.get(k);

      if (!next) {
        next = new Map();
        map.set(k, next);
      }

      map = next;
    });
    next.set(LEAF, value);
    return this;
  }

  delete(key) {
    const ks = Array.isArray(key) ? key : [key]; // $FlowOSSFixMe

    let map = this._base;
    let next = map;
    ks.forEach(k => {
      next = map.get(k);

      if (!next) {
        next = new Map();
        map.set(k, next);
      }

      map = next;
    });
    next.delete(LEAF); // TODO We could cleanup empty maps

    return this;
  }

  entries() {
    const answer = [];

    function recurse(level, prefix) {
      level.forEach((v, k) => {
        if (k === LEAF) {
          answer.push([prefix, v]);
        } else {
          recurse(v, prefix.concat(k));
        }
      });
    } // $FlowOSSFixMe

    recurse(this._base, []);
    return answer.values();
  }

  toBuiltInMap() {
    return new Map(this.entries());
  }
}

var Recoil_ArrayKeyedMap = ArrayKeyedMap;

function cacheWithReferenceEquality() {
  return new Recoil_ArrayKeyedMap();
}

var Recoil_cacheWithReferenceEquality = cacheWithReferenceEquality;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 *
 * @format
 *
 * This is a stub for some integration into FB internal stuff
 */
function startPerfBlock(_id) {
  return () => null;
}

var Recoil_PerformanceTimings = {
  startPerfBlock,
};

const {
  loadableWithError: loadableWithError$1,
  loadableWithPromise: loadableWithPromise$1,
  loadableWithValue: loadableWithValue$1,
} = Recoil_Loadable;

const {
  getNodeLoadable: getNodeLoadable$2,
  setNodeValue: setNodeValue$3,
} = Recoil_FunctionalCore;

const {
  addToDependencyMap: addToDependencyMap$1,
  mergeDepsIntoDependencyMap: mergeDepsIntoDependencyMap$1,
} = Recoil_Graph;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$3,
  RecoilValueNotReady: RecoilValueNotReady$2,
  registerNode: registerNode$1,
} = Recoil_Node;

const {AbstractRecoilValue: AbstractRecoilValue$3} = Recoil_RecoilValue$1;

const {
  getRecoilValueAsLoadable: getRecoilValueAsLoadable$3,
  isRecoilValue: isRecoilValue$3,
} = Recoil_RecoilValueInterface;

const {startPerfBlock: startPerfBlock$1} = Recoil_PerformanceTimings;

// flowlint-next-line unclear-type:off
const emptySet$1 = Object.freeze(new Set());

function cacheKeyFromDepValues(depValues) {
  const answer = [];

  for (const key of Array.from(depValues.keys()).sort()) {
    const loadable = Recoil_nullthrows(depValues.get(key));
    answer.push(key);
    answer.push(loadable.contents);
  }

  return answer;
}

const dependencyStack = []; // for detecting circular dependencies.

/* eslint-disable no-redeclare */

function selector(options) {
  const {key, get, cacheImplementation_UNSTABLE: cacheImplementation} = options;
  const set = options.set != null ? options.set : undefined; // flow

  let cache =
    cacheImplementation !== null && cacheImplementation !== void 0
      ? cacheImplementation
      : Recoil_cacheWithReferenceEquality();

  function initSelector(store) {
    store.getState().knownSelectors.add(key);
  }

  function putIntoCache(store, cacheKey, loadable) {
    if (loadable.state !== 'loading') {
      // Synchronous result
      {
        if (!options.dangerouslyAllowMutability === true) {
          Recoil_deepFreezeValue(loadable.contents);
        }
      }
    } else {
      // Asynchronous result
      // When the promise resolves, we need to replace the loading state in the
      // cache and fire any external subscriptions to re-render with the new value.
      loadable.contents
        .then(result => {
          {
            if (!options.dangerouslyAllowMutability === true) {
              Recoil_deepFreezeValue(result);
            }
          } // If the value is now resolved, then update the cache with the new value

          cache = cache.set(cacheKey, loadableWithValue$1(result)); // TODO Potential optimization: I think this is updating the cache
          // with a cacheKey of the dep when it wasn't ready yet.  We could also
          // theoretically put the result in the cache for a cacheKey with the
          // dep resolved.  If we had some way of figuring out what that cacheKey was..
          // Note that this optimization would change the user visible behavior slightly,
          // see the unit test "useRecoilState - selector catching promise 2".
          // If the user catches and handles pending async dependencies, then returns
          // a promise that resolves when they are available there is a question if
          // the result of that promise should be the value of the selector, or if
          // the selector should re-evaluate when the dependency is available.
          // If the promise returned and the pending dependency resolve at different
          // times, then the behaviour is better defined, as in the unit test,
          // "useRecoilState - selector catching promise and resolving asynchronously"
          // Fire subscriptions to re-render any subscribed components with the new value.
          // The store uses the CURRENT state, not the old state from which
          // this was called.  That state likely doesn't have the subscriptions saved yet.

          store.fireNodeSubscriptions(new Set([key]), 'now');
          return result;
        })
        .catch(error => {
          // TODO Figure out why we are catching promises here versus evaluateSelectorFunction
          // OH, I see why.  Ok, work on this.
          if (Recoil_isPromise(error)) {
            return error;
          }

          {
            if (!options.dangerouslyAllowMutability === true) {
              Recoil_deepFreezeValue(error);
            }
          } // The async value was rejected with an error.  Update the cache with
          // the error and fire subscriptions to re-render.

          cache = cache.set(cacheKey, loadableWithError$1(error));
          store.fireNodeSubscriptions(new Set([key]), 'now');
          return error;
        });
    }

    cache = cache.set(cacheKey, loadable);
  }

  function getFromCacheOrEvaluate(store, state) {
    var _nullthrows$nodeDeps$;

    const dependencyMap = new Map(); // First, get the current deps for this selector

    const currentDeps =
      (_nullthrows$nodeDeps$ = Recoil_nullthrows(
        store.getState().graphsByVersion.get(state.version),
      ).nodeDeps.get(key)) !== null && _nullthrows$nodeDeps$ !== void 0
        ? _nullthrows$nodeDeps$
        : emptySet$1;
    const depValues = new Map(
      Array.from(currentDeps)
        .sort()
        .map(depKey => {
          const [deps, loadable] = getNodeLoadable$2(store, state, depKey);
          mergeDepsIntoDependencyMap$1(deps, dependencyMap);
          return [depKey, loadable];
        }),
    ); // Always cache and evaluate a selector
    // It may provide a result even when not all deps are available.

    const cacheKey = cacheKeyFromDepValues(depValues);
    const cached = cache.get(cacheKey);

    if (cached != null) {
      return [dependencyMap, cached];
    } // Cache miss, compute the value

    const [deps, loadable, newDepValues] = evaluateSelectorFunction(
      store,
      state,
    );
    mergeDepsIntoDependencyMap$1(deps, dependencyMap); // Save result in cache

    const newCacheKey = cacheKeyFromDepValues(newDepValues);
    putIntoCache(store, newCacheKey, loadable);
    return [dependencyMap, loadable];
  }

  function evaluateSelectorFunction(store, state) {
    const endPerfBlock = startPerfBlock$1(key);
    const depValues = new Map(); // key -> value for our deps

    const dependencyMap = new Map(); // node -> nodes, part of overall dep map.

    function getRecoilValue({key: depKey}) {
      addToDependencyMap$1(key, depKey, dependencyMap);
      const [deps, loadable] = getNodeLoadable$2(store, state, depKey);
      depValues.set(depKey, loadable);
      mergeDepsIntoDependencyMap$1(deps, dependencyMap);

      if (loadable.state === 'hasValue') {
        return loadable.contents;
      } else {
        throw loadable.contents; // Promise or error
      }
    }

    try {
      // The big moment!
      const output = get({
        get: getRecoilValue,
      }); // TODO Allow user to also return Loadables for improved composability

      const result = isRecoilValue$3(output) ? getRecoilValue(output) : output;
      const loadable = !Recoil_isPromise(result) // The selector returned a simple synchronous value, so let's use it!
        ? (endPerfBlock(), loadableWithValue$1(result)) // The user returned a promise for an asynchronous selector.  This will
        : // resolve to the proper value of the selector when available.
          loadableWithPromise$1(result.finally(endPerfBlock));
      return [dependencyMap, loadable, depValues];
    } catch (errorOrDepPromise) {
      const isP = errorOrDepPromise.then !== undefined;
      const loadable = !isP // There was a synchronous error in the evaluation
        ? (endPerfBlock(), loadableWithError$1(errorOrDepPromise)) // If an asynchronous dependency was not ready, then return a promise that
        : // will resolve when we finally do have a real value or error for the selector.
          loadableWithPromise$1(
            errorOrDepPromise
              .then(() => {
                // Now that its deps are ready, re-evaluate the selector (and
                // record any newly-discovered dependencies in the Store):
                const loadable = getRecoilValueAsLoadable$3(
                  store,
                  new AbstractRecoilValue$3(key),
                );

                if (loadable.state === 'hasError') {
                  throw loadable.contents;
                } // Either the re-try provided a value, which we will use, or it
                // got blocked again.  In that case this is a promise and we'll try again.

                return loadable.contents;
              })
              .finally(endPerfBlock),
          );
      return [dependencyMap, loadable, depValues];
    }
  }

  function detectCircularDependencies(fn) {
    if (dependencyStack.includes(key)) {
      const message = `Recoil selector has circular dependencies: ${dependencyStack
        .slice(dependencyStack.indexOf(key))
        .join(' \u2192 ')}`;
      return [new Map(), loadableWithError$1(new Error(message))];
    }

    dependencyStack.push(key);

    try {
      return fn();
    } finally {
      dependencyStack.pop();
    }
  }

  function myGet(store, state) {
    initSelector(store); // TODO memoize a value if no deps have changed to avoid a cache lookup
    // Lookup the node value in the cache.  If not there, then compute
    // the value and update the state with any changed node subscriptions.

    {
      return detectCircularDependencies(() =>
        getFromCacheOrEvaluate(store, state),
      );
    }
  }

  if (set != null) {
    function mySet(store, state, newValue) {
      initSelector(store);
      const dependencyMap = new Map();
      const writes = new Map();

      function getRecoilValue({key}) {
        const [deps, loadable] = getNodeLoadable$2(store, state, key);
        mergeDepsIntoDependencyMap$1(deps, dependencyMap);

        if (loadable.state === 'hasValue') {
          return loadable.contents;
        } else if (loadable.state === 'loading') {
          throw new RecoilValueNotReady$2(key);
        } else {
          throw loadable.contents;
        }
      }

      function setRecoilState(recoilState, valueOrUpdater) {
        const newValue =
          typeof valueOrUpdater === 'function' // cast to any because we can't restrict type S from being a function itself without losing support for opaque types
            ? // flowlint-next-line unclear-type:off
              valueOrUpdater(getRecoilValue(recoilState))
            : valueOrUpdater;
        const [deps, upstreamWrites] = setNodeValue$3(
          store,
          state,
          recoilState.key,
          newValue,
        );
        mergeDepsIntoDependencyMap$1(deps, dependencyMap);
        upstreamWrites.forEach((v, k) => writes.set(k, v));
      }

      function resetRecoilState(recoilState) {
        setRecoilState(recoilState, DEFAULT_VALUE$3);
      }

      set(
        {
          set: setRecoilState,
          get: getRecoilValue,
          reset: resetRecoilState,
        },
        newValue,
      );
      return [dependencyMap, writes];
    }

    return registerNode$1({
      key,
      options,
      get: myGet,
      set: mySet,
    });
  } else {
    return registerNode$1({
      key,
      options,
      get: myGet,
    });
  }
}
/* eslint-enable no-redeclare */

var Recoil_selector_OLD = selector;

// const newSelector = require('./Recoil_selector_NEW');

// type Selector = typeof newSelector;
// const selector: Selector = gkx('recoil_async_selector_refactor')
//   ? newSelector
//   : oldSelector;
var Recoil_selector = Recoil_selector_OLD;

// @fb-only: const {scopedAtom} = require('Recoil_ScopedAtom');
const {loadableWithValue: loadableWithValue$2} = Recoil_Loadable;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$4,
  DefaultValue: DefaultValue$2,
  registerNode: registerNode$2,
} = Recoil_Node;

const {isRecoilValue: isRecoilValue$4} = Recoil_RecoilValue$1;

const {setRecoilValue: setRecoilValue$3} = Recoil_RecoilValueInterface;

// It would be nice if this didn't have to be defined at the Recoil level, but I don't want to make
// the api cumbersome. One way to do this would be to have a selector mark the atom as persisted.
// Note that this should also allow for special URL handling. (Although the persistence observer could
// have this as a separate configuration.)

function baseAtom(options) {
  const {
    key,
    persistence_UNSTABLE: persistence
  } = options;
  let cachedAnswerForUnvalidatedValue = undefined;

  function initAtom(store, initState, trigger) {
    if (store.getState().knownAtoms.has(key)) {
      return;
    }

    store.getState().knownAtoms.add(key); // Run Atom Effects

    let initValue = DEFAULT_VALUE$4;

    if (options.effects_UNSTABLE != null) {
      let duringInit = true;

      function setSelf(valueOrUpdater) {
        if (duringInit) {
          const currentValue = initValue instanceof DefaultValue$2 ? options.default : initValue;
          initValue = typeof valueOrUpdater === 'function' ? // cast to any because we can't restrict type from being a function itself without losing support for opaque types
          // flowlint-next-line unclear-type:off
          valueOrUpdater(currentValue) : valueOrUpdater;
        } else {
          setRecoilValue$3(store, node, valueOrUpdater);
        }
      }

      const resetSelf = () => setSelf(DEFAULT_VALUE$4);

      function onSet(handler) {
        store.subscribeToTransactions(asyncStore => {
          var _state$nextTree;

          const state = asyncStore.getState();
          const nextState = (_state$nextTree = state.nextTree) !== null && _state$nextTree !== void 0 ? _state$nextTree : state.currentTree;
          const prevState = state.currentTree;
          const newValue = nextState.atomValues.has(key) ? Recoil_nullthrows(nextState.atomValues.get(key)).valueOrThrow() : DEFAULT_VALUE$4;
          const oldValue = prevState.atomValues.has(key) ? Recoil_nullthrows(prevState.atomValues.get(key)).valueOrThrow() : DEFAULT_VALUE$4;
          handler(newValue, oldValue);
        }, key);
      }

      for (const effect of (_options$effects_UNST = options.effects_UNSTABLE) !== null && _options$effects_UNST !== void 0 ? _options$effects_UNST : []) {
        var _options$effects_UNST;

        effect({
          node,
          trigger,
          setSelf,
          resetSelf,
          onSet
        });
      }

      duringInit = false;
    } // Mutate initial state in place since we know there are no other subscribers
    // since we are the ones initializing on first use.


    if (!(initValue instanceof DefaultValue$2)) {
      initState.atomValues.set(key, loadableWithValue$2(initValue));
    }
  }

  function myGet(store, state) {
    initAtom(store, state, 'get');

    if (state.atomValues.has(key)) {
      // Atom value is stored in state:
      return [new Map(), Recoil_nullthrows(state.atomValues.get(key))];
    } else if (state.nonvalidatedAtoms.has(key)) {
      // Atom value is stored but needs validation before use.
      // We might have already validated it and have a cached validated value:
      if (cachedAnswerForUnvalidatedValue !== undefined) {
        return cachedAnswerForUnvalidatedValue;
      }

      if (persistence == null) {
        Recoil_expectationViolation(`Tried to restore a persisted value for atom ${key} but it has no persistence settings.`);
        return [new Map(), loadableWithValue$2(options.default)];
      }

      const nonvalidatedValue = state.nonvalidatedAtoms.get(key);
      const validatorResult = persistence.validator(nonvalidatedValue, DEFAULT_VALUE$4);
      const validatedValueLoadable = loadableWithValue$2(validatorResult instanceof DefaultValue$2 ? options.default : validatorResult);
      cachedAnswerForUnvalidatedValue = [new Map(), validatedValueLoadable];
      return cachedAnswerForUnvalidatedValue;
    } else {
      return [new Map(), loadableWithValue$2(options.default)];
    }
  }

  function invalidate() {
    cachedAnswerForUnvalidatedValue = undefined;
  }

  function mySet(store, state, newValue) {
    initAtom(store, state, 'set'); // Bail out if we're being set to the existing value, or if we're being
    // reset but have no stored value (validated or unvalidated) to reset from:

    if (state.atomValues.has(key)) {
      const existing = Recoil_nullthrows(state.atomValues.get(key));

      if (existing.state === 'hasValue' && newValue === existing.contents) {
        return [new Map(), new Map()];
      }
    } else if (!state.nonvalidatedAtoms.has(key) && newValue instanceof DefaultValue$2) {
      return [new Map(), new Map()];
    }

    {
      if (options.dangerouslyAllowMutability !== true) {
        Recoil_deepFreezeValue(newValue);
      }
    }

    cachedAnswerForUnvalidatedValue = undefined; // can be released now if it was previously in use

    return [new Map(), new Map().set(key, loadableWithValue$2(newValue))];
  }

  const node = registerNode$2({
    key,
    options,
    get: myGet,
    invalidate,
    set: mySet
  });
  return node;
} // prettier-ignore

function atom(options) {
  const {
    default: optionsDefault,
    // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,
    ...restOptions
  } = options;

  if (isRecoilValue$4(optionsDefault) || Recoil_isPromise(optionsDefault)) {
    return atomWithFallback({
      ...restOptions,
      default: optionsDefault, // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,
    }); // @fb-only: } else if (scopeRules_APPEND_ONLY_READ_THE_DOCS) {
    // @fb-only: return scopedAtom<T>({
    // @fb-only: ...restOptions,
    // @fb-only: default: optionsDefault,
    // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,
    // @fb-only: });
  } else {
    return baseAtom({...restOptions, default: optionsDefault});
  }
}

function atomWithFallback(options) {
  const base = atom({
    ...options,
    default: DEFAULT_VALUE$4,
    persistence_UNSTABLE:
      options.persistence_UNSTABLE === undefined
        ? undefined
        : {
            ...options.persistence_UNSTABLE,
            validator: storedValue =>
              storedValue instanceof DefaultValue$2
                ? storedValue
                : Recoil_nullthrows(options.persistence_UNSTABLE).validator(
                    storedValue,
                    DEFAULT_VALUE$4,
                  ),
          },
    // TODO Hack for now.
    // flowlint-next-line unclear-type: off
    effects_UNSTABLE: options.effects_UNSTABLE,
  });
  return Recoil_selector({
    key: `${options.key}__withFallback`,
    get: ({get}) => {
      const baseValue = get(base);
      return baseValue instanceof DefaultValue$2 ? options.default : baseValue;
    },
    set: ({set}, newValue) => set(base, newValue),
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
  });
}

var Recoil_atom = atom;

const TIME_WARNING_THRESHOLD_MS = 15;

function stringify(x, opt, key) {
  // A optimization to avoid the more expensive JSON.stringify() for simple strings
  // This may lose protection for u2028 and u2029, though.
  if (typeof x === 'string' && !x.includes('"') && !x.includes('\\')) {
    return `"${x}"`;
  } // Handle primitive types

  switch (typeof x) {
    case 'undefined':
      return '';
    // JSON.stringify(undefined) returns undefined, but we always want to return a string

    case 'boolean':
      return x ? 'true' : 'false';

    case 'number':
    case 'symbol':
      // case 'bigint': // BigInt is not supported in www
      return String(x);

    case 'string':
      // Add surrounding quotes and escape internal quotes
      return JSON.stringify(x);

    case 'function':
      if (
        (opt === null || opt === void 0 ? void 0 : opt.allowFunctions) !== true
      ) {
        throw new Error('Attempt to serialize function in a Recoil cache key');
      }

      return `__FUNCTION(${x.name})__`;
  }

  if (x === null) {
    return 'null';
  } // Fallback case for unknown types

  if (typeof x !== 'object') {
    var _JSON$stringify;

    return (_JSON$stringify = JSON.stringify(x)) !== null &&
      _JSON$stringify !== void 0
      ? _JSON$stringify
      : '';
  } // Deal with all promises as equivalent for now.

  if (Recoil_isPromise(x)) {
    return '__PROMISE__';
  } // Arrays handle recursive stringification

  if (Array.isArray(x)) {
    return `[${x.map((v, i) => stringify(v, opt, i.toString()))}]`;
  } // If an object defines a toJSON() method, then use that to override the
  // serialization.  This matches the behavior of JSON.stringify().
  // Pass the key for compatibility.
  // Immutable.js collections define this method to allow us to serialize them.

  if (typeof x.toJSON === 'function') {
    // flowlint-next-line unclear-type: off
    return stringify(x.toJSON(key), opt, key);
  } // For built-in Maps, sort the keys in a stable order instead of the
  // default insertion order.  Support non-string keys.

  if (x instanceof Map) {
    return stringify(
      // TODO Object.fromEntries(x) isn't supported in Babel yet (7/17/19)
      Array.from(x).reduce(
        (obj, [k, v]) => ({
          ...obj,
          // Stringify will escape any nested quotes
          [typeof k === 'string' ? k : stringify(k, opt)]: v,
        }),
        {},
      ),
      opt,
      key,
    );
  } // For built-in Sets, sort the keys in a stable order instead of the
  // default insertion order.

  if (x instanceof Set) {
    return stringify(
      Array.from(x).sort((a, b) =>
        stringify(a, opt).localeCompare(stringify(b, opt)),
      ),
      opt,
      key,
    );
  } // Anything else that is iterable serialize as an Array.

  if (x[Symbol.iterator] != null && typeof x[Symbol.iterator] === 'function') {
    // flowlint-next-line unclear-type: off
    return stringify(Array.from(x), opt, key);
  } // For all other Objects, sort the keys in a stable order.

  return `{${Object.keys(x)
    .filter(key => x[key] !== undefined)
    .sort() // stringify the key to add quotes and escape any nested slashes or quotes.
    .map(key => `${stringify(key, opt)}:${stringify(x[key], opt, key)}`)
    .join(',')}}`;
} // Utility similar to JSON.stringify() except:
// * Serialize built-in Sets as an Array
// * Serialize built-in Maps as an Object.  Supports non-string keys.
// * Serialize other iterables as arrays
// * Sort the keys of Objects and Maps to have a stable order based on string conversion.
//    This overrides their default insertion order.
// * Still uses toJSON() of any object to override serialization
// * Support Symbols (though don't guarantee uniqueness)
// * We could support BigInt, but Flow doesn't seem to like it.
// See Recoil_stableStringify-test.js for examples

function stableStringify(
  x,
  opt = {
    allowFunctions: false,
  },
) {
  {
    if (typeof window !== 'undefined') {
      const startTime = window.performance ? window.performance.now() : 0;
      const str = stringify(x, opt);
      const endTime = window.performance ? window.performance.now() : 0;

      if (endTime - startTime > TIME_WARNING_THRESHOLD_MS) {
        /* eslint-disable fb-www/no-console */
        console.groupCollapsed(
          `Recoil: Spent ${endTime - startTime}ms computing a cache key`,
        );
        console.warn(x, str);
        console.groupEnd();
        /* eslint-enable fb-www/no-console */
      }

      return str;
    }
  }

  return stringify(x, opt);
}

var Recoil_stableStringify = stableStringify;

// If we do profile and find the key equality check is expensive,
// we could always try to optimize..  Something that comes to mind is having
// each check assign an incrementing index to each reference that maps to the
// value equivalency.  Then, if an object already has an index, the comparison
// check/lookup would be trivial and the string serialization would only need
// to be done once per object instance.  Just a thought..
// Cache implementation to use value equality for keys instead of the default
// reference equality.  This allows different instances of dependency values to
// be used.  Normally this is not needed, as dependent atoms/selectors will
// themselves be cached and always return the same instance.  However, if
// different params or upstream values for those dependencies could produce
// equivalent values or they have a custom cache implementation, then this
// implementation may be needed.  The downside with this approach is that it
// takes longer to compute the value equivalence vs simple reference equality.

function cacheWithValueEquality() {
  const map = new Map();
  const cache = {
    get: key => map.get(Recoil_stableStringify(key)),
    set: (key, value) => {
      map.set(Recoil_stableStringify(key), value);
      return cache;
    },
    map, // For debugging
  };
  return cache;
}

var Recoil_cacheWithValueEquality = cacheWithValueEquality;

// Keep in mind the parameter needs to be serializable as a cahche key
// using Recoil_stableStringify

// Add a unique index to each selector in case the cache implementation allows
// duplicate keys based on equivalent stringified parameters
let nextIndex = 0;
/* eslint-disable no-redeclare */

// Return a function that returns members of a family of selectors of the same type
// E.g.,
//
// const s = selectorFamily(...);
// s({a: 1}) => a selector
// s({a: 2}) => a different selector
//
// By default, the selectors are distinguished by distinct values of the
// parameter based on value equality, not reference equality.  This allows using
// object literals or other equivalent objects at callsites to not create
// duplicate cache entries.  This behavior may be overridden with the
// cacheImplementationForParams option.
function selectorFamily(options) {
  var _options$cacheImpleme, _options$cacheImpleme2;

  let selectorCache =
    (_options$cacheImpleme =
      (_options$cacheImpleme2 =
        options.cacheImplementationForParams_UNSTABLE) === null ||
      _options$cacheImpleme2 === void 0
        ? void 0
        : _options$cacheImpleme2.call(options)) !== null &&
    _options$cacheImpleme !== void 0
      ? _options$cacheImpleme
      : Recoil_cacheWithValueEquality();
  return params => {
    var _stableStringify, _options$cacheImpleme3;

    const cachedSelector = selectorCache.get(params);

    if (cachedSelector != null) {
      return cachedSelector;
    }

    const myKey = `${options.key}__selectorFamily/${
      (_stableStringify = Recoil_stableStringify(params, {
        // It is possible to use functions in parameters if the user uses
        // a cache with reference equality thanks to the incrementing index.
        allowFunctions: true,
      })) !== null && _stableStringify !== void 0
        ? _stableStringify
        : 'void'
    }/${nextIndex++}`; // Append index in case values serialize to the same key string

    const myGet = callbacks => options.get(params)(callbacks);

    const myCacheImplementation =
      (_options$cacheImpleme3 = options.cacheImplementation_UNSTABLE) ===
        null || _options$cacheImpleme3 === void 0
        ? void 0
        : _options$cacheImpleme3.call(options);
    let newSelector;

    if (options.set != null) {
      const set = options.set;

      const mySet = (callbacks, newValue) => set(params)(callbacks, newValue);

      newSelector = Recoil_selector({
        key: myKey,
        get: myGet,
        set: mySet,
        cacheImplementation_UNSTABLE: myCacheImplementation,
        dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      });
    } else {
      newSelector = Recoil_selector({
        key: myKey,
        get: myGet,
        cacheImplementation_UNSTABLE: myCacheImplementation,
        dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      });
    }

    selectorCache = selectorCache.set(params, newSelector);
    return newSelector;
  };
}
/* eslint-enable no-redeclare */

var Recoil_selectorFamily = selectorFamily;

// @fb-only: const {parameterizedScopedAtomLegacy} = require('Recoil_ScopedAtom');

const {
  DEFAULT_VALUE: DEFAULT_VALUE$5,
  DefaultValue: DefaultValue$3,
} = Recoil_Node;
/*
A function which returns an atom based on the input parameter.

Each unique parameter returns a unique atom. E.g.,

  const f = atomFamily(...);
  f({a: 1}) => an atom
  f({a: 2}) => a different atom

This allows components to persist local, private state using atoms.  Each
instance of the component may have a different key, which it uses as the
parameter for a family of atoms; in this way, each component will have
its own atom not shared by other instances.  These state keys may be composed
into children's state keys as well.
*/

function atomFamily(options) {
  let atomCache = Recoil_cacheWithValueEquality(); // An atom to represent any legacy atoms that we can upgrade to an atomFamily

  const legacyAtomOptions = {
    key: options.key,
    // Legacy atoms just used the plain key directly
    default: DEFAULT_VALUE$5,
    persistence_UNSTABLE: options.persistence_UNSTABLE,
  };
  let legacyAtom; // prettier-ignore
  // @fb-only: if (
  // @fb-only: options.scopeRules_APPEND_ONLY_READ_THE_DOCS
  // @fb-only: ) {
  // @fb-only: legacyAtom = parameterizedScopedAtomLegacy<T | DefaultValue, P>({
  // @fb-only: ...legacyAtomOptions,
  // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS:
  // @fb-only: options.scopeRules_APPEND_ONLY_READ_THE_DOCS,
  // @fb-only: });
  // @fb-only: } else {

  legacyAtom = Recoil_atom(legacyAtomOptions); // @fb-only: }
  // Selector to calculate the default value based on any persisted legacy atoms
  // that were upgraded to a atomFamily

  const atomFamilyDefault = Recoil_selectorFamily({
    key: `${options.key}__atomFamily/Default`,
    get: param => ({get}) => {
      const legacyValue = get(
        typeof legacyAtom === 'function' ? legacyAtom(param) : legacyAtom,
      ); // Atom was upgraded from a non-parameterized atom

      if (!(legacyValue instanceof DefaultValue$3)) {
        return legacyValue;
      } // There's no legacy atom value, so use the user-specified default

      return typeof options.default === 'function' // The default was parameterized
        ? // Flow doesn't know that T isn't a function, so we need to case to any
          options.default(param) // flowlint-line unclear-type:off
        : // Default may be a static value, promise, or RecoilValue
          options.default;
    },
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
  }); // Simple atomFamily implementation to cache individual atoms based
  // on the parameter value equality.

  return params => {
    var _stableStringify;

    const cachedAtom = atomCache.get(params);

    if (cachedAtom != null) {
      return cachedAtom;
    }

    const newAtom = Recoil_atom({
      ...options,
      key: `${options.key}__${
        (_stableStringify = Recoil_stableStringify(params)) !== null &&
        _stableStringify !== void 0
          ? _stableStringify
          : 'void'
      }`,
      default: atomFamilyDefault(params) // prettier-ignore
      // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS: mapScopeRules(
      // @fb-only: options.scopeRules_APPEND_ONLY_READ_THE_DOCS,
      // @fb-only: params,
      // @fb-only: )
    });
    atomCache = atomCache.set(params, newAtom);
    return newAtom;
  };
}

var Recoil_atomFamily = atomFamily;

// flowlint-next-line unclear-type:off

const constantSelector = Recoil_selectorFamily({
  key: '__constant',
  get: constant => () => constant,
  cacheImplementationForParams_UNSTABLE: Recoil_cacheWithReferenceEquality,
}); // Function that returns a selector which always produces the
// same constant value.  It may be called multiple times with the
// same value, based on reference equality, and will provide the
// same selector.

function constSelector(constant) {
  return constantSelector(constant);
}

var Recoil_constSelector = constSelector;

// flowlint-next-line unclear-type:off

const throwingSelector = Recoil_selectorFamily({
  key: '__error',
  get: message => () => {
    throw new Error(message);
  },
  cacheImplementationForParams_UNSTABLE: Recoil_cacheWithReferenceEquality,
}); // Function that returns a selector which always throws an error
// with the provided message.

function errorSelector(message) {
  return throwingSelector(message);
}

var Recoil_errorSelector = errorSelector;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Wraps another recoil value and prevents writing to it.
 *
 * @emails oncall+recoil
 *
 * @format
 */

function readOnlySelector(atom) {
  // flowlint-next-line unclear-type: off
  return atom;
}

var Recoil_readOnlySelector = readOnlySelector;

const {
  loadableWithError: loadableWithError$2,
  loadableWithPromise: loadableWithPromise$2,
  loadableWithValue: loadableWithValue$3,
} = Recoil_Loadable;

/////////////////
//  TRUTH TABLE
/////////////////
// Dependencies        waitForNone         waitForAny        waitForAll
//  [loading, loading]  [Promise, Promise]  Promise           Promise
//  [value, loading]    [value, Promise]    [value, Promise]  Promise
//  [value, value]      [value, value]      [value, value]    [value, value]
//
//  [error, loading]    [Error, Promise]    Promise           Error
//  [error, error]      [Error, Error]      Error             Error
//  [value, error]      [value, Error]      [value, Error]    Error
// Issue parallel requests for all dependencies and return the current
// status if they have results, have some error, or are still pending.

function concurrentRequests(getRecoilValue, deps) {
  const results = Array(deps.length).fill(undefined);
  const exceptions = Array(deps.length).fill(undefined);

  for (const [i, dep] of deps.entries()) {
    try {
      results[i] = getRecoilValue(dep);
    } catch (e) {
      // exceptions can either be Promises of pending results or real errors
      exceptions[i] = e;
    }
  }

  return [results, exceptions];
}

function isError(exp) {
  return exp != null && !Recoil_isPromise(exp);
}

function unwrapDependencies(dependencies) {
  return Array.isArray(dependencies)
    ? dependencies
    : Object.getOwnPropertyNames(dependencies).map(key => dependencies[key]);
}

function wrapResults(dependencies, results) {
  return Array.isArray(dependencies)
    ? results // Object.getOwnPropertyNames() has consistent key ordering with ES6
    : Object.getOwnPropertyNames(dependencies).reduce(
        (out, key, idx) => ({...out, [key]: results[idx]}),
        {},
      );
}

function wrapLoadables(dependencies, results, exceptions) {
  const output = exceptions.map((exception, idx) =>
    exception == null
      ? loadableWithValue$3(results[idx])
      : Recoil_isPromise(exception)
      ? loadableWithPromise$2(exception)
      : loadableWithError$2(exception),
  );
  return wrapResults(dependencies, output);
} // Selector that requests all dependencies in parallel and immediately returns
// current results without waiting.

const waitForNone = Recoil_selectorFamily({
  key: '__waitForNone',
  get: dependencies => ({get}) => {
    // Issue requests for all dependencies in parallel.
    const deps = unwrapDependencies(dependencies);
    const [results, exceptions] = concurrentRequests(get, deps); // Always return the current status of the results; never block.

    return wrapLoadables(dependencies, results, exceptions);
  },
}); // Selector that requests all dependencies in parallel and waits for at least
// one to be available before returning results.  It will only error if all
// dependencies have errors.

const waitForAny = Recoil_selectorFamily({
  key: '__waitForAny',
  get: dependencies => ({get}) => {
    // Issue requests for all dependencies in parallel.
    // Exceptions can either be Promises of pending results or real errors
    const deps = unwrapDependencies(dependencies);
    const [results, exceptions] = concurrentRequests(get, deps); // If any results are available, return the current status

    if (exceptions.some(exp => exp == null)) {
      return wrapLoadables(dependencies, results, exceptions);
    } // Since we are waiting for any results, only throw an error if all
    // dependencies have an error.  Then, throw the first one.

    if (exceptions.every(isError)) {
      throw exceptions.find(isError);
    }

    {
      throw new Promise((resolve, reject) => {
        for (const [i, exp] of exceptions.entries()) {
          if (Recoil_isPromise(exp)) {
            exp
              .then(result => {
                results[i] = result;
                exceptions[i] = null;
                resolve(wrapLoadables(dependencies, results, exceptions));
              })
              .catch(error => {
                exceptions[i] = error;

                if (exceptions.every(isError)) {
                  reject(exceptions[0]);
                }
              });
          }
        }
      });
    }
  },
}); // Selector that requests all dependencies in parallel and waits for all to be
// available before returning a value.  It will error if any dependencies error.

const waitForAll = Recoil_selectorFamily({
  key: '__waitForAll',
  get: dependencies => ({get}) => {
    // Issue requests for all dependencies in parallel.
    // Exceptions can either be Promises of pending results or real errors
    const deps = unwrapDependencies(dependencies);
    const [results, exceptions] = concurrentRequests(get, deps); // If all results are available, return the results

    if (exceptions.every(exp => exp == null)) {
      return wrapResults(dependencies, results);
    } // If we have any errors, throw the first error

    const error = exceptions.find(isError);

    if (error != null) {
      throw error;
    }

    {
      throw Promise.all(exceptions).then(results =>
        wrapResults(dependencies, results),
      );
    }
  },
});
const noWait = Recoil_selectorFamily({
  key: '__noWait',
  get: dependency => ({get}) => {
    try {
      return loadableWithValue$3(get(dependency));
    } catch (exception) {
      return Recoil_isPromise(exception)
        ? loadableWithPromise$2(exception)
        : loadableWithError$2(exception);
    }
  },
});
var Recoil_WaitFor = {
  waitForNone,
  waitForAny,
  waitForAll,
  noWait,
};

const {DefaultValue: DefaultValue$4} = Recoil_Node;

const {RecoilRoot: RecoilRoot$1} = Recoil_RecoilRoot_react;

const {isRecoilValue: isRecoilValue$5} = Recoil_RecoilValue$1;

const {
  useGotoRecoilSnapshot: useGotoRecoilSnapshot$1,
  useRecoilCallback: useRecoilCallback$1,
  useRecoilSnapshot: useRecoilSnapshot$1,
  useRecoilState: useRecoilState$1,
  useRecoilStateLoadable: useRecoilStateLoadable$1,
  useRecoilTransactionObserver: useRecoilTransactionObserver$1,
  useRecoilValue: useRecoilValue$1,
  useRecoilValueLoadable: useRecoilValueLoadable$1,
  useResetRecoilState: useResetRecoilState$1,
  useSetRecoilState: useSetRecoilState$1,
  useSetUnvalidatedAtomValues: useSetUnvalidatedAtomValues$1,
  useTransactionObservation_DEPRECATED: useTransactionObservation_DEPRECATED$1,
} = Recoil_Hooks;

const {
  noWait: noWait$1,
  waitForAll: waitForAll$1,
  waitForAny: waitForAny$1,
  waitForNone: waitForNone$1,
} = Recoil_WaitFor;

var Recoil_index = {
  // Types
  DefaultValue: DefaultValue$4,
  // Components
  RecoilRoot: RecoilRoot$1,
  // RecoilValues
  atom: Recoil_atom,
  selector: Recoil_selector,
  // Convenience RecoilValues
  atomFamily: Recoil_atomFamily,
  selectorFamily: Recoil_selectorFamily,
  constSelector: Recoil_constSelector,
  errorSelector: Recoil_errorSelector,
  readOnlySelector: Recoil_readOnlySelector,
  // Hooks that accept RecoilValues
  useRecoilValue: useRecoilValue$1,
  useRecoilValueLoadable: useRecoilValueLoadable$1,
  useRecoilState: useRecoilState$1,
  useRecoilStateLoadable: useRecoilStateLoadable$1,
  useSetRecoilState: useSetRecoilState$1,
  useResetRecoilState: useResetRecoilState$1,
  // Hooks for asynchronous Recoil
  useRecoilCallback: useRecoilCallback$1,
  // Hooks for Snapshots
  useGotoRecoilSnapshot: useGotoRecoilSnapshot$1,
  useRecoilSnapshot: useRecoilSnapshot$1,
  useRecoilTransactionObserver_UNSTABLE: useRecoilTransactionObserver$1,
  useTransactionObservation_UNSTABLE: useTransactionObservation_DEPRECATED$1,
  useSetUnvalidatedAtomValues_UNSTABLE: useSetUnvalidatedAtomValues$1,
  // Concurrency Helpers
  noWait: noWait$1,
  waitForNone: waitForNone$1,
  waitForAny: waitForAny$1,
  waitForAll: waitForAll$1,
  // Other functions
  isRecoilValue: isRecoilValue$5,
};
var Recoil_index_1 = Recoil_index.DefaultValue;
var Recoil_index_2 = Recoil_index.RecoilRoot;
var Recoil_index_3 = Recoil_index.atom;
var Recoil_index_4 = Recoil_index.selector;
var Recoil_index_5 = Recoil_index.atomFamily;
var Recoil_index_6 = Recoil_index.selectorFamily;
var Recoil_index_7 = Recoil_index.constSelector;
var Recoil_index_8 = Recoil_index.errorSelector;
var Recoil_index_9 = Recoil_index.readOnlySelector;
var Recoil_index_10 = Recoil_index.useRecoilValue;
var Recoil_index_11 = Recoil_index.useRecoilValueLoadable;
var Recoil_index_12 = Recoil_index.useRecoilState;
var Recoil_index_13 = Recoil_index.useRecoilStateLoadable;
var Recoil_index_14 = Recoil_index.useSetRecoilState;
var Recoil_index_15 = Recoil_index.useResetRecoilState;
var Recoil_index_16 = Recoil_index.useRecoilCallback;
var Recoil_index_17 = Recoil_index.useGotoRecoilSnapshot;
var Recoil_index_18 = Recoil_index.useRecoilSnapshot;
var Recoil_index_19 = Recoil_index.useRecoilTransactionObserver_UNSTABLE;
var Recoil_index_20 = Recoil_index.useTransactionObservation_UNSTABLE;
var Recoil_index_21 = Recoil_index.useSetUnvalidatedAtomValues_UNSTABLE;
var Recoil_index_22 = Recoil_index.noWait;
var Recoil_index_23 = Recoil_index.waitForNone;
var Recoil_index_24 = Recoil_index.waitForAny;
var Recoil_index_25 = Recoil_index.waitForAll;
var Recoil_index_26 = Recoil_index.isRecoilValue;

exports.DefaultValue = Recoil_index_1;
exports.RecoilRoot = Recoil_index_2;
exports.atom = Recoil_index_3;
exports.atomFamily = Recoil_index_5;
exports.constSelector = Recoil_index_7;
exports.default = Recoil_index;
exports.errorSelector = Recoil_index_8;
exports.isRecoilValue = Recoil_index_26;
exports.noWait = Recoil_index_22;
exports.readOnlySelector = Recoil_index_9;
exports.selector = Recoil_index_4;
exports.selectorFamily = Recoil_index_6;
exports.useGotoRecoilSnapshot = Recoil_index_17;
exports.useRecoilCallback = Recoil_index_16;
exports.useRecoilSnapshot = Recoil_index_18;
exports.useRecoilState = Recoil_index_12;
exports.useRecoilStateLoadable = Recoil_index_13;
exports.useRecoilTransactionObserver_UNSTABLE = Recoil_index_19;
exports.useRecoilValue = Recoil_index_10;
exports.useRecoilValueLoadable = Recoil_index_11;
exports.useResetRecoilState = Recoil_index_15;
exports.useSetRecoilState = Recoil_index_14;
exports.useSetUnvalidatedAtomValues_UNSTABLE = Recoil_index_21;
exports.useTransactionObservation_UNSTABLE = Recoil_index_20;
exports.waitForAll = Recoil_index_25;
exports.waitForAny = Recoil_index_24;
exports.waitForNone = Recoil_index_23;
