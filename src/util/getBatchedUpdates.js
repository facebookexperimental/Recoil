import {unstable_batchedUpdates as rdBatched} from 'react-dom';
import {unstable_batchedUpdates as rnBatched} from 'react-native';

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
