'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var reactDom = _interopDefault(require('react-dom'));
var react = _interopDefault(require('react'));

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

const gks = new Map();

function Recoil_gkx(gk) {
  var _gks$get;

  return (_gks$get = gks.get(gk)) !== null && _gks$get !== void 0 ? _gks$get : false;
}

Recoil_gkx.setPass = gk => {
  gks.set(gk, true);
};

Recoil_gkx.setFail = gk => {
  gks.set(gk, false);
};

var Recoil_gkx_1 = Recoil_gkx; // @oss-only

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

  throw new Error(message !== null && message !== void 0 ? message : 'Got unexpected null or undefined');
}

var Recoil_nullthrows = nullthrows;

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

function recoverableViolation(message, projectName, {
  error
} = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  }

  return null;
}

var recoverableViolation_1 = recoverableViolation;

// @oss-only


var Recoil_recoverableViolation = recoverableViolation_1;

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
  wrap
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
  mapByDeletingMultipleFromMap
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

function sprintf(format, ...args) {
  let index = 0;
  return format.replace(/%s/g, () => String(args[index++]));
}

var sprintf_1 = sprintf;

function expectationViolation(format, ...args) {
  if (process.env.NODE_ENV !== "production") {
    const message = sprintf_1.call(null, format, ...args);
    const error = new Error(message);
    error.name = 'Expectation Violation';
    console.error(error);
  }
}

var expectationViolation_1 = expectationViolation;

// @oss-only


var Recoil_expectationViolation = expectationViolation_1;

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
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
    _defineProperty(this, "key", void 0);

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
  isRecoilValue
};

var Recoil_RecoilValue_1 = Recoil_RecoilValue.AbstractRecoilValue;
var Recoil_RecoilValue_2 = Recoil_RecoilValue.RecoilState;
var Recoil_RecoilValue_3 = Recoil_RecoilValue.RecoilValueReadOnly;
var Recoil_RecoilValue_4 = Recoil_RecoilValue.isRecoilValue;

var Recoil_RecoilValue$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  AbstractRecoilValue: Recoil_RecoilValue_1,
  RecoilState: Recoil_RecoilValue_2,
  RecoilValueReadOnly: Recoil_RecoilValue_3,
  isRecoilValue: Recoil_RecoilValue_4
});

class DefaultValue {}

const DEFAULT_VALUE = new DefaultValue();

class RecoilValueNotReady extends Error {
  constructor(key) {
    super(`Tried to set the value of Recoil selector ${key} using an updater function, but it is an async selector in a pending or error state; this is not supported.`);
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
    // @fb-only: recoverableViolation(message, 'recoil');
    // @fb-only: }

    console.warn(message); // @oss-only
  }

  nodes.set(node.key, node);
  const recoilValue = node.set == null ? new Recoil_RecoilValue$1.RecoilValueReadOnly(node.key) : new Recoil_RecoilValue$1.RecoilState(node.key);
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
  RecoilValueNotReady
};

const {
  mapByDeletingFromMap: mapByDeletingFromMap$1,
  mapBySettingInMap: mapBySettingInMap$1,
  setByAddingToSet: setByAddingToSet$1
} = Recoil_CopyOnWrite;

const {
  getNode: getNode$1,
  getNodeMaybe: getNodeMaybe$1
} = Recoil_Node; // flowlint-next-line unclear-type:off


const emptySet = Object.freeze(new Set());

class ReadOnlyRecoilValueError extends Error {} // Get the current value loadable of a node and update the state.
// Update dependencies and subscriptions for selectors.
// Update saved value validation for atoms.


function getNodeLoadable(store, state, key) {
  return getNode$1(key).get(store, state);
} // Peek at the current value loadable for a node without any evaluation or state change


function peekNodeLoadable(store, state, key) {
  return getNode$1(key).peek(store, state);
} // Write value directly to state bypassing the Node interface as the node
// definitions may not have been loaded yet when processing the initial snapshot.


function setUnvalidatedAtomValue_DEPRECATED(state, key, newValue) {
  var _node$invalidate;

  const node = getNodeMaybe$1(key);
  node === null || node === void 0 ? void 0 : (_node$invalidate = node.invalidate) === null || _node$invalidate === void 0 ? void 0 : _node$invalidate.call(node, state);
  return { ...state,
    atomValues: mapByDeletingFromMap$1(state.atomValues, key),
    nonvalidatedAtoms: mapBySettingInMap$1(state.nonvalidatedAtoms, key, newValue),
    dirtyAtoms: setByAddingToSet$1(state.dirtyAtoms, key)
  };
} // Return the discovered dependencies and values to be written by setting
// a node value. (Multiple values may be written due to selectors getting to
// set upstreams; deps may be discovered because of reads in updater functions.)


function setNodeValue(store, state, key, newValue) {
  const node = getNode$1(key);

  if (node.set == null) {
    throw new ReadOnlyRecoilValueError(`Attempt to set read-only RecoilValue: ${key}`);
  }

  return node.set(store, state, newValue);
}

function cleanUpNode(store, key) {
  const node = getNode$1(key);
  node.cleanUp(store);
} // Find all of the recursively dependent nodes


function getDownstreamNodes(store, state, keys) {
  const visitedNodes = new Set();
  const visitingNodes = Array.from(keys);
  const graph = store.getGraph(state.version);

  for (let key = visitingNodes.pop(); key; key = visitingNodes.pop()) {
    var _graph$nodeToNodeSubs;

    visitedNodes.add(key);
    const subscribedNodes = (_graph$nodeToNodeSubs = graph.nodeToNodeSubscriptions.get(key)) !== null && _graph$nodeToNodeSubs !== void 0 ? _graph$nodeToNodeSubs : emptySet;

    for (const downstreamNode of subscribedNodes) {
      if (!visitedNodes.has(downstreamNode)) {
        visitingNodes.push(downstreamNode);
      }
    }
  }

  return visitedNodes;
}

var Recoil_FunctionalCore = {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  cleanUpNode,
  setUnvalidatedAtomValue_DEPRECATED,
  getDownstreamNodes
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

function graph() {
  return {
    nodeDeps: new Map(),
    nodeToNodeSubscriptions: new Map()
  };
}

function cloneGraph(graph) {
  return {
    nodeDeps: Recoil_mapMap(graph.nodeDeps, s => new Set(s)),
    nodeToNodeSubscriptions: Recoil_mapMap(graph.nodeToNodeSubscriptions, s => new Set(s))
  };
} // Note that this overwrites the deps of existing nodes, rather than unioning
// the new deps with the old deps.


function mergeDependencyMapIntoGraph(deps, graph, // If olderGraph is given then we will not overwrite changes made to the given
// graph compared with olderGraph:
olderGraph) {
  const {
    nodeDeps,
    nodeToNodeSubscriptions
  } = graph;
  deps.forEach((upstreams, downstream) => {
    const existingUpstreams = nodeDeps.get(downstream);

    if (existingUpstreams && olderGraph && existingUpstreams !== olderGraph.nodeDeps.get(downstream)) {
      return;
    } // Update nodeDeps:


    nodeDeps.set(downstream, new Set(upstreams)); // Add new deps to nodeToNodeSubscriptions:

    const addedUpstreams = existingUpstreams == null ? upstreams : Recoil_differenceSets(upstreams, existingUpstreams);
    addedUpstreams.forEach(upstream => {
      if (!nodeToNodeSubscriptions.has(upstream)) {
        nodeToNodeSubscriptions.set(upstream, new Set());
      }

      const existing = Recoil_nullthrows(nodeToNodeSubscriptions.get(upstream));
      existing.add(downstream);
    }); // Remove removed deps from nodeToNodeSubscriptions:

    if (existingUpstreams) {
      const removedUpstreams = Recoil_differenceSets(existingUpstreams, upstreams);
      removedUpstreams.forEach(upstream => {
        if (!nodeToNodeSubscriptions.has(upstream)) {
          return;
        }

        const existing = Recoil_nullthrows(nodeToNodeSubscriptions.get(upstream));
        existing.delete(downstream);

        if (existing.size === 0) {
          nodeToNodeSubscriptions.delete(upstream);
        }
      });
    }
  });
}

function saveDependencyMapToStore(dependencyMap, store, version) {
  var _storeState$nextTree, _storeState$previousT, _storeState$previousT2, _storeState$previousT3;

  const storeState = store.getState();

  if (!(version === storeState.currentTree.version || version === ((_storeState$nextTree = storeState.nextTree) === null || _storeState$nextTree === void 0 ? void 0 : _storeState$nextTree.version) || version === ((_storeState$previousT = storeState.previousTree) === null || _storeState$previousT === void 0 ? void 0 : _storeState$previousT.version))) {
    Recoil_recoverableViolation('Tried to save dependencies to a discarded tree');
  } // Merge the dependencies discovered into the store's dependency map
  // for the version that was read:


  const graph = store.getGraph(version);
  mergeDependencyMapIntoGraph(dependencyMap, graph); // If this version is not the latest version, also write these dependencies
  // into later versions if they don't already have their own:

  if (version === ((_storeState$previousT2 = storeState.previousTree) === null || _storeState$previousT2 === void 0 ? void 0 : _storeState$previousT2.version)) {
    const currentGraph = store.getGraph(storeState.currentTree.version);
    mergeDependencyMapIntoGraph(dependencyMap, currentGraph, graph);
  }

  if (version === ((_storeState$previousT3 = storeState.previousTree) === null || _storeState$previousT3 === void 0 ? void 0 : _storeState$previousT3.version) || version === storeState.currentTree.version) {
    var _storeState$nextTree2;

    const nextVersion = (_storeState$nextTree2 = storeState.nextTree) === null || _storeState$nextTree2 === void 0 ? void 0 : _storeState$nextTree2.version;

    if (nextVersion !== undefined) {
      const nextGraph = store.getGraph(nextVersion);
      mergeDependencyMapIntoGraph(dependencyMap, nextGraph, graph);
    }
  }
}

function mergeDepsIntoDependencyMap(from, into) {
  from.forEach((upstreamDeps, downstreamNode) => {
    if (!into.has(downstreamNode)) {
      into.set(downstreamNode, new Set());
    }

    const deps = Recoil_nullthrows(into.get(downstreamNode));
    upstreamDeps.forEach(dep => deps.add(dep));
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
  saveDependencyMapToStore
};

const {
  getDownstreamNodes: getDownstreamNodes$1,
  getNodeLoadable: getNodeLoadable$1,
  setNodeValue: setNodeValue$1
} = Recoil_FunctionalCore;

const {
  saveDependencyMapToStore: saveDependencyMapToStore$1
} = Recoil_Graph;

const {
  getNodeMaybe: getNodeMaybe$2
} = Recoil_Node;

const {
  DefaultValue: DefaultValue$1,
  RecoilValueNotReady: RecoilValueNotReady$1
} = Recoil_Node;

const {
  AbstractRecoilValue: AbstractRecoilValue$1,
  RecoilState: RecoilState$1,
  RecoilValueReadOnly: RecoilValueReadOnly$1,
  isRecoilValue: isRecoilValue$1
} = Recoil_RecoilValue$1;

function getRecoilValueAsLoadable(store, {
  key
}, treeState = store.getState().currentTree) {
  var _storeState$nextTree, _storeState$previousT;

  // Reading from an older tree can cause bugs because the dependencies that we
  // discover during the read are lost.
  const storeState = store.getState();

  if (!(treeState.version === storeState.currentTree.version || treeState.version === ((_storeState$nextTree = storeState.nextTree) === null || _storeState$nextTree === void 0 ? void 0 : _storeState$nextTree.version) || treeState.version === ((_storeState$previousT = storeState.previousTree) === null || _storeState$previousT === void 0 ? void 0 : _storeState$previousT.version))) {
    Recoil_recoverableViolation('Tried to read from a discarded tree');
  }

  const [dependencyMap, loadable] = getNodeLoadable$1(store, treeState, key);

  if (!Recoil_gkx_1('recoil_async_selector_refactor')) {
    /**
     * In selector_NEW, we take care of updating state deps within the selector
     */
    saveDependencyMapToStore$1(dependencyMap, store, treeState.version);
  }

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

function valueFromValueOrUpdater(store, state, {
  key
}, valueOrUpdater) {
  if (typeof valueOrUpdater === 'function') {
    // Updater form: pass in the current value. Throw if the current value
    // is unavailable (namely when updating an async selector that's
    // pending or errored):
    // NOTE: This will evaluate node, but not update state with node subscriptions!
    const current = getNodeLoadable$1(store, state, key)[1];

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

function applyAction(store, state, action) {
  if (action.type === 'set') {
    const {
      recoilValue,
      valueOrUpdater
    } = action;
    const newValue = valueFromValueOrUpdater(store, state, recoilValue, valueOrUpdater);
    const [depMap, writes] = setNodeValue$1(store, state, recoilValue.key, newValue);
    saveDependencyMapToStore$1(depMap, store, state.version);

    for (const [key, loadable] of writes.entries()) {
      writeLoadableToTreeState(state, key, loadable);
    }
  } else if (action.type === 'setLoadable') {
    const {
      recoilValue: {
        key
      },
      loadable
    } = action;
    writeLoadableToTreeState(state, key, loadable);
  } else if (action.type === 'markModified') {
    const {
      recoilValue: {
        key
      }
    } = action;
    state.dirtyAtoms.add(key);
  } else if (action.type === 'setUnvalidated') {
    var _node$invalidate;

    // Write value directly to state bypassing the Node interface as the node
    // definitions may not have been loaded yet when processing the initial snapshot.
    const {
      recoilValue: {
        key
      },
      unvalidatedValue
    } = action;
    const node = getNodeMaybe$2(key);
    node === null || node === void 0 ? void 0 : (_node$invalidate = node.invalidate) === null || _node$invalidate === void 0 ? void 0 : _node$invalidate.call(node, state);
    state.atomValues.delete(key);
    state.nonvalidatedAtoms.set(key, unvalidatedValue);
    state.dirtyAtoms.add(key);
  } else {
    Recoil_recoverableViolation(`Unknown action ${action.type}`);
  }
}

function writeLoadableToTreeState(state, key, loadable) {
  if (loadable.state === 'hasValue' && loadable.contents instanceof DefaultValue$1) {
    state.atomValues.delete(key);
  } else {
    state.atomValues.set(key, loadable);
  }

  state.dirtyAtoms.add(key);
  state.nonvalidatedAtoms.delete(key);
}

function applyActionsToStore(store, actions) {
  store.replaceState(state => {
    const newState = copyTreeState(state);

    for (const action of actions) {
      applyAction(store, newState, action);
    }

    invalidateDownstreams(store, newState);
    return newState;
  });
}

function queueOrPerformStateUpdate(store, action, key, message) {
  if (batchStack.length) {
    const actionsByStore = batchStack[batchStack.length - 1];
    let actions = actionsByStore.get(store);

    if (!actions) {
      actionsByStore.set(store, actions = []);
    }

    actions.push(action);
  } else {
    Recoil_Tracing.trace(message, key, () => applyActionsToStore(store, [action]));
  }
}

const batchStack = [];

function batchStart() {
  const actionsByStore = new Map();
  batchStack.push(actionsByStore);
  return () => {
    for (const [store, actions] of actionsByStore) {
      Recoil_Tracing.trace('Recoil batched updates', '-', () => applyActionsToStore(store, actions));
    }

    const popped = batchStack.pop();

    if (popped !== actionsByStore) {
      Recoil_recoverableViolation('Incorrect order of batch popping');
    }
  };
}

function copyTreeState(state) {
  return { ...state,
    atomValues: new Map(state.atomValues),
    nonvalidatedAtoms: new Map(state.nonvalidatedAtoms),
    dirtyAtoms: new Set(state.dirtyAtoms)
  };
}

function invalidateDownstreams(store, state) {
  // Inform any nodes that were changed or downstream of changes so that they
  // can clear out any caches as needed due to the update:
  const downstreams = getDownstreamNodes$1(store, state, state.dirtyAtoms);

  for (const key of downstreams) {
    var _getNodeMaybe, _getNodeMaybe$invalid;

    (_getNodeMaybe = getNodeMaybe$2(key)) === null || _getNodeMaybe === void 0 ? void 0 : (_getNodeMaybe$invalid = _getNodeMaybe.invalidate) === null || _getNodeMaybe$invalid === void 0 ? void 0 : _getNodeMaybe$invalid.call(_getNodeMaybe, state);
  }
}

function setRecoilValue(store, recoilValue, valueOrUpdater) {
  queueOrPerformStateUpdate(store, {
    type: 'set',
    recoilValue,
    valueOrUpdater
  }, recoilValue.key, 'set Recoil value');
}

function setRecoilValueLoadable(store, recoilValue, loadable) {
  if (loadable instanceof DefaultValue$1) {
    return setRecoilValue(store, recoilValue, loadable);
  }

  queueOrPerformStateUpdate(store, {
    type: 'setLoadable',
    recoilValue,
    loadable
  }, recoilValue.key, 'set Recoil value');
}

function markRecoilValueModified(store, recoilValue) {
  queueOrPerformStateUpdate(store, {
    type: 'markModified',
    recoilValue
  }, recoilValue.key, 'mark RecoilValue modified');
}

function setUnvalidatedRecoilValue(store, recoilValue, unvalidatedValue) {
  queueOrPerformStateUpdate(store, {
    type: 'setUnvalidated',
    recoilValue,
    unvalidatedValue
  }, recoilValue.key, 'set Recoil value');
}

let subscriptionID = 0;

function subscribeToRecoilValue(store, {
  key
}, callback, componentDebugName = null) {
  const subID = subscriptionID++;
  const storeState = store.getState();

  if (!storeState.nodeToComponentSubscriptions.has(key)) {
    storeState.nodeToComponentSubscriptions.set(key, new Map());
  }

  Recoil_nullthrows(storeState.nodeToComponentSubscriptions.get(key)).set(subID, [componentDebugName !== null && componentDebugName !== void 0 ? componentDebugName : '<not captured>', callback]);
  return {
    release: () => {
      const storeState = store.getState();
      const subs = storeState.nodeToComponentSubscriptions.get(key);

      if (subs === undefined || !subs.has(subID)) {
        Recoil_recoverableViolation(`Subscription missing at release time for atom ${key}. This is a bug in Recoil.`);
        return;
      }

      subs.delete(subID);

      if (subs.size === 0) {
        storeState.nodeToComponentSubscriptions.delete(key);
      }
    }
  };
}

var Recoil_RecoilValueInterface = {
  RecoilValueReadOnly: RecoilValueReadOnly$1,
  AbstractRecoilValue: AbstractRecoilValue$1,
  RecoilState: RecoilState$1,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setRecoilValueLoadable,
  markRecoilValueModified,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
  isRecoilValue: isRecoilValue$1,
  applyAtomValueWrites,
  // TODO Remove export when deprecating initialStoreState_DEPRECATED in RecoilRoot
  batchStart,
  invalidateDownstreams_FOR_TESTING: invalidateDownstreams
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
 *
 * This is to export esstiential functions from react-dom
 * for our web build
 */
const {
  unstable_batchedUpdates
} = reactDom; // @oss-only
// @fb-only: const {unstable_batchedUpdates} = require('ReactDOMComet');


var Recoil_ReactBatchedUpdates = {
  unstable_batchedUpdates
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
const {
  batchStart: batchStart$1
} = Recoil_RecoilValueInterface;

const {
  unstable_batchedUpdates: unstable_batchedUpdates$1
} = Recoil_ReactBatchedUpdates;

let batcher = unstable_batchedUpdates$1; // flowlint-next-line unclear-type:off

/**
 * Sets the provided batcher function as the batcher function used by Recoil.
 *
 * Set the batcher to a custom batcher for your renderer,
 * if you use a renderer other than React DOM or React Native.
 */
const setBatcher = newBatcher => {
  batcher = newBatcher;
};
/**
 * Returns the current batcher function.
 */


const getBatcher = () => batcher;
/**
 * Calls the current batcher function and passes the
 * provided callback function.
 */


const batchUpdates = callback => {
  batcher(() => {
    let batchEnd = () => undefined;

    try {
      batchEnd = batchStart$1();
      callback();
    } finally {
      batchEnd();
    }
  });
};

var Recoil_Batching = {
  getBatcher,
  setBatcher,
  batchUpdates
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
  enqueueExecution
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
 * Combines multiple Iterables into a single Iterable.
 * Traverses the input Iterables in the order provided and maintains the order
 * of their elements.
 *
 * Example:
 * ```
 * const r = Array.from(concatIterables(['a', 'b'], ['c'], ['d', 'e', 'f']));
 * r == ['a', 'b', 'c', 'd', 'e', 'f'];
 * ```
 */

function* concatIterables(iters) {
  for (const iter of iters) {
    for (const val of iter) {
      yield val;
    }
  }
}

var Recoil_concatIterables = concatIterables;

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
 * iterable's values through the filter function.
 */

function* filterIterable(iterable, predicate) {
  // Use generator to create iterable/iterator
  let index = 0;

  for (const value of iterable) {
    if (predicate(value, index++)) {
      yield value;
    }
  }
}

var Recoil_filterIterable = filterIterable;

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
  return function* () {
    let index = 0;

    for (const value of iterable) {
      yield callback(value, index++);
    }
  }();
}

var Recoil_mapIterable = mapIterable;

const {
  graph: graph$1
} = Recoil_Graph; // flowlint-next-line unclear-type:off


let nextTreeStateVersion = 0;

const getNextTreeStateVersion = () => nextTreeStateVersion++;

function makeEmptyTreeState() {
  const version = getNextTreeStateVersion();
  return {
    version,
    stateID: version,
    transactionMetadata: {},
    dirtyAtoms: new Set(),
    atomValues: new Map(),
    nonvalidatedAtoms: new Map()
  };
}

function makeEmptyStoreState() {
  const currentTree = makeEmptyTreeState();
  return {
    currentTree,
    nextTree: null,
    previousTree: null,
    knownAtoms: new Set(),
    knownSelectors: new Set(),
    transactionSubscriptions: new Map(),
    nodeTransactionSubscriptions: new Map(),
    nodeToComponentSubscriptions: new Map(),
    queuedComponentCallbacks_DEPRECATED: [],
    suspendedComponentResolvers: new Set(),
    graphsByVersion: new Map().set(currentTree.version, graph$1()),
    versionsUsedByComponent: new Map()
  };
}

var Recoil_State = {
  makeEmptyTreeState,
  makeEmptyStoreState,
  getNextTreeStateVersion
};

const {
  batchUpdates: batchUpdates$1
} = Recoil_Batching;

const {
  getDownstreamNodes: getDownstreamNodes$2,
  peekNodeLoadable: peekNodeLoadable$1
} = Recoil_FunctionalCore;

const {
  graph: graph$2
} = Recoil_Graph;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$1,
  recoilValues: recoilValues$1
} = Recoil_Node;

const {
  getRecoilValueAsLoadable: getRecoilValueAsLoadable$1,
  setRecoilValue: setRecoilValue$1
} = Recoil_RecoilValueInterface;

const {
  getNextTreeStateVersion: getNextTreeStateVersion$1,
  makeEmptyStoreState: makeEmptyStoreState$1
} = Recoil_State; // Opaque at this surface because it's part of the public API from here.


function recoilValuesForKeys(keys) {
  return Recoil_mapIterable(keys, key => Recoil_nullthrows(recoilValues$1.get(key)));
} // A "Snapshot" is "read-only" and captures a specific set of values of atoms.
// However, the data-flow-graph and selector values may evolve as selector
// evaluation functions are executed and async selectors resolve.


class Snapshot {
  constructor(storeState) {
    _defineProperty(this, "_store", void 0);

    _defineProperty(this, "getLoadable", recoilValue => // $FlowFixMe[escaped-generic]
    getRecoilValueAsLoadable$1(this._store, recoilValue));

    _defineProperty(this, "getPromise", recoilValue => // $FlowFixMe[escaped-generic]
    this.getLoadable(recoilValue).toPromise());

    _defineProperty(this, "getNodes_UNSTABLE", opt => {
      // TODO Deal with modified selectors
      if ((opt === null || opt === void 0 ? void 0 : opt.isModified) === true) {
        if ((opt === null || opt === void 0 ? void 0 : opt.isInitialized) === false) {
          return [];
        }

        const state = this._store.getState().currentTree;

        return recoilValuesForKeys(state.dirtyAtoms);
      }

      const knownAtoms = this._store.getState().knownAtoms;

      const knownSelectors = this._store.getState().knownSelectors;

      return (opt === null || opt === void 0 ? void 0 : opt.isInitialized) == null ? recoilValues$1.values() : opt.isInitialized === true ? recoilValuesForKeys(Recoil_concatIterables([this._store.getState().knownAtoms, this._store.getState().knownSelectors])) : Recoil_filterIterable(recoilValues$1.values(), ({
        key
      }) => !knownAtoms.has(key) && !knownSelectors.has(key));
    });

    _defineProperty(this, "getDeps_UNSTABLE", recoilValue => {
      this.getLoadable(recoilValue); // Evaluate node to ensure deps are up-to-date

      const deps = this._store.getGraph(this._store.getState().currentTree.version).nodeDeps.get(recoilValue.key);

      return recoilValuesForKeys(deps !== null && deps !== void 0 ? deps : []);
    });

    _defineProperty(this, "getSubscribers_UNSTABLE", ({
      key
    }) => {
      const state = this._store.getState().currentTree;

      const downstreamNodes = Recoil_filterIterable(getDownstreamNodes$2(this._store, state, new Set([key])), nodeKey => nodeKey !== key);
      return {
        nodes: recoilValuesForKeys(downstreamNodes)
      };
    });

    _defineProperty(this, "getInfo_UNSTABLE", recoilValue => {
      var _graph$nodeDeps$get;

      const {
        key
      } = recoilValue;

      const state = this._store.getState().currentTree;

      const graph = this._store.getGraph(state.version);

      const type = this._store.getState().knownAtoms.has(key) ? 'atom' : this._store.getState().knownSelectors.has(key) ? 'selector' : undefined;
      return {
        loadable: peekNodeLoadable$1(this._store, state, key),
        isActive: this._store.getState().knownAtoms.has(key) || this._store.getState().knownSelectors.has(key),
        isSet: type === 'selector' ? false : state.atomValues.has(key),
        isModified: state.dirtyAtoms.has(key),
        type,
        // Don't use this.getDeps() as it will evaluate the node and we are only peeking
        deps: recoilValuesForKeys((_graph$nodeDeps$get = graph.nodeDeps.get(key)) !== null && _graph$nodeDeps$get !== void 0 ? _graph$nodeDeps$get : []),
        subscribers: this.getSubscribers_UNSTABLE(recoilValue)
      };
    });

    _defineProperty(this, "map", mapper => {
      const mutableSnapshot = new MutableSnapshot(this);
      mapper(mutableSnapshot); // if removing batchUpdates from `set` add it here

      return cloneSnapshot(mutableSnapshot.getStore_INTERNAL());
    });

    _defineProperty(this, "asyncMap", async mapper => {
      const mutableSnapshot = new MutableSnapshot(this);
      await mapper(mutableSnapshot);
      return cloneSnapshot(mutableSnapshot.getStore_INTERNAL());
    });

    this._store = {
      getState: () => storeState,
      replaceState: replacer => {
        storeState.currentTree = replacer(storeState.currentTree); // no batching so nextTree is never active
      },
      getGraph: version => {
        const graphs = storeState.graphsByVersion;

        if (graphs.has(version)) {
          return Recoil_nullthrows(graphs.get(version));
        }

        const newGraph = graph$2();
        graphs.set(version, newGraph);
        return newGraph;
      },
      subscribeToTransactions: () => ({
        release: () => {}
      }),
      addTransactionMetadata: () => {
        throw new Error('Cannot subscribe to Snapshots');
      }
    };
  }

  getStore_INTERNAL() {
    return this._store;
  }

  getID() {
    return this.getID_INTERNAL();
  }

  getID_INTERNAL() {
    return this._store.getState().currentTree.stateID;
  }

}

function cloneStoreState(store, treeState, bumpVersion = false) {
  const storeState = store.getState();
  const version = bumpVersion ? getNextTreeStateVersion$1() : treeState.version;
  return {
    currentTree: bumpVersion ? {
      // TODO snapshots shouldn't really have versions because a new version number
      // is always assigned when the snapshot is gone to.
      version,
      stateID: version,
      transactionMetadata: { ...treeState.transactionMetadata
      },
      dirtyAtoms: new Set(treeState.dirtyAtoms),
      atomValues: new Map(treeState.atomValues),
      nonvalidatedAtoms: new Map(treeState.nonvalidatedAtoms)
    } : treeState,
    nextTree: null,
    previousTree: null,
    knownAtoms: new Set(storeState.knownAtoms),
    // FIXME here's a copy
    knownSelectors: new Set(storeState.knownSelectors),
    // FIXME here's a copy
    transactionSubscriptions: new Map(),
    nodeTransactionSubscriptions: new Map(),
    nodeToComponentSubscriptions: new Map(),
    queuedComponentCallbacks_DEPRECATED: [],
    suspendedComponentResolvers: new Set(),
    graphsByVersion: new Map().set(version, store.getGraph(treeState.version)),
    versionsUsedByComponent: new Map()
  };
} // Factory to build a fresh snapshot


function freshSnapshot(initializeState) {
  const snapshot = new Snapshot(makeEmptyStoreState$1());
  return initializeState != null ? snapshot.map(initializeState) : snapshot;
} // Factory to clone a snapahot state


function cloneSnapshot(store, version = 'current') {
  const storeState = store.getState();
  const treeState = version === 'current' ? storeState.currentTree : Recoil_nullthrows(storeState.previousTree);
  return new Snapshot(cloneStoreState(store, treeState));
}

class MutableSnapshot extends Snapshot {
  constructor(snapshot) {
    super(cloneStoreState(snapshot.getStore_INTERNAL(), snapshot.getStore_INTERNAL().getState().currentTree, true));

    _defineProperty(this, "set", (recoilState, newValueOrUpdater) => {
      const store = this.getStore_INTERNAL(); // This batchUpdates ensures this `set` is applied immediately and you can
      // read the written value after calling `set`. I would like to remove this
      // behavior and only batch in `Snapshot.map`, but this would be a breaking
      // change potentially.

      batchUpdates$1(() => {
        setRecoilValue$1(store, recoilState, newValueOrUpdater);
      });
    });

    _defineProperty(this, "reset", recoilState => // See note at `set` about batched updates.
    batchUpdates$1(() => setRecoilValue$1(this.getStore_INTERNAL(), recoilState, DEFAULT_VALUE$1)));
  } // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer


}

var Recoil_Snapshot = {
  Snapshot,
  MutableSnapshot,
  freshSnapshot,
  cloneSnapshot
};

var Recoil_Snapshot_1 = Recoil_Snapshot.Snapshot;
var Recoil_Snapshot_2 = Recoil_Snapshot.MutableSnapshot;
var Recoil_Snapshot_3 = Recoil_Snapshot.freshSnapshot;
var Recoil_Snapshot_4 = Recoil_Snapshot.cloneSnapshot;

var Recoil_Snapshot$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Snapshot: Recoil_Snapshot_1,
  MutableSnapshot: Recoil_Snapshot_2,
  freshSnapshot: Recoil_Snapshot_3,
  cloneSnapshot: Recoil_Snapshot_4
});

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
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} = react; // @fb-only: const RecoilusagelogEvent = require('RecoilusagelogEvent');
// @fb-only: const RecoilUsageLogFalcoEvent = require('RecoilUsageLogFalcoEvent');
// @fb-only: const URI = require('URI');




const {
  cleanUpNode: cleanUpNode$1,
  getDownstreamNodes: getDownstreamNodes$3,
  setNodeValue: setNodeValue$2,
  setUnvalidatedAtomValue_DEPRECATED: setUnvalidatedAtomValue_DEPRECATED$1
} = Recoil_FunctionalCore;

const {
  graph: graph$3,
  saveDependencyMapToStore: saveDependencyMapToStore$2
} = Recoil_Graph;

const {
  cloneGraph: cloneGraph$1
} = Recoil_Graph;

const {
  applyAtomValueWrites: applyAtomValueWrites$1
} = Recoil_RecoilValueInterface;

const {
  freshSnapshot: freshSnapshot$1
} = Recoil_Snapshot$1;

const {
  getNextTreeStateVersion: getNextTreeStateVersion$2,
  makeEmptyStoreState: makeEmptyStoreState$2
} = Recoil_State;

const {
  mapByDeletingMultipleFromMap: mapByDeletingMultipleFromMap$1
} = Recoil_CopyOnWrite;

 // @fb-only: const recoverableViolation = require('../util/Recoil_recoverableViolation');




 // @fb-only: const gkx = require('gkx');


function notInAContext() {
  throw new Error('This component must be used inside a <RecoilRoot> component.');
}

const defaultStore = Object.freeze({
  getState: notInAContext,
  replaceState: notInAContext,
  getGraph: notInAContext,
  subscribeToTransactions: notInAContext,
  addTransactionMetadata: notInAContext
});
let stateReplacerIsBeingExecuted = false;

function startNextTreeIfNeeded(storeState) {
  if (stateReplacerIsBeingExecuted) {
    throw new Error('An atom update was triggered within the execution of a state updater function. State updater functions provided to Recoil must be pure functions.');
  }

  if (storeState.nextTree === null) {
    const version = storeState.currentTree.version;
    const nextVersion = getNextTreeStateVersion$2();
    storeState.nextTree = { ...storeState.currentTree,
      version: nextVersion,
      stateID: nextVersion,
      dirtyAtoms: new Set(),
      transactionMetadata: {}
    };
    storeState.graphsByVersion.set(nextVersion, cloneGraph$1(Recoil_nullthrows(storeState.graphsByVersion.get(version))));
  }
}

const AppContext = react.createContext({
  current: defaultStore
});

const useStoreRef = () => useContext(AppContext);

const MutableSourceContext = react.createContext(null); // TODO T2710559282599660

const useRecoilMutableSource = () => useContext(MutableSourceContext);

function sendEndOfBatchNotifications(store) {
  const storeState = store.getState();
  const treeState = storeState.currentTree; // Inform transaction subscribers of the transaction:

  const dirtyAtoms = treeState.dirtyAtoms;

  if (dirtyAtoms.size) {
    // Execute Node-specific subscribers before global subscribers
    for (const [key, subscriptions] of storeState.nodeTransactionSubscriptions) {
      if (dirtyAtoms.has(key)) {
        for (const [_, subscription] of subscriptions) {
          subscription(store);
        }
      }
    }

    for (const [_, subscription] of storeState.transactionSubscriptions) {
      subscription(store);
    } // Components that are subscribed to the dirty atom:


    const dependentNodes = getDownstreamNodes$3(store, treeState, dirtyAtoms);

    for (const key of dependentNodes) {
      const comps = storeState.nodeToComponentSubscriptions.get(key);

      if (comps) {
        for (const [_subID, [_debugName, callback]] of comps) {
          callback(treeState);
        }
      }
    } // Wake all suspended components so the right one(s) can try to re-render.
    // We need to wake up components not just when some asynchronous selector
    // resolved, but also when changing synchronous values because this may cause
    // a selector to change from asynchronous to synchronous, in which case there
    // would be no follow-up asynchronous resolution to wake us up.
    // TODO OPTIMIZATION Only wake up related downstream components


    let nodeNames = '[available in dev build]';

    if (process.env.NODE_ENV !== "production") {
      nodeNames = Array.from(dirtyAtoms).join(', ');
    }

    storeState.suspendedComponentResolvers.forEach(cb => Recoil_Tracing.trace('value became available, waking components', nodeNames, cb));
  } // Special behavior ONLY invoked by useInterface.
  // FIXME delete queuedComponentCallbacks_DEPRECATED when deleting useInterface.


  storeState.queuedComponentCallbacks_DEPRECATED.forEach(cb => cb(treeState));
  storeState.queuedComponentCallbacks_DEPRECATED.splice(0, storeState.queuedComponentCallbacks_DEPRECATED.length);
}
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
      const {
        nextTree
      } = storeState; // Ignore commits that are not because of Recoil transactions -- namely,
      // because something above RecoilRoot re-rendered:

      if (nextTree === null) {
        return;
      } // nextTree is now committed -- note that copying and reset occurs when
      // a transaction begins, in startNextTreeIfNeeded:


      storeState.previousTree = storeState.currentTree;
      storeState.currentTree = nextTree;
      storeState.nextTree = null;
      sendEndOfBatchNotifications(storeRef.current);
      const discardedVersion = Recoil_nullthrows(storeState.previousTree).version;
      storeState.graphsByVersion.delete(discardedVersion);
      storeState.previousTree = null;
    });
  });
  return null;
}

if (process.env.NODE_ENV !== "production") {
  if (typeof window !== 'undefined' && !window.$recoilDebugStates) {
    window.$recoilDebugStates = [];
  }
} // When removing this deprecated function, remove stateBySettingRecoilValue
// which will no longer be needed.


function initialStoreState_DEPRECATED(store, initializeState) {
  const initial = makeEmptyStoreState$2();
  initializeState({
    // $FlowFixMe[escaped-generic]
    set: (atom, value) => {
      const state = initial.currentTree;
      const [depMap, writes] = setNodeValue$2(store, state, atom.key, value);
      const writtenNodes = new Set(writes.keys());
      saveDependencyMapToStore$2(depMap, store, state.version);
      const nonvalidatedAtoms = mapByDeletingMultipleFromMap$1(state.nonvalidatedAtoms, writtenNodes);
      initial.currentTree = { ...state,
        dirtyAtoms: Recoil_unionSets(state.dirtyAtoms, writtenNodes),
        atomValues: applyAtomValueWrites$1(state.atomValues, writes),
        // NB: PLEASE un-export applyAtomValueWrites when deleting this code
        nonvalidatedAtoms
      };
    },
    setUnvalidatedAtomValues: atomValues => {
      // FIXME replace this with a mutative loop
      atomValues.forEach((v, k) => {
        initial.currentTree = setUnvalidatedAtomValue_DEPRECATED$1(initial.currentTree, k, v);
      });
    }
  });
  return initial;
}

function initialStoreState(initializeState) {
  const snapshot = freshSnapshot$1().map(initializeState);
  return snapshot.getStore_INTERNAL().getState();
}

let nextID = 0;

function RecoilRoot({
  initializeState_DEPRECATED,
  initializeState,
  store_INTERNAL: storeProp,
  // For use with React "context bridging"
  children
}) {
  var _createMutableSource;

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
      return Recoil_nullthrows(graphs.get(version));
    }

    const newGraph = graph$3();
    graphs.set(version, newGraph);
    return newGraph;
  };

  const subscribeToTransactions = (callback, key) => {
    if (key == null) {
      // Global transaction subscriptions
      const {
        transactionSubscriptions
      } = storeRef.current.getState();
      const id = nextID++;
      transactionSubscriptions.set(id, callback);
      return {
        release: () => {
          transactionSubscriptions.delete(id);
        }
      };
    } else {
      // Node-specific transaction subscriptions:
      const {
        nodeTransactionSubscriptions
      } = storeRef.current.getState();

      if (!nodeTransactionSubscriptions.has(key)) {
        nodeTransactionSubscriptions.set(key, new Map());
      }

      const id = nextID++;
      Recoil_nullthrows(nodeTransactionSubscriptions.get(key)).set(id, callback);
      return {
        release: () => {
          const subs = nodeTransactionSubscriptions.get(key);

          if (subs) {
            subs.delete(id);

            if (subs.size === 0) {
              nodeTransactionSubscriptions.delete(key);
            }
          }
        }
      };
    }
  };

  const addTransactionMetadata = metadata => {
    startNextTreeIfNeeded(storeRef.current.getState());

    for (const k of Object.keys(metadata)) {
      Recoil_nullthrows(storeRef.current.getState().nextTree).transactionMetadata[k] = metadata[k];
    }
  };

  const replaceState = replacer => {
    const storeState = storeRef.current.getState();
    startNextTreeIfNeeded(storeState); // Use replacer to get the next state:

    const nextTree = Recoil_nullthrows(storeState.nextTree);
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

    if (process.env.NODE_ENV !== "production") {
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
  } // FIXME T2710559282599660


  const createMutableSource = (_createMutableSource = react.createMutableSource) !== null && _createMutableSource !== void 0 ? _createMutableSource : // flowlint-line unclear-type:off
  react.unstable_createMutableSource; // flowlint-line unclear-type:off

  const store = storeProp !== null && storeProp !== void 0 ? storeProp : {
    getState: () => storeState.current,
    replaceState,
    getGraph,
    subscribeToTransactions,
    addTransactionMetadata
  };
  const storeRef = useRef(store);
  storeState = useRef(initializeState_DEPRECATED != null ? initialStoreState_DEPRECATED(store, initializeState_DEPRECATED) : initializeState != null ? initialStoreState(initializeState) : makeEmptyStoreState$2());
  const mutableSource = useMemo(() => createMutableSource ? createMutableSource(storeState, () => storeState.current.currentTree.version) : null, [createMutableSource, storeState]); // Cleanup when the <RecoilRoot> is unmounted

  useEffect(() => () => {
    for (const atomKey of storeRef.current.getState().knownAtoms) {
      cleanUpNode$1(storeRef.current, atomKey);
    }
  }, []);
  return /*#__PURE__*/react.createElement(AppContext.Provider, {
    value: storeRef
  }, /*#__PURE__*/react.createElement(MutableSourceContext.Provider, {
    value: mutableSource
  }, /*#__PURE__*/react.createElement(Batcher, {
    setNotifyBatcherOfChange: setNotifyBatcherOfChange
  }), children));
}

var Recoil_RecoilRoot_react = {
  useStoreRef,
  useRecoilMutableSource,
  RecoilRoot,
  sendEndOfBatchNotifications_FOR_TESTING: sendEndOfBatchNotifications
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
/**
 * Returns a set containing all of the values from the original set where
 * the given callback returned true.
 */

function filterSet(set, callback) {
  const result = new Set();

  for (const value of set) {
    if (callback(value)) {
      result.add(value);
    }
  }

  return result;
}

var Recoil_filterSet = filterSet;

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
      // $FlowFixMe[incompatible-call] - map/iterator knows nothing about flow types
      result.set(nextKey.value, maps[i].get(nextKey.value));
    }
  }
  /* $FlowFixMe[incompatible-return] (>=0.66.0 site=www,mobile) This comment
   * suppresses an error found when Flow v0.66 was deployed. To see the error
   * delete this comment and run Flow. */


  return result;
}

var Recoil_mergeMaps = mergeMaps;

var _useMutableSource;

 // FIXME T2710559282599660


const useMutableSource = // flowlint-line unclear-type:off
(_useMutableSource = react.useMutableSource) !== null && _useMutableSource !== void 0 ? _useMutableSource : react.unstable_useMutableSource; // flowlint-line unclear-type:off

function mutableSourceExists() {
  return useMutableSource && !(typeof window !== 'undefined' && window.$disableRecoilValueMutableSource_TEMP_HACK_DO_NOT_USE);
}

var Recoil_mutableSource = {
  mutableSourceExists,
  useMutableSource
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * MIT License
 *
 * Copyright (c) 2014-2019 Georg Tavonius
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @emails oncall+recoil
 * 
 * @format
 */

const UNKNOWN_FUNCTION = '<unknown>';
/**
 * This parses the different stack traces and puts them into one format
 * This borrows heavily from TraceKit (https://github.com/csnover/TraceKit)
 */

function stackTraceParser(stackString) {
  const lines = stackString.split('\n');
  return lines.reduce((stack, line) => {
    const parseResult = parseChrome(line) || parseWinjs(line) || parseGecko(line) || parseNode(line) || parseJSC(line);

    if (parseResult) {
      stack.push(parseResult);
    }

    return stack;
  }, []);
}

const chromeRe = /^\s*at (.*?) ?\(((?:file|https?|blob|chrome-extension|native|eval|webpack|<anonymous>|\/|[a-z]:\\|\\\\).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
const chromeEvalRe = /\((\S*)(?::(\d+))(?::(\d+))\)/;

function parseChrome(line) {
  const parts = chromeRe.exec(line);

  if (!parts) {
    return null;
  }

  const isNative = parts[2] && parts[2].indexOf('native') === 0; // start of line

  const isEval = parts[2] && parts[2].indexOf('eval') === 0; // start of line

  const submatch = chromeEvalRe.exec(parts[2]);

  if (isEval && submatch != null) {
    // throw out eval line/column and use top-most line/column number
    parts[2] = submatch[1]; // url

    parts[3] = submatch[2]; // line

    parts[4] = submatch[3]; // column
  }

  return {
    file: !isNative ? parts[2] : null,
    methodName: parts[1] || UNKNOWN_FUNCTION,
    arguments: isNative ? [parts[2]] : [],
    lineNumber: parts[3] ? +parts[3] : null,
    column: parts[4] ? +parts[4] : null
  };
}

const winjsRe = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:file|ms-appx|https?|webpack|blob):.*?):(\d+)(?::(\d+))?\)?\s*$/i;

function parseWinjs(line) {
  const parts = winjsRe.exec(line);

  if (!parts) {
    return null;
  }

  return {
    file: parts[2],
    methodName: parts[1] || UNKNOWN_FUNCTION,
    arguments: [],
    lineNumber: +parts[3],
    column: parts[4] ? +parts[4] : null
  };
}

const geckoRe = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)((?:file|https?|blob|chrome|webpack|resource|\[native).*?|[^@]*bundle)(?::(\d+))?(?::(\d+))?\s*$/i;
const geckoEvalRe = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;

function parseGecko(line) {
  const parts = geckoRe.exec(line);

  if (!parts) {
    return null;
  }

  const isEval = parts[3] && parts[3].indexOf(' > eval') > -1;
  const submatch = geckoEvalRe.exec(parts[3]);

  if (isEval && submatch != null) {
    // throw out eval line/column and use top-most line number
    parts[3] = submatch[1];
    parts[4] = submatch[2];
    parts[5] = null; // no column when eval
  }

  return {
    file: parts[3],
    methodName: parts[1] || UNKNOWN_FUNCTION,
    arguments: parts[2] ? parts[2].split(',') : [],
    lineNumber: parts[4] ? +parts[4] : null,
    column: parts[5] ? +parts[5] : null
  };
}

const javaScriptCoreRe = /^\s*(?:([^@]*)(?:\((.*?)\))?@)?(\S.*?):(\d+)(?::(\d+))?\s*$/i;

function parseJSC(line) {
  const parts = javaScriptCoreRe.exec(line);

  if (!parts) {
    return null;
  }

  return {
    file: parts[3],
    methodName: parts[1] || UNKNOWN_FUNCTION,
    arguments: [],
    lineNumber: +parts[4],
    column: parts[5] ? +parts[5] : null
  };
}

const nodeRe = /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;

function parseNode(line) {
  const parts = nodeRe.exec(line);

  if (!parts) {
    return null;
  }

  return {
    file: parts[2],
    methodName: parts[1] || UNKNOWN_FUNCTION,
    arguments: [],
    lineNumber: +parts[3],
    column: parts[4] ? +parts[4] : null
  };
}

var Recoil_stackTraceParser = stackTraceParser;

const {
  useRef: useRef$1
} = react;





function useComponentName() {
  const nameRef = useRef$1();

  if (process.env.NODE_ENV !== "production") {
    if (Recoil_gkx_1('recoil_infer_component_names')) {
      var _nameRef$current;

      if (nameRef.current === undefined) {
        // There is no blessed way to determine the calling React component from
        // within a hook. This hack uses the fact that hooks must start with 'use'
        // and that hooks are either called by React Components or other hooks. It
        // follows therefore, that to find the calling component, you simply need
        // to look down the stack and find the first function which doesn't start
        // with 'use'. We are only enabling this in dev for now, since once the
        // codebase is minified, the naming assumptions no longer hold true.
        const frames = Recoil_stackTraceParser(new Error().stack);

        for (const {
          methodName
        } of frames) {
          // I observed cases where the frame was of the form 'Object.useXXX'
          // hence why I'm searching for hooks following a word boundary
          if (!methodName.match(/\buse[^\b]+$/)) {
            return nameRef.current = methodName;
          }
        }

        nameRef.current = null;
      }

      return (_nameRef$current = nameRef.current) !== null && _nameRef$current !== void 0 ? _nameRef$current : '<unable to determine component name>';
    }
  } // @fb-only: return "<component name only available when both in dev mode and when passing GK 'recoil_infer_component_names'>";


  return '<component name not available>'; // @oss-only
}

var Recoil_useComponentName = useComponentName;

const {
  useCallback,
  useEffect: useEffect$1,
  useMemo: useMemo$1,
  useRef: useRef$2,
  useState: useState$1
} = react;

const {
  batchUpdates: batchUpdates$2
} = Recoil_Batching;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$2,
  getNode: getNode$2,
  nodes: nodes$1
} = Recoil_Node;

const {
  useRecoilMutableSource: useRecoilMutableSource$1,
  useStoreRef: useStoreRef$1
} = Recoil_RecoilRoot_react;

const {
  isRecoilValue: isRecoilValue$2
} = Recoil_RecoilValue$1;

const {
  AbstractRecoilValue: AbstractRecoilValue$2,
  getRecoilValueAsLoadable: getRecoilValueAsLoadable$2,
  setRecoilValue: setRecoilValue$2,
  setRecoilValueLoadable: setRecoilValueLoadable$1,
  setUnvalidatedRecoilValue: setUnvalidatedRecoilValue$1,
  subscribeToRecoilValue: subscribeToRecoilValue$1
} = Recoil_RecoilValueInterface;

const {
  Snapshot: Snapshot$1,
  cloneSnapshot: cloneSnapshot$1
} = Recoil_Snapshot$1;

const {
  setByAddingToSet: setByAddingToSet$2
} = Recoil_CopyOnWrite;















const {
  mutableSourceExists: mutableSourceExists$1,
  useMutableSource: useMutableSource$1
} = Recoil_mutableSource;









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
    throw new Error(`Invalid argument to ${hookName}: expected an atom or selector but got ${String(recoilValue)}`);
  }
}

function useRecoilInterface_DEPRECATED() {
  const storeRef = useStoreRef$1();
  const [_, forceUpdate] = useState$1([]);
  const recoilValuesUsed = useRef$2(new Set());
  recoilValuesUsed.current = new Set(); // Track the RecoilValues used just during this render

  const previousSubscriptions = useRef$2(new Set());
  const subscriptions = useRef$2(new Map());
  const unsubscribeFrom = useCallback(key => {
    const sub = subscriptions.current.get(key);

    if (sub) {
      sub.release(storeRef.current);
      subscriptions.current.delete(key);
    }
  }, [storeRef, subscriptions]);
  const componentName = Recoil_useComponentName();
  useEffect$1(() => {
    const store = storeRef.current;

    function updateState(_state, key) {
      if (!subscriptions.current.has(key)) {
        return;
      }

      forceUpdate([]);
    }

    Recoil_differenceSets(recoilValuesUsed.current, previousSubscriptions.current).forEach(key => {
      if (subscriptions.current.has(key)) {
        Recoil_expectationViolation(`Double subscription to RecoilValue "${key}"`);
        return;
      }

      const sub = subscribeToRecoilValue$1(store, new AbstractRecoilValue$2(key), state => {
        Recoil_Tracing.trace('RecoilValue subscription fired', key, () => {
          updateState(state, key);
        });
      }, componentName);
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
        // FIXME delete queuedComponentCallbacks_DEPRECATED when deleting useInterface.
        const state = store.getState();

        if (state.nextTree) {
          store.getState().queuedComponentCallbacks_DEPRECATED.push(Recoil_Tracing.wrap(() => {
            updateState(store.getState(), key);
          }));
        } else {
          updateState(store.getState(), key);
        }
      });
    });
    Recoil_differenceSets(previousSubscriptions.current, recoilValuesUsed.current).forEach(key => {
      unsubscribeFrom(key);
    });
    previousSubscriptions.current = recoilValuesUsed.current;
  });
  useEffect$1(() => {
    const subs = subscriptions.current;
    return () => subs.forEach((_, key) => unsubscribeFrom(key));
  }, [unsubscribeFrom]);
  return useMemo$1(() => {
    function useSetRecoilState(recoilState) {
      if (process.env.NODE_ENV !== "production") {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilState, 'useSetRecoilState');
      }

      return newValueOrUpdater => {
        setRecoilValue$2(storeRef.current, recoilState, newValueOrUpdater);
      };
    }

    function useResetRecoilState(recoilState) {
      if (process.env.NODE_ENV !== "production") {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilState, 'useResetRecoilState');
      }

      return () => setRecoilValue$2(storeRef.current, recoilState, DEFAULT_VALUE$2);
    }

    function useRecoilValueLoadable(recoilValue) {
      if (process.env.NODE_ENV !== "production") {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
      }

      if (!recoilValuesUsed.current.has(recoilValue.key)) {
        recoilValuesUsed.current = setByAddingToSet$2(recoilValuesUsed.current, recoilValue.key);
      } // TODO Restore optimization to memoize lookup


      return getRecoilValueAsLoadable$2(storeRef.current, recoilValue);
    }

    function useRecoilValue(recoilValue) {
      if (process.env.NODE_ENV !== "production") {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilValue, 'useRecoilValue');
      }

      const loadable = useRecoilValueLoadable(recoilValue); // $FlowFixMe[escaped-generic]

      return handleLoadable(loadable, recoilValue, storeRef);
    }

    function useRecoilState(recoilState) {
      if (process.env.NODE_ENV !== "production") {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilState, 'useRecoilState');
      }

      return [useRecoilValue(recoilState), useSetRecoilState(recoilState)];
    }

    function useRecoilStateLoadable(recoilState) {
      if (process.env.NODE_ENV !== "production") {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilState, 'useRecoilStateLoadable');
      }

      return [useRecoilValueLoadable(recoilState), useSetRecoilState(recoilState)];
    }

    return {
      getRecoilValue: useRecoilValue,
      getRecoilValueLoadable: useRecoilValueLoadable,
      getRecoilState: useRecoilState,
      getRecoilStateLoadable: useRecoilStateLoadable,
      getSetRecoilState: useSetRecoilState,
      getResetRecoilState: useResetRecoilState
    };
  }, [recoilValuesUsed, storeRef]);
}

const recoilComponentGetRecoilValueCount_FOR_TESTING = {
  current: 0
};

function useRecoilValueLoadable_MUTABLESOURCE(recoilValue) {
  if (process.env.NODE_ENV !== "production") {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
  }

  const storeRef = useStoreRef$1();
  const getValue = useCallback(() => {
    if (process.env.NODE_ENV !== "production") {
      recoilComponentGetRecoilValueCount_FOR_TESTING.current++;
    }

    return getRecoilValueAsLoadable$2(storeRef.current, recoilValue, storeRef.current.getState().currentTree);
  }, [storeRef, recoilValue]);
  const componentName = Recoil_useComponentName();
  const subscribe = useCallback((_something, callback) => {
    const store = storeRef.current;
    const sub = subscribeToRecoilValue$1(store, recoilValue, () => {
      Recoil_Tracing.trace('RecoilValue subscription fired', recoilValue.key, () => {
        callback();
      });
    }, componentName);
    return () => sub.release(store);
  }, [recoilValue, storeRef, componentName]);
  return useMutableSource$1(useRecoilMutableSource$1(), getValue, subscribe);
}

function useRecoilValueLoadable_LEGACY(recoilValue) {
  if (process.env.NODE_ENV !== "production") {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
  }

  const storeRef = useStoreRef$1();
  const [_, forceUpdate] = useState$1([]);
  const componentName = Recoil_useComponentName();
  useEffect$1(() => {
    const store = storeRef.current;
    const sub = subscribeToRecoilValue$1(store, recoilValue, _state => {
      Recoil_Tracing.trace('RecoilValue subscription fired', recoilValue.key, () => {
        forceUpdate([]);
      });
    }, componentName);
    Recoil_Tracing.trace('initial update on subscribing', recoilValue.key, () => {
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
        store.getState().queuedComponentCallbacks_DEPRECATED.push(Recoil_Tracing.wrap(() => {
          forceUpdate([]);
        }));
      } else {
        forceUpdate([]);
      }
    });
    return () => sub.release(store);
  }, [recoilValue, storeRef]);
  return getRecoilValueAsLoadable$2(storeRef.current, recoilValue);
}
/**
  Like useRecoilValue(), but either returns the value if available or
  just undefined if not available for any reason, such as pending or error.
*/


function useRecoilValueLoadable(recoilValue) {
  if (mutableSourceExists$1()) {
    // eslint-disable-next-line fb-www/react-hooks
    return useRecoilValueLoadable_MUTABLESOURCE(recoilValue);
  } else {
    // eslint-disable-next-line fb-www/react-hooks
    return useRecoilValueLoadable_LEGACY(recoilValue);
  }
}
/**
  Returns the value represented by the RecoilValue.
  If the value is pending, it will throw a Promise to suspend the component,
  if the value is an error it will throw it for the nearest React error boundary.
  This will also subscribe the component for any updates in the value.
  */


function useRecoilValue(recoilValue) {
  if (process.env.NODE_ENV !== "production") {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilValue, 'useRecoilValue');
  }

  const storeRef = useStoreRef$1();
  const loadable = useRecoilValueLoadable(recoilValue); // $FlowFixMe[escaped-generic]

  return handleLoadable(loadable, recoilValue, storeRef);
}
/**
  Returns a function that allows the value of a RecoilState to be updated, but does
  not subscribe the component to changes to that RecoilState.
*/


function useSetRecoilState(recoilState) {
  if (process.env.NODE_ENV !== "production") {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilState, 'useSetRecoilState');
  }

  const storeRef = useStoreRef$1();
  return useCallback(newValueOrUpdater => {
    setRecoilValue$2(storeRef.current, recoilState, newValueOrUpdater);
  }, [storeRef, recoilState]);
}
/**
  Returns a function that will reset the value of a RecoilState to its default
*/


function useResetRecoilState(recoilState) {
  if (process.env.NODE_ENV !== "production") {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilState, 'useResetRecoilState');
  }

  const storeRef = useStoreRef$1();
  return useCallback(() => {
    setRecoilValue$2(storeRef.current, recoilState, DEFAULT_VALUE$2);
  }, [storeRef, recoilState]);
}
/**
  Equivalent to useState(). Allows the value of the RecoilState to be read and written.
  Subsequent updates to the RecoilState will cause the component to re-render. If the
  RecoilState is pending, this will suspend the component and initiate the
  retrieval of the value. If evaluating the RecoilState resulted in an error, this will
  throw the error so that the nearest React error boundary can catch it.
*/


function useRecoilState(recoilState) {
  if (process.env.NODE_ENV !== "production") {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilState, 'useRecoilState');
  }

  return [useRecoilValue(recoilState), useSetRecoilState(recoilState)];
}
/**
  Like useRecoilState(), but does not cause Suspense or React error handling. Returns
  an object that indicates whether the RecoilState is available, pending, or
  unavailable due to an error.
*/


function useRecoilStateLoadable(recoilState) {
  if (process.env.NODE_ENV !== "production") {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilState, 'useRecoilStateLoadable');
  }

  return [useRecoilValueLoadable(recoilState), useSetRecoilState(recoilState)];
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
  const persistedAtomContentsValues = Recoil_mapMap(Recoil_filterMap(atomValues, (v, k) => {
    const node = getNode$2(k);
    const persistence = node.persistence_UNSTABLE;
    return persistence != null && persistence.type !== 'none' && v.state === 'hasValue';
  }), v => v.contents); // Merge in nonvalidated atoms; we may not have defs for them but they will
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
  useTransactionSubscription(useCallback(store => {
    let previousTree = store.getState().previousTree;
    const currentTree = store.getState().currentTree;

    if (!previousTree) {
      Recoil_recoverableViolation('Transaction subscribers notified without a previous tree being present -- this is a bug in Recoil');
      previousTree = store.getState().currentTree; // attempt to trundle on
    }

    const atomValues = externallyVisibleAtomValuesInState(currentTree);
    const previousAtomValues = externallyVisibleAtomValuesInState(previousTree);
    const atomInfo = Recoil_mapMap(nodes$1, node => {
      var _node$persistence_UNS, _node$persistence_UNS2, _node$persistence_UNS3, _node$persistence_UNS4;

      return {
        persistence_UNSTABLE: {
          type: (_node$persistence_UNS = (_node$persistence_UNS2 = node.persistence_UNSTABLE) === null || _node$persistence_UNS2 === void 0 ? void 0 : _node$persistence_UNS2.type) !== null && _node$persistence_UNS !== void 0 ? _node$persistence_UNS : 'none',
          backButton: (_node$persistence_UNS3 = (_node$persistence_UNS4 = node.persistence_UNSTABLE) === null || _node$persistence_UNS4 === void 0 ? void 0 : _node$persistence_UNS4.backButton) !== null && _node$persistence_UNS3 !== void 0 ? _node$persistence_UNS3 : false
        }
      };
    }); // Filter on existance in atomValues so that externally-visible rules
    // are also applied to modified atoms (specifically exclude selectors):

    const modifiedAtoms = Recoil_filterSet(currentTree.dirtyAtoms, k => atomValues.has(k) || previousAtomValues.has(k));
    callback({
      atomValues,
      previousAtomValues,
      atomInfo,
      modifiedAtoms,
      transactionMetadata: { ...currentTree.transactionMetadata
      }
    });
  }, [callback]));
}

function useRecoilTransactionObserver(callback) {
  useTransactionSubscription(useCallback(store => {
    callback({
      snapshot: cloneSnapshot$1(store, 'current'),
      previousSnapshot: cloneSnapshot$1(store, 'previous')
    });
  }, [callback]));
} // Return a snapshot of the current state and subscribe to all state changes


function useRecoilSnapshot() {
  const storeRef = useStoreRef$1();
  const [snapshot, setSnapshot] = useState$1(() => cloneSnapshot$1(storeRef.current));
  useTransactionSubscription(useCallback(store => setSnapshot(cloneSnapshot$1(store)), []));
  return snapshot;
}

function useGotoRecoilSnapshot() {
  const storeRef = useStoreRef$1();
  return useCallback(snapshot => {
    var _storeState$nextTree;

    const storeState = storeRef.current.getState();
    const prev = (_storeState$nextTree = storeState.nextTree) !== null && _storeState$nextTree !== void 0 ? _storeState$nextTree : storeState.currentTree;
    const next = snapshot.getStore_INTERNAL().getState().currentTree;
    batchUpdates$2(() => {
      const keysToUpdate = new Set();

      for (const keys of [prev.atomValues.keys(), next.atomValues.keys()]) {
        for (const key of keys) {
          var _prev$atomValues$get, _next$atomValues$get;

          if (((_prev$atomValues$get = prev.atomValues.get(key)) === null || _prev$atomValues$get === void 0 ? void 0 : _prev$atomValues$get.contents) !== ((_next$atomValues$get = next.atomValues.get(key)) === null || _next$atomValues$get === void 0 ? void 0 : _next$atomValues$get.contents) && getNode$2(key).shouldRestoreFromSnapshots) {
            keysToUpdate.add(key);
          }
        }
      }

      keysToUpdate.forEach(key => {
        setRecoilValueLoadable$1(storeRef.current, new AbstractRecoilValue$2(key), next.atomValues.has(key) ? Recoil_nullthrows(next.atomValues.get(key)) : DEFAULT_VALUE$2);
      });
      storeRef.current.replaceState(state => {
        return { ...state,
          stateID: snapshot.getID_INTERNAL()
        };
      });
    });
  }, [storeRef]);
}

function useSetUnvalidatedAtomValues() {
  const storeRef = useStoreRef$1();
  return (values, transactionMetadata = {}) => {
    batchUpdates$2(() => {
      storeRef.current.addTransactionMetadata(transactionMetadata);
      values.forEach((value, key) => setUnvalidatedRecoilValue$1(storeRef.current, new AbstractRecoilValue$2(key), value));
    });
  };
}

class Sentinel {}

const SENTINEL = new Sentinel();

function useRecoilCallback(fn, deps) {
  const storeRef = useStoreRef$1();
  const gotoSnapshot = useGotoRecoilSnapshot();
  return useCallback((...args) => {
    // Use currentTree for the snapshot to show the currently committed state
    const snapshot = cloneSnapshot$1(storeRef.current);

    function set(recoilState, newValueOrUpdater) {
      setRecoilValue$2(storeRef.current, recoilState, newValueOrUpdater);
    }

    function reset(recoilState) {
      setRecoilValue$2(storeRef.current, recoilState, DEFAULT_VALUE$2);
    }

    let ret = SENTINEL;
    batchUpdates$2(() => {
      // flowlint-next-line unclear-type:off
      ret = fn({
        set,
        reset,
        snapshot,
        gotoSnapshot
      })(...args);
    });
    !!(ret instanceof Sentinel) ? process.env.NODE_ENV !== "production" ? Recoil_invariant(false, 'batchUpdates should return immediately') : Recoil_invariant(false) : void 0;
    return ret;
  }, deps != null ? [...deps, storeRef] : undefined // eslint-disable-line fb-www/react-hooks-deps
  );
}

var Recoil_Hooks = {
  recoilComponentGetRecoilValueCount_FOR_TESTING,
  useGotoRecoilSnapshot,
  useRecoilCallback,
  useRecoilInterface: useRecoilInterface_DEPRECATED,
  useRecoilSnapshot,
  useRecoilState,
  useRecoilStateLoadable,
  useRecoilTransactionObserver,
  useRecoilValue,
  useRecoilValueLoadable,
  useResetRecoilState,
  useSetRecoilState,
  useSetUnvalidatedAtomValues,
  useTransactionObservation_DEPRECATED,
  useTransactionSubscription_DEPRECATED: useTransactionSubscription
};

const {
  useMemo: useMemo$2
} = react;

const {
  RecoilRoot: RecoilRoot$1,
  useStoreRef: useStoreRef$2
} = Recoil_RecoilRoot_react;

function useRecoilBridgeAcrossReactRoots() {
  const store = useStoreRef$2().current;
  return useMemo$2(() => {
    function RecoilBridge({
      children
    }) {
      return /*#__PURE__*/react.createElement(RecoilRoot$1, {
        store_INTERNAL: store
      }, children);
    }

    return RecoilBridge;
  }, [store]);
}

var Recoil_useRecoilBridgeAcrossReactRoots = useRecoilBridgeAcrossReactRoots;

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
  /**
   * if loadable has a value (state === 'hasValue'), return that value.
   * Otherwise, throw the (unwrapped) promise or the error.
   */
  getValue() {
    if (this.state === 'loading' && Recoil_gkx_1('recoil_async_selector_refactor')) {
      throw this.contents.then(({
        __value
      }) => __value);
    }

    if (this.state !== 'hasValue') {
      throw this.contents;
    }

    return this.contents;
  },

  toPromise() {
    return this.state === 'hasValue' ? Promise.resolve(this.contents) : this.state === 'hasError' ? Promise.reject(this.contents) : Recoil_gkx_1('recoil_async_selector_refactor') ? this.contents.then(({
      __value
    }) => __value) : this.contents;
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
    return this.state === 'loading' ? Recoil_gkx_1('recoil_async_selector_refactor') ? this.contents.then(({
      __value
    }) => __value) : this.contents : undefined;
  },

  promiseOrThrow() {
    if (this.state !== 'loading') {
      throw new Error(`Loadable expected promise, but in "${this.state}" state`);
    }

    return Recoil_gkx_1('recoil_async_selector_refactor') ? this.contents.then(({
      __value
    }) => __value) : this.contents;
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

        return Recoil_isPromise(next) ? loadableWithPromise(next) : loadableWithValue(next);
      } catch (e) {
        return Recoil_isPromise(e) ? // If we "suspended", then try again.
        // errors and subsequent retries will be handled in 'loading' case
        loadableWithPromise(e.next(() => map(this.contents))) : loadableWithError(e);
      }
    }

    if (this.state === 'loading') {
      return loadableWithPromise(this.contents // TODO if map returns a loadable, then return the value or promise or throw the error
      .then(map).catch(e => {
        if (Recoil_isPromise(e)) {
          // we were "suspended," try again
          return e.then(() => map(this.contents));
        }

        throw e;
      }));
    }

    throw new Error('Invalid Loadable state');
  }

};

function loadableWithValue(value) {
  // Build objects this way since Flow doesn't support disjoint unions for class properties
  return Object.freeze({
    state: 'hasValue',
    contents: value,
    ...loadableAccessors
  });
}

function loadableWithError(error) {
  return Object.freeze({
    state: 'hasError',
    contents: error,
    ...loadableAccessors
  });
}

function loadableWithPromise(promise) {
  return Object.freeze({
    state: 'loading',
    contents: promise,
    ...loadableAccessors
  });
}

function loadableLoading() {
  return loadableWithPromise(new Promise(() => {}));
}

function loadableAll(inputs) {
  return inputs.every(i => i.state === 'hasValue') ? loadableWithValue(inputs.map(i => i.contents)) : inputs.some(i => i.state === 'hasError') ? loadableWithError( // $FlowIssue[incompatible-call] #44070740 Array.find should refine parameter
  Recoil_nullthrows(inputs.find(i => i.state === 'hasError'), 'Invalid loadable passed to loadableAll').contents) : loadableWithPromise(Recoil_gkx_1('recoil_async_selector_refactor') ? Promise.all(inputs.map(i => i.contents)).then(value => ({
    __value: value
  })) : Promise.all(inputs.map(i => i.contents)));
}

var Recoil_Loadable = {
  loadableWithValue,
  loadableWithError,
  loadableWithPromise,
  loadableLoading,
  loadableAll
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

const ARRAY_BUFFER_VIEW_TYPES = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, DataView];

function isArrayBufferView(value) {
  for (const type of ARRAY_BUFFER_VIEW_TYPES) {
    if (value instanceof type) {
      return true;
    }
  }

  return false;
}

var Recoil_isArrayBufferView = isArrayBufferView;

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

  const doc = object != null ? (_ownerDocument = object.ownerDocument) !== null && _ownerDocument !== void 0 ? _ownerDocument : object : document;
  const defaultView = (_doc$defaultView = doc.defaultView) !== null && _doc$defaultView !== void 0 ? _doc$defaultView : window;
  return !!(object != null && (typeof defaultView.Node === 'function' ? object instanceof defaultView.Node : typeof object === 'object' && typeof object.nodeType === 'number' && typeof object.nodeName === 'string'));
}

var Recoil_isNode = isNode;

const isSSR = typeof window === 'undefined';
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative'; // eslint-disable-line fb-www/typeof-undefined

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


  if (value['@@__IMMUTABLE_ITERABLE__@@'] != null || value['@@__IMMUTABLE_KEYED__@@'] != null || value['@@__IMMUTABLE_INDEXED__@@'] != null || value['@@__IMMUTABLE_ORDERED__@@'] != null || value['@@__IMMUTABLE_RECORD__@@'] != null) {
    return true;
  } // DOM nodes:


  if (Recoil_isNode(value)) {
    return true;
  }

  if (Recoil_isPromise(value)) {
    return true;
  }

  if (Recoil_isArrayBufferView(value)) {
    return true;
  } // Some environments, just as Jest, don't work with the instanceof check


  if (!isSSR && !isReactNative && ( // $FlowFixMe Window does not have a FlowType definition https://github.com/facebook/flow/issues/6709
  value === window || value instanceof Window)) {
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
 * @emails oncall+recoil
 * 
 * @format
 */

// cache implementation that only stores the most recent entry
// based on key reference equality
function cacheMostRecent() {
  let mostRecentKey;
  let mostRecentValue;
  const cache = {
    get: key => key === mostRecentKey ? mostRecentValue : undefined,
    set: (key, value) => {
      mostRecentKey = key;
      mostRecentValue = value;
      return cache;
    }
  };
  return cache;
}

var Recoil_cacheMostRecent = cacheMostRecent;

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
  constructor(existing) {
    _defineProperty(this, "_base", new Map());

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
    const ks = Array.isArray(key) ? key : [key];
    let map = this._base;
    ks.forEach(k => {
      var _map$get;

      map = (_map$get = map.get(k)) !== null && _map$get !== void 0 ? _map$get : emptyMap;
    });
    return map === undefined ? undefined : map.get(LEAF);
  }

  set(key, value) {
    const ks = Array.isArray(key) ? key : [key];
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
    const ks = Array.isArray(key) ? key : [key];
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
    }

    recurse(this._base, []);
    return answer.values();
  }

  toBuiltInMap() {
    return new Map(this.entries());
  }

}

var Recoil_ArrayKeyedMap = {
  ArrayKeyedMap
};

var Recoil_ArrayKeyedMap_1 = Recoil_ArrayKeyedMap.ArrayKeyedMap;

var Recoil_ArrayKeyedMap$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ArrayKeyedMap: Recoil_ArrayKeyedMap_1
});

const {
  ArrayKeyedMap: ArrayKeyedMap$1
} = Recoil_ArrayKeyedMap$1;

function cacheWithReferenceEquality() {
  return new ArrayKeyedMap$1();
}

var Recoil_cacheWithReferenceEquality = cacheWithReferenceEquality;

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
      if ((opt === null || opt === void 0 ? void 0 : opt.allowFunctions) !== true) {
        throw new Error('Attempt to serialize function in a Recoil cache key');
      }

      return `__FUNCTION(${x.name})__`;
  }

  if (x === null) {
    return 'null';
  } // Fallback case for unknown types


  if (typeof x !== 'object') {
    var _JSON$stringify;

    return (_JSON$stringify = JSON.stringify(x)) !== null && _JSON$stringify !== void 0 ? _JSON$stringify : '';
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
    const obj = {};

    for (const [k, v] of x) {
      // Stringify will escape any nested quotes
      obj[typeof k === 'string' ? k : stringify(k, opt)] = v;
    }

    return stringify(obj, opt, key);
  } // For built-in Sets, sort the keys in a stable order instead of the
  // default insertion order.


  if (x instanceof Set) {
    return stringify(Array.from(x).sort((a, b) => stringify(a, opt).localeCompare(stringify(b, opt))), opt, key);
  } // Anything else that is iterable serialize as an Array.


  if (x[Symbol.iterator] != null && typeof x[Symbol.iterator] === 'function') {
    // flowlint-next-line unclear-type: off
    return stringify(Array.from(x), opt, key);
  } // For all other Objects, sort the keys in a stable order.


  return `{${Object.keys(x).filter(key => x[key] !== undefined).sort() // stringify the key to add quotes and escape any nested slashes or quotes.
  .map(key => `${stringify(key, opt)}:${stringify(x[key], opt, key)}`).join(',')}}`;
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


function stableStringify(x, opt = {
  allowFunctions: false
}) {
  if (process.env.NODE_ENV !== "production") {
    if (typeof window !== 'undefined') {
      const startTime = window.performance ? window.performance.now() : 0;
      const str = stringify(x, opt);
      const endTime = window.performance ? window.performance.now() : 0;

      if (endTime - startTime > TIME_WARNING_THRESHOLD_MS) {
        /* eslint-disable fb-www/no-console */
        console.groupCollapsed(`Recoil: Spent ${endTime - startTime}ms computing a cache key`);
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
    map // For debugging

  };
  return cache;
}

var Recoil_cacheWithValueEquality = cacheWithValueEquality;

/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * 
 * @format
 */

function nodeCacheMostRecent() {
  let mostRecent;
  return {
    get: (getNodeValue, handlers) => {
      if (mostRecent === undefined) {
        return undefined;
      }

      for (const [nodeKey, nodeValue] of mostRecent.route) {
        var _handlers$onCacheHit;

        if (getNodeValue(nodeKey) !== nodeValue) {
          return undefined;
        }

        handlers === null || handlers === void 0 ? void 0 : (_handlers$onCacheHit = handlers.onCacheHit) === null || _handlers$onCacheHit === void 0 ? void 0 : _handlers$onCacheHit.call(handlers, nodeKey);
      }

      return mostRecent.value;
    },
    set: (route, value) => {
      mostRecent = {
        route,
        value
      };
    },
    getRoot: () => mostRecent
  };
}

var Recoil_nodeCacheMostRecent = nodeCacheMostRecent;

function setInTreeCache(root, route, result) {
  if (root == null) {
    if (route.length === 0) {
      return {
        type: 'result',
        result
      };
    } else {
      const [path, ...rest] = route;
      const [nodeKey, value] = path;
      const ret = {
        type: 'branch',
        nodeKey,
        branches: new Map([[value, setInTreeCache(null, rest, result)]])
      };
      return ret;
    }
  } else {
    if (route.length === 0) {
      !(root.type === 'result') ? process.env.NODE_ENV !== "production" ? Recoil_invariant(false, 'Existing cache must have a result type node at the end of the route') : Recoil_invariant(false) : void 0;

      if (root.result && root.result.state === 'loading') {
        const ret = {
          type: 'result',
          result
        };
        return ret;
      } else {
        !(root.result === result) ? process.env.NODE_ENV !== "production" ? Recoil_invariant(false, 'Existing cache must have the same result at the end of the route') : Recoil_invariant(false) : void 0;
        const ret = root;
        return ret;
      }
    } else {
      const [path, ...rest] = route;
      const [nodeKey, value] = path;
      !(root.type === 'branch') ? process.env.NODE_ENV !== "production" ? Recoil_invariant(false, 'Existing cache must have a branch midway through the route') : Recoil_invariant(false) : void 0;
      !(root.nodeKey === nodeKey) ? process.env.NODE_ENV !== "production" ? Recoil_invariant(false, 'Existing cache must have a branch for the same nodeKey midway through the route') : Recoil_invariant(false) : void 0;
      root.branches.set(value, setInTreeCache(root.branches.get(value), rest, result));
      return root;
    }
  }
}

function getFromTreeCache(root, getNodeValue, handlers) {
  var _handlers$onCacheHit;

  if (root == null) {
    return undefined;
  }

  if (root.type === 'result') {
    return root.result;
  }

  handlers === null || handlers === void 0 ? void 0 : (_handlers$onCacheHit = handlers.onCacheHit) === null || _handlers$onCacheHit === void 0 ? void 0 : _handlers$onCacheHit.call(handlers, root.nodeKey);
  const nodeValue = getNodeValue(root.nodeKey);
  return getFromTreeCache(root.branches.get(nodeValue), getNodeValue, handlers);
}

var Recoil_TreeNodeCache = {
  setInTreeCache,
  getFromTreeCache
};

const {
  getFromTreeCache: getFromTreeCache$1,
  setInTreeCache: setInTreeCache$1
} = Recoil_TreeNodeCache;

function treeCacheReferenceEquality() {
  let treeRoot;
  return {
    get: (getNodeValue, handlers) => getFromTreeCache$1(treeRoot, getNodeValue, handlers),
    set: (route, result) => {
      treeRoot = setInTreeCache$1(treeRoot, route, result);
    },
    getRoot: () => treeRoot
  };
}

var Recoil_treeCacheReferenceEquality = treeCacheReferenceEquality;

const {
  getFromTreeCache: getFromTreeCache$2,
  setInTreeCache: setInTreeCache$2
} = Recoil_TreeNodeCache;

function treeCacheValueEquality() {
  let treeRoot;
  return {
    get: (getNodeValue, handlers) => getFromTreeCache$2(treeRoot, nodeKey => Recoil_stableStringify(getNodeValue(nodeKey)), handlers),
    set: (route, result) => {
      treeRoot = setInTreeCache$2(treeRoot, route.map(([nodeKey, nodeValue]) => [nodeKey, Recoil_stableStringify(nodeValue)]), result);
    },
    getRoot: () => treeRoot
  };
}

var Recoil_treeCacheValueEquality = treeCacheValueEquality;

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
  startPerfBlock
};

const {
  loadableWithError: loadableWithError$1,
  loadableWithPromise: loadableWithPromise$1,
  loadableWithValue: loadableWithValue$1
} = Recoil_Loadable;













const {
  getNodeLoadable: getNodeLoadable$2,
  peekNodeLoadable: peekNodeLoadable$2,
  setNodeValue: setNodeValue$3
} = Recoil_FunctionalCore;

const {
  saveDependencyMapToStore: saveDependencyMapToStore$3
} = Recoil_Graph;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$3,
  RecoilValueNotReady: RecoilValueNotReady$2,
  registerNode: registerNode$1
} = Recoil_Node;

const {
  isRecoilValue: isRecoilValue$3
} = Recoil_RecoilValue$1;

const {
  AbstractRecoilValue: AbstractRecoilValue$3
} = Recoil_RecoilValue$1;

const {
  setRecoilValueLoadable: setRecoilValueLoadable$2
} = Recoil_RecoilValueInterface;







const {
  startPerfBlock: startPerfBlock$1
} = Recoil_PerformanceTimings;

// flowlint-next-line unclear-type:off
const emptySet$1 = Object.freeze(new Set());
const dependencyStack = []; // for detecting circular dependencies.

const waitingStores = new Map();
/* eslint-disable no-redeclare */

const getNewExecutionId = (() => {
  let executionId = 0;
  return () => executionId++;
})();

function getInitialExecutionInfo() {
  return {
    depValuesDiscoveredSoFarDuringAsyncWork: null,
    latestLoadable: null,
    latestExecutionId: null,
    stateVersion: null
  };
}

function selector(options) {
  const {
    key,
    get,
    cacheImplementation_UNSTABLE: cacheImplementation
  } = options;
  const set = options.set != null ? options.set : undefined; // flow

  /**
   * HACK: doing this as a way to map given cache to corresponding tree cache
   */

  const cache = cacheImplementation === Recoil_cacheWithReferenceEquality ? Recoil_treeCacheReferenceEquality() : cacheImplementation === Recoil_cacheWithValueEquality ? Recoil_treeCacheValueEquality() : cacheImplementation === Recoil_cacheMostRecent ? Recoil_nodeCacheMostRecent() : Recoil_treeCacheReferenceEquality();
  const executionInfo = getInitialExecutionInfo();

  function initSelector(store) {
    store.getState().knownSelectors.add(key);
  }

  function notifyStoreWhenAsyncSettles(store, loadable, executionId) {
    if (loadable.state === 'loading') {
      let stores = waitingStores.get(executionId);

      if (stores == null) {
        waitingStores.set(executionId, stores = new Set());
      }

      stores.add(store);
    }
  }
  /**
   * FIXME: we should keep track of latest execution id _per store_ and update
   * the stores accordingly.
   */


  function notifyStoresOfSettledAsync(newLoadable, executionId) {
    const stores = waitingStores.get(executionId);

    if (stores !== undefined) {
      for (const store of stores) {
        setRecoilValueLoadable$2(store, new AbstractRecoilValue$3(key), newLoadable);
      }

      waitingStores.delete(executionId);
    }
  }

  function getCachedNodeLoadable(store, state, key) {
    if (state.atomValues.has(key)) {
      return [new Map(), Recoil_nullthrows(state.atomValues.get(key))];
    }

    const [, loadable] = getNodeLoadable$2(store, state, key);
    const isKeyPointingToSelector = store.getState().knownSelectors.has(key);

    if (loadable.state !== 'loading' && isKeyPointingToSelector) {
      state.atomValues.set(key, loadable);
    }

    return [new Map(), loadable];
  }
  /**
   * This function attaches a then() and a catch() to a promise that was
   * returned from a selector's get() (either explicitly or implicitly by
   * running a function that uses the "async" keyword). If a selector's get()
   * returns a promise, we have two possibilities:
   *
   * 1. The promise will resolve, in which case it will have completely finished
   *    executing without any remaining pending dependencies. No more retries
   *    are needed and we can proceed with updating the cache and notifying
   *    subscribers (if it is the latest execution, otherwise only the cache
   *    will be updated and subscriptions will not be fired). This is the case
   *    handled by the attached then() handler.
   *
   * 2. The promise will throw because it either has an error or it came across
   *    an async dependency that has not yet resolved, in which case we will
   *    call wrapDepdencyPromise(), whose responsibility is to handle dependency
   *    promises. This case is handled by the attached catch() handler.
   *
   * Both branches will eventually resolve to the final result of the selector
   * (or an error if a real error occurred).
   *
   * The execution will run to completion even if it is stale, and its value
   * will be cached. But stale executions will not update global state or update
   * executionInfo as that is the responsibility of the 'latest' execution.
   *
   * Note this function should not be passed a promise that was thrown--AKA a
   * dependency promise. Dependency promises should be passed to
   * wrapPendingDependencyPromise()).
   */


  function wrapPendingPromise(store, promise, state, depValues, executionId) {
    return promise.then(value => {
      const loadable = loadableWithValue$1(value);
      maybeFreezeValue(value);
      setCache(state, depValuesToDepRoute(depValues), loadable);
      setLoadableInStoreToNotifyDeps(loadable, executionId);
      return {
        __value: value,
        __key: key
      };
    }).catch(errorOrPromise => {
      if (isLatestExecution(executionId)) {
        updateExecutionInfoDepValues(depValues, executionId);
      }

      if (Recoil_isPromise(errorOrPromise)) {
        return wrapPendingDependencyPromise(store, errorOrPromise, state, depValues, executionId);
      }

      const loadable = loadableWithError$1(errorOrPromise);
      maybeFreezeValue(errorOrPromise);
      setCache(state, depValuesToDepRoute(depValues), loadable);
      setLoadableInStoreToNotifyDeps(loadable, executionId);
      throw errorOrPromise;
    });
  }
  /**
   * This function attaches a then() and a catch() to a promise that was
   * thrown from a selector's get(). If a selector's get() throws a promise,
   * we have two possibilities:
   *
   * 1. The promise will resolve, meaning one of our selector's dependencies is
   *    now available and we should "retry" our get() by running it again. This
   *    is the case handled by the attached then() handler.
   *
   * 2. The promise will throw because something went wrong with the dependency
   *    promise (in other words a real error occurred). This case is handled by
   *    the attached catch() handler. If the dependency promise throws, it is
   *    _always_ a real error and not another dependency promise (any dependency
   *    promises would have been handled upstream).
   *
   * The then() branch will eventually resolve to the final result of the
   * selector (or an error if a real error occurs), and the catch() will always
   * resolve to an error because the dependency promise is a promise that was
   * wrapped upstream, meaning it will only resolve to its real value or to a
   * real error.
   *
   * The execution will run to completion even if it is stale, and its value
   * will be cached. But stale executions will not update global state or update
   * executionInfo as that is the responsibility of the 'latest' execution.
   *
   * Note this function should not be passed a promise that was returned from
   * get(). The intention is that this function is only passed promises that
   * were thrown due to a pending dependency. Promises returned by get() should
   * be passed to wrapPendingPromise() instead.
   */


  function wrapPendingDependencyPromise(store, promise, state, existingDeps, executionId) {
    return promise.then(resolvedDep => {
      const {
        __key: resolvedDepKey,
        __value: depValue
      } = resolvedDep;

      if (resolvedDepKey != null) {
        /**
         * Note for async atoms, this means we are changing the atom's value
         * in the store for the given version. This should be alright because
         * the version of state is now stale and a new version will have
         * already been triggered by the atom being resolved (see this logic
         * in Recoil_atom.js)
         */
        state.atomValues.set(resolvedDepKey, loadableWithValue$1(depValue));
      }

      const [loadable, depValues] = evaluateSelectorGetter(store, state, executionId);

      if (isLatestExecution(executionId)) {
        updateExecutionInfoDepValues(depValues, executionId);
      }

      maybeFreezeLoadableContents(loadable);

      if (loadable.state !== 'loading') {
        setCache(state, depValuesToDepRoute(depValues), loadable);
        setLoadableInStoreToNotifyDeps(loadable, executionId);
      }

      if (loadable.state === 'hasError') {
        throw loadable.contents;
      }

      if (loadable.state === 'hasValue') {
        return {
          __value: loadable.contents,
          __key: key
        };
      }
      /**
       * Returning promise here without wrapping as the wrapepr logic was
       * already done when we called evaluateSelectorGetter() to get this
       * loadable
       */


      return loadable.contents;
    }).catch(error => {
      const loadable = loadableWithError$1(error);
      maybeFreezeValue(error);
      setCache(state, depValuesToDepRoute(existingDeps), loadableWithError$1(error));
      setLoadableInStoreToNotifyDeps(loadable, executionId);
      throw error;
    });
  }

  function setLoadableInStoreToNotifyDeps(loadable, executionId) {
    if (isLatestExecution(executionId)) {
      setExecutionInfo(loadable);
      notifyStoresOfSettledAsync(loadable, executionId);
    }
  }

  function setDepsInStore(store, state, deps, executionId) {
    var _store$getState, _store$getState$curre, _store$getState2, _store$getState2$next;

    if (isLatestExecution(executionId) || state.version === ((_store$getState = store.getState()) === null || _store$getState === void 0 ? void 0 : (_store$getState$curre = _store$getState.currentTree) === null || _store$getState$curre === void 0 ? void 0 : _store$getState$curre.version) || state.version === ((_store$getState2 = store.getState()) === null || _store$getState2 === void 0 ? void 0 : (_store$getState2$next = _store$getState2.nextTree) === null || _store$getState2$next === void 0 ? void 0 : _store$getState2$next.version)) {
      var _store$getState$nextT, _store$getState3, _store$getState3$next;

      saveDependencyMapToStore$3(new Map([[key, deps]]), store, (_store$getState$nextT = (_store$getState3 = store.getState()) === null || _store$getState3 === void 0 ? void 0 : (_store$getState3$next = _store$getState3.nextTree) === null || _store$getState3$next === void 0 ? void 0 : _store$getState3$next.version) !== null && _store$getState$nextT !== void 0 ? _store$getState$nextT : store.getState().currentTree.version);
    }
  }

  function setNewDepInStore(store, state, deps, newDepKey, executionId) {
    deps.add(newDepKey);
    setDepsInStore(store, state, deps, executionId);
  }

  function evaluateSelectorGetter(store, state, executionId) {
    const endPerfBlock = startPerfBlock$1(key); // TODO T63965866: use execution ID here

    let result;
    let loadable;
    const depValues = new Map();
    /**
     * Starting a fresh set of deps that we'll be using to update state. We're
     * starting a new set versus adding it in existing state deps because
     * the version of state that we update deps for may be a more recent version
     * than the version the selector was called with. This is because the latest
     * execution will update the deps of the current/latest version of state (
     * this is safe to do because the fact that the selector is the latest
     * execution means the deps we discover below are our best guess at the
     * deps for the current/latest state in the store)
     */

    const deps = new Set();
    setDepsInStore(store, state, deps, executionId);

    function getRecoilValue(recoilValue) {
      const {
        key: depKey
      } = recoilValue;
      setNewDepInStore(store, state, deps, depKey, executionId);
      const [, depLoadable] = getCachedNodeLoadable(store, state, depKey);
      depValues.set(depKey, depLoadable);

      if (depLoadable.state === 'hasValue') {
        return depLoadable.contents;
      }

      throw depLoadable.contents;
    }

    try {
      result = get({
        get: getRecoilValue
      });
      result = isRecoilValue$3(result) ? getRecoilValue(result) : result;

      if (Recoil_isPromise(result)) {
        result = wrapPendingPromise(store, result, state, depValues, executionId).finally(endPerfBlock);
      } else {
        endPerfBlock();
      }
    } catch (errorOrDepPromise) {
      result = errorOrDepPromise;

      if (Recoil_isPromise(result)) {
        result = wrapPendingDependencyPromise(store, result, state, depValues, executionId).finally(endPerfBlock);
      } else {
        endPerfBlock();
      }
    }

    if (result instanceof Error) {
      loadable = loadableWithError$1(result);
    } else if (Recoil_isPromise(result)) {
      loadable = loadableWithPromise$1(result);
    } else {
      loadable = loadableWithValue$1(result);
    }

    maybeFreezeLoadableContents(loadable);
    return [loadable, depValues];
  }

  function getValFromCacheAndUpdatedDownstreamDeps(store, state) {
    var _store$getGraph$nodeD;

    if (state.atomValues.has(key)) {
      return state.atomValues.get(key);
    }

    const deps = new Set((_store$getGraph$nodeD = store.getGraph(state.version).nodeDeps.get(key)) !== null && _store$getGraph$nodeD !== void 0 ? _store$getGraph$nodeD : emptySet$1);
    setDepsInStore(store, state, deps, executionInfo.latestExecutionId);
    const cachedVal = cache.get(nodeKey => {
      const [, loadable] = getCachedNodeLoadable(store, state, nodeKey);
      return loadable.contents;
    }, {
      onCacheHit: nodeKey => {
        if (nodeKey !== key) {
          setNewDepInStore(store, state, deps, nodeKey, executionInfo.latestExecutionId);
        }
      }
    });
    return cachedVal;
  }
  /**
   * FIXME: dep keys should take into account the state of the loadable to
   * prevent the edge case where a loadable with an error and a loadable with
   * an error as a value are treated as the same thing incorrectly. For example
   * these two should be treated differently:
   *
   * selector({key: '', get: () => new Error('hi')});
   * selector({key: '', get () => {throw new Error('hi')}});
   *
   * With current implementation they are treated the same
   */


  function depValuesToDepRoute(depValues) {
    return Array.from(depValues.entries()).map(([key, valLoadable]) => [key, valLoadable.contents]);
  }

  function getValFromRunningNewExecutionAndUpdatedDeps(store, state) {
    const newExecutionId = getNewExecutionId();
    const [loadable, newDepValues] = evaluateSelectorGetter(store, state, newExecutionId);
    setExecutionInfo(loadable, newDepValues, newExecutionId, state);
    maybeSetCacheWithLoadable(state, depValuesToDepRoute(newDepValues), loadable);
    notifyStoreWhenAsyncSettles(store, loadable, newExecutionId);
    return loadable;
  }
  /**
   * Given a tree state, this function returns the "selector result", which is
   * defined as a size-2 tuple of [DependencyMap, Loadable<T>].
   *
   * The selector's get() function will only be re-evaluated if _both_ of the
   * following statements are true:
   *
   * 1. The current dep values from the given state produced a cache key that
   *    was not found in the cache.
   * 2. There is no currently running async execution OR there is an
   *    async execution that is running, but after comparing the dep values in
   *    the given state with the dep values that the execution has discovered so
   *    far we find that at least one dep value has changed, in which case we
   *    start a new execution (the previously running execution will continue to
   *    run to completion, but only the new execution will be deemed the
   *    'latest' execution, meaning it will be the only execution that will
   *    update global state when it is finished. Any non-latest executions will
   *    run to completion and update the selector cache but not global state).
   */


  function getSelectorValAndUpdatedDeps(store, state) {
    const cachedVal = getValFromCacheAndUpdatedDownstreamDeps(store, state);

    if (cachedVal != null) {
      setExecutionInfo(cachedVal);
      return cachedVal;
    } // FIXME: this won't work with custom caching b/c it uses separate cache


    if (asyncWorkIsInProgressAndDepsDiscoveredHaveNotChanged(store, state)) {
      notifyStoreWhenAsyncSettles(store, Recoil_nullthrows(executionInfo.latestLoadable), Recoil_nullthrows(executionInfo.latestExecutionId)); // FIXME: check after the fact to see if we made the right choice by waiting

      return Recoil_nullthrows(executionInfo.latestLoadable);
    }

    return getValFromRunningNewExecutionAndUpdatedDeps(store, state);
  }

  function asyncWorkIsInProgressAndDepsDiscoveredHaveNotChanged(store, state) {
    return executionInfo.latestLoadable != null && executionInfo.latestExecutionId != null && !haveAsyncDepsChanged(store, state);
  }

  const mapOfCheckedVersions = new Map();

  function haveAsyncDepsChanged(store, state) {
    var _executionInfo$depVal, _mapOfCheckedVersions;

    const oldDepValues = (_executionInfo$depVal = executionInfo.depValuesDiscoveredSoFarDuringAsyncWork) !== null && _executionInfo$depVal !== void 0 ? _executionInfo$depVal : new Map();
    const cachedDepValuesCheckedForThisVersion = Array(((_mapOfCheckedVersions = mapOfCheckedVersions.get(state.version)) !== null && _mapOfCheckedVersions !== void 0 ? _mapOfCheckedVersions : new Map()).entries());
    const isCachedVersionSame = mapOfCheckedVersions.has(state.version) && cachedDepValuesCheckedForThisVersion.length === oldDepValues.size && cachedDepValuesCheckedForThisVersion.every(([nodeKey, nodeVal]) => {
      return oldDepValues.get(nodeKey) === nodeVal;
    });

    if (oldDepValues == null || state.version === executionInfo.stateVersion || isCachedVersionSame) {
      return false;
    }

    mapOfCheckedVersions.set(state.version, new Map(oldDepValues));
    return Array.from(oldDepValues).some(([nodeKey, oldVal]) => {
      const [, loadable] = getCachedNodeLoadable(store, state, nodeKey);
      return loadable.contents !== oldVal.contents &&
      /**
       * FIXME: in the condition below we're making the assumption that a
       * dependency that goes from loading to having a value is always because
       * the dependency resolved to that value, so we don't count it as a dep
       * change as the normal retry loop will handle retrying in response to a
       * resolved async dep. This is an incorrect assumption for the edge case
       * where there is an async selector that is loading, and while it is
       * loading one of its dependencies changes, triggering a new execution,
       * and that new execution produces a value synchronously (we don't make
       * that assumption for asynchronous work b/c it's guaranteed that a
       * loadable that goes from 'loading' to 'loading' in a new loadable is
       * a dep change).
       */
      !(oldVal.state === 'loading' && loadable.state !== 'loading');
    });
  }
  /**
   * This function will update the selector's execution info when the selector
   * has either finished running an execution or has started a new execution. If
   * the given loadable is in a 'loading' state, the intention is that a new
   * execution has started. Otherwise, the intention is that an execution has
   * just finished.
   */


  function setExecutionInfo(loadable, depValues, newExecutionId, state) {
    if (loadable.state === 'loading') {
      executionInfo.depValuesDiscoveredSoFarDuringAsyncWork = depValues;
      executionInfo.latestExecutionId = newExecutionId;
      executionInfo.latestLoadable = loadable;
      executionInfo.stateVersion = state === null || state === void 0 ? void 0 : state.version;
    } else {
      executionInfo.depValuesDiscoveredSoFarDuringAsyncWork = null;
      executionInfo.latestExecutionId = null;
      executionInfo.latestLoadable = null;
      executionInfo.stateVersion = null;
    }
  }
  /**
   * Conditionally updates the cache with a given loadable.
   *
   * We only cache loadables that are not loading because our cache keys are
   * based on dep values, which are in an unfinished state for loadables that
   * have a 'loading' state (new deps may be discovered while the selector
   * runs its async code). We never want to cache partial dependencies b/c it
   * could lead to errors, such as prematurely returning the result based on a
   * partial list of deps-- we need the full list of deps to ensure that we
   * are returning the correct result from cache.
   */


  function maybeSetCacheWithLoadable(state, depRoute, loadable) {
    if (loadable.state !== 'loading') {
      setCache(state, depRoute, loadable);
    }
  }

  function updateExecutionInfoDepValues(depValues, executionId) {
    if (isLatestExecution(executionId)) {
      executionInfo.depValuesDiscoveredSoFarDuringAsyncWork = depValues;
    }
  }

  function isLatestExecution(executionId) {
    return executionId === executionInfo.latestExecutionId;
  }

  function maybeFreezeLoadableContents(loadable) {
    if (loadable.state !== 'loading') {
      maybeFreezeValue(loadable.contents);
    }
  }

  function maybeFreezeValue(val) {
    if (process.env.NODE_ENV !== "production") {
      if (Boolean(options.dangerouslyAllowMutability) === false) {
        Recoil_deepFreezeValue(val);
      }
    }
  }

  function setCache(state, cacheRoute, loadable) {
    state.atomValues.set(key, loadable);
    cache.set(cacheRoute, loadable);
  }

  function detectCircularDependencies(fn) {
    if (dependencyStack.includes(key)) {
      const message = `Recoil selector has circular dependencies: ${dependencyStack.slice(dependencyStack.indexOf(key)).join(' \u2192 ')}`;
      return loadableWithError$1(new Error(message));
    }

    dependencyStack.push(key);

    try {
      return fn();
    } finally {
      dependencyStack.pop();
    }
  }

  function myPeek(store, state) {
    const cacheVal = cache.get(nodeKey => {
      const peek = peekNodeLoadable$2(store, state, nodeKey);
      return peek === null || peek === void 0 ? void 0 : peek.contents;
    });
    return cacheVal;
  }

  function myGet(store, state) {
    initSelector(store);
    return [new Map(), detectCircularDependencies(() => getSelectorValAndUpdatedDeps(store, state))];
  }

  function invalidate(state) {
    state.atomValues.delete(key);
  }

  if (set != null) {
    function mySet(store, state, newValue) {
      initSelector(store);
      const dependencyMap = new Map();
      const writes = new Map();

      function getRecoilValue({
        key
      }) {
        const [, loadable] = getCachedNodeLoadable(store, state, key);

        if (loadable.state === 'hasValue') {
          return loadable.contents;
        } else if (loadable.state === 'loading') {
          throw new RecoilValueNotReady$2(key);
        } else {
          throw loadable.contents;
        }
      }

      function setRecoilState(recoilState, valueOrUpdater) {
        const newValue = typeof valueOrUpdater === 'function' ? // cast to any because we can't restrict type S from being a function itself without losing support for opaque types
        // flowlint-next-line unclear-type:off
        valueOrUpdater(getRecoilValue(recoilState)) : valueOrUpdater;
        const [, upstreamWrites] = setNodeValue$3(store, state, recoilState.key, newValue);
        upstreamWrites.forEach((v, k) => writes.set(k, v));
      }

      function resetRecoilState(recoilState) {
        setRecoilState(recoilState, DEFAULT_VALUE$3);
      }

      set({
        set: setRecoilState,
        get: getRecoilValue,
        reset: resetRecoilState
      }, newValue);
      return [dependencyMap, writes];
    }

    return registerNode$1({
      key,
      peek: myPeek,
      get: myGet,
      set: mySet,
      cleanUp: () => {},
      invalidate,
      dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      shouldRestoreFromSnapshots: false
    });
  } else {
    return registerNode$1({
      key,
      peek: myPeek,
      get: myGet,
      cleanUp: () => {},
      invalidate,
      dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      shouldRestoreFromSnapshots: false
    });
  }
}
/* eslint-enable no-redeclare */


var Recoil_selector_NEW = selector;

const {
  loadableWithError: loadableWithError$2,
  loadableWithPromise: loadableWithPromise$2,
  loadableWithValue: loadableWithValue$2
} = Recoil_Loadable;



const {
  getNodeLoadable: getNodeLoadable$3,
  peekNodeLoadable: peekNodeLoadable$3,
  setNodeValue: setNodeValue$4
} = Recoil_FunctionalCore;

const {
  addToDependencyMap: addToDependencyMap$1,
  mergeDepsIntoDependencyMap: mergeDepsIntoDependencyMap$1,
  saveDependencyMapToStore: saveDependencyMapToStore$4
} = Recoil_Graph;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$4,
  RecoilValueNotReady: RecoilValueNotReady$3,
  registerNode: registerNode$2
} = Recoil_Node;

const {
  AbstractRecoilValue: AbstractRecoilValue$4
} = Recoil_RecoilValue$1;

const {
  getRecoilValueAsLoadable: getRecoilValueAsLoadable$3,
  isRecoilValue: isRecoilValue$4,
  setRecoilValueLoadable: setRecoilValueLoadable$3
} = Recoil_RecoilValueInterface;







const {
  startPerfBlock: startPerfBlock$2
} = Recoil_PerformanceTimings;

// flowlint-next-line unclear-type:off
const emptySet$2 = Object.freeze(new Set());

function cacheKeyFromDepValues(depValues) {
  const answer = [];

  for (const key of Array.from(depValues.keys()).sort()) {
    const loadable = Recoil_nullthrows(depValues.get(key));
    answer.push(key);
    answer.push(loadable.state);
    answer.push(loadable.contents);
  }

  return answer;
}

const dependencyStack$1 = []; // for detecting circular dependencies.

const waitingStores$1 = new Map();
/* eslint-disable no-redeclare */

function selector$1(options) {
  const {
    key,
    get,
    cacheImplementation_UNSTABLE: cacheImplementation
  } = options;
  const set = options.set != null ? options.set : undefined; // flow

  let cache = cacheImplementation !== null && cacheImplementation !== void 0 ? cacheImplementation : Recoil_cacheWithReferenceEquality();

  function initSelector(store) {
    store.getState().knownSelectors.add(key);
  }

  function letStoreBeNotifiedWhenAsyncSettles(store, loadable) {
    if (loadable.state === 'loading') {
      let stores = waitingStores$1.get(loadable);

      if (stores === undefined) {
        waitingStores$1.set(loadable, stores = new Set());
      }

      stores.add(store);
    }
  }

  function notifyStoresOfSettledAsync(originalLoadable, newLoadable) {
    const stores = waitingStores$1.get(originalLoadable);

    if (stores !== undefined) {
      for (const store of stores) {
        setRecoilValueLoadable$3(store, new AbstractRecoilValue$4(key), newLoadable);
      }

      waitingStores$1.delete(originalLoadable);
    }
  }

  function putIntoCache(state, cacheKey, loadable) {
    if (loadable.state !== 'loading') {
      // Synchronous result
      if (process.env.NODE_ENV !== "production") {
        if (!options.dangerouslyAllowMutability === true) {
          Recoil_deepFreezeValue(loadable.contents);
        }
      }
    } else {
      // Asynchronous result
      // When the promise resolves, we need to replace the loading state in the
      // cache and fire any external subscriptions to re-render with the new value.
      loadable.contents.then(result => {
        if (process.env.NODE_ENV !== "production") {
          if (!options.dangerouslyAllowMutability === true) {
            Recoil_deepFreezeValue(result);
          }
        }

        const newLoadable = loadableWithValue$2(result); // If the value is now resolved, then update the cache with the new value

        cache = cache.set(cacheKey, newLoadable); // TODO Potential optimization: I think this is updating the cache
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
        // Note that we have to set the value for this key, not just notify
        // components, so that there will be a new version for useMutableSource.

        notifyStoresOfSettledAsync(loadable, newLoadable);
        return result;
      }).catch(error => {
        // TODO Figure out why we are catching promises here versus evaluateSelectorFunction
        // OH, I see why.  Ok, work on this.
        if (Recoil_isPromise(error)) {
          return error;
        }

        if (process.env.NODE_ENV !== "production") {
          if (!options.dangerouslyAllowMutability === true) {
            Recoil_deepFreezeValue(error);
          }
        } // The async value was rejected with an error.  Update the cache with
        // the error and fire subscriptions to re-render.


        const newLoadable = loadableWithError$2(error);
        cache = cache.set(cacheKey, newLoadable);
        notifyStoresOfSettledAsync(loadable, newLoadable);
        return error;
      });
    }

    cache = cache.set(cacheKey, loadable);

    if (loadable.state !== 'loading') {
      state.atomValues.set(key, loadable);
    }
  }

  function getFromCacheOrEvaluate(store, state) {
    var _store$getGraph$nodeD;

    const dependencyMap = new Map(); // First, get the current deps for this selector

    const currentDeps = (_store$getGraph$nodeD = store.getGraph(state.version).nodeDeps.get(key)) !== null && _store$getGraph$nodeD !== void 0 ? _store$getGraph$nodeD : emptySet$2;
    const depValues = new Map(Array.from(currentDeps).sort().map(depKey => {
      const [deps, loadable] = getNodeLoadable$3(store, state, depKey);
      mergeDepsIntoDependencyMap$1(deps, dependencyMap);
      saveDependencyMapToStore$4(dependencyMap, store, state.version);
      return [depKey, loadable];
    })); // Always cache and evaluate a selector
    // It may provide a result even when not all deps are available.

    const cacheKey = cacheKeyFromDepValues(depValues);
    const cached = cache.get(cacheKey);

    if (cached != null) {
      letStoreBeNotifiedWhenAsyncSettles(store, cached);
      return [dependencyMap, cached];
    } // Cache miss, compute the value


    const [deps, loadable, newDepValues] = evaluateSelectorFunction(store, state);
    mergeDepsIntoDependencyMap$1(deps, dependencyMap);
    saveDependencyMapToStore$4(dependencyMap, store, state.version); // Save result in cache

    const newCacheKey = cacheKeyFromDepValues(newDepValues);
    letStoreBeNotifiedWhenAsyncSettles(store, loadable);
    putIntoCache(state, newCacheKey, loadable);
    return [dependencyMap, loadable];
  }

  function evaluateSelectorFunction(store, state) {
    const endPerfBlock = startPerfBlock$2(key);
    const depValues = new Map(); // key -> value for our deps

    const dependencyMap = new Map(); // node -> nodes, part of overall dep map.

    function getRecoilValue({
      key: depKey
    }) {
      addToDependencyMap$1(key, depKey, dependencyMap);
      const [deps, loadable] = getNodeLoadable$3(store, state, depKey);
      depValues.set(depKey, loadable);
      mergeDepsIntoDependencyMap$1(deps, dependencyMap);
      saveDependencyMapToStore$4(dependencyMap, store, state.version);

      if (loadable.state === 'hasValue') {
        return loadable.contents;
      } else {
        throw loadable.contents; // Promise or error
      }
    }

    try {
      // The big moment!
      const output = get({
        get: getRecoilValue
      }); // TODO Allow user to also return Loadables for improved composability

      const result = isRecoilValue$4(output) ? getRecoilValue(output) : output;
      let loadable;

      if (!Recoil_isPromise(result)) {
        // The selector returned a simple synchronous value, so let's use it!
        endPerfBlock();
        loadable = loadableWithValue$2(result);
      } else {
        // The user returned a promise for an asynchronous selector.  This will
        // resolve to the proper value of the selector when available.
        loadable = loadableWithPromise$2(result.finally(endPerfBlock));
      }

      return [dependencyMap, loadable, depValues];
    } catch (errorOrDepPromise) {
      // XXX why was this changed to not use isPromise?
      const isP = errorOrDepPromise.then !== undefined;
      let loadable;

      if (!isP) {
        // There was a synchronous error in the evaluation
        endPerfBlock();
        loadable = loadableWithError$2(errorOrDepPromise);
      } else {
        // If an asynchronous dependency was not ready, then return a promise that
        // will resolve when we finally do have a real value or error for the selector.
        loadable = loadableWithPromise$2(errorOrDepPromise.then(() => {
          // Now that its deps are ready, re-evaluate the selector (and
          // record any newly-discovered dependencies in the Store):
          const loadable = getRecoilValueAsLoadable$3(store, new AbstractRecoilValue$4(key));

          if (loadable.state === 'hasError') {
            throw loadable.contents;
          } // Either the re-try provided a value, which we will use, or it
          // got blocked again.  In that case this is a promise and we'll try again.


          return loadable.contents;
        }).finally(endPerfBlock));
      }

      return [dependencyMap, loadable, depValues];
    }
  }

  function detectCircularDependencies(fn) {
    if (dependencyStack$1.includes(key)) {
      const message = `Recoil selector has circular dependencies: ${dependencyStack$1.slice(dependencyStack$1.indexOf(key)).join(' \u2192 ')}`;
      return [new Map(), loadableWithError$2(new Error(message))];
    }

    dependencyStack$1.push(key);

    try {
      return fn();
    } finally {
      dependencyStack$1.pop();
    }
  }

  function myPeek(store, state) {
    var _store$getGraph$nodeD2;

    // First, get the current deps for this selector
    const currentDeps = (_store$getGraph$nodeD2 = store.getGraph(state.version).nodeDeps.get(key)) !== null && _store$getGraph$nodeD2 !== void 0 ? _store$getGraph$nodeD2 : emptySet$2;
    const depValues = new Map(Array.from(currentDeps).sort().map(depKey => [depKey, peekNodeLoadable$3(store, state, depKey)]));
    const cacheDepValues = new Map();

    for (const [depKey, depValue] of depValues.entries()) {
      if (depValue == null) {
        return undefined;
      }

      cacheDepValues.set(depKey, depValue);
    } // Always cache and evaluate a selector
    // It may provide a result even when not all deps are available.


    const cacheKey = cacheKeyFromDepValues(cacheDepValues);
    return cache.get(cacheKey);
  }

  function invalidate(state) {
    state.atomValues.delete(key);
  }

  function myGet(store, state) {
    initSelector(store); // First-level cache: Have we already evaluated the selector since being
    // invalidated due to a dependency changing?

    const cached = state.atomValues.get(key);

    if (cached !== undefined) {
      return [new Map(), cached];
    } // Second-level cache based on looking up current dependencies in a map
    // and evaluating selector if missing.


    if (process.env.NODE_ENV !== "production") {
      return detectCircularDependencies(() => getFromCacheOrEvaluate(store, state));
    } else {
      return getFromCacheOrEvaluate(store, state);
    }
  }

  if (set != null) {
    function mySet(store, state, newValue) {
      initSelector(store);
      const dependencyMap = new Map();
      const writes = new Map();

      function getRecoilValue({
        key
      }) {
        const [deps, loadable] = getNodeLoadable$3(store, state, key);
        mergeDepsIntoDependencyMap$1(deps, dependencyMap);

        if (loadable.state === 'hasValue') {
          return loadable.contents;
        } else if (loadable.state === 'loading') {
          throw new RecoilValueNotReady$3(key);
        } else {
          throw loadable.contents;
        }
      }

      function setRecoilState(recoilState, valueOrUpdater) {
        const newValue = typeof valueOrUpdater === 'function' ? // cast to any because we can't restrict type S from being a function itself without losing support for opaque types
        // flowlint-next-line unclear-type:off
        valueOrUpdater(getRecoilValue(recoilState)) : valueOrUpdater;
        const [deps, upstreamWrites] = setNodeValue$4(store, state, recoilState.key, newValue);
        mergeDepsIntoDependencyMap$1(deps, dependencyMap);
        upstreamWrites.forEach((v, k) => writes.set(k, v));
      }

      function resetRecoilState(recoilState) {
        setRecoilState(recoilState, DEFAULT_VALUE$4);
      }

      set({
        set: setRecoilState,
        get: getRecoilValue,
        reset: resetRecoilState
      }, newValue);
      return [dependencyMap, writes];
    }

    return registerNode$2({
      key,
      peek: myPeek,
      get: myGet,
      set: mySet,
      invalidate,
      cleanUp: () => {},
      dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      shouldRestoreFromSnapshots: false
    });
  } else {
    return registerNode$2({
      key,
      peek: myPeek,
      get: myGet,
      invalidate,
      cleanUp: () => {},
      dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      shouldRestoreFromSnapshots: false
    });
  }
}
/* eslint-enable no-redeclare */


var Recoil_selector_OLD = selector$1;

const selector$2 = Recoil_gkx_1('recoil_async_selector_refactor') ? Recoil_selector_NEW : Recoil_selector_OLD;
var Recoil_selector = selector$2;

// @fb-only: const {scopedAtom} = require('Recoil_ScopedAtom');
const {
  loadableWithError: loadableWithError$3,
  loadableWithPromise: loadableWithPromise$3,
  loadableWithValue: loadableWithValue$3
} = Recoil_Loadable;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$5,
  DefaultValue: DefaultValue$2,
  registerNode: registerNode$3
} = Recoil_Node;

const {
  isRecoilValue: isRecoilValue$5
} = Recoil_RecoilValue$1;

const {
  markRecoilValueModified: markRecoilValueModified$1,
  setRecoilValue: setRecoilValue$3,
  setRecoilValueLoadable: setRecoilValueLoadable$4
} = Recoil_RecoilValueInterface;













function baseAtom(options) {
  const {
    key,
    persistence_UNSTABLE: persistence
  } = options;
  let defaultLoadable = Recoil_isPromise(options.default) ? loadableWithPromise$3(options.default.then(value => {
    defaultLoadable = loadableWithValue$3(value); // TODO Temporary disable Flow due to pending selector_NEW refactor

    const promiseInfo = {
      __key: key,
      __value: value
    };
    return promiseInfo;
  }).catch(error => {
    defaultLoadable = loadableWithError$3(error);
    throw error;
  })) : loadableWithValue$3(options.default);
  let cachedAnswerForUnvalidatedValue = undefined; // Cleanup handlers for this atom
  // Rely on stable reference equality of the store to use it as a key per <RecoilRoot>

  const cleanupEffectsByStore = new Map();

  function wrapPendingPromise(store, promise) {
    const wrappedPromise = promise.then(value => {
      var _store$getState$nextT, _state$atomValues$get;

      const state = (_store$getState$nextT = store.getState().nextTree) !== null && _store$getState$nextT !== void 0 ? _store$getState$nextT : store.getState().currentTree;

      if (((_state$atomValues$get = state.atomValues.get(key)) === null || _state$atomValues$get === void 0 ? void 0 : _state$atomValues$get.contents) === wrappedPromise) {
        setRecoilValue$3(store, node, value);
      }

      return {
        __key: key,
        __value: value
      };
    }).catch(error => {
      var _store$getState$nextT2, _state$atomValues$get2;

      const state = (_store$getState$nextT2 = store.getState().nextTree) !== null && _store$getState$nextT2 !== void 0 ? _store$getState$nextT2 : store.getState().currentTree;

      if (((_state$atomValues$get2 = state.atomValues.get(key)) === null || _state$atomValues$get2 === void 0 ? void 0 : _state$atomValues$get2.contents) === wrappedPromise) {
        setRecoilValueLoadable$4(store, node, loadableWithError$3(error));
      }

      throw error;
    });
    return wrappedPromise;
  }

  function initAtom(store, initState, trigger) {
    if (store.getState().knownAtoms.has(key)) {
      return;
    }

    store.getState().knownAtoms.add(key); // Setup async defaults to notify subscribers when they resolve

    if (defaultLoadable.state === 'loading') {
      function notifyDefaultSubscribers() {
        var _store$getState$nextT3;

        const state = (_store$getState$nextT3 = store.getState().nextTree) !== null && _store$getState$nextT3 !== void 0 ? _store$getState$nextT3 : store.getState().currentTree;

        if (!state.atomValues.has(key)) {
          markRecoilValueModified$1(store, node);
        }
      }

      defaultLoadable.contents.then(notifyDefaultSubscribers).catch(notifyDefaultSubscribers);
    } // Run Atom Effects
    // This state is scoped by Store, since this is in the initAtom() closure


    let initValue = DEFAULT_VALUE$5;
    let pendingSetSelf = null;

    if (options.effects_UNSTABLE != null) {
      let duringInit = true;

      const setSelf = effect => valueOrUpdater => {
        if (duringInit) {
          const currentValue = initValue instanceof DefaultValue$2 || Recoil_isPromise(initValue) ? defaultLoadable.state === 'hasValue' ? defaultLoadable.contents : DEFAULT_VALUE$5 : initValue;
          initValue = typeof valueOrUpdater === 'function' ? // cast to any because we can't restrict T from being a function without losing support for opaque types
          valueOrUpdater(currentValue) // flowlint-line unclear-type:off
          : valueOrUpdater;
        } else {
          if (Recoil_isPromise(valueOrUpdater)) {
            throw new Error('Setting atoms to async values is not implemented.');
          }

          if (typeof valueOrUpdater !== 'function') {
            pendingSetSelf = {
              effect,
              value: valueOrUpdater
            };
          }

          setRecoilValue$3(store, node, typeof valueOrUpdater === 'function' ? currentValue => {
            const newValue = // cast to any because we can't restrict T from being a function without losing support for opaque types
            valueOrUpdater(currentValue); // flowlint-line unclear-type:off

            pendingSetSelf = {
              effect,
              value: newValue
            };
            return newValue;
          } : valueOrUpdater);
        }
      };

      const resetSelf = effect => () => setSelf(effect)(DEFAULT_VALUE$5);

      const onSet = effect => handler => {
        store.subscribeToTransactions(currentStore => {
          var _pendingSetSelf3;

          // eslint-disable-next-line prefer-const
          let {
            currentTree,
            previousTree
          } = currentStore.getState();

          if (!previousTree) {
            Recoil_recoverableViolation('Transaction subscribers notified without a next tree being present -- this is a bug in Recoil');
            previousTree = currentTree; // attempt to trundle on
          }

          const newLoadable = currentTree.atomValues.get(key);

          if (newLoadable == null || newLoadable.state === 'hasValue') {
            var _previousTree$atomVal, _pendingSetSelf, _pendingSetSelf2;

            const newValue = newLoadable != null ? newLoadable.contents : DEFAULT_VALUE$5;
            const oldLoadable = (_previousTree$atomVal = previousTree.atomValues.get(key)) !== null && _previousTree$atomVal !== void 0 ? _previousTree$atomVal : defaultLoadable;
            const oldValue = oldLoadable.state === 'hasValue' ? oldLoadable.contents : DEFAULT_VALUE$5; // TODO This isn't actually valid, use as a placeholder for now.
            // Ignore atom value changes that were set via setSelf() in the same effect.
            // We will still properly call the handler if there was a subsequent
            // set from something other than an atom effect which was batched
            // with the `setSelf()` call.  However, we may incorrectly ignore
            // the handler if the subsequent batched call happens to set the
            // atom to the exact same value as the `setSelf()`.   But, in that
            // case, it was kind of a noop, so the semantics are debatable..

            if (((_pendingSetSelf = pendingSetSelf) === null || _pendingSetSelf === void 0 ? void 0 : _pendingSetSelf.effect) !== effect || ((_pendingSetSelf2 = pendingSetSelf) === null || _pendingSetSelf2 === void 0 ? void 0 : _pendingSetSelf2.value) !== newValue) {
              handler(newValue, oldValue);
            }
          }

          if (((_pendingSetSelf3 = pendingSetSelf) === null || _pendingSetSelf3 === void 0 ? void 0 : _pendingSetSelf3.effect) === effect) {
            pendingSetSelf = null;
          }
        }, key);
      };

      for (const effect of (_options$effects_UNST = options.effects_UNSTABLE) !== null && _options$effects_UNST !== void 0 ? _options$effects_UNST : []) {
        var _options$effects_UNST;

        const cleanup = effect({
          node,
          trigger,
          setSelf: setSelf(effect),
          resetSelf: resetSelf(effect),
          onSet: onSet(effect)
        });

        if (cleanup != null) {
          cleanupEffectsByStore.set(store, cleanup);
        }
      }

      duringInit = false;
    } // Mutate initial state in place since we know there are no other subscribers
    // since we are the ones initializing on first use.


    if (!(initValue instanceof DefaultValue$2)) {
      initState.atomValues.set(key, Recoil_isPromise(initValue) ? loadableWithPromise$3(wrapPendingPromise(store, initValue)) : loadableWithValue$3(initValue));
    }
  }

  function myPeek(_store, state) {
    var _ref, _state$atomValues$get3, _cachedAnswerForUnval;

    return (_ref = (_state$atomValues$get3 = state.atomValues.get(key)) !== null && _state$atomValues$get3 !== void 0 ? _state$atomValues$get3 : (_cachedAnswerForUnval = cachedAnswerForUnvalidatedValue) === null || _cachedAnswerForUnval === void 0 ? void 0 : _cachedAnswerForUnval[1]) !== null && _ref !== void 0 ? _ref : defaultLoadable;
  }

  function myGet(store, state) {
    initAtom(store, state, 'get');

    if (state.atomValues.has(key)) {
      // Atom value is stored in state:
      return [new Map(), Recoil_nullthrows(state.atomValues.get(key))];
    } else if (state.nonvalidatedAtoms.has(key)) {
      // Atom value is stored but needs validation before use.
      // We might have already validated it and have a cached validated value:
      if (cachedAnswerForUnvalidatedValue != null) {
        return cachedAnswerForUnvalidatedValue;
      }

      if (persistence == null) {
        Recoil_expectationViolation(`Tried to restore a persisted value for atom ${key} but it has no persistence settings.`);
        return [new Map(), defaultLoadable];
      }

      const nonvalidatedValue = state.nonvalidatedAtoms.get(key);
      const validatorResult = persistence.validator(nonvalidatedValue, DEFAULT_VALUE$5);
      const validatedValueLoadable = validatorResult instanceof DefaultValue$2 ? defaultLoadable : loadableWithValue$3(validatorResult);
      cachedAnswerForUnvalidatedValue = [new Map(), validatedValueLoadable];
      return cachedAnswerForUnvalidatedValue;
    } else {
      return [new Map(), defaultLoadable];
    }
  }

  function myCleanup(store) {
    var _cleanupEffectsByStor;

    (_cleanupEffectsByStor = cleanupEffectsByStore.get(store)) === null || _cleanupEffectsByStor === void 0 ? void 0 : _cleanupEffectsByStor();
    cleanupEffectsByStore.delete(store);
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

    if (process.env.NODE_ENV !== "production") {
      if (options.dangerouslyAllowMutability !== true) {
        Recoil_deepFreezeValue(newValue);
      }
    }

    cachedAnswerForUnvalidatedValue = undefined; // can be released now if it was previously in use

    return [new Map(), new Map().set(key, loadableWithValue$3(newValue))];
  }

  const node = registerNode$3({
    key,
    peek: myPeek,
    get: myGet,
    set: mySet,
    cleanUp: myCleanup,
    invalidate,
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
    persistence_UNSTABLE: options.persistence_UNSTABLE ? {
      type: options.persistence_UNSTABLE.type,
      backButton: options.persistence_UNSTABLE.backButton
    } : undefined,
    shouldRestoreFromSnapshots: true
  });
  return node;
} // prettier-ignore


function atom(options) {
  const {
    default: optionsDefault,
    // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,
    ...restOptions
  } = options;

  if (isRecoilValue$5(optionsDefault) // Continue to use atomWithFallback for promise defaults for scoped atoms
  // for now, since scoped atoms don't support async defaults
  // @fb-only: || (isPromise(optionsDefault) && scopeRules_APPEND_ONLY_READ_THE_DOCS)
  ) {
      return atomWithFallback({ ...restOptions,
        default: optionsDefault // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,

      }); // @fb-only: } else if (scopeRules_APPEND_ONLY_READ_THE_DOCS && !isPromise(optionsDefault)) {
      // @fb-only: return scopedAtom<T>({
      // @fb-only: ...restOptions,
      // @fb-only: default: optionsDefault,
      // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,
      // @fb-only: });
    } else {
    return baseAtom({ ...restOptions,
      default: optionsDefault
    });
  }
}

function atomWithFallback(options) {
  const base = atom({ ...options,
    default: DEFAULT_VALUE$5,
    persistence_UNSTABLE: options.persistence_UNSTABLE === undefined ? undefined : { ...options.persistence_UNSTABLE,
      validator: storedValue => storedValue instanceof DefaultValue$2 ? storedValue : Recoil_nullthrows(options.persistence_UNSTABLE).validator(storedValue, DEFAULT_VALUE$5)
    },
    // TODO Hack for now.
    // flowlint-next-line unclear-type: off
    effects_UNSTABLE: options.effects_UNSTABLE
  });
  return Recoil_selector({
    key: `${options.key}__withFallback`,
    get: ({
      get
    }) => {
      const baseValue = get(base);
      return baseValue instanceof DefaultValue$2 ? options.default : baseValue;
    },
    set: ({
      set
    }, newValue) => set(base, newValue),
    dangerouslyAllowMutability: options.dangerouslyAllowMutability
  });
}

var Recoil_atom = atom;

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

  let selectorCache = (_options$cacheImpleme = (_options$cacheImpleme2 = options.cacheImplementationForParams_UNSTABLE) === null || _options$cacheImpleme2 === void 0 ? void 0 : _options$cacheImpleme2.call(options)) !== null && _options$cacheImpleme !== void 0 ? _options$cacheImpleme : Recoil_cacheWithValueEquality();
  return params => {
    var _stableStringify, _options$cacheImpleme3;

    const cachedSelector = selectorCache.get(params);

    if (cachedSelector != null) {
      return cachedSelector;
    }

    const myKey = `${options.key}__selectorFamily/${(_stableStringify = Recoil_stableStringify(params, {
      // It is possible to use functions in parameters if the user uses
      // a cache with reference equality thanks to the incrementing index.
      allowFunctions: true
    })) !== null && _stableStringify !== void 0 ? _stableStringify : 'void'}/${nextIndex++}`; // Append index in case values serialize to the same key string

    const myGet = callbacks => options.get(params)(callbacks);

    const myCacheImplementation = (_options$cacheImpleme3 = options.cacheImplementation_UNSTABLE) === null || _options$cacheImpleme3 === void 0 ? void 0 : _options$cacheImpleme3.call(options);
    let newSelector;

    if (options.set != null) {
      const set = options.set;

      const mySet = (callbacks, newValue) => set(params)(callbacks, newValue);

      newSelector = Recoil_selector({
        key: myKey,
        get: myGet,
        set: mySet,
        cacheImplementation_UNSTABLE: myCacheImplementation,
        dangerouslyAllowMutability: options.dangerouslyAllowMutability
      });
    } else {
      newSelector = Recoil_selector({
        key: myKey,
        get: myGet,
        cacheImplementation_UNSTABLE: myCacheImplementation,
        dangerouslyAllowMutability: options.dangerouslyAllowMutability
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
  DEFAULT_VALUE: DEFAULT_VALUE$6,
  DefaultValue: DefaultValue$3
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
    default: DEFAULT_VALUE$6,
    persistence_UNSTABLE: options.persistence_UNSTABLE
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
    get: param => ({
      get
    }) => {
      const legacyValue = get(typeof legacyAtom === 'function' ? legacyAtom(param) : legacyAtom); // Atom was upgraded from a non-parameterized atom

      if (!(legacyValue instanceof DefaultValue$3)) {
        return legacyValue;
      } // There's no legacy atom value, so use the user-specified default


      return typeof options.default === 'function' ? // The default was parameterized
      // Flow doesn't know that T isn't a function, so we need to case to any
      options.default(param) // flowlint-line unclear-type:off
      : // Default may be a static value, promise, or RecoilValue
      options.default;
    },
    dangerouslyAllowMutability: options.dangerouslyAllowMutability
  }); // Simple atomFamily implementation to cache individual atoms based
  // on the parameter value equality.

  return params => {
    var _stableStringify;

    const cachedAtom = atomCache.get(params);

    if (cachedAtom != null) {
      return cachedAtom;
    }

    const newAtom = Recoil_atom({ ...options,
      key: `${options.key}__${(_stableStringify = Recoil_stableStringify(params)) !== null && _stableStringify !== void 0 ? _stableStringify : 'void'}`,
      default: atomFamilyDefault(params),
      effects_UNSTABLE: typeof options.effects_UNSTABLE === 'function' ? options.effects_UNSTABLE(params) : options.effects_UNSTABLE // prettier-ignore
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
  cacheImplementationForParams_UNSTABLE: Recoil_cacheWithReferenceEquality
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
  cacheImplementationForParams_UNSTABLE: Recoil_cacheWithReferenceEquality
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
  loadableWithError: loadableWithError$4,
  loadableWithPromise: loadableWithPromise$4,
  loadableWithValue: loadableWithValue$4
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
  return Array.isArray(dependencies) ? dependencies : Object.getOwnPropertyNames(dependencies).map(key => dependencies[key]);
}

function getValueFromLoadablePromiseResult(result) {
  if (result != null && typeof result === 'object' && result.hasOwnProperty('__value')) {
    return result.__value;
  }

  return result;
}

function wrapResults(dependencies, results) {
  return Array.isArray(dependencies) ? results : // Object.getOwnPropertyNames() has consistent key ordering with ES6
  Object.getOwnPropertyNames(dependencies).reduce((out, key, idx) => ({ ...out,
    [key]: results[idx]
  }), {});
}

function wrapLoadables(dependencies, results, exceptions) {
  const output = exceptions.map((exception, idx) => exception == null ? loadableWithValue$4(results[idx]) : Recoil_isPromise(exception) ? loadableWithPromise$4(exception) : loadableWithError$4(exception));
  return wrapResults(dependencies, output);
}

function combineAsyncResultsWithSyncResults(syncResults, asyncResults) {
  return asyncResults.map((result, idx) =>
  /**
   * it's important we use === undefined as opposed to == null, because the
   * resolved value of the async promise could be `null`, in which case we
   * don't want to use syncResults[idx], which would be undefined. If async
   * promise resolves to `undefined`, that's ok because `syncResults[idx]`
   * will also be `undefined`. That's a little hacky, but it works.
   */
  result === undefined ? syncResults[idx] : result);
} // Selector that requests all dependencies in parallel and immediately returns
// current results without waiting.


const waitForNone = Recoil_selectorFamily({
  key: '__waitForNone',
  get: dependencies => ({
    get
  }) => {
    // Issue requests for all dependencies in parallel.
    const deps = unwrapDependencies(dependencies);
    const [results, exceptions] = concurrentRequests(get, deps); // Always return the current status of the results; never block.

    return wrapLoadables(dependencies, results, exceptions);
  }
}); // Selector that requests all dependencies in parallel and waits for at least
// one to be available before returning results.  It will only error if all
// dependencies have errors.

const waitForAny = Recoil_selectorFamily({
  key: '__waitForAny',
  get: dependencies => ({
    get
  }) => {
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

    if (Recoil_gkx_1('recoil_async_selector_refactor')) {
      // Otherwise, return a promise that will resolve when the next result is
      // available, whichever one happens to be next.  But, if all pending
      // dependencies end up with errors, then reject the promise.
      return new Promise((resolve, reject) => {
        for (const [i, exp] of exceptions.entries()) {
          if (Recoil_isPromise(exp)) {
            exp.then(result => {
              results[i] = getValueFromLoadablePromiseResult(result);
              exceptions[i] = null;
              resolve(wrapLoadables(dependencies, results, exceptions));
            }).catch(error => {
              exceptions[i] = error;

              if (exceptions.every(isError)) {
                reject(exceptions[0]);
              }
            });
          }
        }
      });
    } else {
      throw new Promise((resolve, reject) => {
        for (const [i, exp] of exceptions.entries()) {
          if (Recoil_isPromise(exp)) {
            exp.then(result => {
              results[i] = result;
              exceptions[i] = null;
              resolve(wrapLoadables(dependencies, results, exceptions));
            }).catch(error => {
              exceptions[i] = error;

              if (exceptions.every(isError)) {
                reject(exceptions[0]);
              }
            });
          }
        }
      });
    }
  }
}); // Selector that requests all dependencies in parallel and waits for all to be
// available before returning a value.  It will error if any dependencies error.

const waitForAll = Recoil_selectorFamily({
  key: '__waitForAll',
  get: dependencies => ({
    get
  }) => {
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

    if (Recoil_gkx_1('recoil_async_selector_refactor')) {
      // Otherwise, return a promise that will resolve when all results are available
      return Promise.all(exceptions).then(exceptionResults => wrapResults(dependencies, combineAsyncResultsWithSyncResults(results, exceptionResults).map(getValueFromLoadablePromiseResult)));
    } else {
      throw Promise.all(exceptions).then(results => wrapResults(dependencies, results));
    }
  }
});
const noWait = Recoil_selectorFamily({
  key: '__noWait',
  get: dependency => ({
    get
  }) => {
    try {
      return loadableWithValue$4(get(dependency));
    } catch (exception) {
      return Recoil_isPromise(exception) ? loadableWithPromise$4(exception) : loadableWithError$4(exception);
    }
  }
});
var Recoil_WaitFor = {
  waitForNone,
  waitForAny,
  waitForAll,
  noWait
};

const {
  batchUpdates: batchUpdates$3,
  setBatcher: setBatcher$1
} = Recoil_Batching;

const {
  DefaultValue: DefaultValue$4
} = Recoil_Node;

const {
  RecoilRoot: RecoilRoot$2
} = Recoil_RecoilRoot_react;

const {
  isRecoilValue: isRecoilValue$6
} = Recoil_RecoilValue$1;

const {
  freshSnapshot: freshSnapshot$2
} = Recoil_Snapshot$1;

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
  useTransactionObservation_DEPRECATED: useTransactionObservation_DEPRECATED$1
} = Recoil_Hooks;

















const {
  noWait: noWait$1,
  waitForAll: waitForAll$1,
  waitForAny: waitForAny$1,
  waitForNone: waitForNone$1
} = Recoil_WaitFor;

var Recoil_index = {
  // Types
  DefaultValue: DefaultValue$4,
  // Components
  RecoilRoot: RecoilRoot$2,
  useRecoilBridgeAcrossReactRoots_UNSTABLE: Recoil_useRecoilBridgeAcrossReactRoots,
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
  isRecoilValue: isRecoilValue$6,
  // Batching
  batchUpdates: batchUpdates$3,
  setBatcher: setBatcher$1,
  // Snapshot Utils
  snapshot_UNSTABLE: freshSnapshot$2
};
var Recoil_index_1 = Recoil_index.DefaultValue;
var Recoil_index_2 = Recoil_index.RecoilRoot;
var Recoil_index_3 = Recoil_index.useRecoilBridgeAcrossReactRoots_UNSTABLE;
var Recoil_index_4 = Recoil_index.atom;
var Recoil_index_5 = Recoil_index.selector;
var Recoil_index_6 = Recoil_index.atomFamily;
var Recoil_index_7 = Recoil_index.selectorFamily;
var Recoil_index_8 = Recoil_index.constSelector;
var Recoil_index_9 = Recoil_index.errorSelector;
var Recoil_index_10 = Recoil_index.readOnlySelector;
var Recoil_index_11 = Recoil_index.useRecoilValue;
var Recoil_index_12 = Recoil_index.useRecoilValueLoadable;
var Recoil_index_13 = Recoil_index.useRecoilState;
var Recoil_index_14 = Recoil_index.useRecoilStateLoadable;
var Recoil_index_15 = Recoil_index.useSetRecoilState;
var Recoil_index_16 = Recoil_index.useResetRecoilState;
var Recoil_index_17 = Recoil_index.useRecoilCallback;
var Recoil_index_18 = Recoil_index.useGotoRecoilSnapshot;
var Recoil_index_19 = Recoil_index.useRecoilSnapshot;
var Recoil_index_20 = Recoil_index.useRecoilTransactionObserver_UNSTABLE;
var Recoil_index_21 = Recoil_index.useTransactionObservation_UNSTABLE;
var Recoil_index_22 = Recoil_index.useSetUnvalidatedAtomValues_UNSTABLE;
var Recoil_index_23 = Recoil_index.noWait;
var Recoil_index_24 = Recoil_index.waitForNone;
var Recoil_index_25 = Recoil_index.waitForAny;
var Recoil_index_26 = Recoil_index.waitForAll;
var Recoil_index_27 = Recoil_index.isRecoilValue;
var Recoil_index_28 = Recoil_index.batchUpdates;
var Recoil_index_29 = Recoil_index.setBatcher;
var Recoil_index_30 = Recoil_index.snapshot_UNSTABLE;

exports.DefaultValue = Recoil_index_1;
exports.RecoilRoot = Recoil_index_2;
exports.atom = Recoil_index_4;
exports.atomFamily = Recoil_index_6;
exports.batchUpdates = Recoil_index_28;
exports.constSelector = Recoil_index_8;
exports.default = Recoil_index;
exports.errorSelector = Recoil_index_9;
exports.isRecoilValue = Recoil_index_27;
exports.noWait = Recoil_index_23;
exports.readOnlySelector = Recoil_index_10;
exports.selector = Recoil_index_5;
exports.selectorFamily = Recoil_index_7;
exports.setBatcher = Recoil_index_29;
exports.snapshot_UNSTABLE = Recoil_index_30;
exports.useGotoRecoilSnapshot = Recoil_index_18;
exports.useRecoilBridgeAcrossReactRoots_UNSTABLE = Recoil_index_3;
exports.useRecoilCallback = Recoil_index_17;
exports.useRecoilSnapshot = Recoil_index_19;
exports.useRecoilState = Recoil_index_13;
exports.useRecoilStateLoadable = Recoil_index_14;
exports.useRecoilTransactionObserver_UNSTABLE = Recoil_index_20;
exports.useRecoilValue = Recoil_index_11;
exports.useRecoilValueLoadable = Recoil_index_12;
exports.useResetRecoilState = Recoil_index_16;
exports.useSetRecoilState = Recoil_index_15;
exports.useSetUnvalidatedAtomValues_UNSTABLE = Recoil_index_22;
exports.useTransactionObservation_UNSTABLE = Recoil_index_21;
exports.waitForAll = Recoil_index_26;
exports.waitForAny = Recoil_index_25;
exports.waitForNone = Recoil_index_24;
