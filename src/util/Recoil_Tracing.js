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

const SchedulerTracing = require('./SchedulerTracing'); // flowlint-line untyped-import:off

function trace<TResult>(
  message: string,
  node: string | RecoilValue<mixed>,
  fn: () => TResult,
): TResult {
  // if (__DEV__) {
  //   if (
  //     SchedulerTracing.unstable_trace !== undefined &&
  //     window.performance !== undefined
  //   ) {
  //     return SchedulerTracing.unstable_trace(
  //       `Recoil: ${message} for node: ${
  //         typeof node === 'string' ? node : node.key
  //       }`,
  //       window.performance.now(),
  //       fn,
  //     );
  //   }
  // }
  return fn();
}

function wrap<TFunction>(fn: TFunction): TFunction {
  // if (__DEV__) {
  //   if (SchedulerTracing.unstable_wrap !== undefined) {
  //     return SchedulerTracing.unstable_wrap(fn);
  //   }
  // }
  return fn;
}

module.exports = {
  trace,
  wrap,
};
