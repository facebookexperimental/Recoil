/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

const errorSelector = require('Recoil_error');
const {getRecoilValueAsLoadable} = require('Recoil_RecoilValue');
const {makeStore} = require('Recoil_TestingUtils');

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
