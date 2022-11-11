/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

const {
  IS_INTERNAL,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

const testOssOnly = IS_INTERNAL ? test.skip : test;

describe('RecoilEnv', () => {
  testOssOnly('OSS only: environment propagates GKs', () => {
    const RecoilEnv = require('../Recoil_RecoilEnv');
    const gkx = require('../Recoil_gkx');

    expect(gkx('recoil_test_gk')).toBe(false);
    RecoilEnv.RECOIL_GKS_ENABLED.add('recoil_test_gk');
    expect(gkx('recoil_test_gk')).toBe(true);
  });

  describe('support for process.env.RECOIL_GKS_ENABLED', () => {
    const originalProcessEnv = process.env;
    beforeEach(() => {
      process.env = {...originalProcessEnv};
      process.env.RECOIL_GKS_ENABLED =
        'recoil_test_gk1,recoil_test_gk2 recoil_test_gk3';
      jest.resetModules();
    });

    afterEach(() => {
      process.env = originalProcessEnv;
    });

    testOssOnly('OSS only: environment propagates GKs', () => {
      const gkx = require('../Recoil_gkx');

      expect(gkx('recoil_test_gk1')).toBe(true);
      expect(gkx('recoil_test_gk2')).toBe(true);
      expect(gkx('recoil_test_gk3')).toBe(true);
    });
  });
});
