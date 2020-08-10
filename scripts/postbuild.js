const fs = require('fs');

function logErrors(err) {
  if (err) {
    throw err;
  }
}

// Copying index.d.ts
fs.copyFile('./typescript/index.d.ts', './index.d.ts', logErrors);
