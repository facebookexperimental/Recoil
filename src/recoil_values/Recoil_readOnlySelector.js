/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Wraps another recoil value and prevents writing to it.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

import type {RecoilValue, RecoilValueReadOnly} from 'Recoil_RecoilValue';

function readOnlySelector<T>(atom: RecoilValue<T>): RecoilValueReadOnly<T> {
  // flowlint-next-line unclear-type: off
  return (atom: any);
}

module.exports = readOnlySelector;
