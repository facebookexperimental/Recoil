/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall recoil
 */

'use strict';

const err = require('./Recoil_err');

export type RecoilEnv = {
  RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED: boolean,
  RECOIL_GKS_ENABLED: Set<string>,
};

const env: RecoilEnv = {
  RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED: true,

  // Note: RECOIL_GKS_ENABLED settings will only be honored in OSS builds of Recoil
  RECOIL_GKS_ENABLED: new Set([
    'recoil_hamt_2020',
    'recoil_sync_external_store',
    'recoil_suppress_rerender_in_callback',
    'recoil_memory_management_2020',
  ]),
};

function readProcessEnvBooleanFlag(name: string, set: boolean => void) {
  const sanitizedValue = process.env[name]?.toLowerCase()?.trim();

  if (sanitizedValue == null || sanitizedValue === '') {
    return;
  }

  const allowedValues = ['true', 'false'];
  if (!allowedValues.includes(sanitizedValue)) {
    throw err(
      `process.env.${name} value must be 'true', 'false', or empty: ${sanitizedValue}`,
    );
  }

  set(sanitizedValue === 'true');
}

function readProcessEnvStringArrayFlag(
  name: string,
  set: (Array<string>) => void,
) {
  const sanitizedValue = process.env[name]?.trim();

  if (sanitizedValue == null || sanitizedValue === '') {
    return;
  }

  set(sanitizedValue.split(/\s*,\s*|\s+/));
}

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

  readProcessEnvBooleanFlag(
    'RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED',
    value => {
      env.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = value;
    },
  );
  readProcessEnvStringArrayFlag('RECOIL_GKS_ENABLED', value => {
    value.forEach(gk => {
      env.RECOIL_GKS_ENABLED.add(gk);
    });
  });
}

applyProcessEnvFlagOverrides();

module.exports = env;
