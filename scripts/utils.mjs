/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall recoil
 */

export function createErrorHandler(message) {
  return err => {
    if (err) {
      console.error(`${message}\n`);
      throw err;
    }
  };
}
