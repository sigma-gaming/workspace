const { configure, presets } = require("eslint-kit")

module.exports = configure({
  root: __dirname,
  allowDebug: process.env.NODE_ENV !== 'production' && !process.env.CI,

  presets: [
    presets.imports(),
    presets.node(),
    presets.prettier(),
    presets.typescript({ enforceUsingType: true }),
  ],

  extend: {
    ignorePatterns: ['!**/*', 'node_modules', 'dist', 'public', 'bin', '.eslintrc.cjs', 'generated/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'sonarjs/no-identical-functions': 'off',
      '@stylistic/quote-props': ['warn', 'consistent-as-needed']
    },
  },
})