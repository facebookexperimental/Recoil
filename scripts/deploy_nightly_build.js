const {files, version, repository} = require('../package.json');
const {execSync} = require('child_process');

const DEST_FOLDER = 'nightly-build-files/';
const DEST_BRANCH = 'nightly';

const COMMIT_MSG = `Publishing a nightly build as ${version}`;

const SOURCES = ['CHANGELOG.md', 'LICENSE', 'README.md', 'package.json'].concat(
  files,
);

const cwd = process.cwd();

console.log('Starting deploy to Git...');
console.log(`Remove "${DEST_FOLDER}" folder...`);
execSync(`rm -rf ${DEST_FOLDER}`, {cwd});

console.log(`Cloning the repository to "${DEST_FOLDER}" folder...`);
execSync(`git clone -b ${DEST_BRANCH} ${repository} ${DEST_FOLDER} --depth 1`, {
  cwd,
});

console.log('Copying sources...');
execSync(`cp -r ${SOURCES.join(' ')} ${DEST_FOLDER}`, {cwd});

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
