/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 * @oncall recoil
 */

module.exports = {
  timers: 'fake',
  globals: {
    __DEV__: true,
  },
  moduleNameMapper: {
    '^recoil-shared(.*)$': '<rootDir>/packages/shared$1',
    '^Recoil$': '<rootDir>/packages/recoil',
    '^recoil-sync$': '<rootDir>/packages/recoil-sync',
    '^refine$': '<rootDir>/packages/refine',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/packages-ext/',
    '/__generated__/',
    '/mock-graphql/',
  ],
  setupFiles: ['./setupJestMock.js'],
};
