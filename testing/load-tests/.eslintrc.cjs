const { configure } = require('eslint-kit')

module.exports = configure({
  root: __dirname,
  extends: '../../base.eslintrc.js',
  extend: {
    rules: {
      'import-x/no-default-export': 'off',
      'import-x/no-anonymous-default-export': 'off'
    }
  }
})
