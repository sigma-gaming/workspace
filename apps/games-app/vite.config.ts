import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import lqip from 'vite-plugin-lqip'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

const monorepo = (end: string) => path.resolve(__dirname, '../..', end)

const ENV = Object.entries(process.env).reduce<Record<string, string>>(
  (acc, [key, value]) => {
    if (!key.startsWith('PUBLIC_')) return acc
    acc[key] = value ?? ''
    return acc
  },
  {},
)

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
    open: true,
    headers: {
      Server: 'vite',
    },
  },
  plugins: [
    react({
      babel: { babelrc: true },
    }),
    tsconfigPaths(),
    sentryVitePlugin({
      disable: process.env.NODE_ENV === 'development',
      telemetry: false,
      sourcemaps: { disable: true }, // Is sent manually on Dockerfile build stage
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayIframe: true,
        excludeReplayShadowDom: true,
        excludeReplayWorker: true,
      },
    }),
    lqip(),
    VitePWA({
      manifest: false,
      injectRegister: false,
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
    // {
    //   name: 'inject-env',
    //   transformIndexHtml(html) {
    //     console.log(html)
    //     return html.replace(
    //       '<!-- public-env -->',
    //       `<script type="module">window.PUBLIC_ENV = ${JSON.stringify(ENV)}</script>`,
    //     )
    //   },
    // },
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['/env.js'],
    },
  },
})
