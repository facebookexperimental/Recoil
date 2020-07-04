const fs = require('fs');

function logErrors(err) {
  if (err) {
    throw err;
  }
}

// For CommonJS
fs.copyFile('./scripts/npm/index.js', './dist/index.js', logErrors);
fs.copyFile('./typescript/index.d.ts', './dist/index.d.ts', logErrors);
// For ESM
fs.copyFile('./scripts/npm/index.js', './esm/index.js', logErrors);
fs.copyFile('./typescript/index.d.ts', './esm/index.d.ts', logErrors);
