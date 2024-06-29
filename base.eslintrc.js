const { configure, presets } = require("eslint-kit")

module.exports = configure({
  root: __dirname,
  allowDebug: process.env.NODE_ENV !== 'production',

  presets: [
    presets.imports(),
    presets.node(),
    presets.prettier(),
    presets.typescript(),
  ],

  extend: {
    ignorePatterns: ['!**/*', 'node_modules', 'dist', 'public', '.eslintrc.cjs'],
    rules: {
      'import/extensions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'sonarjs/no-identical-functions': 'off',
    },
  },
})
