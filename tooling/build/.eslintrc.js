const { configure } = require('eslint-kit')

module.exports = configure({
  root: __dirname,
  extends: '../../base.eslintrc.js',
})
