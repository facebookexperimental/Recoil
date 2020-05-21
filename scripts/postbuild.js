const fs = require('fs');

fs.copyFileSync('./src/npm/index.js', './dist/index.js');
fs.copyFileSync('./src/npm/utils/index.js', './dist/utils/index.js');

// this line copy the file responsible for utils pretty import
// require('recoil/utils')
fs.copyFileSync('./src/npm/root-utils.js', './utils.js');
