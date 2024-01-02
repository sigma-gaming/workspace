import {
  Button,
  Card,
  createTheme,
  CSSVariablesResolver,
  Input,
  LoadingOverlay,
  MantineProvider,
  Menu,
  Modal,
  Popover,
  Skeleton,
  Title,
} from '@mantine/core'
import { PropsWithChildren } from 'react'
import buttonClassNames from './button.module.css'
import cardClassNames from './card.module.css'
import inputClassNames from './input.module.css'
import loadingOverlayClassNames from './loading-overlay.module.css'
import menuClassNames from './menu.module.css'
import modalClassNames from './modal.module.css'
import popoverClassNames from './popover.module.css'
import skeletonClassNames from './skeleton.module.css'
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
    Title: Title.extend({
      classNames: titleClassNames,
    }),
    Button: Button.extend({
      classNames: buttonClassNames,
    }),
    Input: Input.extend({
      classNames: inputClassNames,
    }),
    Card: Card.extend({
      classNames: cardClassNames,
    }),
    Modal: Modal.extend({
      classNames: modalClassNames,
    }),
    ModalCloseButton: Modal.CloseButton.extend({
      defaultProps: {
        size: 'lg',
      },
    }),
    Menu: Menu.extend({
      classNames: menuClassNames,
    }),
    Popover: Popover.extend({
      classNames: popoverClassNames,
    }),
    Skeleton: Skeleton.extend({
      classNames: skeletonClassNames,
    }),
    LoadingOverlay: LoadingOverlay.extend({
      classNames: loadingOverlayClassNames,
    }),
  },
})

const resolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: {
    '--mantine-color-borders': '#4e2567',
    '--mantine-color-text': '#ededed',
    '--mantine-color-bg': '#220032',
    '--mantine-overlay-bg': 'rgb(78 37 104 / 80%)',
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
