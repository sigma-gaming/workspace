import { createConfig } from '@libs/ui/tailwind'

/**
 * Used only for auto-completion
 */

// eslint-disable-next-line import/no-default-export
export default createConfig({
  content: ['./src/**/*.{ts,tsx}', './index.html'],
})
