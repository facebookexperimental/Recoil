/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Interface for `scheduler/tracing` to aid in profiling Recoil and Recoil apps.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {RecoilValue} from '../core/Recoil_RecoilValue';

// flowlint-next-line untyped-import:off
// @fb-only: const SchedulerTracing = require('SchedulerTracing');

function trace<TResult>(
  message: string,
  node: string | RecoilValue<mixed>,
  fn: () => TResult,
): TResult {
  // prettier-ignore
  // @fb-only: if (__DEV__) {
  // prettier-ignore
    // @fb-only: if (
  // prettier-ignore
      // @fb-only: SchedulerTracing.unstable_trace !== undefined &&
  // prettier-ignore
      // @fb-only: window.performance !== undefined
  // prettier-ignore
    // @fb-only: ) {
  // prettier-ignore
      // @fb-only: return SchedulerTracing.unstable_trace(
  // prettier-ignore
        // @fb-only: `Recoil: ${message} for node: ${
  // prettier-ignore
          // @fb-only: typeof node === 'string' ? node : node.key
  // prettier-ignore
        // @fb-only: }`,
  // prettier-ignore
        // @fb-only: window.performance.now(),
  // prettier-ignore
        // @fb-only: fn,
  // prettier-ignore
      // @fb-only: );
  // prettier-ignore
    // @fb-only: }
  // prettier-ignore
  // @fb-only: }
  return fn();
}

function wrap<TFunction>(fn: TFunction): TFunction {
  // prettier-ignore
  // @fb-only: if (__DEV__) {
  // prettier-ignore
    // @fb-only: if (SchedulerTracing.unstable_wrap !== undefined) {
  // prettier-ignore
      // @fb-only: return SchedulerTracing.unstable_wrap(fn);
  // prettier-ignore
    // @fb-only: }
  // prettier-ignore
  // @fb-only: }
  return fn;
}

module.exports = {
  trace,
  wrap,
};
