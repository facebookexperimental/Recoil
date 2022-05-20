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
import {
  recoilInputOptions,
  recoilSyncInputOptions,
  createOutputOption,
} from './rollup-configs.mjs';
import {exec} from 'child_process';
import * as fs from 'fs';
import {projectRootDir} from './project-root-dir.mjs';

const args = process.argv.slice(2);

if (args[0] === 'all') {
  buildAll();
} else if (args[0] === 'recoil') {
  buildRecoil();
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
  await buildRecoilSync();
}

async function buildRecoil() {
  console.log('Building recoil...');
  const createRecoilOutputOptions = type =>
    createOutputOption(type, 'recoil', 'recoil', 'Recoil');
  await build(
    'recoil (common)',
    recoilInputOptions.common,
    ['cjs', 'es'].map(createRecoilOutputOptions),
  );
  await build(
    'recoil (dev)',
    recoilInputOptions.dev,
    ['umd'].map(createRecoilOutputOptions),
  );
  await build(
    'recoil (prod)',
    recoilInputOptions.prod,
    ['es-browsers', 'umd-prod'].map(createRecoilOutputOptions),
  );
  await build(
    'recoil (native)',
    recoilInputOptions.native,
    ['native'].map(createRecoilOutputOptions),
  );

  console.log('Copying files...');
  fs.copyFile(
    `${projectRootDir}/packages/recoil/package-for-release.json`,
    `${BUILD_TARGET}/recoil/package.json`,
    fs.constants.COPYFILE_FICLONE,
    createErrorHandler('Failed to copy package-for-release.json'),
  );

  fs.copyFile(
    `${projectRootDir}/README.md`,
    `${BUILD_TARGET}/recoil/README.md`,
    fs.constants.COPYFILE_FICLONE,
    createErrorHandler('Failed to copy README.md'),
  );
  fs.copyFile(
    `${projectRootDir}/CHANGELOG-recoil.md`,
    `${BUILD_TARGET}/recoil/CHANGELOG.md`,
    fs.constants.COPYFILE_FICLONE,
    createErrorHandler('Failed to copy CHANGELOG.md'),
  );
  fs.copyFile(
    `${projectRootDir}/LICENSE`,
    `${BUILD_TARGET}/recoil/LICENSE`,
    fs.constants.COPYFILE_FICLONE,
    createErrorHandler('Failed to copy LICENSE'),
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
      createErrorHandler('Failed to copy recoil source files for flow types')(
        err,
      );
      fs.rename(
        `${BUILD_TARGET}/recoil/cjs/Recoil_index.js.flow`,
        `${BUILD_TARGET}/recoil/cjs/recoil.js.flow`,
        createErrorHandler('Failed to rename recoil.js.flow'),
      );
    },
  );
  console.log('Successfully built recoil!');
}

async function buildRecoilSync() {
  console.log('Building recoil-sync...');

  const createRecoilSyncOutputOptions = type =>
    createOutputOption(type, 'recoil-sync', 'index', 'RecoilSync');
  await build(
    'recoil-sync (common)',
    recoilSyncInputOptions.common,
    ['cjs', 'es'].map(createRecoilSyncOutputOptions),
  );
  await build(
    'recoil-sync (dev)',
    recoilSyncInputOptions.dev,
    ['umd'].map(createRecoilSyncOutputOptions),
  );
  await build(
    'recoil-sync (prod)',
    recoilSyncInputOptions.prod,
    ['es-browsers', 'umd-prod'].map(createRecoilSyncOutputOptions),
  );

  console.log('Copying files...');
  fs.copyFile(
    `${projectRootDir}/packages/recoil-sync/package-for-release.json`,
    `${BUILD_TARGET}/recoil-sync/package.json`,
    fs.constants.COPYFILE_FICLONE,
    createErrorHandler('Failed to copy package-for-release.json'),
  );

  fs.copyFile(
    `${projectRootDir}/README-recoil-sync.md`,
    `${BUILD_TARGET}/recoil-sync/README.md`,
    fs.constants.COPYFILE_FICLONE,
    createErrorHandler('Failed to copy README.md'),
  );
  fs.copyFile(
    `${projectRootDir}/CHANGELOG-recoil-sync.md`,
    `${BUILD_TARGET}/recoil-sync/CHANGELOG.md`,
    fs.constants.COPYFILE_FICLONE,
    createErrorHandler('Failed to copy CHANGELOG.md'),
  );
  fs.copyFile(
    `${projectRootDir}/LICENSE`,
    `${BUILD_TARGET}/recoil-sync/LICENSE`,
    fs.constants.COPYFILE_FICLONE,
    createErrorHandler('Failed to copy LICENSE'),
  );

  console.log('Copying index.d.ts for TypeScript support...');
  fs.copyFile(
    `${projectRootDir}/typescript/recoil-sync.d.ts`,
    `${BUILD_TARGET}/recoil-sync/index.d.ts`,
    fs.constants.COPYFILE_FICLONE,
    createErrorHandler('Failed to copy recoil-sync.d.ts for recoil-sync'),
  );

  console.log('Generating Flow type files...');
  exec(
    `npx flow-copy-source packages/recoil-sync ${BUILD_TARGET}/recoil-sync/cjs`,
    err => {
      createErrorHandler('Failed to copy recoil source files for flow types')(
        err,
      );
      fs.rename(
        `${BUILD_TARGET}/recoil-sync/cjs/RecoilSync_index.js.flow`,
        `${BUILD_TARGET}/recoil-sync/cjs/index.js.flow`,
        createErrorHandler('Failed to rename RecoilSync_index.js.flow'),
      );
    },
  );
  console.log('Successfully built recoil-sync!');
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
