import {
  Anchor,
  Button,
  createTheme,
  CSSVariablesResolver,
  MantineProvider,
  Title,
} from '@mantine/core'
import { PropsWithChildren } from 'react'
import buttonClassNames from './button.module.css'
import titleClassNames from './title.module.css'

export const theme = createTheme({
  primaryColor: 'sigma',
  primaryShade: 7,
  fontFamily: 'DM Sans, sans-serif',
  defaultRadius: 'md',
  colors: {
    sigma: [
      '#fbe9ff',
      '#f1cfff',
      '#df9cff',
      '#ce65fe',
      '#be38fd',
      '#b41cfd',
      '#b00dfe',
      '#9a00e3',
      '#8900cb',
      '#7700b2',
    ],
  },
  components: {
    Anchor: Anchor.extend({
      defaultProps: {
        c: 'sigma.3',
      },
    }),
    Title: Title.extend({
      classNames: titleClassNames,
    }),
    Button: Button.extend({
      classNames: buttonClassNames,
    }),
  },
})

const resolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: {
    '--mantine-color-borders': '#4e2567',
    '--mantine-color-text': '#ededed',
    '--mantine-color-bg': '#2a003d',
    '--mantine-overlay-bg': 'rgb(78 37 104 / 80%)',
    '--mantine-color-error': '#fd473a',
  },
})

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="dark"
      cssVariablesResolver={resolver}
    >
      {children}
    </MantineProvider>
  )
}
