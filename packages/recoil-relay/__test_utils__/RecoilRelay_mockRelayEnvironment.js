/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

import type {Snapshot} from 'Recoil';

const {snapshot_UNSTABLE} = require('Recoil');

const {
  EnvironmentKey,
  RecoilRelayEnvironment,
  registerRecoilSnapshotRelayEnvironment,
} = require('../RecoilRelay_Environments');
const React = require('react');
const {
  renderElements: renderRecoilElements,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');
const {createMockEnvironment} = require('relay-test-utils');

type RelayMockEnvironment = $Call<typeof createMockEnvironment>;

function mockRelayEnvironment(): {
  environment: RelayMockEnvironment,
  mockEnvironmentKey: EnvironmentKey,
  renderElements: React.Node => HTMLDivElement,
  snapshot: Snapshot,
} {
  const environment = createMockEnvironment();
  const mockEnvironmentKey = new EnvironmentKey('Mock');
  function renderElements(elements: React.Node) {
    return renderRecoilElements(
      <RecoilRelayEnvironment
        environment={environment}
        environmentKey={mockEnvironmentKey}>
        {elements}
      </RecoilRelayEnvironment>,
    );
  }
  const snapshot = snapshot_UNSTABLE();
  snapshot.retain();
  registerRecoilSnapshotRelayEnvironment(
    snapshot,
    mockEnvironmentKey,
    environment,
  );
  return {
    environment,
    mockEnvironmentKey,
    renderElements,
    snapshot,
  };
}

module.exports = mockRelayEnvironment;
