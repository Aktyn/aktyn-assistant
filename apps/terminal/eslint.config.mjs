import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.config.js',
      'coverage/',
      'vitest.config.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "tsconfig.json",
        sourceType: "module",
      },
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          tabWidth: 2,
          parser: 'typescript',
        },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        { functions: false, classes: true, variables: false },
      ],
       '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          modifiers: ['const', 'destructured', 'global'],
          format: ['camelCase'],
        },
        {
          selector: 'variable',
          modifiers: ['exported'],
          types: ['boolean', 'string', 'number', 'array'],
          format: ['UPPER_CASE'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: ['class', 'interface', 'typeAlias', 'enum', 'enumMember'],
          format: ['PascalCase'],
        },
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
        },
      ],
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'import/no-extraneous-dependencies': [
        'warn',
        { devDependencies: false },
      ],
      'import/resolver': 'off',
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-extra-semi': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/test-utils/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-extraneous-dependencies': [
        'warn',
        { devDependencies: true },
      ],
    },
  }
); 