module.exports = {
  timers: 'fake',
  globals: {
    __DEV__: true,
  },
  testPathIgnorePatterns: ['/node_modules/', '/packages/'],
  setupFiles: ['./setupJestMock.js'],
};
