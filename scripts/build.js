/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @format
 */

import {rollup} from 'rollup';
import {recoilInputOptions, createOutputOption} from './rollup-configs.js';
import {exec} from 'child_process';
import * as fs from 'fs';
import {projectRootDir} from './project-root-dir.js';

const args = process.argv.slice(2);

if (args[0] === 'all') {
  buildAll();
}

// constants
const BUILD_TARGET = 'build';

function createErrorHandler(message) {
  return err => {
    if (err) {
      console.error(`${message}\n`);
      throw err;
    }
  };
}

async function buildAll() {
  console.log('Building all packages...');
  await buildRecoil();
}

async function buildRecoil() {
  console.log('Building recoil...');
  await build(
    'recoil (common)',
    recoilInputOptions.common,
    ['cjs', 'es'].map(type =>
      createOutputOption(type, 'recoil', 'recoil', 'Recoil'),
    ),
  );
  await build(
    'recoil (dev)',
    recoilInputOptions.dev,
    ['umd'].map(type => createOutputOption(type, 'recoil', 'recoil', 'Recoil')),
  );
  await build(
    'recoil (prod)',
    recoilInputOptions.prod,
    ['es-browsers', 'umd-prod'].map(type =>
      createOutputOption(type, 'recoil', 'recoil', 'Recoil'),
    ),
  );
  await build(
    'recoil (native)',
    recoilInputOptions.native,
    ['native'].map(type =>
      createOutputOption(type, 'recoil', 'recoil', 'Recoil'),
    ),
  );

  console.log('Copying index.d.ts for TypeScript support...');
  fs.copyFile(
    `${projectRootDir}/typescript/index.d.ts`,
    `${BUILD_TARGET}/recoil/index.d.ts`,
    fs.constants.COPYFILE_FICLONE,
    createErrorHandler('Failed to copy index.d.ts for recoil'),
  );

  console.log('Generating Flow type files...');
  exec(
    `npx flow-copy-source packages/recoil ${BUILD_TARGET}/recoil/cjs`,
    err => {
      createErrorHandler('Failed to copy recoil source files for flow types');
      fs.rename(
        `${BUILD_TARGET}/recoil/cjs/Recoil_index.js.flow`,
        `${BUILD_TARGET}/recoil/cjs/recoil.js.flow`,
        createErrorHandler('Failed to rename recoil.js.flow'),
      );
    },
  );
  console.log('Successfully built recoil!');
}

async function build(name, inputOptions, outputOptionsList) {
  try {
    // create a bundle
    const bundle = await rollup(inputOptions);

    for (const outputOptions of outputOptionsList) {
      await bundle.write(outputOptions);
    }
  } catch (error) {
    createErrorHandler(`Build for package ${name} failed!`)(error);
  }
}
