const fs = require('fs');

function logErrors(err) {
  if (err) {
    throw err;
  }
}

fs.copyFile('./src/npm/index.js', './dist/index.js', logErrors);
fs.copyFile('./typescript/index.d.ts', './dist/index.d.ts', logErrors);
