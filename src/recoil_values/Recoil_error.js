/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {RecoilValueReadOnly} from 'Recoil';

const cacheWithReferenceEquality = require('Recoil_cacheWithReferenceEquality');
const selectorFamily = require('Recoil_selectorFamily');

// flowlint-next-line unclear-type:off
const throwingSelector = selectorFamily<any, any>({
  key: '__error',
  get: message => () => {
    throw new Error(message);
  },
  cacheImplementationForParams_UNSTABLE: cacheWithReferenceEquality,
});

// Function that returns a selector which always throws an error
// with the provided message.
function errorSelector<T>(message: string): RecoilValueReadOnly<T> {
  return throwingSelector(message);
}

module.exports = errorSelector;
