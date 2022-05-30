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

// const React = require('react');
// const {RecoilRoot_INTERNAL, useStoreRef} = require('./Recoil_RecoilRoot');
// const {useRecoilCallback} = require('../hooks/Recoil_useRecoilCallback');

// type PartialNexus = {
//   get: (<T>(atom: RecoilValue<T>) => T) | null,
//   getPromise: (<T>(atom: RecoilValue<T>) => Promise<T>) | null,
//   set:
//     | (<T>(atom: RecoilState<T>, valOrUpdater: T | ((currVal: T) => T)) => void)
//     | null,
//   reset: (<T>(atom: RecoilState<T>) => void) | null,
// };

// type Nexus = {
//   get: <T>(atom: RecoilValue<T>) => T,
//   getPromise: <T>(atom: RecoilValue<T>) => Promise<T>,
//   set: <T>(atom: RecoilState<T>, valOrUpdater: T | ((currVal: T) => T)) => void,
//   reset: <T>(atom: RecoilState<T>) => void,
// };

// const partialNexus: PartialNexus = {
//   get: null,
//   getPromise: null,
//   set: null,
//   reset: null,
// };

// let nexus: Nexus;

// function RecoilNexus() {
//   // $FlowFixMe
//   partialNexus.get = useRecoilCallback(
//     ({snapshot}) =>
//       function <T>(atom: RecoilValue<T>): T {
//         return snapshot.getLoadable(atom).getValue();
//       },
//     [],
//   );

//   // $FlowFixMe
//   partialNexus.getPromise = useRecoilCallback(
//     ({snapshot}) =>
//       function <T>(atom: RecoilValue<T>): Promise<T> {
//         return snapshot.getPromise(atom);
//       },
//     [],
//   );

//   partialNexus.set = useRecoilCallback(({set}) => set, []);

//   partialNexus.reset = useRecoilCallback(({reset}) => reset, []);

//   //$FlowFixMe
//   nexus = partialNexus;

//   return null;
// }

// function RecoilRoot(props: Props): React.Node {
//   const {override, ...propsExceptOverride} = props;

//   const ancestorStoreRef = useStoreRef();
//   if (override === false && ancestorStoreRef.current !== defaultStore) {
//     // If ancestorStoreRef.current !== defaultStore, it means that this
//     // RecoilRoot is not nested within another.
//     return props.children;
//   }

//   return <RecoilRoot_INTERNAL {...propsExceptOverride} />;
// }

// function useRecoilStoreID(): StoreID {
//   return useStoreRef().current.storeID;
// }

// function getRecoil<T>(atom: RecoilValue<T>): T {
//   return nexus.get(atom);
// }

// function getRecoilPromise<T>(atom: RecoilValue<T>): Promise<T> {
//   return nexus.getPromise(atom);
// }

// function setRecoil<T>(
//   atom: RecoilState<T>,
//   valOrUpdater: T | ((currVal: T) => T),
// ) {
//   nexus.set(atom, valOrUpdater);
// }

// //$FlowFixMe
// function resetRecoil(atom: RecoilState<any>) {
//   nexus.reset(atom);
// }

// module.exports = {
//   RecoilRoot,
//   useRecoilStoreID,
//   getRecoil,
//   getRecoilPromise,
//   setRecoil,
//   resetRecoil,
// };

module.exports = ({}: {...});
