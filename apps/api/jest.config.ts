export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@task-management/data$': '<rootDir>/../../libs/data/src/index.ts',
    '^@task-management/auth$': '<rootDir>/../../libs/auth/src/index.ts',
  },
};
