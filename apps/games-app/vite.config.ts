import svg from '@neodx/svg/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const monorepo = (end: string) => path.resolve(__dirname, '../..', end)

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig({
  server: {
    host: 'app.sigma.local',
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
    svg({
      root: './src/shared/ui/assets/icons',
      output: './public',
      fileName: '{name}.{hash:8}.svg',
      metadata: {
        path: './src/shared/ui/general/icon/sprites.generated.ts',
        runtime: {
          size: true,
          viewBox: true,
        },
      },
      group: false,
      resetColors: false,
    }),
  ],
})
