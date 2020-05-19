const rdBatched = require('react-dom').unstable_batchedUpdates;
const rnBatched = require('react-native').unstable_batchedUpdates;

const batchedUpdates =
  typeof rdBatched === 'function'
    ? rdBatched
    : typeof rnBatched === 'function'
    ? rnBatched
    : undefined;

if (batchedUpdates === undefined) {
  throw new Error(
    'batchedUpdates could not be resolved for either react-dom or react-native',
  );
}
module.exports = batchedUpdates;
