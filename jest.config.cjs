/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/amplify/functions'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^\\$amplify/env/field-valuations$':
      '<rootDir>/amplify/functions/field-valuations/__tests__/mock-env.ts',
  },
};
