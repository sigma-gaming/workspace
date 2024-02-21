import { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import { tailwindColors } from './colors'
import { screens } from './screens'

const basePlugin = plugin(({ addBase }) => {
  addBase({
    'html, body, #root': {
      height: '100%',
      overscrollBehaviorY: 'none',
    },
  })
})

const patchPlugin = plugin(({ addUtilities }) => {
  addUtilities({
    '.break-words': {
      'word-break': 'break-word',
      'overflow-wrap': 'break-word',
    },
  })
})

const utilsPlugin = plugin(({ addUtilities }) => {
  addUtilities({
    '.shadow-border': {
      boxShadow: '0 0 0 1px var(--mantine-color-borders)',
    },
  })
})

const scrollbarPlugin = plugin(({ addUtilities }) => {
  addUtilities({
    '.scrollbar-hide': {
      /* IE and Edge */
      '-ms-overflow-style': 'none',

      /* Firefox */
      'scrollbar-width': 'none',

      /* Safari and Chrome */
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },

    '.scrollbar-default': {
      /* IE and Edge */
      '-ms-overflow-style': 'auto',

      /* Firefox */
      'scrollbar-width': 'auto',

      /* Safari and Chrome */
      '&::-webkit-scrollbar': {
        display: 'block',
      },
    },
  })
})

export function createConfig(config: { content: string[] }): Config {
  return {
    content: ['../../libs/ui/**/*.{ts,tsx}', ...config.content],
    plugins: [basePlugin, patchPlugin, utilsPlugin, scrollbarPlugin],

    theme: {
      screens: Object.fromEntries(
        screens.map(({ name, width }) => [name, `${width}px`]),
      ),
      extend: {
        fontFamily: {
          text: `DM Sans, sans-serif`,
          interface: `Rubik, sans-serif`,
        },
        colors: tailwindColors,
      },
    },
  }
}
