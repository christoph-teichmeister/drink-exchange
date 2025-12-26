module.exports = {
  root: true,
  env: {
    browser: true,
    es2024: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module'
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['svelte', '@typescript-eslint'],
  overrides: [
    {
      files: ['*.ts', '**/*.ts'],
      excludedFiles: ['*.d.ts', '**/*.d.ts'],
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    {
      files: ['*.d.ts', '**/*.d.ts'],
      parserOptions: {
        project: './tsconfig.json'
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    },
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
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }
    ]
  },
  ignorePatterns: ['.svelte-kit', 'node_modules', 'node_modules.orig']
};
