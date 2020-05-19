const fs = require('fs');

fs.copyFileSync('./src/npm/index.js', './dist/index.js');
fs.copyFileSync('./src/npm/utils/index.js', './dist/utils/index.js');
