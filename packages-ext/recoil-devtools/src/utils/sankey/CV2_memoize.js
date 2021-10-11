/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow strict-local
 * @format
 */
'use strict';

import isImmutable from './isImmutable';
import Immutable from 'immutable';

const KEY = Symbol('CV2_cacheKeyFromObject.KEY');
const TIME_WARNING_THRESHOLD_MS = 15;

/**
 * Convert the given object into something that hashable that can be used as an
 * Immutable Map key. The current implementation recursively converts arrays
 * and plain objects to Lists and Maps, but it stops when hitting an Immutable
 * structure or a class instance. TODO: T21531272 it should go deeper than that.
 */
function cacheKeyFromObject(object: mixed): mixed {
  if (typeof object === 'object' && object !== null && !isImmutable(object)) {
    const t0 = window.performance ? performance.now() : 0;
    let answer: Immutable.Map<string, mixed> = Immutable.Map();
    // $FlowIssue[sketchy-null-mixed] #9606986 Symbols are not supported
    // $FlowIssue[incompatible-type] #9606986 Symbols are not supported
    if (object[KEY]) {
      answer = answer.set('key', object[KEY]);
    } else {
      Object.entries(object).forEach(([key, value]) => {
        answer =
          typeof value === 'object' &&
          value !== null &&
          // $FlowIssue[incompatible-type] #9606986 Symbols are not supported
          value[KEY] != null
            ? answer.set(key, value[KEY])
            : answer.set(key, Immutable.fromJS(value));
      });
    }
    const t1 = window.performance ? performance.now() : 0;
    if (__DEV__) {
      if (t1 - t0 > TIME_WARNING_THRESHOLD_MS) {
        // eslint-disable-next-line fb-www/no-console
        console.error('Spent', t1 - t0, 'milliseconds computing a cache key.');
      }
    }
    return answer;
  } else {
    return object;
  }
}

export default function memoize<Arg, Result>(fn: Arg => Result): Arg => Result {
  let map;
  return (arg: Arg) => {
    if (!map) {
      map = Immutable.Map();
    }
    const key = cacheKeyFromObject(arg);

    if (map.has(key)) {
      // $FlowFixMe[incompatible-return]
      return map.get(key);
    } else {
      const result = fn(arg);
      map = map.set(key, result);
      return result;
    }
  };
}
