/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

function sprintf(format: string, ...args: Array<mixed>): string {
  let index = 0;
  return format.replace(/%s/g, () => String(args[index++]));
}

module.exports = sprintf;
