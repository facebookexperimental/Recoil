/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @format
 */

import * as child_process from 'child_process';
import * as fs from 'fs';
import {createErrorHandler} from './utils.mjs';

const BUILD_TARGET = 'build';

for (const dir of fs.readdirSync(BUILD_TARGET)) {
  if (fs.lstatSync(`${BUILD_TARGET}/${dir}`).isDirectory()) {
    console.log(`Packaging ${JSON.stringify(dir)}`);
    child_process.exec(
      'yarn pack',
      {cwd: `${BUILD_TARGET}/${dir}`},
      createErrorHandler(`Failed to package ${dir}`),
    );
  }
}
