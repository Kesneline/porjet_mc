module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/config/**',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.controller.ts',
    '!src/**/*.routes.ts'
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        strict: false
      }
    }]
  },
  testTimeout: 30000,
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
};
