export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'utils/**/*.js',
    'core/**/*.js',
    'api/routes/**/*.js',
    'commands/**/*.js',
    'events/**/*.js',
    'tasks/**/*.js',
    'handlers/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true
};
