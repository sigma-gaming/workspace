import { createConfig } from '@core/ui/tailwind'

// eslint-disable-next-line import-x/no-default-export
export default createConfig({
  content: ['./src/**/*.{astro,html,md,mdx,ts,tsx}'],
  features: {
    mantine: false,
    colors: false,
  },
})
