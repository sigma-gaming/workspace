import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync('../../package.json'))

// eslint-disable-next-line no-undef
await Bun.build({
  entrypoints: ['src/main.ts'],
  outdir: 'dist',
  target: 'node',
  sourcemap: 'external',
  external: Object.keys(packageJson.dependencies),
})
