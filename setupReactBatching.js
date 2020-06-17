const {setBatch} = require('./src/util/Recoil_batch');
const {unstable_batchedUpdates} = require('react-dom');

setBatch(unstable_batchedUpdates);
