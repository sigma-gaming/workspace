// eslint-disable-next-line no-undef
await Bun.build({
  entrypoints: ['src/main.ts'],
  outdir: 'dist',
  target: 'node',
  sourcemap: 'external',
  external: ['uWebSockets.js'],
})
