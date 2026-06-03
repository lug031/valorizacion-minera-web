/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/amplify/functions', '<rootDir>/src/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^\\$amplify/env/field-valuations$':
      '<rootDir>/amplify/functions/field-valuations/__tests__/mock-env.ts',
    '^\\$amplify/env/field-devices$':
      '<rootDir>/amplify/functions/field-devices/__tests__/mock-env.ts',
    '^\\$amplify/env/audit-logs$':
      '<rootDir>/amplify/functions/audit-logs/__tests__/mock-env.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
