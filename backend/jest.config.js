export default {
  preset: null,
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testEnvironment: 'node',
  clearMocks: true,
  moduleFileExtensions: ['js', 'json', 'node'],
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/**/*.spec.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transformIgnorePatterns: ['node_modules/(?!(supertest|uuid)/)'],
  injectGlobals: true,
};
