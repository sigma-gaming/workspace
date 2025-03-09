/* eslint-disable import-x/no-default-export */
/* eslint-disable import-x/no-anonymous-default-export */
export default {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  quoteProps: 'consistent',
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: { parser: 'astro' },
    },
  ],
}
