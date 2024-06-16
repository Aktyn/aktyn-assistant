const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig-app.json')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['./src/app'],
  testPathIgnorePatterns: ['/node_modules/', '/dist-app/', '/dist-ui/'],
  restoreMocks: true,
  clearMocks: true,
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: 'src/' }),
  transform: {},
}
