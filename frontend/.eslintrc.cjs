module.exports = {
  root: true,
  env: {
    browser: true,
    es2024: true
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    sourceType: 'module'
  },
  plugins: ['svelte'],
  overrides: [
    {
      files: ['*.svelte', '**/*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        project: './tsconfig.json',
        extraFileExtensions: ['.svelte'],
        sourceType: 'module'
      },
      rules: {}
    }
  ],
  rules: {},
  ignorePatterns: ['.svelte-kit', 'node_modules']
};
