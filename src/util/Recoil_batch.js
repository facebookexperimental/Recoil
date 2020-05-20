function defaultBatch() {
  throw new Error('No batching function specified.');
}

let batch = defaultBatch;

// Allow injecting another batching function later
const setBatch = newBatch => (batch = newBatch);

const batchUpdates = callback => batch(callback);

module.exports = {
  setBatch,
  batchUpdates,
};
