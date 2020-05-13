/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+comparison_view
 * @flow strict
 * @format
 */

'use strict';

function enqueueExecution(s: string, f: () => mixed) {
  f();
}

module.exports = {
  enqueueExecution,
};
