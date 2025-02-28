import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
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
    host: 'control.sigma.local',
    port: 5174,
    https: {
      cert: fs.readFileSync(monorepo('ssl/local.crt')),
      key: fs.readFileSync(monorepo('ssl/local.key')),
    },
    open: true,
  },
  plugins: [
    react({
      babel: { babelrc: true },
    }),
    tsconfigPaths(),
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
    rollupOptions: {
      external: ['/env.js'],
    },
  },
})
