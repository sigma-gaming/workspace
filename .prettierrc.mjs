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
