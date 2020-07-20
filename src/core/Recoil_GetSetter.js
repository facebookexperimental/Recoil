/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */
'use strict';

import type {DependencyMap} from './Recoil_GraphTypes';
import type {AtomValues, Store, TreeState} from './Recoil_State';
import type {RecoilState, RecoilValue} from './Recoil_RecoilValue';
import type {DefaultValue} from './Recoil_Node';
import type {
    GetRecoilValue,
    ResetRecoilState,
    SetRecoilState,
} from '../recoil_values/Recoil_selector_OLD';

const {RecoilValueNotReady, DEFAULT_VALUE} = require('./Recoil_Node');
const {getNodeLoadable, setNodeValue} = require('./Recoil_FunctionalCore');
const {mergeDepsIntoDependencyMap} = require('./Recoil_Graph');

export type Setter<T> = (
    {set: SetRecoilState, get: GetRecoilValue, reset: ResetRecoilState},
    newValue: T | DefaultValue,
) => void;

type SetterResult = [DependencyMap, AtomValues];
type GetSetter = <T>(
    set: Setter<T>,
    initState: (store: Store) => void,
) => (
    store: Store,
    state: TreeState,
    newValue: T | DefaultValue,
) => SetterResult;

const getSetter: GetSetter = <T>(set, initState) => (
    store,
    state,
    newValue,
): SetterResult => {
    initState(store);

    const dependencyMap: DependencyMap = new Map();
    const writes: AtomValues = new Map();

    function getRecoilValue<S>({key}: RecoilValue<S>): S {
        const [deps, loadable] = getNodeLoadable(store, state, key);
        mergeDepsIntoDependencyMap(deps, dependencyMap);

        if (loadable.state === 'hasValue') {
            return loadable.contents;
        } else if (loadable.state === 'loading') {
            throw new RecoilValueNotReady(key);
        } else {
            throw loadable.contents;
        }
    }

    function setRecoilState<S>(
        recoilState: RecoilState<S>,
        valueOrUpdater: S | DefaultValue | ((S, GetRecoilValue) => S),
    ) {
        const newValue =
            typeof valueOrUpdater === 'function'
                ? // cast to any because we can't restrict type S from being a function itself without losing support for opaque types
                  // flowlint-next-line unclear-type:off
                  (valueOrUpdater: any)(getRecoilValue(recoilState))
                : valueOrUpdater;
        const [deps, upstreamWrites] = setNodeValue(
            store,
            state,
            recoilState.key,
            newValue,
        );
        mergeDepsIntoDependencyMap(deps, dependencyMap);

        upstreamWrites.forEach((v, k) => writes.set(k, v));
    }

    function resetRecoilState<S>(recoilState: RecoilState<S>) {
        setRecoilState(recoilState, DEFAULT_VALUE);
    }

    set(
        {set: setRecoilState, get: getRecoilValue, reset: resetRecoilState},
        newValue,
    );
    return [dependencyMap, writes];
};

module.exports = getSetter;
