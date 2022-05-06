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

const args = process.argv.slice(2);

if (args[0] === 'all') {
  buildAll();
}

async function buildAll() {
  console.log('Building all packages...');
  console.log('Building recoil...');
  await buildRecoil();
}

async function buildRecoil() {
  await build(
    'recoil (common)',
    recoilInputOptions.common,
    ['cjs', 'es'].map(type => createOutputOption(type, 'recoil', 'Recoil')),
  );
  await build(
    'recoil (dev)',
    recoilInputOptions.dev,
    ['umd'].map(type => createOutputOption(type, 'recoil', 'Recoil')),
  );
  await build(
    'recoil (prod)',
    recoilInputOptions.prod,
    ['es-browsers', 'umd-prod'].map(type =>
      createOutputOption(type, 'recoil', 'Recoil'),
    ),
  );
  await build(
    'recoil (native)',
    recoilInputOptions.native,
    ['native'].map(type => createOutputOption(type, 'recoil', 'Recoil')),
  );
  console.log('Successfully built recoil!');
}

async function build(name, inputOptions, outputOptionsList) {
  let bundle;
  let buildFailed = false;
  try {
    // create a bundle
    bundle = await rollup(inputOptions);

    await generateOutputs(bundle, outputOptionsList);
  } catch (error) {
    buildFailed = true;
    console.error(`Build for package ${name} failed:\n`);
    console.error(error);
  }
  if (buildFailed) {
    process.exit(1);
  }
}

async function generateOutputs(bundle, outputOptionsList) {
  for (const outputOptions of outputOptionsList) {
    await bundle.write(outputOptions);
  }
}
