module.exports = {
  env: {
    node: true,
    es2022: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'linebreak-style': 'off',
    'consistent-return': 'off',
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    indent: ['error', 2],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    radix: 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
        node: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['utils/logger.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
