// eslint-disable-next-line no-undef
await Bun.build({
  entrypoints: ['src/main.ts'],
  outdir: 'dist',
  target: 'bun',
  sourcemap: 'external',
})
