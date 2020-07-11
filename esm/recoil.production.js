import react from 'react';
import reactDom from 'react-dom';
var Recoil_recoverableViolation = function (message, projectName) {
  var _ref =
    arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
  return _ref.error, null;
};
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg),
      value = info.value;
  } catch (error) {
    return void reject(error);
  }
  info.done ? resolve(value) : Promise.resolve(value).then(_next, _throw);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor))
    throw new TypeError('Cannot call a class as a function');
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    (descriptor.enumerable = descriptor.enumerable || !1),
      (descriptor.configurable = !0),
      'value' in descriptor && (descriptor.writable = !0),
      Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _defineProperty(obj, key, value) {
  return (
    key in obj
      ? Object.defineProperty(obj, key, {
          value: value,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (obj[key] = value),
    obj
  );
}
function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly &&
      (symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })),
      keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2
      ? ownKeys(Object(source), !0).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        })
      : Object.getOwnPropertyDescriptors
      ? Object.defineProperties(
          target,
          Object.getOwnPropertyDescriptors(source),
        )
      : ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(
            target,
            key,
            Object.getOwnPropertyDescriptor(source, key),
          );
        });
  }
  return target;
}
function _inherits(subClass, superClass) {
  if ('function' != typeof superClass && null !== superClass)
    throw new TypeError('Super expression must either be null or a function');
  (subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {value: subClass, writable: !0, configurable: !0},
  })),
    superClass && _setPrototypeOf(subClass, superClass);
}
function _getPrototypeOf(o) {
  return (_getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function (o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      })(o);
}
function _setPrototypeOf(o, p) {
  return (_setPrototypeOf =
    Object.setPrototypeOf ||
    function (o, p) {
      return (o.__proto__ = p), o;
    })(o, p);
}
function _isNativeReflectConstruct() {
  if ('undefined' == typeof Reflect || !Reflect.construct) return !1;
  if (Reflect.construct.sham) return !1;
  if ('function' == typeof Proxy) return !0;
  try {
    return (
      Date.prototype.toString.call(Reflect.construct(Date, [], function () {})),
      !0
    );
  } catch (e) {
    return !1;
  }
}
function _construct(Parent, args, Class) {
  return (_construct = _isNativeReflectConstruct()
    ? Reflect.construct
    : function (Parent, args, Class) {
        var a = [null];
        a.push.apply(a, args);
        var instance = new (Function.bind.apply(Parent, a))();
        return Class && _setPrototypeOf(instance, Class.prototype), instance;
      }).apply(null, arguments);
}
function _wrapNativeSuper(Class) {
  var _cache = 'function' == typeof Map ? new Map() : void 0;
  return (_wrapNativeSuper = function (Class) {
    if (
      null === Class ||
      ((fn = Class), -1 === Function.toString.call(fn).indexOf('[native code]'))
    )
      return Class;
    var fn;
    if ('function' != typeof Class)
      throw new TypeError('Super expression must either be null or a function');
    if (void 0 !== _cache) {
      if (_cache.has(Class)) return _cache.get(Class);
      _cache.set(Class, Wrapper);
    }
    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }
    return (
      (Wrapper.prototype = Object.create(Class.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: !1,
          writable: !0,
          configurable: !0,
        },
      })),
      _setPrototypeOf(Wrapper, Class)
    );
  })(Class);
}
function _assertThisInitialized(self) {
  if (void 0 === self)
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called",
    );
  return self;
}
function _possibleConstructorReturn(self, call) {
  return !call || ('object' != typeof call && 'function' != typeof call)
    ? _assertThisInitialized(self)
    : call;
}
function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function () {
    var result,
      Super = _getPrototypeOf(Derived);
    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else result = Super.apply(this, arguments);
    return _possibleConstructorReturn(this, result);
  };
}
function _slicedToArray(arr, i) {
  return (
    (function (arr) {
      if (Array.isArray(arr)) return arr;
    })(arr) ||
    (function (arr, i) {
      if ('undefined' == typeof Symbol || !(Symbol.iterator in Object(arr)))
        return;
      var _arr = [],
        _n = !0,
        _d = !1,
        _e = void 0;
      try {
        for (
          var _s, _i = arr[Symbol.iterator]();
          !(_n = (_s = _i.next()).done) &&
          (_arr.push(_s.value), !i || _arr.length !== i);
          _n = !0
        );
      } catch (err) {
        (_d = !0), (_e = err);
      } finally {
        try {
          _n || null == _i.return || _i.return();
        } finally {
          if (_d) throw _e;
        }
      }
      return _arr;
    })(arr, i) ||
    _unsupportedIterableToArray(arr, i) ||
    (function () {
      throw new TypeError(
        'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
      );
    })()
  );
}
function _toConsumableArray(arr) {
  return (
    (function (arr) {
      if (Array.isArray(arr)) return _arrayLikeToArray(arr);
    })(arr) ||
    (function (iter) {
      if ('undefined' != typeof Symbol && Symbol.iterator in Object(iter))
        return Array.from(iter);
    })(arr) ||
    _unsupportedIterableToArray(arr) ||
    (function () {
      throw new TypeError(
        'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
      );
    })()
  );
}
function _unsupportedIterableToArray(o, minLen) {
  if (o) {
    if ('string' == typeof o) return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    return (
      'Object' === n && o.constructor && (n = o.constructor.name),
      'Map' === n || 'Set' === n
        ? Array.from(o)
        : 'Arguments' === n ||
          /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
        ? _arrayLikeToArray(o, minLen)
        : void 0
    );
  }
}
function _arrayLikeToArray(arr, len) {
  (null == len || len > arr.length) && (len = arr.length);
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _createForOfIteratorHelper(o, allowArrayLike) {
  var it;
  if ('undefined' == typeof Symbol || null == o[Symbol.iterator]) {
    if (
      Array.isArray(o) ||
      (it = _unsupportedIterableToArray(o)) ||
      (allowArrayLike && o && 'number' == typeof o.length)
    ) {
      it && (o = it);
      var i = 0,
        F = function () {};
      return {
        s: F,
        n: function () {
          return i >= o.length ? {done: !0} : {done: !1, value: o[i++]};
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
  var err,
    normalCompletion = !0,
    didErr = !1;
  return {
    s: function () {
      it = o[Symbol.iterator]();
    },
    n: function () {
      var step = it.next();
      return (normalCompletion = step.done), step;
    },
    e: function (e) {
      (didErr = !0), (err = e);
    },
    f: function () {
      try {
        normalCompletion || null == it.return || it.return();
      } finally {
        if (didErr) throw err;
      }
    },
  };
}
var AbstractRecoilValue = function AbstractRecoilValue(newKey) {
    _classCallCheck(this, AbstractRecoilValue),
      _defineProperty(this, 'key', void 0),
      (this.key = newKey);
  },
  RecoilState = (function (_AbstractRecoilValue) {
    _inherits(RecoilState, AbstractRecoilValue);
    var _super = _createSuper(RecoilState);
    function RecoilState() {
      return _classCallCheck(this, RecoilState), _super.apply(this, arguments);
    }
    return RecoilState;
  })(),
  RecoilValueReadOnly = (function (_AbstractRecoilValue2) {
    _inherits(RecoilValueReadOnly, AbstractRecoilValue);
    var _super2 = _createSuper(RecoilValueReadOnly);
    function RecoilValueReadOnly() {
      return (
        _classCallCheck(this, RecoilValueReadOnly),
        _super2.apply(this, arguments)
      );
    }
    return RecoilValueReadOnly;
  })();
var Recoil_RecoilValue = {
    AbstractRecoilValue: AbstractRecoilValue,
    RecoilState: RecoilState,
    RecoilValueReadOnly: RecoilValueReadOnly,
    isRecoilValue: function (x) {
      return x instanceof RecoilState || x instanceof RecoilValueReadOnly;
    },
  },
  Recoil_RecoilValue_1 = Recoil_RecoilValue.AbstractRecoilValue,
  Recoil_RecoilValue_2 = Recoil_RecoilValue.RecoilState,
  Recoil_RecoilValue_3 = Recoil_RecoilValue.RecoilValueReadOnly,
  Recoil_RecoilValue_4 = Recoil_RecoilValue.isRecoilValue;
function getCjsExportFromNamespace(n) {
  return (n && n.default) || n;
}
var _require3 = getCjsExportFromNamespace(
    Object.freeze({
      __proto__: null,
      AbstractRecoilValue: Recoil_RecoilValue_1,
      RecoilState: Recoil_RecoilValue_2,
      RecoilValueReadOnly: Recoil_RecoilValue_3,
      isRecoilValue: Recoil_RecoilValue_4,
    }),
  ),
  DefaultValue = function DefaultValue() {
    _classCallCheck(this, DefaultValue);
  },
  DEFAULT_VALUE = new DefaultValue(),
  RecoilValueNotReady = (function (_Error) {
    _inherits(RecoilValueNotReady, _wrapNativeSuper(Error));
    var _super = _createSuper(RecoilValueNotReady);
    function RecoilValueNotReady(key) {
      return (
        _classCallCheck(this, RecoilValueNotReady),
        _super.call(
          this,
          'Tried to set the value of Recoil selector '.concat(
            key,
            ' using an updater function, but it is an async selector in a pending or error state; this is not supported.',
          ),
        )
      );
    }
    return RecoilValueNotReady;
  })(),
  nodes = new Map(),
  recoilValues = new Map();
var NodeMissingError = (function (_Error2) {
  _inherits(NodeMissingError, _wrapNativeSuper(Error));
  var _super2 = _createSuper(NodeMissingError);
  function NodeMissingError() {
    return (
      _classCallCheck(this, NodeMissingError), _super2.apply(this, arguments)
    );
  }
  return NodeMissingError;
})();
var Recoil_Node = {
    nodes: nodes,
    recoilValues: recoilValues,
    registerNode: function (node) {
      if (nodes.has(node.key)) {
        var message = 'Duplicate atom key "'.concat(
          node.key,
          '". This is a FATAL ERROR in\n      production. But it is safe to ignore this warning if it occurred because of\n      hot module replacement.',
        );
        Recoil_recoverableViolation(message, 'recoil');
      }
      nodes.set(node.key, node);
      var recoilValue =
        null == node.set
          ? new _require3.RecoilValueReadOnly(node.key)
          : new _require3.RecoilState(node.key);
      return recoilValues.set(node.key, recoilValue), recoilValue;
    },
    getNode: function (key) {
      var node = nodes.get(key);
      if (null == node)
        throw new NodeMissingError(
          'Missing definition for RecoilValue: "'.concat(key, '""'),
        );
      return node;
    },
    NodeMissingError: NodeMissingError,
    DefaultValue: DefaultValue,
    DEFAULT_VALUE: DEFAULT_VALUE,
    RecoilValueNotReady: RecoilValueNotReady,
  },
  Recoil_Node_1 = Recoil_Node.nodes,
  Recoil_Node_2 = Recoil_Node.recoilValues,
  Recoil_Node_3 = Recoil_Node.registerNode,
  Recoil_Node_4 = Recoil_Node.getNode,
  Recoil_Node_5 = Recoil_Node.NodeMissingError,
  Recoil_Node_6 = Recoil_Node.DefaultValue,
  Recoil_Node_7 = Recoil_Node.DEFAULT_VALUE,
  Recoil_Node_8 = Recoil_Node.RecoilValueNotReady;
var Recoil_Queue = {
  enqueueExecution: function (s, f) {
    f();
  },
};
var Recoil_CopyOnWrite_setByAddingToSet = function (set, v) {
    var next = new Set(set);
    return next.add(v), next;
  },
  Recoil_CopyOnWrite_mapBySettingInMap = function (map, k, v) {
    var next = new Map(map);
    return next.set(k, v), next;
  },
  Recoil_CopyOnWrite_mapByUpdatingInMap = function (map, k, updater) {
    var next = new Map(map);
    return next.set(k, updater(next.get(k))), next;
  },
  Recoil_CopyOnWrite_mapByDeletingFromMap = function (map, k) {
    var next = new Map(map);
    return next.delete(k), next;
  };
var Recoil_Tracing = {
    trace: function (message, node, fn) {
      return fn();
    },
    wrap: function (fn) {
      return fn;
    },
  },
  _require = getCjsExportFromNamespace(
    Object.freeze({
      __proto__: null,
      nodes: Recoil_Node_1,
      recoilValues: Recoil_Node_2,
      registerNode: Recoil_Node_3,
      getNode: Recoil_Node_4,
      NodeMissingError: Recoil_Node_5,
      DefaultValue: Recoil_Node_6,
      DEFAULT_VALUE: Recoil_Node_7,
      RecoilValueNotReady: Recoil_Node_8,
    }),
  ),
  mapByDeletingFromMap$1 = Recoil_CopyOnWrite_mapByDeletingFromMap,
  mapBySettingInMap$1 = Recoil_CopyOnWrite_mapBySettingInMap,
  mapByUpdatingInMap$1 = Recoil_CopyOnWrite_mapByUpdatingInMap,
  setByAddingToSet$1 = Recoil_CopyOnWrite_setByAddingToSet,
  getNode$1 = _require.getNode,
  emptyMap = Object.freeze(new Map()),
  emptySet = Object.freeze(new Set()),
  ReadOnlyRecoilValueError = (function (_Error) {
    _inherits(ReadOnlyRecoilValueError, _wrapNativeSuper(Error));
    var _super = _createSuper(ReadOnlyRecoilValueError);
    function ReadOnlyRecoilValueError() {
      return (
        _classCallCheck(this, ReadOnlyRecoilValueError),
        _super.apply(this, arguments)
      );
    }
    return ReadOnlyRecoilValueError;
  })();
function getNodeLoadable(store, state, key) {
  return getNode$1(key).get(store, state);
}
var subscriptionID = 0;
var Recoil_FunctionalCore_1 = getNodeLoadable,
  Recoil_FunctionalCore_2 = function (store, state, key) {
    return getNodeLoadable(store, state, key)[1];
  },
  Recoil_FunctionalCore_3 = function (store, state, key, newValue) {
    var node = getNode$1(key);
    if (null == node.set)
      throw new ReadOnlyRecoilValueError(
        'Attempt to set read-only RecoilValue: '.concat(key),
      );
    var _node$set2 = _slicedToArray(node.set(store, state, newValue), 2);
    return [_node$set2[0], _node$set2[1]];
  },
  Recoil_FunctionalCore_4 = function (state, key, newValue) {
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
  },
  Recoil_FunctionalCore_5 = function (state, key, callback) {
    var subID = subscriptionID++;
    return [
      _objectSpread2(
        _objectSpread2({}, state),
        {},
        {
          nodeToComponentSubscriptions: mapByUpdatingInMap$1(
            state.nodeToComponentSubscriptions,
            key,
            function (subsForAtom) {
              return mapBySettingInMap$1(
                null != subsForAtom ? subsForAtom : emptyMap,
                subID,
                ['TODO debug name', callback],
              );
            },
          ),
        },
      ),
      function (state) {
        return _objectSpread2(
          _objectSpread2({}, state),
          {},
          {
            nodeToComponentSubscriptions: mapByUpdatingInMap$1(
              state.nodeToComponentSubscriptions,
              key,
              function (subsForAtom) {
                return mapByDeletingFromMap$1(
                  null != subsForAtom ? subsForAtom : emptyMap,
                  subID,
                );
              },
            ),
          },
        );
      },
    ];
  },
  Recoil_FunctionalCore_6 = function (store, updatedNodes, when) {
    var _store$getState$nextT,
      _step2,
      state =
        'enqueue' === when &&
        null !== (_store$getState$nextT = store.getState().nextTree) &&
        void 0 !== _store$getState$nextT
          ? _store$getState$nextT
          : store.getState().currentTree,
      dependentNodes = (function (state, keys) {
        for (
          var dependentNodes = new Set(),
            visitedNodes = new Set(),
            visitingNodes = Array.from(keys),
            key = visitingNodes.pop();
          key;
          key = visitingNodes.pop()
        ) {
          var _state$nodeToNodeSubs;
          dependentNodes.add(key), visitedNodes.add(key);
          var _step,
            _iterator = _createForOfIteratorHelper(
              null !==
                (_state$nodeToNodeSubs = state.nodeToNodeSubscriptions.get(
                  key,
                )) && void 0 !== _state$nodeToNodeSubs
                ? _state$nodeToNodeSubs
                : emptySet,
            );
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done; ) {
              var downstreamNode = _step.value;
              visitedNodes.has(downstreamNode) ||
                visitingNodes.push(downstreamNode);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }
        return dependentNodes;
      })(state, updatedNodes),
      _iterator2 = _createForOfIteratorHelper(dependentNodes);
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
        var _state$nodeToComponen,
          key = _step2.value;
        (null !==
          (_state$nodeToComponen = state.nodeToComponentSubscriptions.get(
            key,
          )) && void 0 !== _state$nodeToComponen
          ? _state$nodeToComponen
          : []
        ).forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
            cb = (_ref2[0], _ref2[1]);
          'enqueue' === when
            ? store.getState().queuedComponentCallbacks.push(cb)
            : cb(state);
        });
      }
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
        }),
          resolvers.clear();
      },
    );
  },
  Recoil_FunctionalCore_7 = function detectCircularDependencies(state, stack) {
    if (stack.length) {
      var leaf = stack[stack.length - 1],
        downstream = state.nodeToNodeSubscriptions.get(leaf);
      if (null == downstream ? void 0 : downstream.size) {
        var root = stack[0];
        if (downstream.has(root))
          throw new Error(
            'Recoil selector has circular dependencies: '.concat(
              []
                .concat(_toConsumableArray(stack), [root])
                .reverse()
                .join(' → '),
            ),
          );
        var _step3,
          _iterator3 = _createForOfIteratorHelper(downstream);
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
    }
  },
  Recoil_FunctionalCore$1 = Object.freeze({
    __proto__: null,
    getNodeLoadable: Recoil_FunctionalCore_1,
    peekNodeLoadable: Recoil_FunctionalCore_2,
    setNodeValue: Recoil_FunctionalCore_3,
    setUnvalidatedAtomValue: Recoil_FunctionalCore_4,
    subscribeComponentToNode: Recoil_FunctionalCore_5,
    fireNodeSubscriptions: Recoil_FunctionalCore_6,
    detectCircularDependencies: Recoil_FunctionalCore_7,
  }),
  Recoil_mapIterable = Object.freeze({__proto__: null});
var Recoil_mapMap = function (map, callback) {
  var result = new Map();
  return (
    map.forEach(function (value, key) {
      result.set(key, callback(value, key));
    }),
    result
  );
};
var Recoil_nullthrows = function (x, message) {
    if (null != x) return x;
    throw new Error(
      null != message ? message : 'Got unexpected null or undefined',
    );
  },
  _require2 = getCjsExportFromNamespace(Recoil_FunctionalCore$1),
  getNodeLoadable$1 = _require2.getNodeLoadable,
  peekNodeLoadable$1 = _require2.peekNodeLoadable,
  setNodeValue$1 = _require2.setNodeValue,
  setUnvalidatedAtomValue$1 = _require2.setUnvalidatedAtomValue,
  subscribeComponentToNode$1 = _require2.subscribeComponentToNode,
  RecoilValueNotReady$1 = _require.RecoilValueNotReady,
  AbstractRecoilValue$1 = _require3.AbstractRecoilValue,
  RecoilState$1 = _require3.RecoilState;
var Recoil_RecoilValueInterface = {
    RecoilValueReadOnly: _require3.RecoilValueReadOnly,
    AbstractRecoilValue: AbstractRecoilValue$1,
    RecoilState: RecoilState$1,
    getRecoilValueAsLoadable: function (store, _ref) {
      var result,
        key = _ref.key;
      return (
        Recoil_Tracing.trace('get RecoilValue', key, function () {
          return store.replaceState(
            Recoil_Tracing.wrap(function (state) {
              var _getNodeLoadable2 = _slicedToArray(
                  getNodeLoadable$1(store, state, key),
                  2,
                ),
                newState = _getNodeLoadable2[0],
                loadable = _getNodeLoadable2[1];
              return (result = loadable), newState;
            }),
          );
        }),
        result
      );
    },
    setRecoilValue: function (store, recoilValue, valueOrUpdater) {
      var key = recoilValue.key;
      Recoil_Tracing.trace('set RecoilValue', key, function () {
        return store.replaceState(
          Recoil_Tracing.wrap(function (state) {
            var newValue = (function (store, _ref2, valueOrUpdater) {
                var key = _ref2.key;
                if ('function' == typeof valueOrUpdater) {
                  var _storeState$nextTree,
                    storeState = store.getState(),
                    state =
                      null !== (_storeState$nextTree = storeState.nextTree) &&
                      void 0 !== _storeState$nextTree
                        ? _storeState$nextTree
                        : storeState.currentTree,
                    current = peekNodeLoadable$1(store, state, key);
                  if ('loading' === current.state)
                    throw new RecoilValueNotReady$1(key);
                  if ('hasError' === current.state) throw current.contents;
                  return valueOrUpdater(current.contents);
                }
                return valueOrUpdater;
              })(store, recoilValue, valueOrUpdater),
              _setNodeValue2 = _slicedToArray(
                setNodeValue$1(store, state, key, newValue),
                2,
              ),
              newState = _setNodeValue2[0],
              writtenNodes = _setNodeValue2[1];
            return (
              store.fireNodeSubscriptions(writtenNodes, 'enqueue'), newState
            );
          }),
        );
      });
    },
    setUnvalidatedRecoilValue: function (store, _ref3, newValue) {
      var key = _ref3.key;
      Recoil_Tracing.trace('set unvalidated persisted atom', key, function () {
        return store.replaceState(
          Recoil_Tracing.wrap(function (state) {
            var newState = setUnvalidatedAtomValue$1(state, key, newValue);
            return (
              store.fireNodeSubscriptions(new Set([key]), 'enqueue'), newState
            );
          }),
        );
      });
    },
    subscribeToRecoilValue: function (store, _ref4, callback) {
      var newState,
        releaseFn,
        key = _ref4.key;
      return (
        Recoil_Tracing.trace(
          'subscribe component to RecoilValue',
          key,
          function () {
            return store.replaceState(
              Recoil_Tracing.wrap(function (state) {
                var _subscribeComponentTo2 = _slicedToArray(
                  subscribeComponentToNode$1(state, key, callback),
                  2,
                );
                return (
                  (newState = _subscribeComponentTo2[0]),
                  (releaseFn = _subscribeComponentTo2[1]),
                  newState
                );
              }),
            );
          },
        ),
        {
          release: function (store) {
            return store.replaceState(releaseFn);
          },
        }
      );
    },
  },
  Recoil_RecoilValueInterface_1 =
    Recoil_RecoilValueInterface.RecoilValueReadOnly,
  Recoil_RecoilValueInterface_2 =
    Recoil_RecoilValueInterface.AbstractRecoilValue,
  Recoil_RecoilValueInterface_3 = Recoil_RecoilValueInterface.RecoilState,
  Recoil_RecoilValueInterface_4 =
    Recoil_RecoilValueInterface.getRecoilValueAsLoadable,
  Recoil_RecoilValueInterface_5 = Recoil_RecoilValueInterface.setRecoilValue,
  Recoil_RecoilValueInterface_6 =
    Recoil_RecoilValueInterface.setUnvalidatedRecoilValue,
  Recoil_RecoilValueInterface_7 =
    Recoil_RecoilValueInterface.subscribeToRecoilValue,
  Recoil_RecoilValueInterface$1 = Object.freeze({
    __proto__: null,
    RecoilValueReadOnly: Recoil_RecoilValueInterface_1,
    AbstractRecoilValue: Recoil_RecoilValueInterface_2,
    RecoilState: Recoil_RecoilValueInterface_3,
    getRecoilValueAsLoadable: Recoil_RecoilValueInterface_4,
    setRecoilValue: Recoil_RecoilValueInterface_5,
    setUnvalidatedRecoilValue: Recoil_RecoilValueInterface_6,
    subscribeToRecoilValue: Recoil_RecoilValueInterface_7,
  });
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
var Recoil_State_makeEmptyTreeState = makeEmptyTreeState,
  Recoil_State_makeEmptyStoreState = function () {
    return makeStoreState(makeEmptyTreeState());
  },
  Recoil_State_makeStoreState = makeStoreState,
  mapIterable = getCjsExportFromNamespace(Recoil_mapIterable),
  _require4 = getCjsExportFromNamespace(Recoil_RecoilValueInterface$1),
  DEFAULT_VALUE$1 = _require.DEFAULT_VALUE,
  recoilValues$1 = _require.recoilValues,
  getRecoilValueAsLoadable$1 = _require4.getRecoilValueAsLoadable,
  setRecoilValue$1 = _require4.setRecoilValue,
  makeEmptyTreeState$1 = Recoil_State_makeEmptyTreeState,
  makeStoreState$1 = Recoil_State_makeStoreState;
var Snapshot = (function () {
  function Snapshot(treeState) {
    var _this = this;
    _classCallCheck(this, Snapshot),
      _defineProperty(this, '_store', void 0),
      _defineProperty(this, 'getLoadable', function (recoilValue) {
        return getRecoilValueAsLoadable$1(_this._store, recoilValue);
      }),
      _defineProperty(this, 'getPromise', function (recoilValue) {
        return _this.getLoadable(recoilValue).toPromise();
      }),
      _defineProperty(this, 'getNodes_UNSTABLE', function (opt) {
        if (!0 === (null == opt ? void 0 : opt.dirty)) {
          var state = _this._store.getState().currentTree;
          return mapIterable(state.dirtyAtoms, function (key) {
            return Recoil_nullthrows(recoilValues$1.get(key));
          });
        }
        return recoilValues$1.values();
      }),
      _defineProperty(this, 'getDeps_UNSTABLE', function (recoilValue) {
        _this.getLoadable(recoilValue);
        var deps = _this._store
          .getState()
          .currentTree.nodeDeps.get(recoilValue.key);
        return regeneratorRuntime.mark(function _callee() {
          var _iterator, _step, key;
          return regeneratorRuntime.wrap(
            function (_context) {
              for (;;)
                switch ((_context.prev = _context.next)) {
                  case 0:
                    (_iterator = _createForOfIteratorHelper(
                      null != deps ? deps : [],
                    )),
                      (_context.prev = 1),
                      _iterator.s();
                  case 3:
                    if ((_step = _iterator.n()).done) {
                      _context.next = 9;
                      break;
                    }
                    return (
                      (key = _step.value),
                      (_context.next = 7),
                      Recoil_nullthrows(recoilValues$1.get(key))
                    );
                  case 7:
                    _context.next = 3;
                    break;
                  case 9:
                    _context.next = 14;
                    break;
                  case 11:
                    (_context.prev = 11),
                      (_context.t0 = _context.catch(1)),
                      _iterator.e(_context.t0);
                  case 14:
                    return (
                      (_context.prev = 14), _iterator.f(), _context.finish(14)
                    );
                  case 17:
                  case 'end':
                    return _context.stop();
                }
            },
            _callee,
            null,
            [[1, 11, 14, 17]],
          );
        })();
      }),
      _defineProperty(this, 'map', function (mapper) {
        var mutableSnapshot = new MutableSnapshot(
          _this._store.getState().currentTree,
        );
        return (
          mapper(mutableSnapshot),
          cloneSnapshot(
            mutableSnapshot.getStore_INTERNAL().getState().currentTree,
          )
        );
      }),
      _defineProperty(
        this,
        'asyncMap',
        (function () {
          var fn,
            _ref2 =
              ((fn = regeneratorRuntime.mark(function _callee2(mapper) {
                var mutableSnapshot, newState;
                return regeneratorRuntime.wrap(function (_context2) {
                  for (;;)
                    switch ((_context2.prev = _context2.next)) {
                      case 0:
                        return (
                          (mutableSnapshot = new MutableSnapshot(
                            _this._store.getState().currentTree,
                          )),
                          (_context2.next = 3),
                          mapper(mutableSnapshot)
                        );
                      case 3:
                        return (
                          (newState = mutableSnapshot
                            .getStore_INTERNAL()
                            .getState().currentTree),
                          _context2.abrupt('return', cloneSnapshot(newState))
                        );
                      case 5:
                      case 'end':
                        return _context2.stop();
                    }
                }, _callee2);
              })),
              function () {
                var self = this,
                  args = arguments;
                return new Promise(function (resolve, reject) {
                  var gen = fn.apply(self, args);
                  function _next(value) {
                    asyncGeneratorStep(
                      gen,
                      resolve,
                      reject,
                      _next,
                      _throw,
                      'next',
                      value,
                    );
                  }
                  function _throw(err) {
                    asyncGeneratorStep(
                      gen,
                      resolve,
                      reject,
                      _next,
                      _throw,
                      'throw',
                      err,
                    );
                  }
                  _next(void 0);
                });
              });
          return function (_x) {
            return _ref2.apply(this, arguments);
          };
        })(),
      ),
      (this._store = (function (treeState) {
        var storeState = makeStoreState$1(treeState);
        return {
          getState: function () {
            return storeState;
          },
          replaceState: function (replacer) {
            storeState.currentTree = replacer(storeState.currentTree);
          },
          subscribeToTransactions: function () {
            return {release: function () {}};
          },
          addTransactionMetadata: function () {
            throw new Error('Cannot subscribe to Snapshots');
          },
          fireNodeSubscriptions: function () {},
        };
      })(treeState));
  }
  var Constructor, protoProps, staticProps;
  return (
    (Constructor = Snapshot),
    (protoProps = [
      {
        key: 'getStore_INTERNAL',
        value: function () {
          return this._store;
        },
      },
    ]) && _defineProperties(Constructor.prototype, protoProps),
    staticProps && _defineProperties(Constructor, staticProps),
    Snapshot
  );
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
}
function cloneSnapshot(treeState) {
  return new Snapshot(cloneTreeState(treeState));
}
var MutableSnapshot = (function (_Snapshot) {
    _inherits(MutableSnapshot, Snapshot);
    var _super = _createSuper(MutableSnapshot);
    function MutableSnapshot(treeState) {
      var _this2;
      return (
        _classCallCheck(this, MutableSnapshot),
        _defineProperty(
          _assertThisInitialized(
            (_this2 = _super.call(this, cloneTreeState(treeState))),
          ),
          'set',
          function (recoilState, newValueOrUpdater) {
            var store = _this2.getStore_INTERNAL();
            setRecoilValue$1(store, recoilState, newValueOrUpdater);
          },
        ),
        _defineProperty(_assertThisInitialized(_this2), 'reset', function (
          recoilState,
        ) {
          return setRecoilValue$1(
            _this2.getStore_INTERNAL(),
            recoilState,
            DEFAULT_VALUE$1,
          );
        }),
        _this2
      );
    }
    return MutableSnapshot;
  })(),
  Recoil_Snapshot = {
    Snapshot: Snapshot,
    MutableSnapshot: MutableSnapshot,
    freshSnapshot: function () {
      return new Snapshot(makeEmptyTreeState$1());
    },
    cloneSnapshot: cloneSnapshot,
  },
  Recoil_Snapshot_1 = Recoil_Snapshot.Snapshot,
  Recoil_Snapshot_2 = Recoil_Snapshot.MutableSnapshot,
  Recoil_Snapshot_3 = Recoil_Snapshot.freshSnapshot,
  Recoil_Snapshot_4 = Recoil_Snapshot.cloneSnapshot,
  _require6 = getCjsExportFromNamespace(
    Object.freeze({
      __proto__: null,
      Snapshot: Recoil_Snapshot_1,
      MutableSnapshot: Recoil_Snapshot_2,
      freshSnapshot: Recoil_Snapshot_3,
      cloneSnapshot: Recoil_Snapshot_4,
    }),
  ),
  _require$1 = react,
  useContext = _require$1.useContext,
  useEffect = _require$1.useEffect,
  useRef = _require$1.useRef,
  useState = _require$1.useState,
  fireNodeSubscriptions$1 = _require2.fireNodeSubscriptions,
  setNodeValue$2 = _require2.setNodeValue,
  setUnvalidatedAtomValue$2 = _require2.setUnvalidatedAtomValue,
  freshSnapshot$1 = _require6.freshSnapshot,
  makeEmptyStoreState$1 = Recoil_State_makeEmptyStoreState,
  makeStoreState$2 = Recoil_State_makeStoreState;
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
  null === storeState.nextTree &&
    (storeState.nextTree = _objectSpread2(
      _objectSpread2({}, storeState.currentTree),
      {},
      {dirtyAtoms: new Set(), transactionMetadata: {}},
    ));
}
var AppContext = react.createContext({current: defaultStore}),
  useStoreRef = function () {
    return useContext(AppContext);
  };
function Batcher(props) {
  var storeRef = useStoreRef(),
    _useState2 = _slicedToArray(useState([]), 2),
    setState = (_useState2[0], _useState2[1]);
  return (
    props.setNotifyBatcherOfChange(function () {
      return setState({});
    }),
    useEffect(function () {
      Recoil_Queue.enqueueExecution('Batcher', function () {
        var storeState = storeRef.current.getState(),
          nextTree = storeState.nextTree;
        if (null !== nextTree) {
          var dirtyAtoms = nextTree.dirtyAtoms;
          if (dirtyAtoms.size) {
            var _step,
              _iterator = _createForOfIteratorHelper(
                storeState.nodeTransactionSubscriptions,
              );
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done; ) {
                var _step$value = _slicedToArray(_step.value, 2),
                  key = _step$value[0],
                  subscriptions = _step$value[1];
                if (dirtyAtoms.has(key)) {
                  var _step3,
                    _iterator3 = _createForOfIteratorHelper(subscriptions);
                  try {
                    for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
                      (0, _step3.value)(storeRef.current);
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
            var _step2,
              _iterator2 = _createForOfIteratorHelper(
                storeState.transactionSubscriptions,
              );
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done; ) {
                var _step2$value = _slicedToArray(_step2.value, 2);
                _step2$value[0];
                (0, _step2$value[1])(storeRef.current);
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
          storeState.queuedComponentCallbacks.forEach(function (cb) {
            return cb(nextTree);
          }),
            storeState.queuedComponentCallbacks.splice(
              0,
              storeState.queuedComponentCallbacks.length,
            ),
            (storeState.currentTree = nextTree),
            (storeState.nextTree = null);
        }
      });
    }),
    null
  );
}
var nextID = 0;
var Recoil_RecoilRoot_react_1 = useStoreRef,
  Recoil_RecoilRoot_react_2 = function (_ref) {
    var storeState,
      initializeState_DEPRECATED = _ref.initializeState_DEPRECATED,
      initializeState = _ref.initializeState,
      children = _ref.children,
      notifyBatcherOfChange = useRef(null),
      store = {
        getState: function () {
          return storeState.current;
        },
        replaceState: function (replacer) {
          var storeState = storeRef.current.getState();
          startNextTreeIfNeeded(storeState);
          var nextTree = Recoil_nullthrows(storeState.nextTree),
            replaced = replacer(nextTree);
          replaced !== nextTree &&
            ((storeState.nextTree = replaced),
            Recoil_nullthrows(notifyBatcherOfChange.current)());
        },
        subscribeToTransactions: function (callback, key) {
          if (null == key) {
            var transactionSubscriptions = storeRef.current.getState()
                .transactionSubscriptions,
              id = nextID++;
            return (
              transactionSubscriptions.set(id, callback),
              {
                release: function () {
                  transactionSubscriptions.delete(id);
                },
              }
            );
          }
          var nodeTransactionSubscriptions = storeRef.current.getState()
            .nodeTransactionSubscriptions;
          return (
            nodeTransactionSubscriptions.has(key) ||
              nodeTransactionSubscriptions.set(key, []),
            Recoil_nullthrows(nodeTransactionSubscriptions.get(key)).push(
              callback,
            ),
            {release: function () {}}
          );
        },
        addTransactionMetadata: function (metadata) {
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
        },
        fireNodeSubscriptions: function (updatedNodes, when) {
          fireNodeSubscriptions$1(storeRef.current, updatedNodes, when);
        },
      },
      storeRef = useRef(store);
    return (
      (storeState = useRef(
        null != initializeState_DEPRECATED
          ? (function (store, initializeState) {
              var initial = makeEmptyStoreState$1();
              return (
                initializeState({
                  set: function (atom, value) {
                    initial.currentTree = setNodeValue$2(
                      store,
                      initial.currentTree,
                      atom.key,
                      value,
                    )[0];
                  },
                  setUnvalidatedAtomValues: function (atomValues) {
                    atomValues.forEach(function (v, k) {
                      initial.currentTree = setUnvalidatedAtomValue$2(
                        initial.currentTree,
                        k,
                        v,
                      );
                    });
                  },
                }),
                initial
              );
            })(store, initializeState_DEPRECATED)
          : null != initializeState
          ? (function (initializeState) {
              var snapshot = freshSnapshot$1().map(initializeState);
              return makeStoreState$2(
                snapshot.getStore_INTERNAL().getState().currentTree,
              );
            })(initializeState)
          : makeEmptyStoreState$1(),
      )),
      react.createElement(
        AppContext.Provider,
        {value: storeRef},
        react.createElement(Batcher, {
          setNotifyBatcherOfChange: function (x) {
            notifyBatcherOfChange.current = x;
          },
        }),
        children,
      )
    );
  },
  Recoil_RecoilRoot_react$1 = Object.freeze({
    __proto__: null,
    useStoreRef: Recoil_RecoilRoot_react_1,
    RecoilRoot: Recoil_RecoilRoot_react_2,
  }),
  Recoil_differenceSets = Object.freeze({__proto__: null}),
  Recoil_filterMap = Object.freeze({__proto__: null});
var Recoil_invariant = function (condition, message) {
  if (!condition) throw new Error(message);
};
var Recoil_mergeMaps = function () {
    for (
      var result = new Map(),
        _len = arguments.length,
        maps = new Array(_len),
        _key = 0;
      _key < _len;
      _key++
    )
      maps[_key] = arguments[_key];
    for (var i = 0; i < maps.length; i++)
      for (
        var iterator = maps[i].keys(), nextKey = void 0;
        !(nextKey = iterator.next()).done;

      )
        result.set(nextKey.value, maps[i].get(nextKey.value));
    return result;
  },
  _require2$1 = getCjsExportFromNamespace(Recoil_RecoilRoot_react$1),
  differenceSets = getCjsExportFromNamespace(Recoil_differenceSets),
  filterMap = getCjsExportFromNamespace(Recoil_filterMap),
  useCallback = react.useCallback,
  useEffect$1 = react.useEffect,
  useMemo = react.useMemo,
  useRef$1 = react.useRef,
  useState$1 = react.useState,
  DEFAULT_VALUE$2 = _require.DEFAULT_VALUE,
  getNode$2 = _require.getNode,
  nodes$1 = _require.nodes,
  useStoreRef$1 = _require2$1.useStoreRef,
  AbstractRecoilValue$2 =
    (_require3.isRecoilValue, _require4.AbstractRecoilValue),
  getRecoilValueAsLoadable$2 = _require4.getRecoilValueAsLoadable,
  setRecoilValue$2 = _require4.setRecoilValue,
  setUnvalidatedRecoilValue$1 = _require4.setUnvalidatedRecoilValue,
  subscribeToRecoilValue$1 = _require4.subscribeToRecoilValue,
  cloneSnapshot$1 = (_require6.Snapshot, _require6.cloneSnapshot),
  setByAddingToSet$2 = Recoil_CopyOnWrite_setByAddingToSet;
function useInterface() {
  var storeRef = useStoreRef$1(),
    _useState2 = _slicedToArray(useState$1([]), 2),
    forceUpdate = (_useState2[0], _useState2[1]),
    recoilValuesUsed = useRef$1(new Set());
  recoilValuesUsed.current = new Set();
  var previousSubscriptions = useRef$1(new Set()),
    subscriptions = useRef$1(new Map()),
    unsubscribeFrom = useCallback(
      function (key) {
        var sub = subscriptions.current.get(key);
        sub &&
          (sub.release(storeRef.current), subscriptions.current.delete(key));
      },
      [storeRef, subscriptions],
    );
  return (
    useEffect$1(function () {
      var store = storeRef.current;
      function updateState(_state, key) {
        subscriptions.current.has(key) && forceUpdate([]);
      }
      differenceSets(
        recoilValuesUsed.current,
        previousSubscriptions.current,
      ).forEach(function (key) {
        if (!subscriptions.current.has(key)) {
          var sub = subscribeToRecoilValue$1(
            store,
            new AbstractRecoilValue$2(key),
            function (state) {
              Recoil_Tracing.trace(
                'RecoilValue subscription fired',
                key,
                function () {
                  updateState(0, key);
                },
              );
            },
          );
          subscriptions.current.set(key, sub),
            Recoil_Tracing.trace(
              'initial update on subscribing',
              key,
              function () {
                updateState(store.getState(), key);
              },
            );
        }
      }),
        differenceSets(
          previousSubscriptions.current,
          recoilValuesUsed.current,
        ).forEach(function (key) {
          unsubscribeFrom(key);
        }),
        (previousSubscriptions.current = recoilValuesUsed.current);
    }),
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
    ),
    useMemo(
      function () {
        function useSetRecoilState(recoilState) {
          return function (newValueOrUpdater) {
            setRecoilValue$2(storeRef.current, recoilState, newValueOrUpdater);
          };
        }
        function useRecoilValueLoadable(recoilValue) {
          return (
            recoilValuesUsed.current.has(recoilValue.key) ||
              (recoilValuesUsed.current = setByAddingToSet$2(
                recoilValuesUsed.current,
                recoilValue.key,
              )),
            getRecoilValueAsLoadable$2(storeRef.current, recoilValue)
          );
        }
        function useRecoilValue(recoilValue) {
          return (function (loadable, atom, storeRef) {
            if ('hasValue' === loadable.state) return loadable.contents;
            if ('loading' === loadable.state)
              throw new Promise(function (resolve) {
                storeRef.current
                  .getState()
                  .suspendedComponentResolvers.add(resolve);
              });
            throw 'hasError' === loadable.state
              ? loadable.contents
              : new Error(
                  'Invalid value of loadable atom "'.concat(atom.key, '"'),
                );
          })(useRecoilValueLoadable(recoilValue), recoilValue, storeRef);
        }
        return {
          getRecoilValue: useRecoilValue,
          getRecoilValueLoadable: useRecoilValueLoadable,
          getRecoilState: function (recoilState) {
            return [
              useRecoilValue(recoilState),
              useSetRecoilState(recoilState),
            ];
          },
          getRecoilStateLoadable: function (recoilState) {
            return [
              useRecoilValueLoadable(recoilState),
              useSetRecoilState(recoilState),
            ];
          },
          getSetRecoilState: useSetRecoilState,
          getResetRecoilState: function (recoilState) {
            return function () {
              return setRecoilValue$2(
                storeRef.current,
                recoilState,
                DEFAULT_VALUE$2,
              );
            };
          },
        };
      },
      [recoilValuesUsed, storeRef],
    )
  );
}
function useTransactionSubscription(callback) {
  var storeRef = useStoreRef$1();
  useEffect$1(
    function () {
      return storeRef.current.subscribeToTransactions(callback).release;
    },
    [callback, storeRef],
  );
}
function externallyVisibleAtomValuesInState(state) {
  var atomValues = state.atomValues,
    persistedAtomContentsValues = Recoil_mapMap(
      filterMap(atomValues, function (v, k) {
        var _node$options,
          persistence =
            null === (_node$options = getNode$2(k).options) ||
            void 0 === _node$options
              ? void 0
              : _node$options.persistence_UNSTABLE;
        return (
          null != persistence &&
          'none' !== persistence.type &&
          'hasValue' === v.state
        );
      }),
      function (v) {
        return v.contents;
      },
    );
  return Recoil_mergeMaps(state.nonvalidatedAtoms, persistedAtomContentsValues);
}
function useGotoRecoilSnapshot() {
  var storeRef = useStoreRef$1();
  return useCallback(
    function (snapshot) {
      reactDom.unstable_batchedUpdates(function () {
        storeRef.current.replaceState(function (prevState) {
          for (
            var nextState = snapshot.getStore_INTERNAL().getState().currentTree,
              updatedKeys = new Set(),
              _i = 0,
              _arr = [prevState.atomValues.keys(), nextState.atomValues.keys()];
            _i < _arr.length;
            _i++
          ) {
            var _step,
              _iterator = _createForOfIteratorHelper(_arr[_i]);
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done; ) {
                var _prevState$atomValues,
                  _nextState$atomValues,
                  key = _step.value;
                (null ===
                  (_prevState$atomValues = prevState.atomValues.get(key)) ||
                void 0 === _prevState$atomValues
                  ? void 0
                  : _prevState$atomValues.contents) !==
                  (null ===
                    (_nextState$atomValues = nextState.atomValues.get(key)) ||
                  void 0 === _nextState$atomValues
                    ? void 0
                    : _nextState$atomValues.contents) && updatedKeys.add(key);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }
          return (
            storeRef.current.fireNodeSubscriptions(updatedKeys, 'enqueue'),
            _objectSpread2(
              _objectSpread2({}, nextState),
              {},
              {
                nodeToComponentSubscriptions:
                  prevState.nodeToComponentSubscriptions,
              },
            )
          );
        });
      });
    },
    [storeRef],
  );
}
var Sentinel = function Sentinel() {
    _classCallCheck(this, Sentinel);
  },
  SENTINEL = new Sentinel();
var Recoil_Hooks_1 = function (fn, deps) {
    var storeRef = useStoreRef$1(),
      gotoSnapshot = useGotoRecoilSnapshot();
    return useCallback(
      function () {
        for (
          var _len = arguments.length, args = new Array(_len), _key = 0;
          _key < _len;
          _key++
        )
          args[_key] = arguments[_key];
        var snapshot = cloneSnapshot$1(storeRef.current.getState().currentTree);
        function set(recoilState, newValueOrUpdater) {
          setRecoilValue$2(storeRef.current, recoilState, newValueOrUpdater);
        }
        function reset(recoilState) {
          setRecoilValue$2(storeRef.current, recoilState, DEFAULT_VALUE$2);
        }
        var ret = SENTINEL;
        return (
          reactDom.unstable_batchedUpdates(function () {
            ret = fn({
              set: set,
              reset: reset,
              snapshot: snapshot,
              gotoSnapshot: gotoSnapshot,
            }).apply(void 0, args);
          }),
          ret instanceof Sentinel && Recoil_invariant(!1),
          ret
        );
      },
      null != deps ? [].concat(_toConsumableArray(deps), [storeRef]) : void 0,
    );
  },
  Recoil_Hooks_2 = function (recoilValue) {
    return useInterface().getRecoilValue(recoilValue);
  },
  Recoil_Hooks_3 = function (recoilValue) {
    return useInterface().getRecoilValueLoadable(recoilValue);
  },
  Recoil_Hooks_4 = function (recoilState) {
    var recoilInterface = useInterface();
    return [
      _slicedToArray(recoilInterface.getRecoilState(recoilState), 1)[0],
      useCallback(recoilInterface.getSetRecoilState(recoilState), [
        recoilState,
      ]),
    ];
  },
  Recoil_Hooks_5 = function (recoilState) {
    var recoilInterface = useInterface();
    return [
      _slicedToArray(recoilInterface.getRecoilStateLoadable(recoilState), 1)[0],
      useCallback(recoilInterface.getSetRecoilState(recoilState), [
        recoilState,
      ]),
    ];
  },
  Recoil_Hooks_6 = function (recoilState) {
    return useCallback(useInterface().getSetRecoilState(recoilState), [
      recoilState,
    ]);
  },
  Recoil_Hooks_7 = function (recoilState) {
    return useCallback(useInterface().getResetRecoilState(recoilState), [
      recoilState,
    ]);
  },
  Recoil_Hooks_8 = useInterface,
  Recoil_Hooks_9 = useTransactionSubscription,
  Recoil_Hooks_10 = function (callback) {
    useTransactionSubscription(
      useCallback(
        function (store) {
          var previousState = store.getState().currentTree,
            nextState = store.getState().nextTree;
          nextState ||
            (Recoil_recoverableViolation(
              'Transaction subscribers notified without a next tree being present -- this is a bug in Recoil',
              'recoil',
            ),
            (nextState = store.getState().currentTree));
          var atomValues = externallyVisibleAtomValuesInState(nextState),
            previousAtomValues = externallyVisibleAtomValuesInState(
              previousState,
            ),
            atomInfo = Recoil_mapMap(nodes$1, function (node) {
              var _node$options$persist,
                _node$options2,
                _node$options2$persis,
                _node$options$persist2,
                _node$options3,
                _node$options3$persis;
              return {
                persistence_UNSTABLE: {
                  type:
                    null !==
                      (_node$options$persist =
                        null === (_node$options2 = node.options) ||
                        void 0 === _node$options2 ||
                        null ===
                          (_node$options2$persis =
                            _node$options2.persistence_UNSTABLE) ||
                        void 0 === _node$options2$persis
                          ? void 0
                          : _node$options2$persis.type) &&
                    void 0 !== _node$options$persist
                      ? _node$options$persist
                      : 'none',
                  backButton:
                    null !==
                      (_node$options$persist2 =
                        null === (_node$options3 = node.options) ||
                        void 0 === _node$options3 ||
                        null ===
                          (_node$options3$persis =
                            _node$options3.persistence_UNSTABLE) ||
                        void 0 === _node$options3$persis
                          ? void 0
                          : _node$options3$persis.backButton) &&
                    void 0 !== _node$options$persist2 &&
                    _node$options$persist2,
                },
              };
            }),
            modifiedAtoms = new Set(nextState.dirtyAtoms);
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
  },
  Recoil_Hooks_11 = function (callback) {
    useTransactionSubscription(
      useCallback(
        function (store) {
          var previousState = store.getState().currentTree,
            nextState = store.getState().nextTree;
          nextState ||
            (Recoil_recoverableViolation(
              'Transaction subscribers notified without a next tree being present -- this is a bug in Recoil',
              'recoil',
            ),
            (nextState = previousState)),
            callback({
              snapshot: cloneSnapshot$1(nextState),
              previousSnapshot: cloneSnapshot$1(previousState),
            });
        },
        [callback],
      ),
    );
  },
  Recoil_Hooks_12 = function () {
    var store = useStoreRef$1(),
      _useState4 = _slicedToArray(
        useState$1(function () {
          return cloneSnapshot$1(store.current.getState().currentTree);
        }),
        2,
      ),
      snapshot = _useState4[0],
      setSnapshot = _useState4[1];
    return (
      useTransactionSubscription(
        useCallback(function (store) {
          var _store$getState$nextT;
          return setSnapshot(
            cloneSnapshot$1(
              null !== (_store$getState$nextT = store.getState().nextTree) &&
                void 0 !== _store$getState$nextT
                ? _store$getState$nextT
                : store.getState().currentTree,
            ),
          );
        }, []),
      ),
      snapshot
    );
  },
  Recoil_Hooks_13 = useGotoRecoilSnapshot,
  Recoil_Hooks_14 = function () {
    var storeRef = useStoreRef$1();
    return function (values) {
      var transactionMetadata =
        arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      reactDom.unstable_batchedUpdates(function () {
        storeRef.current.addTransactionMetadata(transactionMetadata),
          values.forEach(function (value, key) {
            return setUnvalidatedRecoilValue$1(
              storeRef.current,
              new AbstractRecoilValue$2(key),
              value,
            );
          });
      });
    };
  },
  Recoil_Hooks$1 = Object.freeze({
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
var Recoil_isPromise = function (p) {
    return !!p && 'function' == typeof p.then;
  },
  loadableAccessors = {
    getValue: function () {
      if ('hasValue' !== this.state) throw this.contents;
      return this.contents;
    },
    toPromise: function () {
      return 'hasValue' === this.state
        ? Promise.resolve(this.contents)
        : 'hasError' === this.state
        ? Promise.reject(this.contents)
        : this.contents;
    },
    valueMaybe: function () {
      return 'hasValue' === this.state ? this.contents : void 0;
    },
    valueOrThrow: function () {
      if ('hasValue' !== this.state)
        throw new Error(
          'Loadable expected value, but in "'.concat(this.state, '" state'),
        );
      return this.contents;
    },
    errorMaybe: function () {
      return 'hasError' === this.state ? this.contents : void 0;
    },
    errorOrThrow: function () {
      if ('hasError' !== this.state)
        throw new Error(
          'Loadable expected error, but in "'.concat(this.state, '" state'),
        );
      return this.contents;
    },
    promiseMaybe: function () {
      return 'loading' === this.state ? this.contents : void 0;
    },
    promiseOrThrow: function () {
      if ('loading' !== this.state)
        throw new Error(
          'Loadable expected promise, but in "'.concat(this.state, '" state'),
        );
      return this.contents;
    },
    map: (function (_map) {
      function map(_x) {
        return _map.apply(this, arguments);
      }
      return (
        (map.toString = function () {
          return _map.toString();
        }),
        map
      );
    })(function (map) {
      var _this = this;
      if ('hasError' === this.state) return this;
      if ('hasValue' === this.state)
        try {
          var next = map(this.contents);
          return Recoil_isPromise(next)
            ? loadableWithPromise(next)
            : loadableWithValue(next);
        } catch (e) {
          return Recoil_isPromise(e)
            ? loadableWithPromise(
                e.next(function () {
                  return map(_this.contents);
                }),
              )
            : loadableWithError(e);
        }
      if ('loading' === this.state)
        return loadableWithPromise(
          this.contents.then(map).catch(function (e) {
            if (Recoil_isPromise(e))
              return e.then(function () {
                return map(_this.contents);
              });
            throw e;
          }),
        );
      throw new Error('Invalid Loadable state');
    }),
  };
function loadableWithValue(value) {
  return Object.freeze(
    _objectSpread2({state: 'hasValue', contents: value}, loadableAccessors),
  );
}
function loadableWithError(error) {
  return Object.freeze(
    _objectSpread2({state: 'hasError', contents: error}, loadableAccessors),
  );
}
function loadableWithPromise(promise) {
  return Object.freeze(
    _objectSpread2({state: 'loading', contents: promise}, loadableAccessors),
  );
}
var Recoil_Loadable_1 = loadableWithValue,
  Recoil_Loadable_2 = loadableWithError,
  Recoil_Loadable_3 = loadableWithPromise,
  Recoil_Loadable_4 = function () {
    return loadableWithPromise(new Promise(function () {}));
  },
  Recoil_Loadable_5 = function (inputs) {
    return inputs.every(function (i) {
      return 'hasValue' === i.state;
    })
      ? loadableWithValue(
          inputs.map(function (i) {
            return i.contents;
          }),
        )
      : inputs.some(function (i) {
          return 'hasError' === i.state;
        })
      ? loadableWithError(
          Recoil_nullthrows(
            inputs.find(function (i) {
              return 'hasError' === i.state;
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
  },
  Recoil_Loadable$1 = Object.freeze({
    __proto__: null,
    loadableWithValue: Recoil_Loadable_1,
    loadableWithError: Recoil_Loadable_2,
    loadableWithPromise: Recoil_Loadable_3,
    loadableLoading: Recoil_Loadable_4,
    loadableAll: Recoil_Loadable_5,
  });
getCjsExportFromNamespace(Object.freeze({__proto__: null}));
var Recoil_deepFreezeValue = Object.freeze({__proto__: null}),
  ArrayKeyedMap = getCjsExportFromNamespace(Object.freeze({__proto__: null}));
var Recoil_cacheWithReferenceEquality = function () {
    return new ArrayKeyedMap();
  },
  Recoil_traverseDepGraph = Object.freeze({__proto__: null}),
  _require$2 = getCjsExportFromNamespace(Recoil_Loadable$1);
getCjsExportFromNamespace(Recoil_deepFreezeValue),
  getCjsExportFromNamespace(Recoil_traverseDepGraph);
_require$2.loadableWithError,
  _require$2.loadableWithPromise,
  _require$2.loadableWithValue,
  _require2.detectCircularDependencies,
  _require2.getNodeLoadable,
  _require2.setNodeValue,
  _require.DEFAULT_VALUE,
  _require.RecoilValueNotReady,
  _require.registerNode,
  _require3.isRecoilValue,
  Object.freeze(new Set());
var Recoil_selector_NEW = Object.freeze({__proto__: null}),
  Recoil_selector_OLD =
    (_require$2.loadableWithError,
    _require$2.loadableWithPromise,
    _require$2.loadableWithValue,
    _require2.detectCircularDependencies,
    _require2.getNodeLoadable,
    _require2.setNodeValue,
    _require.DEFAULT_VALUE,
    _require.RecoilValueNotReady,
    _require.registerNode,
    _require3.isRecoilValue,
    Object.freeze(new Set()),
    Object.freeze({__proto__: null}));
getCjsExportFromNamespace(Recoil_selector_NEW);
var Recoil_selector = getCjsExportFromNamespace(Recoil_selector_OLD),
  Recoil_atom =
    (_require$2.loadableWithValue,
    _require.DEFAULT_VALUE,
    _require.DefaultValue,
    _require.registerNode,
    _require3.isRecoilValue,
    _require4.setRecoilValue,
    Object.freeze({__proto__: null})),
  stableStringify = getCjsExportFromNamespace(Object.freeze({__proto__: null}));
var Recoil_cacheWithValueEquality = function () {
    var map = new Map(),
      cache = {
        get: function (key) {
          return map.get(stableStringify(key));
        },
        set: function (key, value) {
          return map.set(stableStringify(key), value), cache;
        },
        map: map,
      };
    return cache;
  },
  nextIndex = 0;
var Recoil_selectorFamily = function (options) {
    var _options$cacheImpleme,
      _options$cacheImpleme2,
      selectorCache =
        null !==
          (_options$cacheImpleme =
            null ===
              (_options$cacheImpleme2 =
                options.cacheImplementationForParams_UNSTABLE) ||
            void 0 === _options$cacheImpleme2
              ? void 0
              : _options$cacheImpleme2.call(options)) &&
        void 0 !== _options$cacheImpleme
          ? _options$cacheImpleme
          : Recoil_cacheWithValueEquality();
    return function (params) {
      var _stableStringify,
        _options$cacheImpleme3,
        cachedSelector = selectorCache.get(params);
      if (null != cachedSelector) return cachedSelector;
      var newSelector,
        myKey = ''
          .concat(options.key, '__selectorFamily/')
          .concat(
            null !==
              (_stableStringify = stableStringify(params, {
                allowFunctions: !0,
              })) && void 0 !== _stableStringify
              ? _stableStringify
              : 'void',
            '/',
          )
          .concat(nextIndex++),
        myGet = function (callbacks) {
          return options.get(params)(callbacks);
        },
        myCacheImplementation =
          null ===
            (_options$cacheImpleme3 = options.cacheImplementation_UNSTABLE) ||
          void 0 === _options$cacheImpleme3
            ? void 0
            : _options$cacheImpleme3.call(options);
      if (null != options.set) {
        var set = options.set;
        newSelector = Recoil_selector({
          key: myKey,
          get: myGet,
          set: function (callbacks, newValue) {
            return set(params)(callbacks, newValue);
          },
          cacheImplementation_UNSTABLE: myCacheImplementation,
          dangerouslyAllowMutability: options.dangerouslyAllowMutability,
        });
      } else
        newSelector = Recoil_selector({
          key: myKey,
          get: myGet,
          cacheImplementation_UNSTABLE: myCacheImplementation,
          dangerouslyAllowMutability: options.dangerouslyAllowMutability,
        });
      return (
        (selectorCache = selectorCache.set(params, newSelector)), newSelector
      );
    };
  },
  atom = getCjsExportFromNamespace(Recoil_atom),
  Recoil_atomFamily =
    (_require.DEFAULT_VALUE,
    _require.DefaultValue,
    Object.freeze({__proto__: null})),
  constantSelector = Recoil_selectorFamily({
    key: '__constant',
    get: function (constant) {
      return function () {
        return constant;
      };
    },
    cacheImplementationForParams_UNSTABLE: Recoil_cacheWithReferenceEquality,
  });
var Recoil_constSelector = function (constant) {
    return constantSelector(constant);
  },
  throwingSelector = Recoil_selectorFamily({
    key: '__error',
    get: function (message) {
      return function () {
        throw new Error(message);
      };
    },
    cacheImplementationForParams_UNSTABLE: Recoil_cacheWithReferenceEquality,
  });
var Recoil_errorSelector = function (message) {
  return throwingSelector(message);
};
var Recoil_readOnlySelector = function (atom) {
    return atom;
  },
  loadableWithError$3 = _require$2.loadableWithError,
  loadableWithPromise$3 = _require$2.loadableWithPromise,
  loadableWithValue$4 = _require$2.loadableWithValue;
function concurrentRequests(getRecoilValue, deps) {
  var _step,
    results = Array(deps.length).fill(void 0),
    exceptions = Array(deps.length).fill(void 0),
    _iterator = _createForOfIteratorHelper(deps.entries());
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done; ) {
      var _step$value = _slicedToArray(_step.value, 2),
        i = _step$value[0],
        dep = _step$value[1];
      try {
        results[i] = getRecoilValue(dep);
      } catch (e) {
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
  return null != exp && !Recoil_isPromise(exp);
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
    ? results
    : Object.getOwnPropertyNames(dependencies).reduce(function (out, key, idx) {
        return _objectSpread2(
          _objectSpread2({}, out),
          {},
          _defineProperty({}, key, results[idx]),
        );
      }, {});
}
function wrapLoadables(dependencies, results, exceptions) {
  return wrapResults(
    dependencies,
    exceptions.map(function (exception, idx) {
      return null == exception
        ? loadableWithValue$4(results[idx])
        : Recoil_isPromise(exception)
        ? loadableWithPromise$3(exception)
        : loadableWithError$3(exception);
    }),
  );
}
var Recoil_WaitFor = {
    waitForNone: Recoil_selectorFamily({
      key: '__waitForNone',
      get: function (dependencies) {
        return function (_ref) {
          var _concurrentRequests2 = _slicedToArray(
              concurrentRequests(_ref.get, unwrapDependencies(dependencies)),
              2,
            ),
            results = _concurrentRequests2[0],
            exceptions = _concurrentRequests2[1];
          return wrapLoadables(dependencies, results, exceptions);
        };
      },
    }),
    waitForAny: Recoil_selectorFamily({
      key: '__waitForAny',
      get: function (dependencies) {
        return function (_ref2) {
          var _concurrentRequests4 = _slicedToArray(
              concurrentRequests(_ref2.get, unwrapDependencies(dependencies)),
              2,
            ),
            results = _concurrentRequests4[0],
            exceptions = _concurrentRequests4[1];
          if (
            exceptions.some(function (exp) {
              return null == exp;
            })
          )
            return wrapLoadables(dependencies, results, exceptions);
          if (exceptions.every(isError)) throw exceptions.find(isError);
          throw new Promise(function (resolve, reject) {
            var _step3,
              _iterator3 = _createForOfIteratorHelper(exceptions.entries());
            try {
              var _loop2 = function () {
                var _step3$value = _slicedToArray(_step3.value, 2),
                  i = _step3$value[0],
                  exp = _step3$value[1];
                Recoil_isPromise(exp) &&
                  exp
                    .then(function (result) {
                      (results[i] = result),
                        (exceptions[i] = null),
                        resolve(
                          wrapLoadables(dependencies, results, exceptions),
                        );
                    })
                    .catch(function (error) {
                      (exceptions[i] = error),
                        exceptions.every(isError) && reject(exceptions[0]);
                    });
              };
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) _loop2();
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
          });
        };
      },
    }),
    waitForAll: Recoil_selectorFamily({
      key: '__waitForAll',
      get: function (dependencies) {
        return function (_ref3) {
          var _concurrentRequests6 = _slicedToArray(
              concurrentRequests(_ref3.get, unwrapDependencies(dependencies)),
              2,
            ),
            results = _concurrentRequests6[0],
            exceptions = _concurrentRequests6[1];
          if (
            exceptions.every(function (exp) {
              return null == exp;
            })
          )
            return wrapResults(dependencies, results);
          var error = exceptions.find(isError);
          if (null != error) throw error;
          throw Promise.all(exceptions).then(function (results) {
            return wrapResults(dependencies, results);
          });
        };
      },
    }),
    noWait: Recoil_selectorFamily({
      key: '__noWait',
      get: function (dependency) {
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
    }),
  },
  Recoil_WaitFor_1 = Recoil_WaitFor.waitForNone,
  Recoil_WaitFor_2 = Recoil_WaitFor.waitForAny,
  Recoil_WaitFor_3 = Recoil_WaitFor.waitForAll,
  Recoil_WaitFor_4 = Recoil_WaitFor.noWait,
  Recoil_WaitFor$1 = Object.freeze({
    __proto__: null,
    waitForNone: Recoil_WaitFor_1,
    waitForAny: Recoil_WaitFor_2,
    waitForAll: Recoil_WaitFor_3,
    noWait: Recoil_WaitFor_4,
  }),
  _require4$1 = getCjsExportFromNamespace(Recoil_Hooks$1),
  atomFamily = getCjsExportFromNamespace(Recoil_atomFamily),
  _require5 = getCjsExportFromNamespace(Recoil_WaitFor$1),
  DefaultValue$3 = _require.DefaultValue,
  RecoilRoot$1 = _require2$1.RecoilRoot,
  isRecoilValue$5 = _require3.isRecoilValue,
  useGotoRecoilSnapshot$1 = _require4$1.useGotoRecoilSnapshot,
  useRecoilCallback$1 = _require4$1.useRecoilCallback,
  useRecoilSnapshot$1 = _require4$1.useRecoilSnapshot,
  useRecoilState$1 = _require4$1.useRecoilState,
  useRecoilStateLoadable$1 = _require4$1.useRecoilStateLoadable,
  useRecoilTransactionObserver$1 = _require4$1.useRecoilTransactionObserver,
  useRecoilValue$1 = _require4$1.useRecoilValue,
  useRecoilValueLoadable$1 = _require4$1.useRecoilValueLoadable,
  useResetRecoilState$1 = _require4$1.useResetRecoilState,
  useSetRecoilState$1 = _require4$1.useSetRecoilState,
  useSetUnvalidatedAtomValues$1 = _require4$1.useSetUnvalidatedAtomValues,
  useTransactionObservation_DEPRECATED$1 =
    _require4$1.useTransactionObservation_DEPRECATED,
  noWait$1 = _require5.noWait,
  waitForAll$1 = _require5.waitForAll,
  waitForAny$1 = _require5.waitForAny,
  waitForNone$1 = _require5.waitForNone,
  Recoil_index = {
    DefaultValue: DefaultValue$3,
    RecoilRoot: RecoilRoot$1,
    atom: atom,
    selector: Recoil_selector,
    atomFamily: atomFamily,
    selectorFamily: Recoil_selectorFamily,
    constSelector: Recoil_constSelector,
    errorSelector: Recoil_errorSelector,
    readOnlySelector: Recoil_readOnlySelector,
    useRecoilValue: useRecoilValue$1,
    useRecoilValueLoadable: useRecoilValueLoadable$1,
    useRecoilState: useRecoilState$1,
    useRecoilStateLoadable: useRecoilStateLoadable$1,
    useSetRecoilState: useSetRecoilState$1,
    useResetRecoilState: useResetRecoilState$1,
    useRecoilCallback: useRecoilCallback$1,
    useGotoRecoilSnapshot: useGotoRecoilSnapshot$1,
    useRecoilSnapshot: useRecoilSnapshot$1,
    useRecoilTransactionObserver_UNSTABLE: useRecoilTransactionObserver$1,
    useTransactionObservation_UNSTABLE: useTransactionObservation_DEPRECATED$1,
    useSetUnvalidatedAtomValues_UNSTABLE: useSetUnvalidatedAtomValues$1,
    noWait: noWait$1,
    waitForNone: waitForNone$1,
    waitForAny: waitForAny$1,
    waitForAll: waitForAll$1,
    isRecoilValue: isRecoilValue$5,
  },
  Recoil_index_1 = Recoil_index.DefaultValue,
  Recoil_index_2 = Recoil_index.RecoilRoot,
  Recoil_index_3 = Recoil_index.atom,
  Recoil_index_4 = Recoil_index.selector,
  Recoil_index_5 = Recoil_index.atomFamily,
  Recoil_index_6 = Recoil_index.selectorFamily,
  Recoil_index_7 = Recoil_index.constSelector,
  Recoil_index_8 = Recoil_index.errorSelector,
  Recoil_index_9 = Recoil_index.readOnlySelector,
  Recoil_index_10 = Recoil_index.useRecoilValue,
  Recoil_index_11 = Recoil_index.useRecoilValueLoadable,
  Recoil_index_12 = Recoil_index.useRecoilState,
  Recoil_index_13 = Recoil_index.useRecoilStateLoadable,
  Recoil_index_14 = Recoil_index.useSetRecoilState,
  Recoil_index_15 = Recoil_index.useResetRecoilState,
  Recoil_index_16 = Recoil_index.useRecoilCallback,
  Recoil_index_17 = Recoil_index.useGotoRecoilSnapshot,
  Recoil_index_18 = Recoil_index.useRecoilSnapshot,
  Recoil_index_19 = Recoil_index.useRecoilTransactionObserver_UNSTABLE,
  Recoil_index_20 = Recoil_index.useTransactionObservation_UNSTABLE,
  Recoil_index_21 = Recoil_index.useSetUnvalidatedAtomValues_UNSTABLE,
  Recoil_index_22 = Recoil_index.noWait,
  Recoil_index_23 = Recoil_index.waitForNone,
  Recoil_index_24 = Recoil_index.waitForAny,
  Recoil_index_25 = Recoil_index.waitForAll,
  Recoil_index_26 = Recoil_index.isRecoilValue;
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
