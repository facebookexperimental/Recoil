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

import type {StoreID} from './Recoil_Keys';
import type {RecoilState, RecoilValue} from './Recoil_RecoilValue';
import type {MutableSnapshot, Snapshot} from './Recoil_Snapshot';
import type {Store, StoreRef, StoreState, TreeState} from './Recoil_State';

const React = require('react');
const {
  RecoilRoot_INTERNAL,
  useStoreRef,
  defaultStore,
} = require('./Recoil_RecoilRoot');
const {useRecoilCallback} = require('../hooks/Recoil_useRecoilCallback');
const {getNextStoreID} = require('./Recoil_Keys');
const err = require('recoil-shared/util/Recoil_err');

function notInAContext() {
  throw err('This component must be used inside a <RecoilRoot> component.');
}

type Nexus = {
  get: <T>(atom: RecoilValue<T>) => T,
  getPromise: <T>(atom: RecoilValue<T>) => Promise<T>,
  set: <T>(atom: RecoilState<T>, valOrUpdater: T | ((currVal: T) => T)) => void,
  reset: <T>(atom: RecoilState<T>) => void,
};

let nexus: $Shape<Nexus> = {};

function RecoilNexus() {
  // $FlowFixMe
  nexus.get = useRecoilCallback(
    ({snapshot}) =>
      function <T>(atom: RecoilValue<T>): T {
        return snapshot.getLoadable(atom).getValue();
      },
    [],
  );

  // $FlowFixMe
  nexus.getPromise = useRecoilCallback(
    ({snapshot}) =>
      function <T>(atom: RecoilValue<T>): Promise<T> {
        return snapshot.getPromise(atom);
      },
    [],
  );

  nexus.set = useRecoilCallback(({set}) => set, []);

  nexus.reset = useRecoilCallback(({reset}) => reset, []);

  return null;
}

type Props =
  | {
      initializeState_DEPRECATED?: ({
        set: <T>(RecoilValue<T>, T) => void,
        setUnvalidatedAtomValues: (Map<string, mixed>) => void,
      }) => void,
      initializeState?: MutableSnapshot => void,
      store_INTERNAL?: Store,
      override?: true,
      children: React.Node,
    }
  | {
      store_INTERNAL?: Store,
      /**
       * Defaults to true. If override is true, this RecoilRoot will create a
       * new Recoil scope. If override is false and this RecoilRoot is nested
       * within another RecoilRoot, this RecoilRoot will perform no function.
       * Children of this RecoilRoot will access the Recoil values of the
       * nearest ancestor RecoilRoot.
       */
      override: false,
      children: React.Node,
    };

function RecoilRoot(props: Props): React.Node {
  const {override, children, ...propsExceptOverrideAndChildren} = props;

  const ancestorStoreRef = useStoreRef();
  if (override === false && ancestorStoreRef.current !== defaultStore) {
    // If ancestorStoreRef.current !== defaultStore, it means that this
    // RecoilRoot is not nested within another.
    return children;
  }

  return (
    <RecoilRoot_INTERNAL {...propsExceptOverrideAndChildren}>
      <RecoilNexus />
      {children}
    </RecoilRoot_INTERNAL>
  );
}

function getRecoil<T>(atom: RecoilValue<T>): T {
  return nexus.get(atom);
}

function getRecoilPromise<T>(atom: RecoilValue<T>): Promise<T> {
  return nexus.getPromise(atom);
}

function setRecoil<T>(
  atom: RecoilState<T>,
  valOrUpdater: T | ((currVal: T) => T),
) {
  nexus.set(atom, valOrUpdater);
}

//$FlowFixMe
function resetRecoil(atom: RecoilState<any>) {
  nexus.reset(atom);
}

module.exports = {
  RecoilRoot,
  getRecoil,
  getRecoilPromise,
  setRecoil,
  resetRecoil,
};
