import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const monorepo = (end: string) => path.resolve(__dirname, '../..', end)

// https://vitejs.dev/config/
// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  server: {
    host: 'app.sigma.local',
    port: 5173,
    https: {
      cert: fs.readFileSync(monorepo('ssl/local.crt')),
      key: fs.readFileSync(monorepo('ssl/local.key')),
    },
  },
  plugins: [
    react({
      babel: { babelrc: true },
    }),
    tsconfigPaths(),
    sentryVitePlugin({
      disable: process.env.NODE_ENV === 'development',
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayIframe: true,
        excludeReplayShadowDom: true,
        excludeReplayWorker: true,
      },
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['/env.js'],
    },
  },
})
