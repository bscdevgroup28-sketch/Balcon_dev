module.exports = {
  root: true,
  env: { node: true, es2022: true, jest: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: ['dist/', 'node_modules/'],
  rules: {
    // Focus current sweep on unused imports/vars only; relax other strict rules
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { args: 'none', argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-types': 'off',
    'prefer-const': 'off',
    'no-useless-escape': 'off'
    , '@typescript-eslint/no-namespace': 'off'
  }
};