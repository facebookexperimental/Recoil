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

export type NodeKey = string;
export opaque type StateID = number;
export opaque type StoreID = number;
export opaque type ComponentID = number;

let nextTreeStateVersion = 0;
const getNextTreeStateVersion: () => StateID = () => nextTreeStateVersion++;

let nextStoreID = 0;
const getNextStoreID: () => StoreID = () => nextStoreID++;

let nextComponentID = 0;
const getNextComponentID: () => ComponentID = () => nextComponentID++;

module.exports = {
  getNextTreeStateVersion,
  getNextStoreID,
  getNextComponentID,
};
