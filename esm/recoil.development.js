import react from 'react';
import reactDom from 'react-dom';

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

function sprintf(format) {
  for (
    var _len = arguments.length,
      args = new Array(_len > 1 ? _len - 1 : 0),
      _key = 1;
    _key < _len;
    _key++
  ) {
    args[_key - 1] = arguments[_key];
  }

  var index = 0;
  return format.replace(/%s/g, function () {
    return String(args[index++]);
  });
}

var sprintf_1 = sprintf;

function expectationViolation(format) {
  {
    for (
      var _len = arguments.length,
        args = new Array(_len > 1 ? _len - 1 : 0),
        _key = 1;
      _key < _len;
      _key++
    ) {
      args[_key - 1] = arguments[_key];
    }

    var message = sprintf_1.call.apply(sprintf_1, [null, format].concat(args));
    var error = new Error(message);
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

function recoverableViolation(message, projectName) {
  var _ref =
      arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
    error = _ref.error;

  {
    console.error(message, error);
  }

  return null;
}

var recoverableViolation_1 = recoverableViolation;

// @oss-only

var Recoil_recoverableViolation = recoverableViolation_1;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err);
      }

      _next(undefined);
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ('value' in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

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

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(
          target,
          key,
          Object.getOwnPropertyDescriptor(source, key),
        );
      });
    }
  }

  return target;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function');
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true,
    },
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === 'undefined' || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === 'function') return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf('[native code]') !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === 'function' ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== 'function') {
      throw new TypeError('Super expression must either be null or a function');
    }

    if (typeof _cache !== 'undefined') {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called",
    );
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === 'object' || typeof call === 'function')) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
      result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) ||
    _iterableToArrayLimit(arr, i) ||
    _unsupportedIterableToArray(arr, i) ||
    _nonIterableRest()
  );
}

function _toConsumableArray(arr) {
  return (
    _arrayWithoutHoles(arr) ||
    _iterableToArray(arr) ||
    _unsupportedIterableToArray(arr) ||
    _nonIterableSpread()
  );
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArray(iter) {
  if (typeof Symbol !== 'undefined' && Symbol.iterator in Object(iter))
    return Array.from(iter);
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === 'undefined' || !(Symbol.iterator in Object(arr)))
    return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (
      var _i = arr[Symbol.iterator](), _s;
      !(_n = (_s = _i.next()).done);
      _n = true
    ) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i['return'] != null) _i['return']();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === 'Object' && o.constructor) n = o.constructor.name;
  if (n === 'Map' || n === 'Set') return Array.from(o);
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableSpread() {
  throw new TypeError(
    'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
  );
}

function _nonIterableRest() {
  throw new TypeError(
    'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
  );
}

function _createForOfIteratorHelper(o, allowArrayLike) {
  var it;

  if (typeof Symbol === 'undefined' || o[Symbol.iterator] == null) {
    if (
      Array.isArray(o) ||
      (it = _unsupportedIterableToArray(o)) ||
      (allowArrayLike && o && typeof o.length === 'number')
    ) {
      if (it) o = it;
      var i = 0;

      var F = function () {};

      return {
        s: F,
        n: function () {
          if (i >= o.length)
            return {
              done: true,
            };
          return {
            done: false,
            value: o[i++],
          };
        },
        e: function (e) {
          throw e;
        },
        f: F,
      };
    }

    throw new TypeError(
      'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
    );
  }

  var normalCompletion = true,
    didErr = false,
    err;
  return {
    s: function () {
      it = o[Symbol.iterator]();
    },
    n: function () {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function (e) {
      didErr = true;
      err = e;
    },
    f: function () {
      try {
        if (!normalCompletion && it.return != null) it.return();
      } finally {
        if (didErr) throw err;
      }
    },
  };
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
var AbstractRecoilValue = function AbstractRecoilValue(newKey) {
  _classCallCheck(this, AbstractRecoilValue);

  _defineProperty(this, 'key', void 0);

  this.key = newKey;
};

var RecoilState = /*#__PURE__*/ (function (_AbstractRecoilValue) {
  _inherits(RecoilState, _AbstractRecoilValue);

  var _super = _createSuper(RecoilState);

  function RecoilState() {
    _classCallCheck(this, RecoilState);

    return _super.apply(this, arguments);
  }

  return RecoilState;
})(AbstractRecoilValue);

var RecoilValueReadOnly = /*#__PURE__*/ (function (_AbstractRecoilValue2) {
  _inherits(RecoilValueReadOnly, _AbstractRecoilValue2);

  var _super2 = _createSuper(RecoilValueReadOnly);

  function RecoilValueReadOnly() {
    _classCallCheck(this, RecoilValueReadOnly);

    return _super2.apply(this, arguments);
  }

  return RecoilValueReadOnly;
})(AbstractRecoilValue);

function isRecoilValue(x) {
  return x instanceof RecoilState || x instanceof RecoilValueReadOnly;
}

var Recoil_RecoilValue = {
  AbstractRecoilValue: AbstractRecoilValue,
  RecoilState: RecoilState,
  RecoilValueReadOnly: RecoilValueReadOnly,
  isRecoilValue: isRecoilValue,
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

var DefaultValue = function DefaultValue() {
  _classCallCheck(this, DefaultValue);
};

var DEFAULT_VALUE = new DefaultValue();

var RecoilValueNotReady = /*#__PURE__*/ (function (_Error) {
  _inherits(RecoilValueNotReady, _Error);

  var _super = _createSuper(RecoilValueNotReady);

  function RecoilValueNotReady(key) {
    _classCallCheck(this, RecoilValueNotReady);

    return _super.call(
      this,
      'Tried to set the value of Recoil selector '.concat(
        key,
        ' using an updater function, but it is an async selector in a pending or error state; this is not supported.',
      ),
    );
  }

  return RecoilValueNotReady;
})(/*#__PURE__*/ _wrapNativeSuper(Error));

// flowlint-next-line unclear-type:off
var nodes = new Map(); // flowlint-next-line unclear-type:off

var recoilValues = new Map();
/* eslint-disable no-redeclare */

function registerNode(node) {
  if (nodes.has(node.key)) {
    var message = 'Duplicate atom key "'.concat(
      node.key,
      '". This is a FATAL ERROR in\n      production. But it is safe to ignore this warning if it occurred because of\n      hot module replacement.',
    ); // TODO Need to figure out if there is a standard/open-source equivalent to see if hot module replacement is happening:
    // prettier-ignore
    // @fb-only: if (__DEV__) {
    // @fb-only: const isAcceptingUpdate = require('__debug').isAcceptingUpdate;
    // prettier-ignore
    // @fb-only: if (typeof isAcceptingUpdate !== 'function' || !isAcceptingUpdate()) {
    // @fb-only: expectationViolation(message, 'recoil');
    // @fb-only: }
    // prettier-ignore
    // @fb-only: } else {

    Recoil_recoverableViolation(message, 'recoil'); // @fb-only: }
  }

  nodes.set(node.key, node);
  var recoilValue =
    node.set == null
      ? new Recoil_RecoilValue$1.RecoilValueReadOnly(node.key)
      : new Recoil_RecoilValue$1.RecoilState(node.key);
  recoilValues.set(node.key, recoilValue);
  return recoilValue;
}
/* eslint-enable no-redeclare */

var NodeMissingError = /*#__PURE__*/ (function (_Error2) {
  _inherits(NodeMissingError, _Error2);

  var _super2 = _createSuper(NodeMissingError);

  function NodeMissingError() {
    _classCallCheck(this, NodeMissingError);

    return _super2.apply(this, arguments);
  }

  return NodeMissingError;
})(/*#__PURE__*/ _wrapNativeSuper(Error)); // flowlint-next-line unclear-type:off

function getNode(key) {
  var node = nodes.get(key);

  if (node == null) {
    throw new NodeMissingError(
      'Missing definition for RecoilValue: "'.concat(key, '""'),
    );
  }

  return node;
}

var Recoil_Node = {
  nodes: nodes,
  recoilValues: recoilValues,
  registerNode: registerNode,
  getNode: getNode,
  NodeMissingError: NodeMissingError,
  DefaultValue: DefaultValue,
  DEFAULT_VALUE: DEFAULT_VALUE,
  RecoilValueNotReady: RecoilValueNotReady,
};

var Recoil_Node_1 = Recoil_Node.nodes;
var Recoil_Node_2 = Recoil_Node.recoilValues;
var Recoil_Node_3 = Recoil_Node.registerNode;
var Recoil_Node_4 = Recoil_Node.getNode;
var Recoil_Node_5 = Recoil_Node.NodeMissingError;
var Recoil_Node_6 = Recoil_Node.DefaultValue;
var Recoil_Node_7 = Recoil_Node.DEFAULT_VALUE;
var Recoil_Node_8 = Recoil_Node.RecoilValueNotReady;

var Recoil_Node$1 = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  nodes: Recoil_Node_1,
  recoilValues: Recoil_Node_2,
  registerNode: Recoil_Node_3,
  getNode: Recoil_Node_4,
  NodeMissingError: Recoil_Node_5,
  DefaultValue: Recoil_Node_6,
  DEFAULT_VALUE: Recoil_Node_7,
  RecoilValueNotReady: Recoil_Node_8,
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

function enqueueExecution(s, f) {
  f();
}

var Recoil_Queue = {
  enqueueExecution: enqueueExecution,
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
  var next = new Set(set);
  next.add(v);
  return next;
}

function setByDeletingFromSet(set, v) {
  var next = new Set(set);
  next.delete(v);
  return next;
}

function mapBySettingInMap(map, k, v) {
  var next = new Map(map);
  next.set(k, v);
  return next;
}

function mapByUpdatingInMap(map, k, updater) {
  var next = new Map(map);
  next.set(k, updater(next.get(k)));
  return next;
}

function mapByDeletingFromMap(map, k) {
  var next = new Map(map);
  next.delete(k);
  return next;
}

var Recoil_CopyOnWrite = {
  setByAddingToSet: setByAddingToSet,
  setByDeletingFromSet: setByDeletingFromSet,
  mapBySettingInMap: mapBySettingInMap,
  mapByUpdatingInMap: mapByUpdatingInMap,
  mapByDeletingFromMap: mapByDeletingFromMap,
};

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
  trace: trace,
  wrap: wrap,
};

var mapByDeletingFromMap$1 = Recoil_CopyOnWrite.mapByDeletingFromMap,
  mapBySettingInMap$1 = Recoil_CopyOnWrite.mapBySettingInMap,
  mapByUpdatingInMap$1 = Recoil_CopyOnWrite.mapByUpdatingInMap,
  setByAddingToSet$1 = Recoil_CopyOnWrite.setByAddingToSet;

var getNode$1 = Recoil_Node$1.getNode; // flowlint-next-line unclear-type:off

var emptyMap = Object.freeze(new Map()); // flowlint-next-line unclear-type:off

var emptySet = Object.freeze(new Set());

var ReadOnlyRecoilValueError = /*#__PURE__*/ (function (_Error) {
  _inherits(ReadOnlyRecoilValueError, _Error);

  var _super = _createSuper(ReadOnlyRecoilValueError);

  function ReadOnlyRecoilValueError() {
    _classCallCheck(this, ReadOnlyRecoilValueError);

    return _super.apply(this, arguments);
  }

  return ReadOnlyRecoilValueError;
})(/*#__PURE__*/ _wrapNativeSuper(Error)); // Get the current value loadable of a node and update the state.
// Update dependencies and subscriptions for selectors.
// Update saved value validation for atoms.

function getNodeLoadable(store, state, key) {
  return getNode$1(key).get(store, state);
} // Peek at the current value loadable for a node.
// NOTE: This will ignore updating the state for subscriptions so use sparingly!!

function peekNodeLoadable(store, state, key) {
  return getNodeLoadable(store, state, key)[1];
} // Write value directly to state bypassing the Node interface as the node
// definitions may not have been loaded yet when processing the initial snapshot.

function setUnvalidatedAtomValue(state, key, newValue) {
  return _objectSpread2(
    _objectSpread2({}, state),
    {},
    {
      atomValues: mapByDeletingFromMap$1(state.atomValues, key),
      nonvalidatedAtoms: mapBySettingInMap$1(
        state.nonvalidatedAtoms,
        key,
        newValue,
      ),
      dirtyAtoms: setByAddingToSet$1(state.dirtyAtoms, key),
    },
  );
} // Set a node value and return the set of nodes that were actually written.
// That does not include any downstream nodes which are dependent on them.

function setNodeValue(store, state, key, newValue) {
  var node = getNode$1(key);

  if (node.set == null) {
    throw new ReadOnlyRecoilValueError(
      'Attempt to set read-only RecoilValue: '.concat(key),
    );
  }

  var _node$set = node.set(store, state, newValue),
    _node$set2 = _slicedToArray(_node$set, 2),
    newState = _node$set2[0],
    writtenNodes = _node$set2[1];

  return [newState, writtenNodes];
} // Find all of the recursively dependent nodes

function getDownstreamNodes(state, keys) {
  var dependentNodes = new Set();
  var visitedNodes = new Set();
  var visitingNodes = Array.from(keys);

  for (var key = visitingNodes.pop(); key; key = visitingNodes.pop()) {
    var _state$nodeToNodeSubs;

    dependentNodes.add(key);
    visitedNodes.add(key);
    var subscribedNodes =
      (_state$nodeToNodeSubs = state.nodeToNodeSubscriptions.get(key)) !==
        null && _state$nodeToNodeSubs !== void 0
        ? _state$nodeToNodeSubs
        : emptySet;

    var _iterator = _createForOfIteratorHelper(subscribedNodes),
      _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done; ) {
        var downstreamNode = _step.value;

        if (!visitedNodes.has(downstreamNode)) {
          visitingNodes.push(downstreamNode);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  return dependentNodes;
}

var subscriptionID = 0;

function subscribeComponentToNode(state, key, callback) {
  var subID = subscriptionID++;

  var newState = _objectSpread2(
    _objectSpread2({}, state),
    {},
    {
      nodeToComponentSubscriptions: mapByUpdatingInMap$1(
        state.nodeToComponentSubscriptions,
        key,
        function (subsForAtom) {
          return mapBySettingInMap$1(
            subsForAtom !== null && subsForAtom !== void 0
              ? subsForAtom
              : emptyMap,
            subID,
            ['TODO debug name', callback],
          );
        },
      ),
    },
  );

  function release(state) {
    var newState = _objectSpread2(
      _objectSpread2({}, state),
      {},
      {
        nodeToComponentSubscriptions: mapByUpdatingInMap$1(
          state.nodeToComponentSubscriptions,
          key,
          function (subsForAtom) {
            return mapByDeletingFromMap$1(
              subsForAtom !== null && subsForAtom !== void 0
                ? subsForAtom
                : emptyMap,
              subID,
            );
          },
        ),
      },
    );

    return newState;
  }

  return [newState, release];
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
  var state =
    when === 'enqueue'
      ? (_store$getState$nextT = store.getState().nextTree) !== null &&
        _store$getState$nextT !== void 0
        ? _store$getState$nextT
        : store.getState().currentTree
      : store.getState().currentTree;
  var dependentNodes = getDownstreamNodes(state, updatedNodes);

  var _iterator2 = _createForOfIteratorHelper(dependentNodes),
    _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
      var _state$nodeToComponen;

      var key = _step2.value;
      ((_state$nodeToComponen = state.nodeToComponentSubscriptions.get(key)) !==
        null && _state$nodeToComponen !== void 0
        ? _state$nodeToComponen
        : []
      ).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          _debugName = _ref2[0],
          cb = _ref2[1];

        when === 'enqueue'
          ? store.getState().queuedComponentCallbacks.push(cb)
          : cb(state);
      });
    } // Wake all suspended components so the right one(s) can try to re-render.
    // We need to wake up components not just when some asynchronous selector
    // resolved (when === 'now'), but also when changing synchronous values because
    // they may cause a selector to change from asynchronous to synchronous, in
    // which case there would be no follow-up asynchronous resolution to wake us up.
    // TODO OPTIMIZATION Only wake up related downstream components
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  Recoil_Tracing.trace(
    'value became available, waking components',
    Array.from(updatedNodes).join(', '),
    function () {
      var resolvers = store.getState().suspendedComponentResolvers;
      resolvers.forEach(function (r) {
        return r();
      });
      resolvers.clear();
    },
  );
}

function detectCircularDependencies(state, stack) {
  if (!stack.length) {
    return;
  }

  var leaf = stack[stack.length - 1];
  var downstream = state.nodeToNodeSubscriptions.get(leaf);

  if (
    !(downstream === null || downstream === void 0 ? void 0 : downstream.size)
  ) {
    return;
  }

  var root = stack[0];

  if (downstream.has(root)) {
    throw new Error(
      'Recoil selector has circular dependencies: '.concat(
        [].concat(_toConsumableArray(stack), [root]).reverse().join(' \u2192 '),
      ),
    );
  }

  var _iterator3 = _createForOfIteratorHelper(downstream),
    _step3;

  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
      var next = _step3.value;
      detectCircularDependencies(
        state,
        [].concat(_toConsumableArray(stack), [next]),
      );
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }
}

var Recoil_FunctionalCore = {
  getNodeLoadable: getNodeLoadable,
  peekNodeLoadable: peekNodeLoadable,
  setNodeValue: setNodeValue,
  setUnvalidatedAtomValue: setUnvalidatedAtomValue,
  subscribeComponentToNode: subscribeComponentToNode,
  fireNodeSubscriptions: fireNodeSubscriptions,
  detectCircularDependencies: detectCircularDependencies,
};

var Recoil_FunctionalCore_1 = Recoil_FunctionalCore.getNodeLoadable;
var Recoil_FunctionalCore_2 = Recoil_FunctionalCore.peekNodeLoadable;
var Recoil_FunctionalCore_3 = Recoil_FunctionalCore.setNodeValue;
var Recoil_FunctionalCore_4 = Recoil_FunctionalCore.setUnvalidatedAtomValue;
var Recoil_FunctionalCore_5 = Recoil_FunctionalCore.subscribeComponentToNode;
var Recoil_FunctionalCore_6 = Recoil_FunctionalCore.fireNodeSubscriptions;
var Recoil_FunctionalCore_7 = Recoil_FunctionalCore.detectCircularDependencies;

var Recoil_FunctionalCore$1 = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  getNodeLoadable: Recoil_FunctionalCore_1,
  peekNodeLoadable: Recoil_FunctionalCore_2,
  setNodeValue: Recoil_FunctionalCore_3,
  setUnvalidatedAtomValue: Recoil_FunctionalCore_4,
  subscribeComponentToNode: Recoil_FunctionalCore_5,
  fireNodeSubscriptions: Recoil_FunctionalCore_6,
  detectCircularDependencies: Recoil_FunctionalCore_7,
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

var Recoil_mapIterable = /*#__PURE__*/ Object.freeze({
  __proto__: null,
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
/**
 * Returns a new Map object with the same keys as the original, but with the
 * values replaced with the output of the given callback function.
 */

function mapMap(map, callback) {
  var result = new Map();
  map.forEach(function (value, key) {
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

  throw new Error(
    message !== null && message !== void 0
      ? message
      : 'Got unexpected null or undefined',
  );
}

var Recoil_nullthrows = nullthrows;

var getNodeLoadable$1 = Recoil_FunctionalCore$1.getNodeLoadable,
  peekNodeLoadable$1 = Recoil_FunctionalCore$1.peekNodeLoadable,
  setNodeValue$1 = Recoil_FunctionalCore$1.setNodeValue,
  setUnvalidatedAtomValue$1 = Recoil_FunctionalCore$1.setUnvalidatedAtomValue,
  subscribeComponentToNode$1 = Recoil_FunctionalCore$1.subscribeComponentToNode;

var RecoilValueNotReady$1 = Recoil_Node$1.RecoilValueNotReady;

var AbstractRecoilValue$1 = Recoil_RecoilValue$1.AbstractRecoilValue,
  RecoilState$1 = Recoil_RecoilValue$1.RecoilState,
  RecoilValueReadOnly$1 = Recoil_RecoilValue$1.RecoilValueReadOnly;

function getRecoilValueAsLoadable(store, _ref) {
  var key = _ref.key;
  var result; // Save any state changes during read, such as validating atoms,
  // updated selector subscriptions/dependencies, &c.

  Recoil_Tracing.trace('get RecoilValue', key, function () {
    return store.replaceState(
      Recoil_Tracing.wrap(function (state) {
        var _getNodeLoadable = getNodeLoadable$1(store, state, key),
          _getNodeLoadable2 = _slicedToArray(_getNodeLoadable, 2),
          newState = _getNodeLoadable2[0],
          loadable = _getNodeLoadable2[1];

        result = loadable;
        return newState;
      }),
    );
  });
  return result; // flowlint-line unclear-type:off
}

function valueFromValueOrUpdater(store, _ref2, valueOrUpdater) {
  var key = _ref2.key;

  if (typeof valueOrUpdater === 'function') {
    var _storeState$nextTree;

    // Updater form: pass in the current value. Throw if the current value
    // is unavailable (namely when updating an async selector that's
    // pending or errored):
    var storeState = store.getState();
    var state =
      (_storeState$nextTree = storeState.nextTree) !== null &&
      _storeState$nextTree !== void 0
        ? _storeState$nextTree
        : storeState.currentTree; // NOTE: This will not update state with node subscriptions.

    var current = peekNodeLoadable$1(store, state, key);

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
  var key = recoilValue.key;
  Recoil_Tracing.trace('set RecoilValue', key, function () {
    return store.replaceState(
      Recoil_Tracing.wrap(function (state) {
        var newValue = valueFromValueOrUpdater(
          store,
          recoilValue,
          valueOrUpdater,
        );

        var _setNodeValue = setNodeValue$1(store, state, key, newValue),
          _setNodeValue2 = _slicedToArray(_setNodeValue, 2),
          newState = _setNodeValue2[0],
          writtenNodes = _setNodeValue2[1];

        store.fireNodeSubscriptions(writtenNodes, 'enqueue');
        return newState;
      }),
    );
  });
}

function setUnvalidatedRecoilValue(store, _ref3, newValue) {
  var key = _ref3.key;
  Recoil_Tracing.trace('set unvalidated persisted atom', key, function () {
    return store.replaceState(
      Recoil_Tracing.wrap(function (state) {
        var newState = setUnvalidatedAtomValue$1(state, key, newValue);
        store.fireNodeSubscriptions(new Set([key]), 'enqueue');
        return newState;
      }),
    );
  });
}

function subscribeToRecoilValue(store, _ref4, callback) {
  var key = _ref4.key;
  var newState, releaseFn;
  Recoil_Tracing.trace('subscribe component to RecoilValue', key, function () {
    return store.replaceState(
      Recoil_Tracing.wrap(function (state) {
        var _subscribeComponentTo = subscribeComponentToNode$1(
          state,
          key,
          callback,
        );

        var _subscribeComponentTo2 = _slicedToArray(_subscribeComponentTo, 2);

        newState = _subscribeComponentTo2[0];
        releaseFn = _subscribeComponentTo2[1];
        return newState;
      }),
    );
  });
  return {
    release: function release(store) {
      return store.replaceState(releaseFn);
    },
  };
}

var Recoil_RecoilValueInterface = {
  RecoilValueReadOnly: RecoilValueReadOnly$1,
  AbstractRecoilValue: AbstractRecoilValue$1,
  RecoilState: RecoilState$1,
  getRecoilValueAsLoadable: getRecoilValueAsLoadable,
  setRecoilValue: setRecoilValue,
  setUnvalidatedRecoilValue: setUnvalidatedRecoilValue,
  subscribeToRecoilValue: subscribeToRecoilValue,
};

var Recoil_RecoilValueInterface_1 =
  Recoil_RecoilValueInterface.RecoilValueReadOnly;
var Recoil_RecoilValueInterface_2 =
  Recoil_RecoilValueInterface.AbstractRecoilValue;
var Recoil_RecoilValueInterface_3 = Recoil_RecoilValueInterface.RecoilState;
var Recoil_RecoilValueInterface_4 =
  Recoil_RecoilValueInterface.getRecoilValueAsLoadable;
var Recoil_RecoilValueInterface_5 = Recoil_RecoilValueInterface.setRecoilValue;
var Recoil_RecoilValueInterface_6 =
  Recoil_RecoilValueInterface.setUnvalidatedRecoilValue;
var Recoil_RecoilValueInterface_7 =
  Recoil_RecoilValueInterface.subscribeToRecoilValue;

var Recoil_RecoilValueInterface$1 = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  RecoilValueReadOnly: Recoil_RecoilValueInterface_1,
  AbstractRecoilValue: Recoil_RecoilValueInterface_2,
  RecoilState: Recoil_RecoilValueInterface_3,
  getRecoilValueAsLoadable: Recoil_RecoilValueInterface_4,
  setRecoilValue: Recoil_RecoilValueInterface_5,
  setUnvalidatedRecoilValue: Recoil_RecoilValueInterface_6,
  subscribeToRecoilValue: Recoil_RecoilValueInterface_7,
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

// flowlint-next-line unclear-type:off
// StoreState represents the state of a Recoil context. It is global and mutable.
// It is updated only during effects, except that the nextTree property is updated
// when atom values change and async requests resolve, and suspendedComponentResolvers
// is updated when components are suspended.
function makeEmptyTreeState() {
  return {
    transactionMetadata: {},
    dirtyAtoms: new Set(),
    atomValues: new Map(),
    nonvalidatedAtoms: new Map(),
    nodeDeps: new Map(),
    nodeToNodeSubscriptions: new Map(),
    nodeToComponentSubscriptions: new Map(),
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
  };
}

function makeEmptyStoreState() {
  return makeStoreState(makeEmptyTreeState());
}

var Recoil_State = {
  makeEmptyTreeState: makeEmptyTreeState,
  makeEmptyStoreState: makeEmptyStoreState,
  makeStoreState: makeStoreState,
};

var DEFAULT_VALUE$1 = Recoil_Node$1.DEFAULT_VALUE,
  recoilValues$1 = Recoil_Node$1.recoilValues;

var getRecoilValueAsLoadable$1 =
    Recoil_RecoilValueInterface$1.getRecoilValueAsLoadable,
  setRecoilValue$1 = Recoil_RecoilValueInterface$1.setRecoilValue;

var makeEmptyTreeState$1 = Recoil_State.makeEmptyTreeState,
  makeStoreState$1 = Recoil_State.makeStoreState; // TODO Temporary until Snapshots only contain state

function makeSnapshotStore(treeState) {
  var storeState = makeStoreState$1(treeState);
  var store = {
    getState: function getState() {
      return storeState;
    },
    replaceState: function replaceState(replacer) {
      storeState.currentTree = replacer(storeState.currentTree); // no batching so nextTree is never active
    },
    subscribeToTransactions: function subscribeToTransactions() {
      return {
        release: function release() {},
      };
    },
    addTransactionMetadata: function addTransactionMetadata() {
      throw new Error('Cannot subscribe to Snapshots');
    },
    fireNodeSubscriptions: function fireNodeSubscriptions() {},
  };
  return store;
} // A "Snapshot" is "read-only" and captures a specific set of values of atoms.
// However, the data-flow-graph and selector values may evolve as selector
// evaluation functions are executed and async selectors resolve.

var Snapshot = /*#__PURE__*/ (function () {
  function Snapshot(treeState) {
    var _this = this;

    _classCallCheck(this, Snapshot);

    _defineProperty(this, '_store', void 0);

    _defineProperty(this, 'getLoadable', function (recoilValue) {
      return getRecoilValueAsLoadable$1(_this._store, recoilValue);
    });

    _defineProperty(this, 'getPromise', function (recoilValue) {
      return _this.getLoadable(recoilValue).toPromise();
    });

    _defineProperty(this, 'getNodes_UNSTABLE', function (opt) {
      // TODO Deal with modified selectors
      if ((opt === null || opt === void 0 ? void 0 : opt.dirty) === true) {
        var state = _this._store.getState().currentTree;

        return Recoil_mapIterable(state.dirtyAtoms, function (key) {
          return Recoil_nullthrows(recoilValues$1.get(key));
        });
      }

      return recoilValues$1.values();
    });

    _defineProperty(this, 'getDeps_UNSTABLE', function (recoilValue) {
      _this.getLoadable(recoilValue); // Evaluate node to ensure deps are up-to-date

      var deps = _this._store
        .getState()
        .currentTree.nodeDeps.get(recoilValue.key);

      return /*#__PURE__*/ regeneratorRuntime.mark(function _callee() {
        var _iterator, _step, key;

        return regeneratorRuntime.wrap(
          function _callee$(_context) {
            while (1) {
              switch ((_context.prev = _context.next)) {
                case 0:
                  _iterator = _createForOfIteratorHelper(
                    deps !== null && deps !== void 0 ? deps : [],
                  );
                  _context.prev = 1;

                  _iterator.s();

                case 3:
                  if ((_step = _iterator.n()).done) {
                    _context.next = 9;
                    break;
                  }

                  key = _step.value;
                  _context.next = 7;
                  return Recoil_nullthrows(recoilValues$1.get(key));

                case 7:
                  _context.next = 3;
                  break;

                case 9:
                  _context.next = 14;
                  break;

                case 11:
                  _context.prev = 11;
                  _context.t0 = _context['catch'](1);

                  _iterator.e(_context.t0);

                case 14:
                  _context.prev = 14;

                  _iterator.f();

                  return _context.finish(14);

                case 17:
                case 'end':
                  return _context.stop();
              }
            }
          },
          _callee,
          null,
          [[1, 11, 14, 17]],
        );
      })();
    });

    _defineProperty(this, 'map', function (mapper) {
      var mutableSnapshot = new MutableSnapshot(
        _this._store.getState().currentTree,
      );
      mapper(mutableSnapshot);
      var newState = mutableSnapshot.getStore_INTERNAL().getState().currentTree;
      return cloneSnapshot(newState);
    });

    _defineProperty(
      this,
      'asyncMap',
      /*#__PURE__*/ (function () {
        var _ref2 = _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee2(mapper) {
            var mutableSnapshot, newState;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch ((_context2.prev = _context2.next)) {
                  case 0:
                    mutableSnapshot = new MutableSnapshot(
                      _this._store.getState().currentTree,
                    );
                    _context2.next = 3;
                    return mapper(mutableSnapshot);

                  case 3:
                    newState = mutableSnapshot.getStore_INTERNAL().getState()
                      .currentTree;
                    return _context2.abrupt('return', cloneSnapshot(newState));

                  case 5:
                  case 'end':
                    return _context2.stop();
                }
              }
            }, _callee2);
          }),
        );

        return function (_x) {
          return _ref2.apply(this, arguments);
        };
      })(),
    );

    this._store = makeSnapshotStore(treeState);
  }

  _createClass(Snapshot, [
    {
      key: 'getStore_INTERNAL',
      value: function getStore_INTERNAL() {
        return this._store;
      },
    },
  ]);

  return Snapshot;
})();

function cloneTreeState(treeState) {
  return {
    transactionMetadata: _objectSpread2({}, treeState.transactionMetadata),
    dirtyAtoms: new Set(treeState.dirtyAtoms),
    atomValues: new Map(treeState.atomValues),
    nonvalidatedAtoms: new Map(treeState.nonvalidatedAtoms),
    nodeDeps: new Map(treeState.nodeDeps),
    nodeToNodeSubscriptions: Recoil_mapMap(
      treeState.nodeToNodeSubscriptions,
      function (keys) {
        return new Set(keys);
      },
    ),
    nodeToComponentSubscriptions: new Map(),
  };
} // Factory to build a fresh snapshot

function freshSnapshot() {
  return new Snapshot(makeEmptyTreeState$1());
} // Factory to clone a snapahot state

function cloneSnapshot(treeState) {
  return new Snapshot(cloneTreeState(treeState));
}

var MutableSnapshot = /*#__PURE__*/ (function (_Snapshot) {
  _inherits(MutableSnapshot, _Snapshot);

  var _super = _createSuper(MutableSnapshot);

  function MutableSnapshot(treeState) {
    var _this2;

    _classCallCheck(this, MutableSnapshot);

    _this2 = _super.call(this, cloneTreeState(treeState));

    _defineProperty(_assertThisInitialized(_this2), 'set', function (
      recoilState,
      newValueOrUpdater,
    ) {
      var store = _this2.getStore_INTERNAL();

      setRecoilValue$1(store, recoilState, newValueOrUpdater);
    });

    _defineProperty(_assertThisInitialized(_this2), 'reset', function (
      recoilState,
    ) {
      return setRecoilValue$1(
        _this2.getStore_INTERNAL(),
        recoilState,
        DEFAULT_VALUE$1,
      );
    });

    return _this2;
  } // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer

  return MutableSnapshot;
})(Snapshot);

var Recoil_Snapshot = {
  Snapshot: Snapshot,
  MutableSnapshot: MutableSnapshot,
  freshSnapshot: freshSnapshot,
  cloneSnapshot: cloneSnapshot,
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

var _require = react,
  useContext = _require.useContext,
  useEffect = _require.useEffect,
  useRef = _require.useRef,
  useState = _require.useState;

var fireNodeSubscriptions$1 = Recoil_FunctionalCore$1.fireNodeSubscriptions,
  setNodeValue$2 = Recoil_FunctionalCore$1.setNodeValue,
  setUnvalidatedAtomValue$2 = Recoil_FunctionalCore$1.setUnvalidatedAtomValue;

var freshSnapshot$1 = Recoil_Snapshot$1.freshSnapshot;

var makeEmptyStoreState$1 = Recoil_State.makeEmptyStoreState,
  makeStoreState$2 = Recoil_State.makeStoreState;

function notInAContext() {
  throw new Error(
    'This component must be used inside a <RecoilRoot> component.',
  );
}

var defaultStore = Object.freeze({
  getState: notInAContext,
  replaceState: notInAContext,
  subscribeToTransactions: notInAContext,
  addTransactionMetadata: notInAContext,
  fireNodeSubscriptions: notInAContext,
});

function startNextTreeIfNeeded(storeState) {
  if (storeState.nextTree === null) {
    storeState.nextTree = _objectSpread2(
      _objectSpread2({}, storeState.currentTree),
      {},
      {
        dirtyAtoms: new Set(),
        transactionMetadata: {},
      },
    );
  }
}

var AppContext = react.createContext({
  current: defaultStore,
});

var useStoreRef = function useStoreRef() {
  return useContext(AppContext);
};
/*
 * The purpose of the Batcher is to observe when React batches end so that
 * Recoil state changes can be batched. Whenever Recoil state changes, we call
 * setState on the batcher. Then we wait for that change to be committed, which
 * signifies the end of the batch. That's when we respond to the Recoil change.
 */

function Batcher(props) {
  var storeRef = useStoreRef();

  var _useState = useState([]),
    _useState2 = _slicedToArray(_useState, 2),
    _ = _useState2[0],
    setState = _useState2[1];

  props.setNotifyBatcherOfChange(function () {
    return setState({});
  });
  useEffect(function () {
    // enqueueExecution runs this function immediately; it is only used to
    // manipulate the order of useEffects during tests, since React seems to
    // call useEffect in an unpredictable order sometimes.
    Recoil_Queue.enqueueExecution('Batcher', function () {
      var storeState = storeRef.current.getState();
      var nextTree = storeState.nextTree; // Ignore commits that are not because of Recoil transactions -- namely,
      // because something above RecoilRoot re-rendered:

      if (nextTree === null) {
        return;
      } // Inform transaction subscribers of the transaction:

      var dirtyAtoms = nextTree.dirtyAtoms;

      if (dirtyAtoms.size) {
        // Execute Node-specific subscribers before global subscribers
        var _iterator = _createForOfIteratorHelper(
            storeState.nodeTransactionSubscriptions,
          ),
          _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var _step$value = _slicedToArray(_step.value, 2),
              key = _step$value[0],
              subscriptions = _step$value[1];

            if (dirtyAtoms.has(key)) {
              var _iterator3 = _createForOfIteratorHelper(subscriptions),
                _step3;

              try {
                for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
                  var subscription = _step3.value;
                  subscription(storeRef.current);
                }
              } catch (err) {
                _iterator3.e(err);
              } finally {
                _iterator3.f();
              }
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }

        var _iterator2 = _createForOfIteratorHelper(
            storeState.transactionSubscriptions,
          ),
          _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
            var _step2$value = _slicedToArray(_step2.value, 2),
              _2 = _step2$value[0],
              _subscription = _step2$value[1];

            _subscription(storeRef.current);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      } // Inform components that depend on dirty atoms of the transaction:
      // FIXME why is this StoreState but dirtyAtoms is TreeState? Seems like they should be the same.

      storeState.queuedComponentCallbacks.forEach(function (cb) {
        return cb(nextTree);
      });
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
}

function initialStoreState_DEPRECATED(store, initializeState) {
  var initial = makeEmptyStoreState$1();
  initializeState({
    set: function set(atom, value) {
      initial.currentTree = setNodeValue$2(
        store,
        initial.currentTree,
        atom.key,
        value,
      )[0];
    },
    setUnvalidatedAtomValues: function setUnvalidatedAtomValues(atomValues) {
      atomValues.forEach(function (v, k) {
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
  var snapshot = freshSnapshot$1().map(initializeState);
  return makeStoreState$2(snapshot.getStore_INTERNAL().getState().currentTree);
}

var nextID = 0;

function RecoilRoot(_ref) {
  var initializeState_DEPRECATED = _ref.initializeState_DEPRECATED,
    initializeState = _ref.initializeState,
    children = _ref.children;
  var storeState; // eslint-disable-line prefer-const

  var subscribeToTransactions = function subscribeToTransactions(
    callback,
    key,
  ) {
    if (key == null) {
      // Global transaction subscriptions
      var _storeRef$current$get = storeRef.current.getState(),
        transactionSubscriptions =
          _storeRef$current$get.transactionSubscriptions;

      var id = nextID++;
      transactionSubscriptions.set(id, callback);
      return {
        release: function release() {
          transactionSubscriptions.delete(id);
        },
      };
    } else {
      // Node-specific transaction subscriptions from onSet() effect
      var _storeRef$current$get2 = storeRef.current.getState(),
        nodeTransactionSubscriptions =
          _storeRef$current$get2.nodeTransactionSubscriptions;

      if (!nodeTransactionSubscriptions.has(key)) {
        nodeTransactionSubscriptions.set(key, []);
      }

      Recoil_nullthrows(nodeTransactionSubscriptions.get(key)).push(callback); // We don't currently support canceling onSet() handlers, but can if needed

      return {
        release: function release() {},
      };
    }
  };

  var addTransactionMetadata = function addTransactionMetadata(metadata) {
    startNextTreeIfNeeded(storeRef.current.getState());

    for (
      var _i = 0, _Object$keys = Object.keys(metadata);
      _i < _Object$keys.length;
      _i++
    ) {
      var k = _Object$keys[_i];
      Recoil_nullthrows(
        storeRef.current.getState().nextTree,
      ).transactionMetadata[k] = metadata[k];
    }
  };

  function fireNodeSubscriptionsForStore(updatedNodes, when) {
    fireNodeSubscriptions$1(storeRef.current, updatedNodes, when);
  }

  var replaceState = function replaceState(replacer) {
    var storeState = storeRef.current.getState();
    startNextTreeIfNeeded(storeState); // Use replacer to get the next state:

    var nextTree = Recoil_nullthrows(storeState.nextTree);
    var replaced = replacer(nextTree);

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

  var notifyBatcherOfChange = useRef(null);

  function setNotifyBatcherOfChange(x) {
    notifyBatcherOfChange.current = x;
  }

  var store = {
    getState: function getState() {
      return storeState.current;
    },
    replaceState: replaceState,
    subscribeToTransactions: subscribeToTransactions,
    addTransactionMetadata: addTransactionMetadata,
    fireNodeSubscriptions: fireNodeSubscriptionsForStore,
  };
  var storeRef = useRef(store);
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
  useStoreRef: useStoreRef,
  RecoilRoot: RecoilRoot,
};

var Recoil_RecoilRoot_react_1 = Recoil_RecoilRoot_react.useStoreRef;
var Recoil_RecoilRoot_react_2 = Recoil_RecoilRoot_react.RecoilRoot;

var Recoil_RecoilRoot_react$1 = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  useStoreRef: Recoil_RecoilRoot_react_1,
  RecoilRoot: Recoil_RecoilRoot_react_2,
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

var Recoil_differenceSets = /*#__PURE__*/ Object.freeze({
  __proto__: null,
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

var Recoil_filterMap = /*#__PURE__*/ Object.freeze({
  __proto__: null,
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

function mergeMaps() {
  var result = new Map();

  for (
    var _len = arguments.length, maps = new Array(_len), _key = 0;
    _key < _len;
    _key++
  ) {
    maps[_key] = arguments[_key];
  }

  for (var i = 0; i < maps.length; i++) {
    var iterator = maps[i].keys();
    var nextKey = void 0;

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

var useCallback = react.useCallback,
  useEffect$1 = react.useEffect,
  useMemo = react.useMemo,
  useRef$1 = react.useRef,
  useState$1 = react.useState;

var DEFAULT_VALUE$2 = Recoil_Node$1.DEFAULT_VALUE,
  getNode$2 = Recoil_Node$1.getNode,
  nodes$1 = Recoil_Node$1.nodes;

var useStoreRef$1 = Recoil_RecoilRoot_react$1.useStoreRef;

var isRecoilValue$1 = Recoil_RecoilValue$1.isRecoilValue;

var AbstractRecoilValue$2 = Recoil_RecoilValueInterface$1.AbstractRecoilValue,
  getRecoilValueAsLoadable$2 =
    Recoil_RecoilValueInterface$1.getRecoilValueAsLoadable,
  setRecoilValue$2 = Recoil_RecoilValueInterface$1.setRecoilValue,
  setUnvalidatedRecoilValue$1 =
    Recoil_RecoilValueInterface$1.setUnvalidatedRecoilValue,
  subscribeToRecoilValue$1 =
    Recoil_RecoilValueInterface$1.subscribeToRecoilValue;

var Snapshot$1 = Recoil_Snapshot$1.Snapshot,
  cloneSnapshot$1 = Recoil_Snapshot$1.cloneSnapshot;

var setByAddingToSet$2 = Recoil_CopyOnWrite.setByAddingToSet;

function handleLoadable(loadable, atom, storeRef) {
  // We can't just throw the promise we are waiting on to Suspense.  If the
  // upstream dependencies change it may produce a state in which the component
  // can render, but it would still be suspended on a Promise that may never resolve.
  if (loadable.state === 'hasValue') {
    return loadable.contents;
  } else if (loadable.state === 'loading') {
    var promise = new Promise(function (resolve) {
      storeRef.current.getState().suspendedComponentResolvers.add(resolve);
    });
    throw promise;
  } else if (loadable.state === 'hasError') {
    throw loadable.contents;
  } else {
    throw new Error('Invalid value of loadable atom "'.concat(atom.key, '"'));
  }
}

function validateRecoilValue(recoilValue, hookName) {
  if (!isRecoilValue$1(recoilValue)) {
    throw new Error(
      'Invalid argument to '
        .concat(hookName, ': expected an atom or selector but got ')
        .concat(String(recoilValue)),
    );
  }
}

function useInterface() {
  var storeRef = useStoreRef$1();

  var _useState = useState$1([]),
    _useState2 = _slicedToArray(_useState, 2),
    _ = _useState2[0],
    forceUpdate = _useState2[1];

  var recoilValuesUsed = useRef$1(new Set());
  recoilValuesUsed.current = new Set(); // Track the RecoilValues used just during this render

  var previousSubscriptions = useRef$1(new Set());
  var subscriptions = useRef$1(new Map());
  var unsubscribeFrom = useCallback(
    function (key) {
      var sub = subscriptions.current.get(key);

      if (sub) {
        sub.release(storeRef.current);
        subscriptions.current.delete(key);
      }
    },
    [storeRef, subscriptions],
  );
  useEffect$1(function () {
    var store = storeRef.current;

    function updateState(_state, key) {
      if (!subscriptions.current.has(key)) {
        return;
      }

      forceUpdate([]);
    }

    Recoil_differenceSets(
      recoilValuesUsed.current,
      previousSubscriptions.current,
    ).forEach(function (key) {
      if (subscriptions.current.has(key)) {
        Recoil_expectationViolation(
          'Double subscription to RecoilValue "'.concat(key, '"'),
        );
        return;
      }

      var sub = subscribeToRecoilValue$1(
        store,
        new AbstractRecoilValue$2(key),
        function (state) {
          Recoil_Tracing.trace(
            'RecoilValue subscription fired',
            key,
            function () {
              updateState(state, key);
            },
          );
        },
      );
      subscriptions.current.set(key, sub);
      Recoil_Tracing.trace('initial update on subscribing', key, function () {
        updateState(store.getState(), key);
      });
    });
    Recoil_differenceSets(
      previousSubscriptions.current,
      recoilValuesUsed.current,
    ).forEach(function (key) {
      unsubscribeFrom(key);
    });
    previousSubscriptions.current = recoilValuesUsed.current;
  });
  useEffect$1(
    function () {
      var subs = subscriptions.current;
      return function () {
        return subs.forEach(function (_, key) {
          return unsubscribeFrom(key);
        });
      };
    },
    [unsubscribeFrom],
  );
  return useMemo(
    function () {
      function useSetRecoilState(recoilState) {
        {
          validateRecoilValue(recoilState, 'useSetRecoilState');
        }

        return function (newValueOrUpdater) {
          setRecoilValue$2(storeRef.current, recoilState, newValueOrUpdater);
        };
      }

      function useResetRecoilState(recoilState) {
        {
          validateRecoilValue(recoilState, 'useResetRecoilState');
        }

        return function () {
          return setRecoilValue$2(
            storeRef.current,
            recoilState,
            DEFAULT_VALUE$2,
          );
        };
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

        var loadable = useRecoilValueLoadable(recoilValue);
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
    },
    [recoilValuesUsed, storeRef],
  );
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
  var recoilInterface = useInterface();

  var _recoilInterface$getR = recoilInterface.getRecoilState(recoilState),
    _recoilInterface$getR2 = _slicedToArray(_recoilInterface$getR, 1),
    value = _recoilInterface$getR2[0];

  var setValue = useCallback(recoilInterface.getSetRecoilState(recoilState), [
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
  var recoilInterface = useInterface();

  var _recoilInterface$getR3 = recoilInterface.getRecoilStateLoadable(
      recoilState,
    ),
    _recoilInterface$getR4 = _slicedToArray(_recoilInterface$getR3, 1),
    value = _recoilInterface$getR4[0];

  var setValue = useCallback(recoilInterface.getSetRecoilState(recoilState), [
    recoilState,
  ]);
  return [value, setValue];
}

function useTransactionSubscription(callback) {
  var storeRef = useStoreRef$1();
  useEffect$1(
    function () {
      var sub = storeRef.current.subscribeToTransactions(callback);
      return sub.release;
    },
    [callback, storeRef],
  );
}

function externallyVisibleAtomValuesInState(state) {
  var atomValues = state.atomValues;
  var persistedAtomContentsValues = Recoil_mapMap(
    Recoil_filterMap(atomValues, function (v, k) {
      var _node$options;

      var node = getNode$2(k);
      var persistence =
        (_node$options = node.options) === null || _node$options === void 0
          ? void 0
          : _node$options.persistence_UNSTABLE;
      return (
        persistence != null &&
        persistence.type !== 'none' &&
        v.state === 'hasValue'
      );
    }),
    function (v) {
      return v.contents;
    },
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
      function (store) {
        var previousState = store.getState().currentTree;
        var nextState = store.getState().nextTree;

        if (!nextState) {
          Recoil_recoverableViolation(
            'Transaction subscribers notified without a next tree being present -- this is a bug in Recoil',
            'recoil',
          );
          nextState = store.getState().currentTree; // attempt to trundle on
        }

        var atomValues = externallyVisibleAtomValuesInState(nextState);
        var previousAtomValues = externallyVisibleAtomValuesInState(
          previousState,
        );
        var atomInfo = Recoil_mapMap(nodes$1, function (node) {
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
        var modifiedAtoms = new Set(nextState.dirtyAtoms);
        callback({
          atomValues: atomValues,
          previousAtomValues: previousAtomValues,
          atomInfo: atomInfo,
          modifiedAtoms: modifiedAtoms,
          transactionMetadata: _objectSpread2(
            {},
            nextState.transactionMetadata,
          ),
        });
      },
      [callback],
    ),
  );
}

function useRecoilTransactionObserver(callback) {
  useTransactionSubscription(
    useCallback(
      function (store) {
        var previousState = store.getState().currentTree;
        var nextState = store.getState().nextTree;

        if (!nextState) {
          Recoil_recoverableViolation(
            'Transaction subscribers notified without a next tree being present -- this is a bug in Recoil',
            'recoil',
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
  var store = useStoreRef$1();

  var _useState3 = useState$1(function () {
      return cloneSnapshot$1(store.current.getState().currentTree);
    }),
    _useState4 = _slicedToArray(_useState3, 2),
    snapshot = _useState4[0],
    setSnapshot = _useState4[1];

  useTransactionSubscription(
    useCallback(function (store) {
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
  var storeRef = useStoreRef$1();
  return useCallback(
    function (snapshot) {
      reactDom.unstable_batchedUpdates(function () {
        storeRef.current.replaceState(function (prevState) {
          var nextState = snapshot.getStore_INTERNAL().getState().currentTree; // Fire subscriptions for any atoms that changed values

          var updatedKeys = new Set(); // Going through both seems to be more efficient than constructing a union set of keys

          for (
            var _i = 0,
              _arr = [prevState.atomValues.keys(), nextState.atomValues.keys()];
            _i < _arr.length;
            _i++
          ) {
            var keys = _arr[_i];

            var _iterator = _createForOfIteratorHelper(keys),
              _step;

            try {
              for (_iterator.s(); !(_step = _iterator.n()).done; ) {
                var _prevState$atomValues, _nextState$atomValues;

                var key = _step.value;

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
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }

          storeRef.current.fireNodeSubscriptions(updatedKeys, 'enqueue');
          return _objectSpread2(
            _objectSpread2({}, nextState),
            {},
            {
              nodeToComponentSubscriptions:
                prevState.nodeToComponentSubscriptions,
            },
          );
        });
      });
    },
    [storeRef],
  );
}

function useSetUnvalidatedAtomValues() {
  var storeRef = useStoreRef$1();
  return function (values) {
    var transactionMetadata =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    reactDom.unstable_batchedUpdates(function () {
      storeRef.current.addTransactionMetadata(transactionMetadata);
      values.forEach(function (value, key) {
        return setUnvalidatedRecoilValue$1(
          storeRef.current,
          new AbstractRecoilValue$2(key),
          value,
        );
      });
    });
  };
}

var Sentinel = function Sentinel() {
  _classCallCheck(this, Sentinel);
};

var SENTINEL = new Sentinel();

function useRecoilCallback(fn, deps) {
  var storeRef = useStoreRef$1();
  var gotoSnapshot = useGotoRecoilSnapshot();
  return useCallback(
    function () {
      for (
        var _len = arguments.length, args = new Array(_len), _key = 0;
        _key < _len;
        _key++
      ) {
        args[_key] = arguments[_key];
      }

      // Use currentTree for the snapshot to show the currently committed stable state
      var snapshot = cloneSnapshot$1(storeRef.current.getState().currentTree);

      function set(recoilState, newValueOrUpdater) {
        setRecoilValue$2(storeRef.current, recoilState, newValueOrUpdater);
      }

      function reset(recoilState) {
        setRecoilValue$2(storeRef.current, recoilState, DEFAULT_VALUE$2);
      }

      var ret = SENTINEL;
      reactDom.unstable_batchedUpdates(function () {
        // flowlint-next-line unclear-type:off
        ret = fn({
          set: set,
          reset: reset,
          snapshot: snapshot,
          gotoSnapshot: gotoSnapshot,
        }).apply(void 0, args);
      });
      !!(ret instanceof Sentinel)
        ? Recoil_invariant(
            false,
            'unstable_batchedUpdates should return immediately',
          )
        : void 0;
      return ret;
    },
    deps != null ? [].concat(_toConsumableArray(deps), [storeRef]) : undefined, // eslint-disable-line fb-www/react-hooks-deps
  );
}

var Recoil_Hooks = {
  useRecoilCallback: useRecoilCallback,
  useRecoilValue: useRecoilValue,
  useRecoilValueLoadable: useRecoilValueLoadable,
  useRecoilState: useRecoilState,
  useRecoilStateLoadable: useRecoilStateLoadable,
  useSetRecoilState: useSetRecoilState,
  useResetRecoilState: useResetRecoilState,
  useRecoilInterface: useInterface,
  useTransactionSubscription_DEPRECATED: useTransactionSubscription,
  useTransactionObservation_DEPRECATED: useTransactionObservation_DEPRECATED,
  useRecoilTransactionObserver: useRecoilTransactionObserver,
  useRecoilSnapshot: useRecoilSnapshot,
  useGotoRecoilSnapshot: useGotoRecoilSnapshot,
  useSetUnvalidatedAtomValues: useSetUnvalidatedAtomValues,
};

var Recoil_Hooks_1 = Recoil_Hooks.useRecoilCallback;
var Recoil_Hooks_2 = Recoil_Hooks.useRecoilValue;
var Recoil_Hooks_3 = Recoil_Hooks.useRecoilValueLoadable;
var Recoil_Hooks_4 = Recoil_Hooks.useRecoilState;
var Recoil_Hooks_5 = Recoil_Hooks.useRecoilStateLoadable;
var Recoil_Hooks_6 = Recoil_Hooks.useSetRecoilState;
var Recoil_Hooks_7 = Recoil_Hooks.useResetRecoilState;
var Recoil_Hooks_8 = Recoil_Hooks.useRecoilInterface;
var Recoil_Hooks_9 = Recoil_Hooks.useTransactionSubscription_DEPRECATED;
var Recoil_Hooks_10 = Recoil_Hooks.useTransactionObservation_DEPRECATED;
var Recoil_Hooks_11 = Recoil_Hooks.useRecoilTransactionObserver;
var Recoil_Hooks_12 = Recoil_Hooks.useRecoilSnapshot;
var Recoil_Hooks_13 = Recoil_Hooks.useGotoRecoilSnapshot;
var Recoil_Hooks_14 = Recoil_Hooks.useSetUnvalidatedAtomValues;

var Recoil_Hooks$1 = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  useRecoilCallback: Recoil_Hooks_1,
  useRecoilValue: Recoil_Hooks_2,
  useRecoilValueLoadable: Recoil_Hooks_3,
  useRecoilState: Recoil_Hooks_4,
  useRecoilStateLoadable: Recoil_Hooks_5,
  useSetRecoilState: Recoil_Hooks_6,
  useResetRecoilState: Recoil_Hooks_7,
  useRecoilInterface: Recoil_Hooks_8,
  useTransactionSubscription_DEPRECATED: Recoil_Hooks_9,
  useTransactionObservation_DEPRECATED: Recoil_Hooks_10,
  useRecoilTransactionObserver: Recoil_Hooks_11,
  useRecoilSnapshot: Recoil_Hooks_12,
  useGotoRecoilSnapshot: Recoil_Hooks_13,
  useSetUnvalidatedAtomValues: Recoil_Hooks_14,
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

var loadableAccessors = {
  getValue: function getValue() {
    if (this.state !== 'hasValue') {
      throw this.contents; // Throw Error, or Promise for the loading state
    }

    return this.contents;
  },
  toPromise: function toPromise() {
    return this.state === 'hasValue'
      ? Promise.resolve(this.contents)
      : this.state === 'hasError'
      ? Promise.reject(this.contents)
      : this.contents;
  },
  valueMaybe: function valueMaybe() {
    return this.state === 'hasValue' ? this.contents : undefined;
  },
  valueOrThrow: function valueOrThrow() {
    if (this.state !== 'hasValue') {
      throw new Error(
        'Loadable expected value, but in "'.concat(this.state, '" state'),
      );
    }

    return this.contents;
  },
  errorMaybe: function errorMaybe() {
    return this.state === 'hasError' ? this.contents : undefined;
  },
  errorOrThrow: function errorOrThrow() {
    if (this.state !== 'hasError') {
      throw new Error(
        'Loadable expected error, but in "'.concat(this.state, '" state'),
      );
    }

    return this.contents;
  },
  promiseMaybe: function promiseMaybe() {
    return this.state === 'loading' ? this.contents : undefined;
  },
  promiseOrThrow: function promiseOrThrow() {
    if (this.state !== 'loading') {
      throw new Error(
        'Loadable expected promise, but in "'.concat(this.state, '" state'),
      );
    }

    return this.contents;
  },
  // TODO Unit tests
  // TODO Convert Loadable to a Class to better support chaining
  //      by returning a Loadable from a map function
  map: (function (_map) {
    function map(_x) {
      return _map.apply(this, arguments);
    }

    map.toString = function () {
      return _map.toString();
    };

    return map;
  })(function (map) {
    var _this = this;

    if (this.state === 'hasError') {
      return this;
    }

    if (this.state === 'hasValue') {
      try {
        var next = map(this.contents); // TODO if next instanceof Loadable, then return next

        return Recoil_isPromise(next)
          ? loadableWithPromise(next)
          : loadableWithValue(next);
      } catch (e) {
        return Recoil_isPromise(e) // If we "suspended", then try again.
          ? // errors and subsequent retries will be handled in 'loading' case
            loadableWithPromise(
              e.next(function () {
                return map(_this.contents);
              }),
            )
          : loadableWithError(e);
      }
    }

    if (this.state === 'loading') {
      return loadableWithPromise(
        this.contents // TODO if map returns a loadable, then return the value or promise or throw the error
          .then(map)
          .catch(function (e) {
            if (Recoil_isPromise(e)) {
              // we were "suspended," try again
              return e.then(function () {
                return map(_this.contents);
              });
            }

            throw e;
          }),
      );
    }

    throw new Error('Invalid Loadable state');
  }),
};

function loadableWithValue(value) {
  // Build objects this way since Flow doesn't support disjoint unions for class properties
  return Object.freeze(
    _objectSpread2(
      {
        state: 'hasValue',
        contents: value,
      },
      loadableAccessors,
    ),
  );
}

function loadableWithError(error) {
  return Object.freeze(
    _objectSpread2(
      {
        state: 'hasError',
        contents: error,
      },
      loadableAccessors,
    ),
  );
}

function loadableWithPromise(promise) {
  return Object.freeze(
    _objectSpread2(
      {
        state: 'loading',
        contents: promise,
      },
      loadableAccessors,
    ),
  );
}

function loadableLoading() {
  return loadableWithPromise(new Promise(function () {}));
}

function loadableAll(inputs) {
  return inputs.every(function (i) {
    return i.state === 'hasValue';
  })
    ? loadableWithValue(
        inputs.map(function (i) {
          return i.contents;
        }),
      )
    : inputs.some(function (i) {
        return i.state === 'hasError';
      })
    ? loadableWithError(
        // $FlowIssue #44070740 Array.find should refine parameter
        Recoil_nullthrows(
          inputs.find(function (i) {
            return i.state === 'hasError';
          }),
          'Invalid loadable passed to loadableAll',
        ).contents,
      )
    : loadableWithPromise(
        Promise.all(
          inputs.map(function (i) {
            return i.contents;
          }),
        ),
      );
}

var Recoil_Loadable = {
  loadableWithValue: loadableWithValue,
  loadableWithError: loadableWithError,
  loadableWithPromise: loadableWithPromise,
  loadableLoading: loadableLoading,
  loadableAll: loadableAll,
};

var Recoil_Loadable_1 = Recoil_Loadable.loadableWithValue;
var Recoil_Loadable_2 = Recoil_Loadable.loadableWithError;
var Recoil_Loadable_3 = Recoil_Loadable.loadableWithPromise;
var Recoil_Loadable_4 = Recoil_Loadable.loadableLoading;
var Recoil_Loadable_5 = Recoil_Loadable.loadableAll;

var Recoil_Loadable$1 = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  loadableWithValue: Recoil_Loadable_1,
  loadableWithError: Recoil_Loadable_2,
  loadableWithPromise: Recoil_Loadable_3,
  loadableLoading: Recoil_Loadable_4,
  loadableAll: Recoil_Loadable_5,
});

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

var Recoil_ArrayKeyedMap = /*#__PURE__*/ Object.freeze({
  __proto__: null,
});

function cacheWithReferenceEquality() {
  return new Recoil_ArrayKeyedMap();
}

var Recoil_cacheWithReferenceEquality = cacheWithReferenceEquality;

var loadableWithError$1 = Recoil_Loadable$1.loadableWithError,
  loadableWithPromise$1 = Recoil_Loadable$1.loadableWithPromise,
  loadableWithValue$1 = Recoil_Loadable$1.loadableWithValue;

var detectCircularDependencies$1 =
    Recoil_FunctionalCore$1.detectCircularDependencies,
  getNodeLoadable$2 = Recoil_FunctionalCore$1.getNodeLoadable,
  setNodeValue$3 = Recoil_FunctionalCore$1.setNodeValue;

var DEFAULT_VALUE$3 = Recoil_Node$1.DEFAULT_VALUE,
  RecoilValueNotReady$2 = Recoil_Node$1.RecoilValueNotReady,
  registerNode$1 = Recoil_Node$1.registerNode;

var isRecoilValue$2 = Recoil_RecoilValue$1.isRecoilValue;

var emptySet$1 = Object.freeze(new Set());

var loadableWithError$2 = Recoil_Loadable$1.loadableWithError,
  loadableWithPromise$2 = Recoil_Loadable$1.loadableWithPromise,
  loadableWithValue$2 = Recoil_Loadable$1.loadableWithValue;

var detectCircularDependencies$2 =
    Recoil_FunctionalCore$1.detectCircularDependencies,
  getNodeLoadable$3 = Recoil_FunctionalCore$1.getNodeLoadable,
  setNodeValue$4 = Recoil_FunctionalCore$1.setNodeValue;

var DEFAULT_VALUE$4 = Recoil_Node$1.DEFAULT_VALUE,
  RecoilValueNotReady$3 = Recoil_Node$1.RecoilValueNotReady,
  registerNode$2 = Recoil_Node$1.registerNode;

var isRecoilValue$3 = Recoil_RecoilValue$1.isRecoilValue;

// flowlint-next-line unclear-type:off
var emptySet$2 = Object.freeze(new Set());

var Recoil_selector_OLD = /*#__PURE__*/ Object.freeze({
  __proto__: null,
});

var selector = Recoil_selector_OLD;
var Recoil_selector = selector;

// @fb-only: const {scopedAtom} = require('Recoil_ScopedAtom');
var loadableWithValue$3 = Recoil_Loadable$1.loadableWithValue;

var DEFAULT_VALUE$5 = Recoil_Node$1.DEFAULT_VALUE,
  DefaultValue$1 = Recoil_Node$1.DefaultValue,
  registerNode$3 = Recoil_Node$1.registerNode;

var isRecoilValue$4 = Recoil_RecoilValue$1.isRecoilValue;

var setRecoilValue$3 = Recoil_RecoilValueInterface$1.setRecoilValue;

var Recoil_atom = /*#__PURE__*/ Object.freeze({
  __proto__: null,
});

var Recoil_stableStringify = /*#__PURE__*/ Object.freeze({
  __proto__: null,
});

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
  var map = new Map();
  var cache = {
    get: function get(key) {
      return map.get(Recoil_stableStringify(key));
    },
    set: function set(key, value) {
      map.set(Recoil_stableStringify(key), value);
      return cache;
    },
    map: map, // For debugging
  };
  return cache;
}

var Recoil_cacheWithValueEquality = cacheWithValueEquality;

// Keep in mind the parameter needs to be serializable as a cahche key
// using Recoil_stableStringify

// Add a unique index to each selector in case the cache implementation allows
// duplicate keys based on equivalent stringified parameters
var nextIndex = 0;
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

  var selectorCache =
    (_options$cacheImpleme =
      (_options$cacheImpleme2 =
        options.cacheImplementationForParams_UNSTABLE) === null ||
      _options$cacheImpleme2 === void 0
        ? void 0
        : _options$cacheImpleme2.call(options)) !== null &&
    _options$cacheImpleme !== void 0
      ? _options$cacheImpleme
      : Recoil_cacheWithValueEquality();
  return function (params) {
    var _stableStringify, _options$cacheImpleme3;

    var cachedSelector = selectorCache.get(params);

    if (cachedSelector != null) {
      return cachedSelector;
    }

    var myKey = ''
      .concat(options.key, '__selectorFamily/')
      .concat(
        (_stableStringify = Recoil_stableStringify(params, {
          // It is possible to use functions in parameters if the user uses
          // a cache with reference equality thanks to the incrementing index.
          allowFunctions: true,
        })) !== null && _stableStringify !== void 0
          ? _stableStringify
          : 'void',
        '/',
      )
      .concat(nextIndex++); // Append index in case values serialize to the same key string

    var myGet = function myGet(callbacks) {
      return options.get(params)(callbacks);
    };

    var myCacheImplementation =
      (_options$cacheImpleme3 = options.cacheImplementation_UNSTABLE) ===
        null || _options$cacheImpleme3 === void 0
        ? void 0
        : _options$cacheImpleme3.call(options);
    var newSelector;

    if (options.set != null) {
      var set = options.set;

      var mySet = function mySet(callbacks, newValue) {
        return set(params)(callbacks, newValue);
      };

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

var DEFAULT_VALUE$6 = Recoil_Node$1.DEFAULT_VALUE,
  DefaultValue$2 = Recoil_Node$1.DefaultValue;

var Recoil_atomFamily = /*#__PURE__*/ Object.freeze({
  __proto__: null,
});

// flowlint-next-line unclear-type:off

var constantSelector = Recoil_selectorFamily({
  key: '__constant',
  get: function get(constant) {
    return function () {
      return constant;
    };
  },
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

var throwingSelector = Recoil_selectorFamily({
  key: '__error',
  get: function get(message) {
    return function () {
      throw new Error(message);
    };
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

var loadableWithError$3 = Recoil_Loadable$1.loadableWithError,
  loadableWithPromise$3 = Recoil_Loadable$1.loadableWithPromise,
  loadableWithValue$4 = Recoil_Loadable$1.loadableWithValue;

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
  var results = Array(deps.length).fill(undefined);
  var exceptions = Array(deps.length).fill(undefined);

  var _iterator = _createForOfIteratorHelper(deps.entries()),
    _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done; ) {
      var _step$value = _slicedToArray(_step.value, 2),
        i = _step$value[0],
        dep = _step$value[1];

      try {
        results[i] = getRecoilValue(dep);
      } catch (e) {
        // exceptions can either be Promises of pending results or real errors
        exceptions[i] = e;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return [results, exceptions];
}

function isError(exp) {
  return exp != null && !Recoil_isPromise(exp);
}

function unwrapDependencies(dependencies) {
  return Array.isArray(dependencies)
    ? dependencies
    : Object.getOwnPropertyNames(dependencies).map(function (key) {
        return dependencies[key];
      });
}

function wrapResults(dependencies, results) {
  return Array.isArray(dependencies)
    ? results // Object.getOwnPropertyNames() has consistent key ordering with ES6
    : Object.getOwnPropertyNames(dependencies).reduce(function (out, key, idx) {
        return _objectSpread2(
          _objectSpread2({}, out),
          {},
          _defineProperty({}, key, results[idx]),
        );
      }, {});
}

function wrapLoadables(dependencies, results, exceptions) {
  var output = exceptions.map(function (exception, idx) {
    return exception == null
      ? loadableWithValue$4(results[idx])
      : Recoil_isPromise(exception)
      ? loadableWithPromise$3(exception)
      : loadableWithError$3(exception);
  });
  return wrapResults(dependencies, output);
} // Selector that requests all dependencies in parallel and immediately returns
// current results without waiting.

var waitForNone = Recoil_selectorFamily({
  key: '__waitForNone',
  get: function get(dependencies) {
    return function (_ref) {
      var get = _ref.get;
      // Issue requests for all dependencies in parallel.
      var deps = unwrapDependencies(dependencies);

      var _concurrentRequests = concurrentRequests(get, deps),
        _concurrentRequests2 = _slicedToArray(_concurrentRequests, 2),
        results = _concurrentRequests2[0],
        exceptions = _concurrentRequests2[1]; // Always return the current status of the results; never block.

      return wrapLoadables(dependencies, results, exceptions);
    };
  },
}); // Selector that requests all dependencies in parallel and waits for at least
// one to be available before returning results.  It will only error if all
// dependencies have errors.

var waitForAny = Recoil_selectorFamily({
  key: '__waitForAny',
  get: function get(dependencies) {
    return function (_ref2) {
      var get = _ref2.get;
      // Issue requests for all dependencies in parallel.
      // Exceptions can either be Promises of pending results or real errors
      var deps = unwrapDependencies(dependencies);

      var _concurrentRequests3 = concurrentRequests(get, deps),
        _concurrentRequests4 = _slicedToArray(_concurrentRequests3, 2),
        results = _concurrentRequests4[0],
        exceptions = _concurrentRequests4[1]; // If any results are available, return the current status

      if (
        exceptions.some(function (exp) {
          return exp == null;
        })
      ) {
        return wrapLoadables(dependencies, results, exceptions);
      } // Since we are waiting for any results, only throw an error if all
      // dependencies have an error.  Then, throw the first one.

      if (exceptions.every(isError)) {
        throw exceptions.find(isError);
      }

      {
        throw new Promise(function (resolve, reject) {
          var _iterator3 = _createForOfIteratorHelper(exceptions.entries()),
            _step3;

          try {
            var _loop2 = function _loop2() {
              var _step3$value = _slicedToArray(_step3.value, 2),
                i = _step3$value[0],
                exp = _step3$value[1];

              if (Recoil_isPromise(exp)) {
                exp
                  .then(function (result) {
                    results[i] = result;
                    exceptions[i] = null;
                    resolve(wrapLoadables(dependencies, results, exceptions));
                  })
                  .catch(function (error) {
                    exceptions[i] = error;

                    if (exceptions.every(isError)) {
                      reject(exceptions[0]);
                    }
                  });
              }
            };

            for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
              _loop2();
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
        });
      }
    };
  },
}); // Selector that requests all dependencies in parallel and waits for all to be
// available before returning a value.  It will error if any dependencies error.

var waitForAll = Recoil_selectorFamily({
  key: '__waitForAll',
  get: function get(dependencies) {
    return function (_ref3) {
      var get = _ref3.get;
      // Issue requests for all dependencies in parallel.
      // Exceptions can either be Promises of pending results or real errors
      var deps = unwrapDependencies(dependencies);

      var _concurrentRequests5 = concurrentRequests(get, deps),
        _concurrentRequests6 = _slicedToArray(_concurrentRequests5, 2),
        results = _concurrentRequests6[0],
        exceptions = _concurrentRequests6[1]; // If all results are available, return the results

      if (
        exceptions.every(function (exp) {
          return exp == null;
        })
      ) {
        return wrapResults(dependencies, results);
      } // If we have any errors, throw the first error

      var error = exceptions.find(isError);

      if (error != null) {
        throw error;
      }

      {
        throw Promise.all(exceptions).then(function (results) {
          return wrapResults(dependencies, results);
        });
      }
    };
  },
});
var noWait = Recoil_selectorFamily({
  key: '__noWait',
  get: function get(dependency) {
    return function (_ref4) {
      var get = _ref4.get;

      try {
        return loadableWithValue$4(get(dependency));
      } catch (exception) {
        return Recoil_isPromise(exception)
          ? loadableWithPromise$3(exception)
          : loadableWithError$3(exception);
      }
    };
  },
});
var Recoil_WaitFor = {
  waitForNone: waitForNone,
  waitForAny: waitForAny,
  waitForAll: waitForAll,
  noWait: noWait,
};

var Recoil_WaitFor_1 = Recoil_WaitFor.waitForNone;
var Recoil_WaitFor_2 = Recoil_WaitFor.waitForAny;
var Recoil_WaitFor_3 = Recoil_WaitFor.waitForAll;
var Recoil_WaitFor_4 = Recoil_WaitFor.noWait;

var Recoil_WaitFor$1 = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  waitForNone: Recoil_WaitFor_1,
  waitForAny: Recoil_WaitFor_2,
  waitForAll: Recoil_WaitFor_3,
  noWait: Recoil_WaitFor_4,
});

var DefaultValue$3 = Recoil_Node$1.DefaultValue;

var RecoilRoot$1 = Recoil_RecoilRoot_react$1.RecoilRoot;

var isRecoilValue$5 = Recoil_RecoilValue$1.isRecoilValue;

var useGotoRecoilSnapshot$1 = Recoil_Hooks$1.useGotoRecoilSnapshot,
  useRecoilCallback$1 = Recoil_Hooks$1.useRecoilCallback,
  useRecoilSnapshot$1 = Recoil_Hooks$1.useRecoilSnapshot,
  useRecoilState$1 = Recoil_Hooks$1.useRecoilState,
  useRecoilStateLoadable$1 = Recoil_Hooks$1.useRecoilStateLoadable,
  useRecoilTransactionObserver$1 = Recoil_Hooks$1.useRecoilTransactionObserver,
  useRecoilValue$1 = Recoil_Hooks$1.useRecoilValue,
  useRecoilValueLoadable$1 = Recoil_Hooks$1.useRecoilValueLoadable,
  useResetRecoilState$1 = Recoil_Hooks$1.useResetRecoilState,
  useSetRecoilState$1 = Recoil_Hooks$1.useSetRecoilState,
  useSetUnvalidatedAtomValues$1 = Recoil_Hooks$1.useSetUnvalidatedAtomValues,
  useTransactionObservation_DEPRECATED$1 =
    Recoil_Hooks$1.useTransactionObservation_DEPRECATED;

var noWait$1 = Recoil_WaitFor$1.noWait,
  waitForAll$1 = Recoil_WaitFor$1.waitForAll,
  waitForAny$1 = Recoil_WaitFor$1.waitForAny,
  waitForNone$1 = Recoil_WaitFor$1.waitForNone;

var Recoil_index = {
  // Types
  DefaultValue: DefaultValue$3,
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

export default Recoil_index;
export {
  Recoil_index_1 as DefaultValue,
  Recoil_index_2 as RecoilRoot,
  Recoil_index_3 as atom,
  Recoil_index_5 as atomFamily,
  Recoil_index_7 as constSelector,
  Recoil_index_8 as errorSelector,
  Recoil_index_26 as isRecoilValue,
  Recoil_index_22 as noWait,
  Recoil_index_9 as readOnlySelector,
  Recoil_index_4 as selector,
  Recoil_index_6 as selectorFamily,
  Recoil_index_17 as useGotoRecoilSnapshot,
  Recoil_index_16 as useRecoilCallback,
  Recoil_index_18 as useRecoilSnapshot,
  Recoil_index_12 as useRecoilState,
  Recoil_index_13 as useRecoilStateLoadable,
  Recoil_index_19 as useRecoilTransactionObserver_UNSTABLE,
  Recoil_index_10 as useRecoilValue,
  Recoil_index_11 as useRecoilValueLoadable,
  Recoil_index_15 as useResetRecoilState,
  Recoil_index_14 as useSetRecoilState,
  Recoil_index_21 as useSetUnvalidatedAtomValues_UNSTABLE,
  Recoil_index_20 as useTransactionObservation_UNSTABLE,
  Recoil_index_25 as waitForAll,
  Recoil_index_24 as waitForAny,
  Recoil_index_23 as waitForNone,
};
