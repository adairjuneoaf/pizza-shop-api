// @ts-check
/** @type { import("eslint").Linter.Config[] } */
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';

export default [
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  {
    files: ['src/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptEslintParser,
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      '@typescript-eslint': typescriptEslintPlugin,
    },
    rules: {
      'no-unused-vars': ['warn'],
      semi: ['warn', 'always'],
      quotes: ['error', 'single'],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-console': ['off'],
    },
  },
];
