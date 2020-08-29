const fs = require('fs');
const {exec} = require('child_process');

function logErrors(err) {
  if (err) {
    throw err;
  }
}

console.log('Copying index.d.ts for TypeScript support...');
fs.copyFile('./typescript/index.d.ts', './index.d.ts', logErrors);

console.log('Generating Flow type files...');
exec('npx gen-flow-files src --out-dir cjs', err => {
  logErrors(err);
  fs.rename('cjs/Recoil_index.js.flow', 'cjs/recoil.js.flow', logErrors);
});
