/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Return an atom whose state cannot vary independently but is derived from that
 * of other atoms. Whenever its dependency atoms change, it will re-evaluate
 * a function and pass along the result to any components or further selectors:
 *
 *    const exampleSelector = selector({
 *      key: 'example',
 *      get: ({get}) => {
 *        const a = get(atomA);
 *        const b = get(atomB);
 *        return a + b;
 *      },
 *    });
 *
 * In this example, the value of exampleSelector will be the sum of atomA and atomB.
 * This sum will be updated whenever either atomA or atomB changes. The value
 * returned by the function will be deeply frozen.
 *
 * The function is only reevaluated if the dependencies change and the selector
 * has a component subscribed to it (either directly or indirectly via other
 * selectors). By default, function results are cached, so if the same values
 * of the dependencies are seen again, the cached value will be returned instead
 * of the function being reevaluated. The caching behavior can be overridden
 * by providing the `cacheImplementation` option; this can be used to discard
 * old values or to provide different equality semantics.
 *
 * If the provided function returns a Promise, it will cause the value of the
 * atom to become unavailable until the promise resolves. This means that any
 * components subscribed to the selector will suspend. If the promise is rejected,
 * any subscribed components will throw the rejecting error during rendering.
 *
 * You can provide the `set` option to allow writing to the selector. This
 * should be used sparingly; maintain a conceptual separation between independent
 * state and derived values. The `set` function receives a function to set
 * upstream RecoilValues which can accept a value or an updater function.
 * The updater function provides parameters with the old value of the RecoilValue
 * as well as a get() function to read other RecoilValues.
 *
 *   const multiplierSelector = selector({
 *     key: 'multiplier',
 *     get: ({get}) => get(atomA) * 100,
 *     set: ({set, reset, get}, newValue) => set(atomA, newValue / 100),
 *   });
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable} from '../adt/Recoil_Loadable';
import type {DependencyMap} from '../core/Recoil_Graph';
import type {DefaultValue} from '../core/Recoil_Node';
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {Store} from '../core/Recoil_State';
import type {
    GetRecoilValue,
    SetRecoilState,
    ResetRecoilState,
} from './Recoil_selector_OLD';

const {loadableWithValue} = require('../adt/Recoil_Loadable');
const {registerNode} = require('../core/Recoil_Node');
const getSetter = require('../core/Recoil_GetSetter');

type PowerOptions<T> = $ReadOnly<{
    key: string,
    set: (
        {set: SetRecoilState, get: GetRecoilValue, reset: ResetRecoilState},
        newValue: T | DefaultValue,
    ) => void,
}>;

/* eslint-disable no-redeclare */
declare function power<T>(options: PowerOptions<T>): RecoilState<T>;

function power<T>(options: PowerOptions<T>): RecoilValue<T> {
    const {key, set} = options;

    // flowlint-next-line unclear-type:off
    const powerValues = [new Map(), loadableWithValue<any>(null)]; // does not matter for setter: any static value

    const initPower = (store: Store) => {
        store.getState().knownSelectors.add(key);
    };

    return registerNode<T>({
        key,
        options,
        set: getSetter<T>(set, initPower),
        get: (store: Store): [DependencyMap, Loadable<T>] => {
            initPower(store);
            return powerValues;
        },
    });
}
/* eslint-enable no-redeclare */

module.exports = power;
