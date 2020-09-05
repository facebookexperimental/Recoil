module.exports = {
  timers: 'fake',
  globals: {
    __DEV__: true,
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    'src/hooks/__tests__/Recoil_PublicHooks-test.js',
    'src/hooks/__tests__/Recoil_useRecoilCallback-test.js',
    'src/recoil_values/__tests__/Recoil_atomFamily-test.js',
  ],
  setupFiles: ['./setupJestMock.js'],
};
