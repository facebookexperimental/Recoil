/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Interface for `scheduler/tracing` to aid in profiling Recoil and Recoil apps.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {RecoilValue} from '../core/Recoil_RecoilValue';

// flowlint-next-line untyped-import:off
// @fb-only: import SchedulerTracing from 'SchedulerTracing';

export function trace<TResult>(
  message: string,
  node: string | RecoilValue<mixed>,
  fn: () => TResult,
): TResult {
  // prettier-ignore
  if (__DEV__) {
    // @fb-only
    // prettier-ignore
    if (
      // @fb-only
      // prettier-ignore
      // @fb-only: SchedulerTracing.unstable_trace !== undefined &&
        // prettier-ignore
        // @fb-only: window.performance !== undefined
        // prettier-ignore
        
    ) {
      // @fb-only
      // prettier-ignore
      return SchedulerTracing.unstable_trace(
        // @fb-only
        // prettier-ignore
        `Recoil: ${message} for node: ${// @fb-only
        // prettier-ignore
        typeof node === 'string'
          ? node
          // @fb-only: : node.key
          // prettier-ignore
          // @fb-only: }`
        ,
        // prettier-ignore
        // @fb-only: window.performance.now()
        ,
        // prettier-ignore
        // @fb-only: fn
        ,
        // prettier-ignore
        
      // @fb-only: );
      // prettier-ignore
      
    // @fb-only: }
    // prettier-ignore
    
  // @fb-only: }
  return fn();
}

export function wrap<TFunction>(fn: TFunction): TFunction {
  // prettier-ignore
  if (__DEV__) {
    // @fb-only
    // prettier-ignore
    if (SchedulerTracing.unstable_wrap !== undefined) {
      // @fb-only
      // prettier-ignore
      // @fb-only: return SchedulerTracing.unstable_wrap(fn);
      // prettier-ignore
      
    // @fb-only: }
    // prettier-ignore
    
  // @fb-only: }
  return fn;
}
