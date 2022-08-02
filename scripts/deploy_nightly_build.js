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

const {repository} = require('../package.json');
const {execSync} = require('child_process');

const DEST_FOLDER = 'nightly-build-files/';
const DEST_BRANCH = 'nightly';

const COMMIT_MSG = `Publishing a nightly build`;

const cwd = process.cwd();

console.log('Starting deploy to Git...');
console.log(`Remove "${DEST_FOLDER}" folder...`);
execSync(`rm -rf ${DEST_FOLDER}`, {cwd});

console.log(`Cloning the repository to "${DEST_FOLDER}" folder...`);
execSync(`git clone -b ${DEST_BRANCH} ${repository} ${DEST_FOLDER} --depth 1`, {
  cwd,
});

console.log('Copying sources...');
execSync(`cp -r build/recoil/* ${DEST_FOLDER}`, {cwd});

console.log('Committing and pushing...');
execSync(
  [
    `cd ${DEST_FOLDER}`,
    'git config --local include.path "$PWD/../.git/config"', // include orginal git config
    'git add .',
    `git commit --allow-empty -m "${COMMIT_MSG}"`,
    `git push --tags ${repository} ${DEST_BRANCH}`,
  ].join('&&'),
  {cwd},
);

console.log('Deploying to git is finished.');
