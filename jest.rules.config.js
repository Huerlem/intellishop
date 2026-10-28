/**
 * Jest config for Security Rules tests (Node environment, needs the Firebase emulators).
 * Run via: npm run test:rules  (wraps firebase-tools emulators:exec).
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/rules-tests/**/*.test.ts'],
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  testTimeout: 30000,
};
