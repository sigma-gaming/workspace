import { esbuildDecorators } from '@anatine/esbuild-decorators'
import node from '@astrojs/node'
import tailwind from '@astrojs/tailwind'
import { defineConfig } from 'astro/config'

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  integrations: [tailwind()],
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  server: {
    host: 'auth.local',
    port: 4321,
  },
  vite: {
    optimizeDeps: {
      esbuildOptions: {
        plugins: [esbuildDecorators({ tsconfig: './tsconfig.json' })],
      },
    },
  },
})
