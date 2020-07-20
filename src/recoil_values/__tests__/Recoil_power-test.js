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

const atom = require('../Recoil_atom');
const selector = require('../Recoil_selector');
const power = require('../Recoil_power');

const {
    getRecoilValueAsLoadable,
    setRecoilValue,
} = require('../../core/Recoil_RecoilValueInterface');
const {makeStore} = require('../../testing/Recoil_TestingUtils');

let store;

function get(recoilValue) {
    return getRecoilValueAsLoadable(store, recoilValue).contents;
}

function set(recoilState, value) {
    setRecoilValue(store, recoilState, value);
}

describe('#power', () => {
    let setter: any;
    let state: any;
    let isDirtyState: any;

    const defaultAtomValue = 'defaultAtomValue';
    const updatedValue = 'updatedValue';

    beforeEach(() => {
        store = makeStore();
    });

    beforeEach(() => {
        state = atom<string>({
            key: 'selector/set/atom',
            default: defaultAtomValue,
        });

        setter = power<string>({
            key: 'power',
            set: ({set}, newValue) => set(state, newValue),
        });

        isDirtyState = selector<boolean>({
            key: 'selector/get',
            get: ({get}) => get(state) === defaultAtomValue,
        });
    });

    it('should set new value to dependent atom state', () => {
        expect(get(state)).toEqual(defaultAtomValue);
        set(setter, updatedValue);
        expect(get(state)).toEqual(updatedValue);
    });

    it('should set new value to dependent selector state', () => {
        expect(get(isDirtyState)).toBeTruthy();
        set(setter, updatedValue);
        expect(get(isDirtyState)).toBeFalsy();
    });
});
