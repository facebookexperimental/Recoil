/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * See https://our.intern.facebook.com/intern/wiki/Recoil/
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

export type {CacheImplementation} from 'Recoil_Cache';
export type {RecoilInterface, SetterOrUpdater} from 'Recoil_Hooks';

const ArrayKeyedMap = require('Recoil_ArrayKeyedMap');
const cacheMostRecent = require('Recoil_cacheMostRecent');
const cacheWithReferenceEquality = require('Recoil_cacheWithReferenceEquality');
const cacheWithValueEquality = require('Recoil_cacheWithValueEquality');
const evaluatingAtom = require('Recoil_evaluatingAtom');
const evaluatingAtomFamily = require('Recoil_evaluatingAtomFamily');
const {useRecoilInterface} = require('Recoil_Hooks');
const {DEFAULT_VALUE} = require('Recoil_Node');
const ParameterizedAtomTaggedValue_DEPRECATED = require('Recoil_ParameterizedAtomTaggedValue_DEPRECATED');
const RecoilDevToolsObserver = require('Recoil_RecoilDevToolsObserver');
const ScopedAtomTaggedValue = require('Recoil_ScopedAtomTaggedValue');
const stableStringify = require('Recoil_stableStringify');

module.exports = {
  // Convenience RecoilValues
  evaluatingAtom,
  evaluatingAtomFamily,

  // Hooks
  useRecoilInterface_UNSTABLE: useRecoilInterface,

  // Types
  ScopedAtomTaggedValue,
  ParameterizedAtomTaggedValue_DEPRECATED,
  ArrayKeyedMap,
  DEFAULT_VALUE,

  // Caches
  cacheWithReferenceEquality,
  cacheWithValueEquality,
  cacheMostRecent,
  stableStringify,

  // Dev Tools
  RecoilDevToolsObserver,
};
