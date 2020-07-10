module.exports = {
  env: {
    browser: true,
  },
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'script'
  },
  rules: {
    "no-prototype-builtins": "off",
  }
}
