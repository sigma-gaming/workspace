import { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import { CustomThemeConfig } from 'tailwindcss/types/config'
import { tailwindColors } from './colors'
import { fontSizes } from './font-sizes'
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

const mantineUtilsPlugin = plugin(({ addUtilities }) => {
  addUtilities({
    '.shadow-border': {
      boxShadow: '0 0 0 1px var(--mantine-color-borders)',
    },
    '.outline-primary': {
      'outline-style': 'solid',
      'outline-width': '2px',
      'outline-offset': '2px',
      'outline-color': 'var(--mantine-color-primary-5)',
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

export function createConfig(options: {
  content: string[]
  features?: {
    mantine?: boolean
    screens?: boolean
    fonts?: boolean
    colors?: boolean
  }
}): Config {
  const defaultFeatures = {
    mantine: true,
    screens: true,
    fonts: true,
    colors: true,
  }

  const features = {
    ...defaultFeatures,
    ...options.features,
  }

  const plugins = [basePlugin, patchPlugin, scrollbarPlugin]

  if (features.mantine) {
    plugins.push(mantineUtilsPlugin)
  }

  const theme: Config['theme'] = {}
  const extend: Partial<CustomThemeConfig> = {}
  theme.extend = extend

  if (features.screens) {
    theme.screens = Object.fromEntries(
      screens.map(({ name, width }) => [name, `${width}px`]),
    )
  }

  if (features.fonts) {
    theme.fontSize = fontSizes.reduce(
      (acc, fontSize) => {
        acc[fontSize.name] = [`${fontSize.size}px`, `${fontSize.lineHeight}px`]

        return acc
      },
      {} as Record<string, [string, string]>,
    )
  }

  if (features.fonts) {
    extend.fontFamily = {
      text: `DM Sans, sans-serif`,
      interface: `Rubik, sans-serif`,
    }
  }

  if (features.colors) {
    extend.colors = { ...tailwindColors }

    if (features.mantine) {
      extend.colors!.dimmed = 'var(--mantine-color-dimmed)'
    }
  }

  return {
    content: ['../../core/ui/**/*.{ts,tsx}', ...options.content],
    plugins,
    theme,
  }
}
