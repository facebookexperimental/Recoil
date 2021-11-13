/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */

const {exec} = require('child_process');
const fs = require('fs');

function logErrors(err) {
  if (err) {
    throw err;
  }
}

console.log('Copying index.d.ts for TypeScript support...');
// $FlowIssue Flow typing for copyFile() is incorrect.
fs.copyFile('./typescript/index.d.ts', './index.d.ts', logErrors);

console.log('Generating Flow type files...');
exec('npx gen-flow-files packages/recoil --out-dir cjs', err => {
  logErrors(err);
  fs.rename('cjs/Recoil_index.js.flow', 'cjs/recoil.js.flow', logErrors);
});
