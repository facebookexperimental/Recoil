// Default to a dummy "batch" implementation that just runs the callback
function defaultNoopBatch(callback) {
  callback();
}

let batch = defaultNoopBatch;

// Allow injecting another batching function later
const setBatch = newBatch => (batch = newBatch);

const batchUpdates = callback => batch(callback);

module.exports = {
  setBatch,
  batchUpdates,
};
