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

class RecoilFlags {
  _duplicateAtomKeyCheckEnabled: boolean = true;

  isDuplicateAtomKeyCheckingEnabled(): boolean {
    return this._duplicateAtomKeyCheckEnabled;
  }

  setDuplicateAtomKeyCheckingEnabled(value: boolean) {
    this._duplicateAtomKeyCheckEnabled = value;
  }
}

const flags: RecoilFlags = new RecoilFlags();

const PROCESS_ENV_KEY__SUPRESS_DUPLICATE_ATOM_KEY_CHECKS =
  'RECOIL_SUPPRESS_DUPLICATE_ATOM_KEY_CHECKS';

/**
 * Allow NextJS/etc to set the initial state 'process.env.RECOIL_SUPPRESS_DUPLICATE_ATOM_KEY_CHECKS'
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
    process.env[
      PROCESS_ENV_KEY__SUPRESS_DUPLICATE_ATOM_KEY_CHECKS
    ]?.toLowerCase()?.trim();

  if (sanitizedValue == null || sanitizedValue === '') {
    return;
  }

  const allowedValues = ['true', 'false'];
  if (!allowedValues.includes(sanitizedValue)) {
    throw err(
      `process.env.${PROCESS_ENV_KEY__SUPRESS_DUPLICATE_ATOM_KEY_CHECKS} sanitized value must be 'true', 'false', or empty: ${sanitizedValue}`,
    );
  }

  const suppressed = sanitizedValue === 'true';
  flags.setDuplicateAtomKeyCheckingEnabled(!suppressed);
}

applyProcessEnvFlagOverrides();

module.exports = flags;
