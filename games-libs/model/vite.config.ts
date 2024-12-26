import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  plugins: [tsconfigPaths()],
})
