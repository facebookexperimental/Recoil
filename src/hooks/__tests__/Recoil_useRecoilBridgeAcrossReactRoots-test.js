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

const {getRecoilTestFn} = require('../../testing/Recoil_TestingUtils');

let React,
  useEffect,
  useRef,
  ReactDOM,
  act,
  RecoilRoot,
  atom,
  componentThatReadsAndWritesAtom,
  useRecoilBridgeAcrossReactRoots;

const testRecoil = getRecoilTestFn(() => {
  React = require('React');
  ({useEffect, useRef} = require('React'));
  ReactDOM = require('ReactDOM');
  ({act} = require('ReactTestUtils'));

  ({RecoilRoot} = require('../../core/Recoil_RecoilRoot.react'));
  atom = require('../../recoil_values/Recoil_atom');
  ({
    componentThatReadsAndWritesAtom,
  } = require('../../testing/Recoil_TestingUtils'));
  useRecoilBridgeAcrossReactRoots = require('../Recoil_useRecoilBridgeAcrossReactRoots');
});

testRecoil('useRecoilBridgeAcrossReactRoots - create a context bridge', () => {
  const myAtom = atom({
    key: 'useRecoilBridgeAcrossReactRoots - context bridge',
    default: 'DEFAULT',
  });

  function initializeState({set, getLoadable}) {
    expect(getLoadable(myAtom).contents).toEqual('DEFAULT');
    set(myAtom, 'INITIALIZE');
    expect(getLoadable(myAtom).contents).toEqual('INITIALIZE');
  }

  const [ReadWriteAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);

  function NestedReactRoot({children}) {
    const ref = useRef();
    const RecoilBridge = useRecoilBridgeAcrossReactRoots();

    useEffect(() => {
      act(() => {
        ReactDOM.render(
          <RecoilBridge>{children}</RecoilBridge>,
          ref.current ?? document.createElement('div'),
        );
      });
    }, [children]);

    return <div ref={ref} />;
  }

  const container = document.createElement('div');
  act(() => {
    ReactDOM.render(
      <RecoilRoot initializeState={initializeState}>
        <ReadWriteAtom />

        <NestedReactRoot>
          <ReadWriteAtom />
        </NestedReactRoot>
      </RecoilRoot>,
      container,
    );
  });

  expect(container.textContent).toEqual('"INITIALIZE""INITIALIZE"');

  act(() => setAtom('SET'));
  expect(container.textContent).toEqual('"SET""SET"');
});
