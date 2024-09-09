/** @type { import("eslint").Linter.Config[] } */

export default [
  {
    files: ['src/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn'],
      semi: ["warn", "always"],
      quotes: ["error", "single"],
    }
  }
]