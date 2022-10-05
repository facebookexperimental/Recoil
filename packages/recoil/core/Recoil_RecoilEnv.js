/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall recoil
 */

'use strict';

const err = require('recoil-shared/util/Recoil_err');

export type RecoilEnv = {
  RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED: boolean,
};

const env: RecoilEnv = {
  RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED: true,
};

/**
 * Allow NodeJS/NextJS/etc to set the initial state through process.env variable
 * Note:  we don't assume 'process' is available in all runtime environments
 *
 * @see https://github.com/facebookexperimental/Recoil/issues/733
 */
function applyProcessEnvFlagOverrides() {
  // note: this check is needed in addition to the check below, runtime error will occur without it!
  // eslint-disable-next-line fb-www/typeof-undefined
  if (typeof process === 'undefined') {
    return;
  }

  if (process?.env == null) {
    return;
  }

  const sanitizedValue =
    process.env.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED?.toLowerCase()?.trim();

  if (sanitizedValue == null || sanitizedValue === '') {
    return;
  }

  const allowedValues = ['true', 'false'];
  if (!allowedValues.includes(sanitizedValue)) {
    throw err(
      `process.env.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED value must be 'true', 'false', or empty: ${sanitizedValue}`,
    );
  }

  env.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = sanitizedValue === 'true';
}

applyProcessEnvFlagOverrides();

module.exports = env;
