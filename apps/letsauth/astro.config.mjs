import node from '@astrojs/node'
import tailwind from '@astrojs/tailwind'
import earlyHints from '@itsmatteomanf/astro-early-hints'
import { defineConfig } from 'astro/config'

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  integrations: [tailwind(), earlyHints()],
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  server: {
    host: 'auth.local',
    port: Number(process.env.AUTH_API_PORT) || 8080,
  },
})
