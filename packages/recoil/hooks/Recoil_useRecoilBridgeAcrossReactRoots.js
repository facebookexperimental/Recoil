/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

const {RecoilRoot, useStoreRef} = require('../core/Recoil_RecoilRoot');
const React = require('react');
const {useMemo} = require('react');

export type RecoilBridge = React.AbstractComponent<{children: React.Node}>;

function useRecoilBridgeAcrossReactRoots(): RecoilBridge {
  const store = useStoreRef().current;
  return useMemo(() => {
    // eslint-disable-next-line no-shadow
    function RecoilBridge({
      children,
    }: $TEMPORARY$object<{children: React.Node}>) {
      return <RecoilRoot store_INTERNAL={store}>{children}</RecoilRoot>;
    }
    return RecoilBridge;
  }, [store]);
}

module.exports = useRecoilBridgeAcrossReactRoots;
