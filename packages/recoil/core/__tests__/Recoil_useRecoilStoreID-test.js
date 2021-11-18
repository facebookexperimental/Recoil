/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const {getRecoilTestFn} = require('../../__test_utils__/Recoil_TestingUtils');

let React, renderElements, RecoilRoot, useRecoilStoreID;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({renderElements} = require('../../__test_utils__/Recoil_TestingUtils'));
  ({RecoilRoot} = require('../Recoil_RecoilRoot.react'));
  ({useRecoilStoreID} = require('../Recoil_RecoilRoot.react'));
});

testRecoil('useRecoilStoreID', () => {
  const storeIDs = {};
  function StoreID({rootKey}) {
    const storeID = useRecoilStoreID();
    storeIDs[rootKey] = storeID;
    return null;
  }
  function MyApp() {
    return (
      <div>
        <RecoilRoot>
          <StoreID rootKey="A" />
          <RecoilRoot>
            <StoreID rootKey="A1" />
          </RecoilRoot>
          <RecoilRoot override={false}>
            <StoreID rootKey="A2" />
          </RecoilRoot>
        </RecoilRoot>
        <RecoilRoot>
          <StoreID rootKey="B" />
        </RecoilRoot>
      </div>
    );
  }

  renderElements(<MyApp />);

  expect('A' in storeIDs).toEqual(true);
  expect('A1' in storeIDs).toEqual(true);
  expect('A2' in storeIDs).toEqual(true);
  expect('B' in storeIDs).toEqual(true);
  expect(storeIDs.A).not.toEqual(storeIDs.B);
  expect(storeIDs.A).not.toEqual(storeIDs.A1);
  expect(storeIDs.A).toEqual(storeIDs.A2);
  expect(storeIDs.B).not.toEqual(storeIDs.A1);
  expect(storeIDs.B).not.toEqual(storeIDs.A2);
});
