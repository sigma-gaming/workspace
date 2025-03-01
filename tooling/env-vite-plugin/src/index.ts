import { getPublicEnv, loadEnv } from '@tooling/env'
import type { Plugin } from 'vite'

export function publicEnvPlugin(root: string): Plugin {
  loadEnv({ root })
  const publicEnv = getPublicEnv({ source: process.env })

  return {
    name: 'env-vite-plugin',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace(
        '<!-- public-env -->',
        `<script type="module">window.PUBLIC_ENV = ${JSON.stringify(publicEnv)}</script>`,
      )
    },
  } as Plugin // fix mad issue from dts plugin
}
