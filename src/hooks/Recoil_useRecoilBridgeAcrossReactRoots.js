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

const React = require('React');
const {useMemo} = require('React');

const {RecoilRoot, useStoreRef} = require('../core/Recoil_RecoilRoot.react');

export type RecoilBridge = React.AbstractComponent<{children: React.Node}>;

function useRecoilBridgeAcrossReactRoots(): RecoilBridge {
  const store = useStoreRef().current;
  return useMemo(() => {
    function RecoilBridge({children}) {
      return <RecoilRoot store_INTERNAL={store}>{children}</RecoilRoot>;
    }
    return RecoilBridge;
  }, [store]);
}

module.exports = useRecoilBridgeAcrossReactRoots;
