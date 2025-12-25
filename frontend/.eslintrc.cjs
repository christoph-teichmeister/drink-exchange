export = {
  root: true,
  env: {
    browser: true,
    es2024: true
  },
  extends: ['eslint:recommended', 'plugin:@sveltejs/recommended', 'prettier'],
  parserOptions: {
    sourceType: 'module'
  },
  rules: {},
  ignorePatterns: ['.svelte-kit', 'node_modules']
};
