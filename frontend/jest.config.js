module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)'
  ],
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
};
