module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    webextensions: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    chrome: 'readonly'
  },
  rules: {
    // Chrome extension specific rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // Security rules
    'no-unsafe-finally': 'error',
    'no-unsafe-optional-chaining': 'error',

    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'warn'
  },
  overrides: [
    {
      // Test files
      files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-expressions': 'off',
        'no-unused-vars': 'off'
      }
    },
    {
      // Configuration files
      files: ['*.config.js', 'scripts/watch-tests.js'],
      env: {
        node: true
      }
    }
  ]
}
