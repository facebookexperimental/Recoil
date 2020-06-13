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

const {
  getRecoilValueAsLoadable,
} = require('../../core/Recoil_RecoilValueInterface');
const {makeStore} = require('../../testing/Recoil_TestingUtils');
const errorSelector = require('../Recoil_errorSelector');

let store;
beforeEach(() => {
  store = makeStore();
});

function getError(recoilValue) {
  return getRecoilValueAsLoadable(store, recoilValue).errorOrThrow();
}

test('errorSelector - string', () => {
  const mySelector = errorSelector('My Error');
  expect(getError(mySelector).message).toEqual(
    expect.stringContaining('My Error'),
  );
});
