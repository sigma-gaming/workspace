const { configure, presets } = require('eslint-kit')

module.exports = configure({
  root: __dirname,
  extends: '../../base.eslintrc.js',
  presets: [presets.react(), presets.astro()],
})
